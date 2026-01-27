import { TranscriberData } from "../transcriber/useTranscriber";
import {
  Input,
  Output,
  BlobSource,
  BufferTarget,
  StreamTarget,
  Mp4OutputFormat,
  WebMOutputFormat,
  MovOutputFormat,
  ALL_FORMATS,
  CanvasSink,
  CanvasSource,
  AudioSampleSink,
  AudioSampleSource,
  getFirstEncodableVideoCodec,
  getFirstEncodableAudioCodec,
  getEncodableVideoCodecs,
  getEncodableAudioCodecs,
  canEncodeVideo,
  canEncodeAudio,
  QUALITY_HIGH,
  VIDEO_CODECS,
  NON_PCM_AUDIO_CODECS,
  type VideoCodec,
  type AudioCodec,
} from "mediabunny";
import {
  createCtx,
  loadGoogleFont,
  renderCueOnCanvas,
  WordAnimationData,
} from "./subtitle-renderer";
import { style } from "../screens/editor/Style.gen";

export type OutputFormat = "mp4" | "webm" | "mov";
export type OutputVideoCodec = "avc" | "hevc" | "vp9" | "vp8" | "av1";
export type OutputAudioCodec = "aac" | "opus" | "mp3" | "vorbis" | "flac";

export type SupportedCodecsMessage = {
  type: "supported-codecs";
  videoCodecs: OutputVideoCodec[];
  audioCodecs: OutputAudioCodec[];
};

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
      type: "filereadprogress";
      progress: number;
    }
  | {
      type: "done";
      target: Target;
      outputFormat: OutputFormat;
    }
  | {
      type: "error";
      message: string;
      error: unknown;
    };

export type RenderMessage = {
  dataUri: File;
  canvas: OffscreenCanvas;
  target: Target;
  cues: TranscriberData["chunks"];
  style: style;
  outputFormat?: OutputFormat;
  videoCodec?: OutputVideoCodec;
  audioCodec?: OutputAudioCodec;
  // Word animation data for export
  wordAnimationData?: WordAnimationData;
};

export type ValidateMessage = {
  dataUri: File;
};

export type QueryCodecsMessage = {
  width?: number;
  height?: number;
};

export type RenderWorkerMessage =
  | {
      type: "render";
      payload: RenderMessage;
    }
  | {
      type: "validate";
      payload: ValidateMessage;
    }
  | {
      type: "query-codecs";
      payload?: QueryCodecsMessage;
    };

export type ConfigSupportResponseMessage =
  | {
      type: "config-support";
      decoderSupported: boolean;
      encoderSupported: boolean;
      encoderConfig: {
        codec: string;
        width: number;
        height: number;
        bitrate?: number;
      } | null;
    }
  | {
      type: "error";
      message: string;
      error: unknown;
    };

const postMessage = (
  message: RenderProgressMessage | ConfigSupportResponseMessage | SupportedCodecsMessage,
) => self.postMessage(message);

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

