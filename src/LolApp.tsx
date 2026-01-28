import * as React from "react";
import { style } from "./screens/editor/Style.gen";
import { useChunksState } from "./screens/editor/ChunksList/ChunksList.gen";
import RenderWorker from "./codecs/render-worker?worker";
import { useTranscriber } from "./transcriber/useTranscriber";
import Constants from "./transcriber/Constants";
import { Spinner } from "./ui/Spinner";
import { LandingDropzone } from "./screens/LandingDropzone";
import { Progress } from "./ui/Progress";
import { makeEditorContextComponent } from "./screens/editor/EditorContext.gen";
import { Transition } from "@headlessui/react";
import type {
  Target,
  RenderWorkerMessage,
  ConfigSupportResponseMessage,
  RenderProgressMessage,
  OutputFormat,
  OutputVideoCodec,
  OutputAudioCodec,
} from "./codecs/render-worker";
import clsx from "clsx";
import { ShowErrorContext, UserFacingError } from "./ErrorBoundary";
import { log } from "./hooks/useAnalytics";
import HeartIcon from "@heroicons/react/20/solid/HeartIcon";
import { ProductHuntIcon } from "./ui/Icons.res.mjs";
import { Editor } from "./screens/editor/Editor.gen";

type VideoFile = {
  name: string;
  file: File;
  objectURL: string;
  audioBuffer: AudioBuffer;
  audioCtx: AudioContext;
};

export type ProgressItem = {
  id: string;
  title: string;
  progress: number;
};

type FormatConfig = {
  extension: string;
  mimeType: string;
  description: string;
};

const FORMAT_CONFIGS: Record<OutputFormat, FormatConfig> = {
  mp4: { extension: ".mp4", mimeType: "video/mp4", description: "MP4 Video" },
  webm: {
    extension: ".webm",
    mimeType: "video/webm",
    description: "WebM Video",
  },
  mov: {
    extension: ".mov",
    mimeType: "video/quicktime",
    description: "QuickTime Video",
  },
};

function getOutputFileName(originalName: string, format: OutputFormat): string {
  // Remove existing extension and add the new one
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  return `transcribed_${baseName}${FORMAT_CONFIGS[format].extension}`;
}

async function createTarget(file: File, format: OutputFormat): Promise<Target> {
  const suggestedName = getOutputFileName(file.name, format);
  const config = FORMAT_CONFIGS[format];

  if ("showSaveFilePicker" in window) {
    let fileHandle = await (window as any).showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: config.description,
          accept: { [config.mimeType]: [config.extension] },
        },
      ],
    });

    return {
      type: "filehandle",
      handle: fileHandle,
    };
  }

  return {
    type: "arraybuffer",
    fileName: suggestedName,
  };
}

