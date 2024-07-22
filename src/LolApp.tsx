import * as React from "react";
import { style } from "./screens/editor/Style.gen";
import { useChunksState } from "./screens/editor/ChunksList/ChunksList.gen";
import RenderWorker from "./codecs/render-worker?worker";
import { useTranscriber } from "./transcriber/useTranscriber";
import Constants from "./transcriber/Constants";
import { Spinner } from "./ui/Spinner";
import { LandingDropzone } from "./screens/LandingDropzone";
import { Progress } from "./ui/Progress";
import { Editor } from "./screens/editor/Editor.gen";
import { makeEditorContextComponent } from "./screens/editor/EditorContext.gen";
import { Transition } from "@headlessui/react";
import type {
  RenderMessage,
  Target,
  RenderProgressMessage,
} from "./codecs/render-worker";
import clsx from "clsx";
import { ShowErrorContext, UserFacingError } from "./ErrorBoundary";
import { log } from "./hooks/useAnalytics";

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

async function createTarget(file: File): Promise<Target> {
  const suggestedName = `transcribed_${file.name}`;

  if ("showSaveFilePicker" in window) {
    let fileHandle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: "Video File",
          accept: { "video/mp4": [".mp4"] },
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

async function saveTarget(target: Target) {
  if (target.type === "populated_arraybuffer") {
    const blob = new Blob([target.arrayBuffer!], { type: "video/mp4" });
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
  // Changed name to be more descriptive
  const failWith = React.useContext(ShowErrorContext);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rendererPreviewCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [progressItems, setProgressItems] = React.useState<ProgressItem[]>([]);

  const transcriber = useTranscriber(setProgressItems);
  const [file, setFile] = React.useState<VideoFile | null>(null);
  const [renderState, setRenderState] = React.useState<
    "idle" | "rendering" | "done"
  >("idle");

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const timelineVideoRef = React.useRef<HTMLVideoElement>(null);

  const [EditorContext, setEditorContext] = React.useState<{
    make: (props: any) => JSX.Element;
  } | null>(null);

  const onFile = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) {
      return;
    }

    let audioBuffer;
    log("video_uploaded");
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

      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setProgressItems([
        {
          id: "decodeprogress",
          title: "Decoding Audio",
          progress: 100,
        },
      ]);

      document.title = `${file.name} subtitles`;
      setFile({
        name: file.name,
        file,
        objectURL: URL.createObjectURL(file),
        audioBuffer,
        audioCtx,
      });
    } catch (e) {
      failWith(
        new UserFacingError(
          "We couldn't find decodable audio stream in your video",
          e,
        ),
      );
    }

    setProgressItems([]);
    transcriber.start(audioBuffer);
  };

  const subtitlesManager = useChunksState(
    transcriber.output?.chunks ?? [],
    transcriber.isBusy,
  );

  const render = React.useCallback(
    async (style: style) => {
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

      const target = await createTarget(file.file);
      setRenderState("rendering");
      setProgressItems([
        {
          id: "renderprogress",
          title: "Rendering frames",
          progress: 0,
        },
        {
          id: "encodeprogress",
          title: "Encoding video",
          progress: 0,
        },
      ]);

      worker.postMessage(
        {
          type: "render",
          style,
          target,
          dataUri: file.file,
          canvas: offscreenCanvas,
          cues: subtitlesManager.activeSubtitles,
        } as RenderMessage,
        [offscreenCanvas],
      );

      worker.addEventListener(
        "message",
        (e: MessageEvent<RenderProgressMessage>) => {
          if (e.data.type === "error") {
            failWith(
              new UserFacingError("Failed to render subtitles", e.data.error),
            );
          }
          if (e.data.type === "done") {
            log("video_rendered");

            saveTarget(e.data.target).catch((e) => {
              failWith(
                new UserFacingError(
                  "Failed to save rendered video file",
                  e as Error,
                ),
              );
            });

            document.title = `✅ Subtitles rendered!`;
            setRenderState("done");
            setProgressItems([]);
            worker.terminate();

            import("js-confetti").then(({ default: JsConfetti }) => {
              new JsConfetti().addConfetti();
            });
          }
          if (
            e.data.type === "renderprogress" ||
            e.data.type === "encodeprogress"
          ) {
            document.title = `${Math.floor(e.data.progress)}% — subtitles for ${file.name}`;
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
      <div className="container mx-auto flex items-center justify-center pt-[25%] flex-col">
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

        <div className="flex items-center justify-center gap-4">
          <Spinner sizeRem={3} />
          <h1 className="text-5xl">{status}</h1>
        </div>
        <p className="text-center text-balance text-gray-400 mt-4">
          {description}
        </p>
        <div className="w-full flex flex-col gap-y-2 mt-12 max-w-[34rem]">
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
          />
        </EditorContext.make>
      )}

      <Transition show={renderState !== "idle"}>
        <div
          className={clsx(
            "transition flex-col absolute w-screen h-screen bg-white/10 backdrop-blur-xl inset-0 duration-300 ease-in data-[closed]:opacity-0 flex items-center justify-center",
            renderState === "done" && "!bg-green-600/10 !backdrop-blur-2xl",
          )}
        >
          {renderState === "rendering" && (
            <>
              <h2 className="text-5xl tracking-wide font-bold">
                Rendering Your Video
              </h2>
              <p className="text-gray-300 text-balance text-center text-lg max-w-screen-sm mt-4">
                In a moment you'll get your video with subtitles created at the
                selected location. For faster and more reliable render do not
                leave this tab.
              </p>

              <div className="w-full flex flex-col gap-y-2 mt-8 max-w-[34rem]">
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

          {renderState === "done" && (
            <>
              <h2 className="text-5xl tracking-wide font-bold">
                Video Rendered!
              </h2>
              <p className="text-gray-200 text-balance text-center max-w-screen-sm text-lg mt-4">
                You'll find your video in the location you selected a moment
                before. Time for publishing but before you do that ... just know
                ... 👉👈 your video is amazing!
              </p>

              <a
                type="button"
                href="/"
                className="mx-auto outline-none mt-6 focus-visible:ring ring-emerald-500 ring-offset-zinc-900 ring-offset-2 hover:bg-emerald-400 transition rounded-lg bg-emerald-600 inline-flex items-center px-4 py-2 font-medium"
              >
                Generate more subtitles
              </a>
            </>
          )}
        </div>
      </Transition>
    </>
  );
}
