import * as React from "react";
import DecodeWorker from "./codecs/Decode?worker";
import { useTranscriber } from "./transcriber/useTranscriber";
import Constants from "./transcriber/Constants";
import { Spinner } from "./ui/Spinner.gen";
import { LandingDropzone } from "./screens/LandingDropzone";
import { Progress } from "./ui/Progress";

const worker = new DecodeWorker();

export default function App() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const transcriber = useTranscriber();
  const [file, setFile] = React.useState<File | null>(null);

  const onFile = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) {
      return;
    }

    setFile(file);

    const audioCtx = new AudioContext({
      sampleRate: Constants.SAMPLING_RATE,
    });
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

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
