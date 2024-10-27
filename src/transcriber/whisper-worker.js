/* eslint-disable camelcase */
import { pipeline, env, WhisperTextStreamer } from "@xenova/transformers";
import Constants from "./Constants";

async function isWebGPUAvailable() {
  if (!navigator.gpu) return false;

  let adapter;
  try {
    adapter = await navigator.gpu.requestAdapter();
  } catch (e) {
    console.info("WebGPU not available:", e);
    return false
  }

  return !!adapter;
}

// Specify a custom location for models (defaults to '/models/').
// env.localModelPath = "/models/";
// env.allowRemoteModels = true;

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
        device: await isWebGPUAvailable() ? "webgpu" : "wasm",
      });
    }

    return this.instance;
  }
}

self.addEventListener("message", async (event) => {
  try {
    const message = event.data;

    let transcript = await transcribe(
      message.audio,
      message.model,
      message.quantized,
      message.language,
    );

    if (transcript === null) return;

    // Send the result back to the main thread
    self.postMessage({
      status: "complete",
      task: "automatic-speech-recognition",
      data: transcript,
    });
  } catch (error) {
    self.postMessage({
      status: "error",
      task: "automatic-speech-recognition",
      data: error,
    });
  }
});

class AutomaticSpeechRecognitionPipelineFactory extends PipelineFactory {
  static task = "automatic-speech-recognition";
  static model = null;
  static quantized = null;
}

const SENTENCE_ENDING_REGEXP = /.*[.!?。！？]$/;

const transcribe = async (audio, modelName, quantized, language) => {
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

  let start_time;
  let num_tokens = 0;
  let tps;

  let in_progress_text = "";
  let in_progress_chunks = [];

  const streamer = new WhisperTextStreamer(transcriber.tokenizer, {
    time_precision,
    token_callback_function: () => {
      start_time ??= performance.now();
      if (num_tokens++ > 0) {
        tps = (num_tokens / (performance.now() - start_time)) * 1000;
      }
    },
    callback_function: (x) => {
      const last_chunk = in_progress_chunks[in_progress_chunks.length - 1];
      if (
        in_progress_chunks.length === 0 ||
        SENTENCE_ENDING_REGEXP.test(last_chunk.text.trim()) ||
        last_chunk.text.trim().length + x.trim().length >
        Constants.DEFAULT_CHUNK_THRESHOLD_CHARS
      ) {
        in_progress_chunks.push({
          text: x,
          timestamp: [0, null],
          isInProgress: true,
        });
      } else {
        last_chunk.text += x;
      }

      in_progress_text += x;

      self.postMessage({
        tps,
        status: "update",
        text: in_progress_text,
        chunks: in_progress_chunks,
      });
    },
  });

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

    streamer,
  });

  return output;
};
