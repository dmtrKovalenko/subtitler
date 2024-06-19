import { TranscriberData } from "../transcriber/useTranscriber";
import { MP4Demuxer, Metadata } from "./Demuxer";
import { Muxer, FileSystemWritableFileStreamTarget } from "mp4-muxer";

const QUEUE_SIZE = 64;

function renderAnimationFrame(
  text: string | null,
  pendingFrame: VideoFrame,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) {
  if (!pendingFrame) {
    return;
  }

  canvas.width = pendingFrame.displayWidth;
  canvas.height = pendingFrame.displayHeight;
  ctx.drawImage(
    pendingFrame,
    0,
    0,
    pendingFrame.displayWidth,
    pendingFrame.displayHeight,
  );
  if (text) {
    ctx.font = "48px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText(text, 200, 200);
  }
}

function webcodecsCodecToMuxer(
  fullCodec: string,
): "avc" | "hevc" | "vp9" | "av1" {
  const codec = fullCodec.toLowerCase();

  // Check for AVC (H.264)
  if (codec.includes("avc1") || codec.includes("h264")) {
    return "avc";
  }
  // Check for HEVC (H.265)
  else if (codec.includes("hev1") || codec.includes("h265")) {
    return "hevc";
  }
  // Check for VP9
  else if (codec.includes("vp09")) {
    return "vp9";
  }
  // Check for AV1
  else if (codec.includes("av01")) {
    return "av1";
  }

  return "avc";
}

class EncoderMuxer {
  encoder: VideoEncoder;
  #muxer: Muxer<FileSystemWritableFileStreamTarget>;
  #fileStream: FileSystemWritableFileStream;
  #onEncodeQueueEmptied: () => void;

  constructor(
    fileHandle: FileSystemWritableFileStream,
    onEncodeQueueDevastation: () => void,
  ) {
    this.#fileStream = fileHandle;
    this.#onEncodeQueueEmptied = onEncodeQueueDevastation;
  }

  configure(videoConfig: VideoDecoderConfig, audioConfig: AudioDecoderConfig) {
    if (!videoConfig.codedWidth || !videoConfig.codedHeight) {
      throw new Error("Can not resolve video size");
    }

    this.#muxer = new Muxer({
      target: new FileSystemWritableFileStreamTarget(this.#fileStream),
      video: {
        codec: webcodecsCodecToMuxer(videoConfig.codec),
        width: videoConfig.codedWidth,
        height: videoConfig.codedHeight,
      },
      audio: {
        codec: audioConfig.codec.toLowerCase().includes("opus")
          ? "opus"
          : "aac",
        numberOfChannels: audioConfig.numberOfChannels,
        sampleRate: audioConfig.sampleRate,
      },
      firstTimestampBehavior: "offset",
      fastStart: false,
    });

    this.encoder = new VideoEncoder({
      output: this.#muxer.addVideoChunk.bind(this.#muxer),
      error: (e) => console.error(e),
    });

    this.encoder.configure({
      codec: videoConfig.codec,
      width: videoConfig.codedWidth,
      height: videoConfig.codedHeight,
    });

    this.encoder.ondequeue = () => {
      if (this.encoder.encodeQueueSize === 0) {
        this.#onEncodeQueueEmptied();
      }
    };
  }

  supplyRawAudioChunk = (...args: any) => {
    if (!this.#muxer) {
      throw new Error("Muxer is not configured");
    }

    return this.#muxer.addAudioChunkRaw.apply(this.#muxer, args);
  };

  flush = () => {
    this.encoder
      .flush()
      .then(() => {
        console.log("finalizing");
        this.#muxer.finalize();
        console.log("saving");
        this.#fileStream.close().then(() => console.log("saved"));
      })
      .catch(console.error);
  };
}

export async function start({ dataUri, canvas, fileHandle, _cues }) {
  const cues: TranscriberData["chunks"] = _cues;
  const ctx = canvas.getContext("2d");
  const chunks: EncodedVideoChunk[] = [];

  function supplyChunks(first: number) {
    if (chunks.length > 0) {
      console.log("supplying chunks");
      chunks.splice(0, first).forEach((chunk) => decoder.decode(chunk));
    }
  }

  const fileStream = await fileHandle.createWritable();
  let encoderMuxer = new EncoderMuxer(fileStream, () => {
    if (chunks.length === 0) {
      encoderMuxer.flush();
    } else {
      supplyChunks(QUEUE_SIZE);
    }
  });

  function getCurrentCue(timestampInMs: number) {
    const timestamp = timestampInMs / 1e6;
    const currentChunk = cues[0];
    if (!currentChunk) {
      return null;
    }

    if (currentChunk.timestamp[1] && timestamp > currentChunk.timestamp[1]) {
      cues.shift();
      return getCurrentCue(timestamp);
    }

    if (currentChunk.timestamp[0] <= timestamp) {
      return currentChunk;
    }

    return 0;
  }

  const decoder = new VideoDecoder({
    output(frame: VideoFrame) {
      const timestamp = frame.timestamp;
      const cue = getCurrentCue(timestamp);
      renderAnimationFrame(cue?.text ?? null, frame, canvas, ctx);
      frame.close();
      const renderedFrame = new VideoFrame(canvas, { timestamp });
      encoderMuxer.encoder.encode(renderedFrame);
      renderedFrame.close();
      console.log("frame processed");
    },
    error(e) {
      console.error(e);
    },
  });

  let decodingStarted = false;
  // Fetch and demux the media data.
  new MP4Demuxer(dataUri, {
    onMetadata() {},
    onConfig(videoConfig: VideoDecoderConfig, audioConfig: AudioDecoderConfig) {
      decoder.configure(videoConfig);
      encoderMuxer.configure(videoConfig, audioConfig);
    },
    onVideoChunk(chunk: EncodedVideoChunk) {
      chunks.push(chunk);

      if (!decodingStarted && chunks.length === QUEUE_SIZE) {
        supplyChunks(QUEUE_SIZE);
        decodingStarted = true;
      }
    },
    onRawAudioChunk: encoderMuxer.supplyRawAudioChunk,
    setStatus: console.log,
  });
}

// Listen for the start request.
self.addEventListener("message", (message) => {
  if (message.data.type === "decode") {
    start(message.data);
  }
});
