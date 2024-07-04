/* eslint-disable camelcase */
import { pipeline, env } from "@xenova/transformers";

// Specify a custom location for models (defaults to '/models/').
env.localModelPath = "/models/";
env.allowRemoteModels = true;

// Define model factories
// Ensures only one model is created of each type
class PipelineFactory {
  static task = null;
  static model = null;
  static quantized = null;
  static instance = null;

  constructor(tokenizer, model, quantized) {
    this.tokenizer = tokenizer;
    this.model = model;
    this.quantized = quantized;
  }

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, {
        quantized: this.quantized,
        progress_callback,
        dtype: {
          encoder_model: "fp32",
          decoder_model_merged: "q4", // or 'fp32' ('fp16' is broken)
        },
        device: "webgpu",

        // For medium models, we need to load the `no_attentions` revision to avoid running out of memory
        revision: this.model.includes("whisper-medium")
          ? "no_attentions"
          : "main",
      });
    }

    return this.instance;
  }
}

self.addEventListener("message", async (event) => {
  const message = event.data;

  // Do some work...
  // TODO use message data
  let transcript = await transcribe(
    message.audio,
    message.model,
    message.quantized,
    message.subtask,
    message.language,
  );
  if (transcript === null) return;

  // Send the result back to the main thread
  self.postMessage({
    status: "complete",
    task: "automatic-speech-recognition",
    data: transcript,
  });
});

class AutomaticSpeechRecognitionPipelineFactory extends PipelineFactory {
  static task = "automatic-speech-recognition";
  static model = null;
  static quantized = null;
}

const transcribe = async (audio, modelName, quantized, subtask, language) => {
  const p = AutomaticSpeechRecognitionPipelineFactory;
  if (p.model !== modelName || p.quantized !== quantized) {
    // Invalidate model if different
    p.model = modelName;
    p.quantized = false;

    if (p.instance !== null) {
      (await p.getInstance()).dispose();
      p.instance = null;
    }
  }

  // Load transcriber model
  let transcriber = await p.getInstance((data) => {
    self.postMessage(data);
  });

  const time_precision =
    transcriber.processor.feature_extractor.config.chunk_length /
    transcriber.model.config.max_source_positions;

  // Storage for chunks to be processed. Initialise with an empty chunk.
  let chunks_to_process = [
    {
      tokens: [],
      finalised: false,
    },
  ];

  // TODO: Storage for fully-processed and merged chunks
  // let decoded_chunks = [];

  function chunk_callback(chunk) {
    let last = chunks_to_process[chunks_to_process.length - 1];

    // Overwrite last chunk with new info
    Object.assign(last, chunk);
    last.finalised = true;

    // Create an empty chunk after, if it not the last chunk
    if (!chunk.is_last) {
      chunks_to_process.push({
        tokens: [],
        finalised: false,
      });
    }
  }

  // Inject custom callback function to handle merging of chunks
  function callback_function(item) {
    let last = chunks_to_process[chunks_to_process.length - 1];

    // Update tokens of last chunk
    last.tokens = [...item[0].output_token_ids];

    // Merge text chunks
    // TODO optimise so we don't have to decode all chunks every time
    let data = transcriber.tokenizer._decode_asr(chunks_to_process, {
      time_precision: time_precision,
      return_timestamps: true,
      force_full_sequences: false,
    });

    self.postMessage({
      status: "update",
      task: "automatic-speech-recognition",
      data: data,
    });
  }

  // Actually run transcription
  let output = await transcriber(audio, {
    // Greedy
    top_k: 0,
    do_sample: false,

    // Sliding window
    chunk_length_s: 20,
    stride_length_s: 5,

    // Language and task
    language: language,
    task: "transcribe",

    // Return timestamps
    return_timestamps: "word",
    force_full_sequences: false,

    // Callback functions
    callback_function: callback_function, // after each generation step
    chunk_callback: chunk_callback, // after each chunk is processed
  }).catch((error) => {
    self.postMessage({
      status: "error",
      task: "automatic-speech-recognition",
      data: error,
    });
    return null;
  });

  return output;
};