function saveTarget(target: Target, format: OutputFormat) {
  if (target.type === "populated_arraybuffer") {
    const config = FORMAT_CONFIGS[format];
    const blob = new Blob([target.arrayBuffer!], { type: config.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = target.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Why is this written in TypeScript? 💀 My eyes are bleeding from these terrible states.
export default function LolApp() {
  const failWith = React.useContext(ShowErrorContext);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rendererPreviewCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [progressItems, setProgressItems] = React.useState<ProgressItem[]>([]);

  const transcriber = useTranscriber(setProgressItems);
  const [file, setFile] = React.useState<VideoFile | null>(null);
  const [renderState, setRenderState] = React.useState<
    "idle" | "rendering" | "done" | "error"
  >("idle");
  const [renderError, setRenderError] = React.useState<string | null>(null);
  const resetPlayerStateRef = React.useRef<(() => void) | null>(null);
  // Key to force canvas recreation after render (transferControlToOffscreen can only be called once)
  const [renderCanvasKey, setRenderCanvasKey] = React.useState(0);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const timelineVideoRef = React.useRef<HTMLVideoElement>(null);

  const [EditorContext, setEditorContext] = React.useState<{
    make: (props: any) => React.ReactElement;
  } | null>(null);

  async function readAndPrepareAudioContext(file: File) {
    try {
      const audioCtx = new AudioContext({
        sampleRate: Constants.SAMPLING_RATE,
      });

      setProgressItems([
        {
          id: "decodeprogress",
          title: "Decoding Audio",
          progress: 0,
        },
      ]);
      const arrayBuffer = await file.arrayBuffer();
      setProgressItems([
        {
          id: "decodeprogress",
          title: "Decoding Audio",
          progress: 25,
        },
      ]);

      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setProgressItems([
        {
          id: "decodeprogress",
          title: "Decoding Audio",
          progress: 100,
        },
      ]);

      return { audioBuffer, audioCtx };
    } catch (e) {
      throw new UserFacingError(
        "We couldn't find decodable audio stream in your video",
        e,
      );
    }
  }

  async function validateFileCodecSupported(file: File) {
    const worker = new RenderWorker();

    worker.postMessage({
      type: "validate",
      payload: {
        dataUri: file,
      },
    } as RenderWorkerMessage);

    return new Promise<boolean>((res, rej) =>
      worker.addEventListener(
        "message",
        ({ data }: MessageEvent<ConfigSupportResponseMessage>) => {
          if (data.type === "error") {
            rej(new UserFacingError(data.message, data.error));
          }

          if (data.type === "config-support") {
            if (
              data.encoderSupported &&
              data.decoderSupported &&
              data.encoderConfig
            ) {
              res(true);
            } else {
              let whichCodecIsMissing = "";

              if (!data.encoderSupported && !data.decoderSupported) {
                whichCodecIsMissing = "both encoding and decoding";
              }

              if (!data.encoderSupported && data.decoderSupported) {
                whichCodecIsMissing = "encoding";
              }

              if (data.encoderSupported && !data.decoderSupported) {
                whichCodecIsMissing = "decoding";
              }

              rej(
                new UserFacingError(
                  `Your browser does not support ${whichCodecIsMissing} for your video file codec.`,
                  new Error(
                    "mediabunny will try to find a compatible codec. This error may occur if your browser lacks WebCodecs support.",
                  ),
                ),
              );
            }
          }
        },
        { once: true },
      ),
    ).finally(() => worker.terminate());
  }

  const onFile = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) {
      return;
    }

    log("video_uploaded");
    document.title = `validating ${file.name}`;

    try {
      const [{ audioCtx, audioBuffer }] = await Promise.all([
        readAndPrepareAudioContext(file),
        validateFileCodecSupported(file),
      ]);

      setFile({
        file,
        name: file.name,
        objectURL: URL.createObjectURL(file),
        audioBuffer,
        audioCtx,
      });

      setProgressItems([]);
      document.title = `transcribing ${file.name}`;

      transcriber.start(audioBuffer);
    } catch (e) {
      failWith(e);
    }
  };

  const subtitlesManager = useChunksState(
    transcriber.output?.chunks ?? [],
    transcriber.isBusy,
    Constants.DEFAULT_CHUNK_THRESHOLD_CHARS,
  );

  const handleBackToEditor = React.useCallback(() => {
    setRenderState("idle");
    resetPlayerStateRef.current?.();
    // Increment key to force canvas recreation (transferControlToOffscreen can only be called once)
    setRenderCanvasKey((k) => k + 1);
  }, []);

  const render = React.useCallback(
    async (
      style: style,
      outputFormat: string = "mp4",
      videoCodec?: string,
      audioCodec?: string,
    ) => {
      log("video_render_started");

      const worker = new RenderWorker();
      if (!file || !rendererPreviewCanvasRef.current) {
        return Promise.reject();
      }

      const offscreenCanvas =
        rendererPreviewCanvasRef.current?.transferControlToOffscreen();
      if (!offscreenCanvas) {
        return Promise.reject();
      }

      // Validate output format
      const validFormat: OutputFormat =
        outputFormat === "webm"
          ? "webm"
          : outputFormat === "mov"
            ? "mov"
            : "mp4";

      // Validate video codec
      const validVideoCodec: OutputVideoCodec | undefined =
        videoCodec && ["avc", "hevc", "vp9", "vp8", "av1"].includes(videoCodec)
          ? (videoCodec as OutputVideoCodec)
          : undefined;

      // Validate audio codec
      const validAudioCodec: OutputAudioCodec | undefined =
        audioCodec &&
        ["aac", "opus", "mp3", "vorbis", "flac"].includes(audioCodec)
          ? (audioCodec as OutputAudioCodec)
          : undefined;

      const target = await createTarget(file.file, validFormat);
      setRenderState("rendering");
      setProgressItems([
        {
          id: "filereadprogress",
          title: "Reading file",
          progress: 0,
        },
        {
          id: "renderprogress",
          title: "Rendering frames",
          progress: 0,
        },
      ]);

      worker.postMessage(
        {
          type: "render",
          payload: {
            style,
            target,
            dataUri: file.file,
            canvas: offscreenCanvas,
            cues: subtitlesManager.activeSubtitles,
            outputFormat: validFormat,
            videoCodec: validVideoCodec,
            audioCodec: validAudioCodec,
            // Pass word animation data if word animation is enabled
            wordAnimationData:
              style.showWordAnimation &&
              subtitlesManager.transcriptionState !== "TranscriptionInProgress"
                ? {
                    wordChunks: subtitlesManager.transcriptionState.wordChunks,
                    cueRanges: subtitlesManager.transcriptionState.cueRanges,
                  }
                : undefined,
          },
        } as RenderWorkerMessage,
        [offscreenCanvas],
      );

      worker.addEventListener(
        "message",
        (e: MessageEvent<RenderProgressMessage>) => {
          if (e.data.type === "error") {
            setRenderError(e.data.message);
            setRenderState("error");
            setProgressItems([]);
            worker.terminate();
          }
          if (e.data.type === "done") {
            log("video_rendered");

            // Use the actual output format from the worker (may differ if fallback occurred)
            saveTarget(e.data.target, e.data.outputFormat);

            document.title = `✅ Subtitles rendered!`;
            setRenderState("done");
            setProgressItems([]);
            worker.terminate();

            import("js-confetti").then(({ default: JsConfetti }) => {
              new JsConfetti().addConfetti();
            });
          }
          if (e.data.type === "renderprogress") {
            document.title = `${Math.floor(e.data.progress)}% — subtitles for ${file.name}`;
          }
          if (
            e.data.type === "renderprogress" ||
            e.data.type === "encodeprogress" ||
            e.data.type === "filereadprogress"
          ) {
            const progress = e.data.progress;
            setProgressItems((prev) =>
              prev.map((item) => {
                if (item.id === e.data.type) {
                  return { ...item, progress };
                }

                return item;
              }),
            );
          }
        },
      );
    },
    [subtitlesManager],
  );

  const [status, description] = React.useMemo(() => {
    if (transcriber.isModelLoading) {
      return [
        "Loading AI model",
        "The AI model is now loading. This will happen only once. On your next visit, everything will be much faster.",
      ];
    }

    if (transcriber.isBusy) {
      return [
        "Transcribing",
        "We are currently transcribing your video. The editor will appear shortly.",
      ];
    }

    return [
      "Processing Audio",
      "We are loading and processing the audio from your video.",
    ];
  }, [transcriber.isModelLoading, transcriber.isBusy]);

  const handleMetadataLoad = React.useCallback(
    (e: React.FormEvent<HTMLVideoElement>) => {
      if (!EditorContext) {
        const component = makeEditorContextComponent(
          {
            duration: e.currentTarget.duration,
            width: e.currentTarget.videoWidth,
            height: e.currentTarget.videoHeight,
          },
          videoRef,
          timelineVideoRef,
          subtitlesManager.subtitlesRef,
          canvasRef,
          file?.audioBuffer,
        );

        setEditorContext(component);
      }
    },
    [file],
  );

  //const fakeState = useChunksState(
  //  [
  //    {
  //      id: 0,
  //      text: "Hello, world! ",
  //      timestamp: [0, 1],
  //    },
  //    {
  //      id: 1,
  //      text: "This is a test subtitle, ",
  //      timestamp: [2, 4],
  //    },
  //    {
  //      id: 2,
  //      text: "and this is the end!",
  //      timestamp: [4, null],
  //    },
  //  ],
  //  false,
  //);
  //return (
  //  <>
  //    <video
  //      ref={videoRef}
  //      className="hidden"
  //      //src={file.objectURL}
  //      src="https://cdn.pixabay.com/video/2024/05/31/214592_large.mp4"
  //      onLoadedMetadata={handleMetadataLoad}
  //    />
  //    <video
  //      muted
  //      ref={timelineVideoRef}
  //      className="hidden"
  //      //src={file.objectURL}
  //      src="https://cdn.pixabay.com/video/2024/05/31/214592_large.mp4"
  //    />
  //
  //    {EditorContext && (
  //      <EditorContext.make>
  //        {/**<Editor subtitles={transcriber.output?.chunks} />*/}
  //        <Editor subtitlesManager={fakeState} />
  //      </EditorContext.make>
  //    )}
  //  </>
  //);
  //
  if (!file) {
    return (
      <LandingDropzone
        onDrop={onFile}
        language={transcriber.language ?? "en"}
        setLanguage={transcriber.setLanguage}
        model={transcriber.model}
        setModel={transcriber.setModel}
      />
    );
  }

  if (file && !transcriber.output) {
    return (
      <div className="container mx-auto flex items-center justify-center px-4 flex-col h-dvh md:h-screen">
        <svg
          className="absolute inset-0 -z-10 h-full w-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
              width={200}
              height={200}
              x="50%"
              y={-1}
              patternUnits="userSpaceOnUse"
            >
              <path d="M.5 200V.5H200" fill="none" />
            </pattern>
          </defs>
          <svg x="50%" y={-1} className="overflow-visible fill-gray-800/20">
            <path
              d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
              strokeWidth={0}
            />
          </svg>
          <rect
            width="100%"
            height="100%"
            strokeWidth={0}
            fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)"
          />
        </svg>

        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
          <div className="md:hidden">
            <Spinner sizeRem={2} />
          </div>
          <div className="hidden md:block">
            <Spinner sizeRem={3} />
          </div>
          <h1 className="text-2xl md:text-5xl text-center">{status}</h1>
        </div>
        <p className="text-center text-balance text-gray-400 text-sm md:text-base mt-4 px-2">
          {description}
        </p>
        <div className="w-full flex flex-col gap-y-2 mt-8 md:mt-12 max-w-[34rem] px-4">
          {progressItems
            ? progressItems.map((item) => (
                <Progress
                  key={item.id}
                  name={item.title}
                  progress={item.progress ?? 0}
                />
              ))
            : null}
        </div>
      </div>
    );
  }

  // If you are wondering how this was implemented and are surprised that I used
  // 2 video elements - just know I was too lazy to do something else, but you
  // probably should use webcodecs and manually decode, bufferize, and render frames.
  return (
    <>
      <video
        ref={videoRef}
        className="hidden"
        src={file.objectURL}
        onLoadedMetadata={handleMetadataLoad}
      />

      <video
        muted
        ref={timelineVideoRef}
        className="hidden"
        src={file.objectURL}
      />

      {EditorContext && (
        <EditorContext.make>
          <Editor
            render={render}
            subtitlesManager={subtitlesManager}
            rendererPreviewCanvasRef={rendererPreviewCanvasRef}
            renderCanvasKey={renderCanvasKey}
            videoFileName={file.name}
            onResetPlayerState={(fn: () => void) => {
              resetPlayerStateRef.current = fn;
            }}
          />
        </EditorContext.make>
      )}

      <Transition show={renderState !== "idle"}>
        <div
          className={clsx(
            "transition flex-col absolute z-[60] w-screen h-dvh md:h-screen bg-white/10 backdrop-blur-xl inset-0 duration-300 ease-in data-[closed]:opacity-0 flex items-center justify-center px-4",
            renderState === "done" && "!bg-green-600/10 !backdrop-blur-2xl",
            renderState === "error" && "!bg-red-600/10 !backdrop-blur-2xl",
          )}
        >
          {renderState === "rendering" && (
            <>
              <h2 className="text-2xl md:text-5xl text-center tracking-wide font-bold">
                Rendering your video
              </h2>
              <p className="text-gray-300 text-balance text-center text-sm md:text-lg max-w-screen-sm mt-4">
                In a moment you'll get your video with subtitles created at the
                selected location. Feel free to move to the other tab, the
                render will continue in the background.
              </p>

              <div className="w-full flex flex-col gap-y-2 mt-6 md:mt-8 max-w-[34rem]">
                {progressItems
                  ? progressItems.map((item) => (
                      <Progress
                        key={item.id}
                        name={item.title}
                        progress={item.progress ?? 0}
                      />
                    ))
                  : null}
              </div>
            </>
          )}

          {renderState === "error" && (
            <>
              <h2 className="text-2xl md:text-5xl text-center tracking-wide font-bold text-red-400">
                Rendering Failed
              </h2>
              <p className="text-gray-200 text-balance text-center max-w-screen-sm text-sm md:text-lg mt-4">
                {renderError || "An unknown error occurred during rendering."}
              </p>
              <p className="text-gray-400 text-balance text-center max-w-screen-md text-xs md:text-sm mt-2">
                Try selecting a different video codec or format. Some codec
                combinations may not be supported by your browser.
              </p>

              <button
                onClick={handleBackToEditor}
                className="mt-6 text-gray-300 hover:text-white underline underline-offset-4 transition"
              >
                ← Back to editor
              </button>
            </>
          )}

          {renderState === "done" && (
            <>
              <h2 className="text-2xl md:text-5xl text-center tracking-wide font-bold">
                Video Rendered!
              </h2>
              <p className="text-gray-200 text-balance text-center max-w-screen-sm text-sm md:text-lg mt-4">
                You'll find your video in the location you selected a moment
                before. Time for publishing but before you do that ... just know
                ... your video is amazing!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <a
                  href="https://www.producthunt.com/products/fframes-subtitles/reviews/new"
                  rel="noopener noreferrer"
                  className="mx-auto outline-none focus-visible:ring ring-orange-500 ring-offset-zinc-900 ring-offset-2 hover:bg-orange-400 transition rounded-lg gap-2 bg-orange-600 inline-flex items-center px-4 py-3 font-medium text-sm md:text-base"
                >
                  <ProductHuntIcon.make className="size-5 md:size-6 text-orange-500" />
                  Leave a Review
                </a>

                <a
                  href="https://github.com/sponsors/dmtrKovalenko"
                  rel="noopener noreferrer"
                  className="mx-auto outline-none focus-visible:ring ring-rose-500 ring-offset-zinc-900 ring-offset-2 hover:bg-rose-400 transition rounded-lg bg-rose-600 gap-2 inline-flex items-center px-4 py-3 font-medium text-sm md:text-base"
                >
                  <HeartIcon className="size-5 md:size-6" />
                  Support Author
                </a>
              </div>

              <button
                onClick={handleBackToEditor}
                className="mt-6 text-gray-300 hover:text-white underline underline-offset-4 transition text-sm md:text-base"
              >
                ← Back to editor
              </button>
            </>
          )}
        </div>
      </Transition>
    </>
  );
}
