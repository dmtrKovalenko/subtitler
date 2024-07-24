import { useCallback, useMemo, useState, useContext } from "react";
import { serdeString, useStickyState } from "../hooks/useStickyState.gen";
import WhisperWorker from "./whisper-worker?worker";
import Constants, { Model, modelSerde } from "./Constants";
import { ProgressItem } from "../LolApp";
import { ShowErrorContext, UserFacingError } from "../ErrorBoundary";

type Chunk = {
  text: string;
  timestamp: [number, number | null];
  isInProgress: boolean | undefined;
  id: number | undefined;
};

interface TranscriberProgressMessage {
  file: string;
  loaded: number;
  progress: number;
  total: number;
  name: string;
  status: string;
}

interface TranscriberUpdateData {
  chunks: Chunk[];
  text: string;
}

interface TranscriberCompleteData {
  data: {
    text: string;
    chunks: Chunk[];
  };
}

export interface TranscriberData {
  isBusy: boolean;
  text: string;
  chunks: Chunk[];
}

export interface Transcriber {
  onInputChange: () => void;
  isBusy: boolean;
  isModelLoading: boolean;
  start: (audioData: AudioBuffer | undefined) => void;
  output?: TranscriberData;
  model: Model;
  setModel: (model: Model) => void;
  quantized: boolean;
  setQuantized: (model: boolean) => void;
  language?: string;
  setLanguage: (language: string) => void;
}

const worker: Worker = new WhisperWorker();

export function useTranscriber(
  setProgressItems: React.Dispatch<React.SetStateAction<ProgressItem[]>>,
): Transcriber {
  const failWith = useContext(ShowErrorContext);
  const [transcript, setTranscript] = useState<TranscriberData | undefined>(
    undefined,
  );
  const [isBusy, setIsBusy] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);

  worker.addEventListener("message", (event) => {
    const message = event.data;
    // Update the state with the result
    switch (message.status) {
      case "progress":
        const progressMessage = message as TranscriberProgressMessage;
        // Model file progress: update one of the progress items.
        setProgressItems((prev) =>
          prev.map((item) => {
            if (item.title === progressMessage.file) {
              return { ...item, progress: message.progress };
            }
            return item;
          }),
        );
        break;
      case "update":
        // Received partial update
        // eslint-disable-next-line no-case-declarations
        const updateMessage = message as TranscriberUpdateData;
        setTranscript({
          isBusy: true,
          text: updateMessage.text,
          chunks: updateMessage.chunks,
        });
        break;
      case "complete":
        worker.terminate();
        const completeMessage = message as TranscriberCompleteData;
        setTranscript({
          isBusy: false,
          text: completeMessage.data.text,
          chunks: completeMessage.data.chunks,
        });
        setIsBusy(false);
        break;

      case "initiate":
        const initiateMessage = message as TranscriberProgressMessage;
        // Model file start load: add a new progress item to the list.
        setIsModelLoading(true);
        setProgressItems((prev) => {
          if (prev.some((item) => item.id === initiateMessage.file)) {
            return prev;
          }

          return [
            ...prev,
            {
              id: initiateMessage.file,
              title: initiateMessage.file,
              progress: initiateMessage.progress,
            },
          ];
        });
        break;
      case "ready":
        setIsModelLoading(false);
        break;
      case "error":
        setIsBusy(false);
        failWith(new UserFacingError("Transcription failed", message.data));
        break;
      case "done":
        // Model file loaded: remove the progress item from the list.
        setProgressItems((prev) =>
          prev.filter((item) => item.id !== message.file),
        );
        break;

      // initate/dwnload/done the
      default:
        break;
    }
  });

  const [quantized, setQuantized] = useState<boolean>(
    Constants.DEFAULT_QUANTIZED,
  );

  const [model, setModel] = useStickyState(
    "subtitler:model",
    1,
    Constants.DEFAULT_MODEL,
    modelSerde,
  );

  const [language, setLanguage] = useStickyState(
    "subtitler:language",
    0,
    Constants.DEFAULT_LANGUAGE,
    serdeString,
  );

  const onInputChange = useCallback(() => {
    setTranscript(undefined);
  }, []);

  const postRequest = useCallback(
    async (audioData: AudioBuffer | undefined) => {
      if (audioData) {
        setTranscript(undefined);
        setIsBusy(true);

        let audio;
        if (audioData.numberOfChannels === 2) {
          const SCALING_FACTOR = Math.sqrt(2);

          let left = audioData.getChannelData(0);
          let right = audioData.getChannelData(1);

          audio = new Float32Array(left.length);
          for (let i = 0; i < audioData.length; ++i) {
            audio[i] = (SCALING_FACTOR * (left[i] + right[i])) / 2;
          }
        } else {
          // If the audio is not stereo, we can just use the first channel:
          audio = audioData.getChannelData(0);
        }

        worker.postMessage({
          audio,
          model,
          multilingual: true,
          quantized,
          subtask: "transcribe",
          language,
        });
      }
    },
    [worker, model, quantized, language],
  );

  const transcriber = useMemo(() => {
    return {
      onInputChange,
      isBusy,
      isModelLoading,
      start: postRequest,
      output: transcript,
      model,
      setModel,
      quantized,
      setQuantized,
      language,
      setLanguage,
    };
  }, [
    isBusy,
    isModelLoading,
    postRequest,
    transcript,
    model,
    quantized,
    language,
  ]);

  return transcriber;
}
