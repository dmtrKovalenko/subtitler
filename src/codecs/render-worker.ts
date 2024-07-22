import { TranscriberData } from "../transcriber/useTranscriber";
import { MP4Demuxer, Metadata } from "./Demuxer";
import {
  Muxer,
  FileSystemWritableFileStreamTarget,
  ArrayBufferTarget,
} from "mp4-muxer";
import {
  RendererContext,
  createCtx,
  loadGoogleFont,
  renderCue,
} from "./subtitle-renderer";
import { style } from "../screens/editor/Style.gen";

const QUEUE_SIZE = 64;

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

export type RenderProgressMessage =
  | {
      type: "encodeprogress";
      progress: number;
    }
  | {
      type: "renderprogress";
      progress: number;
    }
  | {
      type: "done";
      target: Target;
    }
  | {
      type: "error";
      message: string;
      error: unknown;
    };

const postMessage = (message: RenderProgressMessage) =>
  self.postMessage(message);

export type Target =
  | {
      type: "filehandle";
      handle: FileSystemFileHandle;
    }
  | {
      type: "filestream";
      stream: FileSystemWritableFileStream | null;
    }
  | {
      type: "arraybuffer";
      fileName: string;
    }
  | {
      type: "populated_arraybuffer";
      fileName: string;
      arrayBuffer: ArrayBuffer;
    };

function createMuxerTarget(target: Target) {
  switch (target.type) {
    case "filestream":
      if (!target.stream) {
        throw new Error("Filestream target is not initialized");
      }
      return new FileSystemWritableFileStreamTarget(target.stream);
    case "arraybuffer":
      return new ArrayBufferTarget();
    case "filehandle":
      throw new Error(
        "At this point filehandle should be already resolved to filestream",
      );
    case "populated_arraybuffer":
      throw new Error(
        "populated_arraybuffer can be used only as output when flushing is done",
      );
  }
}

async function prepareOffscreenTargetForWriting(target: Target) {
  if (target.type === "filehandle") {
    target = {
      type: "filestream",
      stream: await target.handle.createWritable(),
    };
  }

  return target;
}

class EncoderMuxer {
  videoMetadataRef: { current: Metadata | null };
  encoder: VideoEncoder | undefined;
  #muxer: Muxer<FileSystemWritableFileStreamTarget> | undefined;

  #target: Target;
  #onEncodeQueueEmptied: () => void;

  constructor(
    metadataRef: { current: Metadata | null },
    target: Target,
    onEncodeQueueDevastation: () => void,
  ) {
    this.videoMetadataRef = metadataRef;
    this.#target = target;
    this.#onEncodeQueueEmptied = onEncodeQueueDevastation;
  }

  configure(videoConfig: VideoDecoderConfig, audioConfig: AudioDecoderConfig) {
    let encodedFrames = 0;
    if (!videoConfig.codedWidth || !videoConfig.codedHeight) {
      throw new Error("Can not resolve video size");
    }

    this.#muxer = new Muxer({
      target: createMuxerTarget(this.#target),
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
      fastStart: this.#target.type === "arraybuffer" ? "in-memory" : false,
    });

    this.encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        if (this.videoMetadataRef.current) {
          postMessage({
            type: "encodeprogress",
            progress:
              (encodedFrames / this.videoMetadataRef.current.nbSamples) * 100,
          });
        }

        encodedFrames++;
        this.#muxer?.addVideoChunk(chunk, metadata);
      },
      error: (e) =>
        postMessage({
          message: "Error encoding video.",
          type: "error",
          error: e,
        } as RenderProgressMessage),
    });

    this.encoder.configure({
      codec: videoConfig.codec,
      width: videoConfig.codedWidth,
      height: videoConfig.codedHeight,
    });

    this.encoder.ondequeue = () => {
      if (this.encoder?.encodeQueueSize === 0) {
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

  flush = async () => {
    try {
      await this.encoder?.flush();
      this.#muxer?.finalize();

      let populatedTarget = this.#target;
      switch (this.#target.type) {
        case "filestream":
          await this.#target.stream?.close();
          this.#target.stream = null;
          break;
        case "filehandle":
          throw new Error(
            "Found filehnadle target when the muxer is fanlized. Only accepting filestream target at this point",
          );
        // @ts-expect-error yes we want to fall through
        case "arraybuffer":
          if (this.#muxer?.target instanceof ArrayBufferTarget) {
            populatedTarget = {
              type: "populated_arraybuffer",
              fileName: this.#target.fileName,
              arrayBuffer: this.#muxer?.target.buffer,
            };
            break;
          }
        default:
          throw new Error(
            "Can not write the muxed data to the target. Found unsupported combination of muxer target and target when flushing.",
          );
      }

      postMessage({
        type: "done",
        target: populatedTarget,
      });
    } catch (e) {
      postMessage({
        message: "Failed to finalize vide muxing",
        type: "error",
        error: e,
      });
    }
  };
}

export type RenderMessage = {
  type: "render";
  dataUri: File;
  canvas: OffscreenCanvas;
  target: Target;
  cues: TranscriberData["chunks"];
  style: style;
};

export async function render({
  dataUri,
  canvas,
  target,
  cues,
  style,
}: RenderMessage) {
  console.log("FROM RENDER WORKER");
  let metadataRef: { current: Metadata | null } = {
    current: null,
  };

  try {
    await loadGoogleFont(style.fontFamily, style.fontWeight);
  } catch (e) {
    postMessage({
      error: e,
      type: "error",
      message: "Failed to load font",
    });

    return;
  }

  let renderedFrames = 0;
  let rendererCtx: RendererContext | null = null;
  const chunks: EncodedVideoChunk[] = [];

  function supplyChunks(first: number) {
    if (chunks.length > 0) {
      chunks.splice(0, first).forEach((chunk) => decoder.decode(chunk));
    }
  }

  let encoderMuxer = new EncoderMuxer(
    metadataRef,
    await prepareOffscreenTargetForWriting(target),
    () => {
      if (chunks.length === 0) {
        encoderMuxer.flush();
      } else {
        supplyChunks(QUEUE_SIZE);
      }
    },
  );

  const decoder = new VideoDecoder({
    output(frame: VideoFrame) {
      if (!rendererCtx) {
        throw new Error("Renderer context is not initialized");
      }

      const renderedFrame = renderCue(cues, frame, rendererCtx);
      encoderMuxer.encoder?.encode(renderedFrame);
      renderedFrame.close();

      renderedFrames++;
      if (metadataRef.current) {
        postMessage({
          type: "renderprogress",
          progress: (renderedFrames / metadataRef.current.nbSamples) * 100,
        });
      }
    },
    error(e) {
      postMessage({
        type: "error",
        error: e,
        message: "Failed to decode video",
      });
    },
  });

  let decodingStarted = false;
  // Fetch and demux the media data.
  new MP4Demuxer(dataUri, {
    onMetadata(metadata: Metadata) {
      metadataRef.current = metadata;
    },
    onConfig(videoConfig: VideoDecoderConfig, audioConfig: AudioDecoderConfig) {
      decoder.configure(videoConfig);
      rendererCtx = createCtx(videoConfig, canvas, style);
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
  if (message.data.type === "render") {
    render(message.data).catch((e) => {
      postMessage({
        type: "error",
        error: e,
        message: "Failed to render video",
      });
    });
  }
});