function createMediaBunnyTarget(target: Target) {
  switch (target.type) {
    case "filestream":
      if (!target.stream) {
        throw new Error("Filestream target is not initialized");
      }
      return new StreamTarget(target.stream);
    case "arraybuffer":
      return new BufferTarget();
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

async function prepareTargetForWriting(target: Target): Promise<Target> {
  if (target.type === "filehandle") {
    return {
      type: "filestream",
      stream: await target.handle.createWritable(),
    };
  }
  return target;
}

export async function render({
  dataUri,
  canvas,
  target,
  cues,
  style,
  outputFormat = "mp4",
  videoCodec: preferredVideoCodec,
  audioCodec: preferredAudioCodec,
  wordAnimationData,
}: RenderMessage) {
  let canvasSource: CanvasSource | null = null;
  let output: Output | null = null;
  let audioSampleSource: AudioSampleSource | null = null;
  let audioProcessingError: Error | null = null;

  try {
    if (!dataUri || !canvas) {
      throw new Error("Invalid input: dataUri and canvas are required");
    }

    if (canvas.width <= 0 || canvas.height <= 0) {
      throw new Error(
        `Invalid canvas dimensions: ${canvas.width}x${canvas.height}`,
      );
    }

    try {
      target = await prepareTargetForWriting(target);
    } catch (e) {
      throw new Error(
        `Failed to prepare output target: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    try {
      await Promise.race([
        loadGoogleFont(style.fontFamily, style.fontWeight),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Font loading timeout")), 10000),
        ),
      ]);
    } catch (e) {
      console.warn(
        `Failed to load font ${style.fontFamily}, continuing with system fonts:`,
        e,
      );
      // Continue rendering - system fonts will be used as fallback
    }

    // Create input
    let input: Input;
    try {
      input = new Input({
        source: new BlobSource(dataUri),
        formats: ALL_FORMATS,
      });
    } catch (e) {
      throw new Error(
        `Failed to open input file: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      throw new Error(
        "No video track found in input file. Please ensure the file is a valid video.",
      );
    }

    if (videoTrack.displayWidth <= 0 || videoTrack.displayHeight <= 0) {
      throw new Error(
        `Invalid video dimensions: ${videoTrack.displayWidth}x${videoTrack.displayHeight}`,
      );
    }

    const canDecode = await videoTrack.canDecode();
    if (!canDecode) {
      throw new Error(
        `Cannot decode video track. Codec may not be supported by your browser. ` +
          `Video codec: ${videoTrack.codec || "unknown"}`,
      );
    }

    const audioTrack = await input.getPrimaryAudioTrack();

    let format: Mp4OutputFormat | WebMOutputFormat | MovOutputFormat;
    let actualOutputFormat: OutputFormat = outputFormat;

    // Create format class based on format string
    function createFormatClass(fmt: OutputFormat): Mp4OutputFormat | WebMOutputFormat | MovOutputFormat {
      switch (fmt) {
        case "webm":
          return new WebMOutputFormat();
        case "mov":
          return new MovOutputFormat();
        case "mp4":
        default:
          return new Mp4OutputFormat();
      }
    }

    // Define fallback order based on requested format
    const formatFallbackOrder: OutputFormat[] = (() => {
      switch (outputFormat) {
        case "webm":
          return ["webm", "mp4", "mov"];
        case "mov":
          return ["mov", "mp4", "webm"];
        case "mp4":
        default:
          return ["mp4", "mov", "webm"];
      }
    })();

    const formatAttempts = formatFallbackOrder.map((fmt) => ({
      format: fmt,
      formatClass: createFormatClass(fmt),
    }));

    let videoCodec: VideoCodec | null = null;
    let formatError = null;

    for (const attempt of formatAttempts) {
      try {
        format = attempt.formatClass;
        const supportedVideoCodecs = format.getSupportedVideoCodecs();

        // If user specified a preferred codec, try it first if supported by the format
        if (preferredVideoCodec && supportedVideoCodecs.includes(preferredVideoCodec as VideoCodec)) {
          const canEncode = await canEncodeVideo(preferredVideoCodec as VideoCodec, {
            width: videoTrack.displayWidth,
            height: videoTrack.displayHeight,
          });
          if (canEncode) {
            videoCodec = preferredVideoCodec as VideoCodec;
          }
        }

        // If preferred codec didn't work, try to find any encodable codec
        if (!videoCodec) {
          videoCodec = await getFirstEncodableVideoCodec(
            supportedVideoCodecs,
            {
              width: videoTrack.displayWidth,
              height: videoTrack.displayHeight,
            },
          );
        }

        if (videoCodec) {
          actualOutputFormat = attempt.format;
          if (attempt.format !== outputFormat) {
            console.warn(
              `Requested ${outputFormat} format not supported, falling back to ${attempt.format}`,
            );
            postMessage({
              type: "error",
              error: new Error(
                `Format fallback: using ${attempt.format} instead of ${outputFormat}`,
              ),
              message: `Your browser doesn't support ${outputFormat} format. Using ${attempt.format} instead.`,
            });
          }
          if (preferredVideoCodec && videoCodec !== preferredVideoCodec) {
            console.warn(
              `Requested ${preferredVideoCodec} codec not supported, using ${videoCodec}`,
            );
          }
          break;
        }
      } catch (e) {
        formatError = e;
        console.warn(`Failed to use ${attempt.format} format:`, e);
      }
    }

    if (!videoCodec || !format!) {
      throw new Error(
        `No compatible video codec found for any output format. ` +
          `Your browser may not support encoding this video resolution (${videoTrack.displayWidth}x${videoTrack.displayHeight}). ` +
          `Last error: ${formatError instanceof Error ? formatError.message : String(formatError)}`,
      );
    }

    try {
      output = new Output({
        target: createMediaBunnyTarget(target),
        format,
      });
    } catch (e) {
      throw new Error(
        `Failed to create output: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    let packetStats;
    try {
      packetStats = await videoTrack.computePacketStats();
    } catch (e) {
      console.warn("Failed to compute packet stats, using defaults:", e);
      packetStats = { averagePacketRate: 30, averageBitrate: 0 };
    }

    const frameRate = packetStats.averagePacketRate || 30;
    const bitrate = packetStats.averageBitrate;

    // Validate frame rate
    if (frameRate <= 0 || frameRate > 240) {
      throw new Error(
        `Invalid frame rate: ${frameRate}. Frame rate must be between 0 and 240 fps.`,
      );
    }

    let validBitrate;
    if (Number.isFinite(bitrate) && bitrate > 0) {
      // Round to nearest integer if it's a valid positive number
      validBitrate = Math.round(bitrate);
    } else {
      // Use Quality preset if bitrate is NaN, undefined, 0, or negative
      validBitrate = QUALITY_HIGH;
    }

    // Try multiple bitrate options if the first fails
    const bitrateAttempts = [
      validBitrate,
      QUALITY_HIGH,
      5000000, // 5 Mbps fallback
      2000000, // 2 Mbps fallback
    ];

    let encoderError = null;
    for (const bitrateAttempt of bitrateAttempts) {
      try {
        canvasSource = new CanvasSource(canvas, {
          codec: videoCodec as VideoCodec,
          bitrate: bitrateAttempt,
        });

        if (bitrateAttempt !== validBitrate) {
          console.warn(
            `Original bitrate ${validBitrate} failed, using fallback: ${bitrateAttempt}`,
          );
        }
        break;
      } catch (e) {
        encoderError = e;
        console.warn(
          `Failed to create encoder with bitrate ${bitrateAttempt}:`,
          e,
        );
        continue;
      }
    }

    if (!canvasSource) {
      throw new Error(
        `Failed to create video encoder with any bitrate configuration. ` +
          `Last error: ${encoderError instanceof Error ? encoderError.message : String(encoderError)}`,
      );
    }

    output.addVideoTrack(canvasSource, { frameRate });

    if (audioTrack) {
      try {
        const canDecodeAudio = await audioTrack.canDecode();

        if (canDecodeAudio) {
          // Try to find compatible audio codec with multiple parameter combinations
          const sampleRateAttempts = [
            audioTrack.sampleRate,
            48000, // Standard fallback
            44100, // CD quality fallback
          ];

          const channelAttempts = [
            audioTrack.numberOfChannels,
            2, // Stereo fallback
            1, // Mono fallback
          ];

          let audioCodec: AudioCodec | null = null;
          const supportedAudioCodecs = format.getSupportedAudioCodecs();

          // Try different sample rate and channel combinations
          outerLoop: for (const sampleRate of sampleRateAttempts) {
            for (const channels of channelAttempts) {
              try {
                // If user specified a preferred audio codec, try it first
                if (preferredAudioCodec && supportedAudioCodecs.includes(preferredAudioCodec as AudioCodec)) {
                  const canEncode = await canEncodeAudio(preferredAudioCodec as AudioCodec, {
                    sampleRate,
                    numberOfChannels: channels,
                  });
                  if (canEncode) {
                    audioCodec = preferredAudioCodec as AudioCodec;
                  }
                }

                // If preferred codec didn't work, try to find any encodable codec
                if (!audioCodec) {
                  audioCodec = await getFirstEncodableAudioCodec(
                    supportedAudioCodecs,
                    {
                      sampleRate,
                      numberOfChannels: channels,
                    },
                  );
                }

                if (audioCodec) {
                  if (
                    sampleRate !== audioTrack.sampleRate ||
                    channels !== audioTrack.numberOfChannels
                  ) {
                    console.warn(
                      `Audio parameters adjusted: ${audioTrack.sampleRate}Hz/${audioTrack.numberOfChannels}ch -> ${sampleRate}Hz/${channels}ch`,
                    );
                  }
                  if (preferredAudioCodec && audioCodec !== preferredAudioCodec) {
                    console.warn(
                      `Requested ${preferredAudioCodec} audio codec not supported, using ${audioCodec}`,
                    );
                  }
                  break outerLoop;
                }
              } catch (e) {
                console.warn(
                  `Failed to get audio codec for ${sampleRate}Hz/${channels}ch:`,
                  e,
                );
              }
            }
          }

          if (audioCodec) {
            const audioSampleSink = new AudioSampleSink(audioTrack);

            // Get audio bitrate from source track
            let audioPacketStats;
            try {
              audioPacketStats = await audioTrack.computePacketStats();
            } catch (e) {
              console.warn(
                "Failed to compute audio packet stats, using defaults:",
                e,
              );
              audioPacketStats = { averageBitrate: 128000 };
            }

            const audioBitrate = audioPacketStats.averageBitrate;

            // Round to nearest standard audio bitrate
            // Standard bitrates: 64, 96, 128, 160, 192, 256, 320 kbps
            const standardBitrates = [
              64000, 96000, 128000, 160000, 192000, 256000, 320000,
            ];
            let validAudioBitrate = 128000; // Default fallback

            if (Number.isFinite(audioBitrate) && audioBitrate > 0) {
              // Find the closest standard bitrate
              validAudioBitrate = standardBitrates.reduce((prev, curr) => {
                return Math.abs(curr - audioBitrate) <
                  Math.abs(prev - audioBitrate)
                  ? curr
                  : prev;
              });
            }

            // Try multiple bitrates if the first fails
            const audioBitrateAttempts = [
              validAudioBitrate,
              128000, // Standard fallback
              96000, // Lower quality fallback
              192000, // Higher quality fallback
            ];

            let audioEncoderCreated = false;
            let audioEncoderError = null;

            for (const bitrateAttempt of audioBitrateAttempts) {
              try {
                audioSampleSource = new AudioSampleSource({
                  codec: audioCodec as AudioCodec,
                  bitrate: bitrateAttempt,
                });

                if (bitrateAttempt !== validAudioBitrate) {
                  console.warn(
                    `Audio bitrate adjusted from ${validAudioBitrate} to ${bitrateAttempt}`,
                  );
                }

                audioEncoderCreated = true;
                break;
              } catch (e) {
                audioEncoderError = e;
                console.warn(
                  `Failed to create audio encoder with bitrate ${bitrateAttempt}:`,
                  e,
                );
              }
            }

            if (audioEncoderCreated && audioSampleSource) {
              try {
                output.addAudioTrack(audioSampleSource);
              } catch (e) {
                console.warn(
                  `Failed to add audio track: ${e instanceof Error ? e.message : String(e)}`,
                );
                console.warn("Continuing without audio...");
                audioSampleSource = null;
              }
            } else {
              console.warn(
                `Failed to create audio encoder with any bitrate: ${audioEncoderError instanceof Error ? audioEncoderError.message : String(audioEncoderError)}`,
              );
              console.warn("Continuing without audio...");
            }

            // Only start audio processing if we successfully added the track
            if (audioSampleSource) {
              // Start audio decoding/encoding in parallel
              (async () => {
                try {
                  for await (const audioSample of audioSampleSink.samples()) {
                    try {
                      await audioSampleSource!.add(audioSample);
                      audioSample.close(); // Close sample after processing for proper resource management
                    } catch (e) {
                      // Close the sample even on error
                      try {
                        audioSample.close();
                      } catch {}
                      throw e;
                    }
                  }
                  audioSampleSource!.close();
                } catch (e) {
                  audioProcessingError =
                    e instanceof Error ? e : new Error(String(e));
                  console.error(
                    "Audio processing error:",
                    audioProcessingError,
                  );
                  // Don't post error message here - will be handled after video finishes
                }
              })();
            }
          } else {
            console.warn(
              `No compatible audio codec found for any audio parameters. Continuing without audio...`,
            );
          }
        } else {
          console.warn(
            "Cannot decode audio track. Continuing without audio...",
          );
        }
      } catch (e) {
        console.warn(
          `Error setting up audio: ${e instanceof Error ? e.message : String(e)}`,
        );
        console.warn("Continuing without audio...");
      }
    }

    // Start output
    try {
      await output.start();
    } catch (e) {
      throw new Error(
        `Failed to start output: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // Setup subtitle renderer context
    const videoDecoderConfig = await videoTrack.getDecoderConfig();
    if (!videoDecoderConfig) {
      throw new Error("Could not get decoder config for video track");
    }

    let rendererCtx;
    try {
      rendererCtx = createCtx(videoDecoderConfig, canvas, style, wordAnimationData);
    } catch (e) {
      throw new Error(
        `Failed to create subtitle renderer: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // Create canvas sink for decoding
    let canvasSink;
    try {
      canvasSink = new CanvasSink(videoTrack, {
        width: videoTrack.displayWidth,
        height: videoTrack.displayHeight,
        fit: "fill", // Use exact dimensions without aspect ratio adjustment
      });
    } catch (e) {
      throw new Error(
        `Failed to create video decoder: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // Process frames
    let frameCount = 0;
    const duration = await videoTrack.computeDuration();
    const totalFrames = Math.ceil(duration * frameRate);

    if (totalFrames <= 0) {
      throw new Error(
        `Invalid video duration: ${duration}s (${totalFrames} frames)`,
      );
    }

    postMessage({
      type: "filereadprogress",
      progress: 100,
    });

    try {
      for await (const wrappedCanvas of canvasSink.canvases()) {
        const { canvas: sourceCanvas, timestamp, duration } = wrappedCanvas;

        try {
          renderCueOnCanvas(cues, sourceCanvas, rendererCtx, timestamp);
        } catch (e) {
          console.warn(`Failed to render subtitle at ${timestamp}s:`, e);
          // Continue without subtitle for this frame
        }

        try {
          await canvasSource.add(timestamp, duration);
        } catch (e) {
          throw new Error(
            `Failed to encode frame at ${timestamp.toFixed(2)}s: ${e instanceof Error ? e.message : String(e)}`,
          );
        }

        // Progress tracking
        frameCount++;
        if (frameCount % 10 === 0 || frameCount === totalFrames) {
          postMessage({
            type: "renderprogress",
            progress: Math.min(100, (frameCount / totalFrames) * 100),
          });
        }
      }
    } catch (e) {
      throw new Error(
        `Failed during frame processing (processed ${frameCount}/${totalFrames} frames): ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // Close video source
    try {
      canvasSource.close();
    } catch (e) {
      console.warn("Error closing canvas source:", e);
    }

    // Finalize output
    try {
      await output.finalize();
    } catch (e) {
      throw new Error(
        `Failed to finalize output: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // Check if audio processing had errors
    if (audioProcessingError) {
      console.warn(
        "Video completed but audio had errors:",
        audioProcessingError.message,
      );
      // Don't fail the entire render, video is complete
    }

    // Handle output result
    let resultTarget = target;
    if (target.type === "arraybuffer") {
      const bufferTarget = output.target as BufferTarget;
      if (!bufferTarget.buffer) {
        throw new Error("Output buffer is empty");
      }
      resultTarget = {
        type: "populated_arraybuffer",
        fileName: target.fileName,
        arrayBuffer: bufferTarget.buffer,
      };
    } else if (target.type === "filestream") {
      // Stream is automatically closed by mediabunny
      target.stream = null;
    }

    postMessage({
      type: "done",
      target: resultTarget,
      outputFormat: actualOutputFormat,
    });
  } catch (e) {
    // Cleanup resources on error
    try {
      if (canvasSource) {
        canvasSource.close();
      }
    } catch {}

    try {
      if (audioSampleSource) {
        audioSampleSource.close();
      }
    } catch {}

    // Close filestream if it was opened
    if (target?.type === "filestream" && target.stream) {
      try {
        await target.stream.close();
      } catch {}
    }

    const errorMessage = e instanceof Error ? e.message : String(e);
    const errorStack = e instanceof Error ? e.stack : undefined;

    console.error("Render error:", errorMessage, errorStack);

    postMessage({
      type: "error",
      error: e,
      message: errorMessage,
    });
  }
}

export async function validateFile({ dataUri }: ValidateMessage) {
  try {
    // Validate input
    if (!dataUri) {
      throw new Error("Invalid input: dataUri is required");
    }

    // Create input with error handling
    let input: Input;
    try {
      input = new Input({
        source: new BlobSource(dataUri),
        formats: ALL_FORMATS,
      });
    } catch (e) {
      throw new Error(
        `Failed to open file: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // Get video track
    let videoTrack;
    try {
      videoTrack = await input.getPrimaryVideoTrack();
    } catch (e) {
      throw new Error(
        `Failed to read video track: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    if (!videoTrack) {
      throw new Error(
        "No video track found in input file. Please ensure the file is a valid video.",
      );
    }

    // Validate dimensions
    if (videoTrack.displayWidth <= 0 || videoTrack.displayHeight <= 0) {
      throw new Error(
        `Invalid video dimensions: ${videoTrack.displayWidth}x${videoTrack.displayHeight}`,
      );
    }

    // Check decoder support
    let decoderSupported = false;
    try {
      decoderSupported = await videoTrack.canDecode();
    } catch (e) {
      console.warn("Error checking decoder support:", e);
    }

    // Check encoder support with auto-selection
    const outputFormat = new Mp4OutputFormat();
    let videoCodec = null;
    try {
      videoCodec = await getFirstEncodableVideoCodec(
        outputFormat.getSupportedVideoCodecs(),
        {
          width: videoTrack.displayWidth,
          height: videoTrack.displayHeight,
        },
      );
    } catch (e) {
      console.warn("Error checking encoder support:", e);
    }

    // Get packet stats with error handling
    let packetStats;
    try {
      packetStats = await videoTrack.computePacketStats();
    } catch (e) {
      console.warn("Failed to compute packet stats:", e);
      packetStats = { averageBitrate: 0 };
    }

    postMessage({
      type: "config-support",
      decoderSupported,
      encoderSupported: videoCodec !== null,
      encoderConfig: videoCodec
        ? {
            codec: videoCodec,
            width: videoTrack.displayWidth,
            height: videoTrack.displayHeight,
            bitrate: packetStats.averageBitrate,
          }
        : null,
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Validation error:", errorMessage);

    postMessage({
      type: "error",
      error: e,
      message: errorMessage,
    });
  }
}

export async function querySupportedCodecs({ width = 1920, height = 1080 }: QueryCodecsMessage = {}) {
  try {
    const supportedVideoCodecs = await getEncodableVideoCodecs(
      [...VIDEO_CODECS],
      { width, height }
    );

    const supportedAudioCodecs = await getEncodableAudioCodecs(
      [...NON_PCM_AUDIO_CODECS],
      { sampleRate: 48000, numberOfChannels: 2 }
    );

    postMessage({
      type: "supported-codecs",
      videoCodecs: supportedVideoCodecs as OutputVideoCodec[],
      audioCodecs: supportedAudioCodecs as OutputAudioCodec[],
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Error querying codecs:", errorMessage);

    postMessage({
      type: "error",
      error: e,
      message: errorMessage,
    });
  }
}

self.addEventListener(
  "message",
  (message: MessageEvent<RenderWorkerMessage>) => {
    try {
      if (message.data.type === "render") {
        render(message.data.payload).catch((e) => {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.error("Unhandled render error:", errorMessage);
          postMessage({
            type: "error",
            error: e,
            message: errorMessage || "Failed to render video",
          });
        });
      } else if (message.data.type === "validate") {
        validateFile(message.data.payload).catch((e) => {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.error("Unhandled validation error:", errorMessage);
          postMessage({
            type: "error",
            error: e,
            message: errorMessage || "Failed to validate file",
          });
        });
      } else if (message.data.type === "query-codecs") {
        querySupportedCodecs(message.data.payload).catch((e) => {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.error("Unhandled codec query error:", errorMessage);
          postMessage({
            type: "error",
            error: e,
            message: errorMessage || "Failed to query codecs",
          });
        });
      } else {
        console.warn("Unknown message type:", (message.data as any)?.type);
      }
    } catch (e) {
      console.error("Error handling message:", e);
      postMessage({
        type: "error",
        error: e,
        message: "Worker error: Failed to process message",
      });
    }
  },
);
