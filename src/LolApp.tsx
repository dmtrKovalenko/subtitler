import * as React from "react";
import DecodeWorker from "./codecs/Decode?worker";
import {
  Transcriber,
  TranscriberData,
  useTranscriber,
} from "./transcriber/useTranscriber";
import Constants from "./transcriber/Constants";
import { Spinner } from "./ui/Spinner.gen";
import { LandingDropzone } from "./screens/LandingDropzone";
import { Progress } from "./ui/Progress";
import { Editor } from "./screens/editor/Editor.gen";
import { makeEditorContextComponent } from "./screens/editor/EditorContext.gen";

const worker = new DecodeWorker();

type VideoFile = {
  name: string;
  file: File;
  objectURL: string;
  audioBuffer: AudioBuffer;
};

export default function App() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const transcriber = useTranscriber();
  const [file, setFile] = React.useState<VideoFile | null>(null);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [EditorContext, setEditorContext] = React.useState<React.FC<{
    children: React.ReactNode;
  }> | null>(null);

  const onFile = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) {
      return;
    }

    const audioCtx = new AudioContext({
      sampleRate: Constants.SAMPLING_RATE,
    });
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    setFile({
      name: file.name,
      file,
      objectURL: URL.createObjectURL(file),
      audioBuffer,
    });

    transcriber.start(audioBuffer);
  };

  const render = async () => {
    const offscreenCanvas = canvasRef.current?.transferControlToOffscreen();

    let fileHandle = await window.showSaveFilePicker({
      suggestedName: `video.mp4`,
      types: [
        {
          description: "Video File",
          accept: { "video/mp4": [".mp4"] },
        },
      ],
    });

    if (file && offscreenCanvas) {
      worker.postMessage(
        {
          type: "decode",
          dataUri: file,
          fileHandle,
          canvas: offscreenCanvas,
          _cues: transcriber.output?.chunks,
        },
        [offscreenCanvas],
      );
    }
  };

  const status = React.useMemo(() => {
    if (transcriber.isModelLoading) {
      return "Loading AI model";
    }

    if (transcriber.isBusy) {
      return "Transcribing";
    }

    return "Processing Audio";
  }, [transcriber.isModelLoading, transcriber.isBusy]);

  const outputRef = React.useRef<TranscriberData["chunks"]>([
    {
      text: "Hello, world!",
      timestamp: [0, 1],
    },
    {
      text: "This is a test subtitle",
      timestamp: [2, 4],
    },
    {
      text: "This is a test subtitle",
      timestamp: [4, null],
    },
  ]);
  if (transcriber.output?.chunks) {
    outputRef.current = transcriber.output.chunks;
  }

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
          outputRef.current,
          canvasRef,
        );

        setEditorContext(component);
      }
    },
    [],
  );

  //if (!file) {
  //  return (
  //    <LandingDropzone
  //      onDrop={onFile}
  //      language={transcriber.language ?? "en"}
  //      setLanguage={transcriber.setLanguage}
  //      model={transcriber.model}
  //      setModel={transcriber.setModel}
  //    />
  //  );
  //}

  return (
    <>
      <video
        ref={videoRef}
        className="hidden"
        //src={file.objectURL}
        src="https://cdn.pixabay.com/video/2024/05/31/214592_large.mp4"
        onLoadedMetadata={handleMetadataLoad}
      />

      {EditorContext && (
        <EditorContext.make>
          {/**<Editor subtitles={transcriber.output?.chunks} />*/}
          <Editor subtitles={outputRef.current} />
        </EditorContext.make>
      )}
    </>
  );

  if (file && !transcriber.output) {
    return (
      <div className="container mx-auto flex items-center justify-center pt-[25%] flex-col">
        <div className="flex items-center justify-center gap-4">
          <Spinner />
          <h1 className="text-5xl">{status}</h1>
        </div>
        <div className="w-full flex flex-col gap-y-2 mt-12 max-w-[34rem]">
          {transcriber.progressItems
            ? transcriber.progressItems.map((item) => (
                <Progress name={item.file} progress={item.progress ?? 0} />
              ))
            : null}
        </div>
      </div>
    );
  }

  return <span>lolfuck</span>;
}
