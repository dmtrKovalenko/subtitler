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
  RenderProgressMessage,
} from "./codecs/render-worker";
import clsx from "clsx";

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

// lol why this is written in typescript? 💀 aa my eyes are bleeding from this shity states
export default function LolApp() {
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

    document.title = `${file.name} subtitles`;
    setFile({
      name: file.name,
      file,
      objectURL: URL.createObjectURL(file),
      audioBuffer,
      audioCtx,
    });

    setProgressItems([]);
    transcriber.start(audioBuffer);
  };

  const subtitlesManager = useChunksState(
    transcriber.output?.chunks ?? [],
    transcriber.isBusy,
  );

  const render = React.useCallback(
    async (style: style) => {
      const worker = new RenderWorker();
      if (!file || !rendererPreviewCanvasRef.current) {
        return;
      }

      let fileHandle = await window.showSaveFilePicker({
        suggestedName: `transcribed_${file.name}`,
        types: [
          {
            description: "Video File",
            accept: { "video/mp4": [".mp4"] },
          },
        ],
      });

      const offscreenCanvas =
        rendererPreviewCanvasRef.current?.transferControlToOffscreen();
      if (!offscreenCanvas) {
        return;
      }

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
          dataUri: file.file,
          fileHandle,
          canvas: offscreenCanvas,
          cues: subtitlesManager.activeSubtitles,
        } as RenderMessage,
        [offscreenCanvas],
      );

      worker.addEventListener(
        "message",
        (e: MessageEvent<RenderProgressMessage>) => {
          if (e.data.type === "done") {
            setRenderState("done");
            setProgressItems([]);
            worker.terminate();
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
        "Now the AI model is loading, this will happen only once, your next visit everything will be blazing fast",
      ];
    }

    if (transcriber.isBusy) {
      return [
        "Transcribing",
        "We are starting to transcribe your video, in a moment editor will appear",
      ];
    }

    return [
      "Processing Audio",
      "We are loading and processing the audio from your video",
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
  //
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

  // if you are here wondering how this was implemented and surprised that I used
  // 2 video elements - just know I was too lazy to do something else, but you
  // probably should use webcodecs and manually decode, bufferize and render frames
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
                selected location. Please do not close this tab as it might
                interrupt the rendering.
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
                You'll find your video in the file you selected a moment before.
                Time for publishing but before you do that ... just know ...
                👉👈 your video is amazing!
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
