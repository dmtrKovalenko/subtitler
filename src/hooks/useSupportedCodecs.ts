import { useState, useEffect } from "react";
import RenderWorker from "../codecs/render-worker?worker";
import type { 
  RenderWorkerMessage, 
  SupportedCodecsMessage,
  OutputVideoCodec,
  OutputAudioCodec 
} from "../codecs/render-worker";

export type SupportedCodecs = {
  videoCodecs: OutputVideoCodec[];
  audioCodecs: OutputAudioCodec[];
  loading: boolean;
  error: string | null;
};

export function useSupportedCodecs(width?: number, height?: number): SupportedCodecs {
  const [videoCodecs, setVideoCodecs] = useState<OutputVideoCodec[]>([]);
  const [audioCodecs, setAudioCodecs] = useState<OutputAudioCodec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new RenderWorker();

    worker.postMessage({
      type: "query-codecs",
      payload: { width, height },
    } as RenderWorkerMessage);

    const handleMessage = (e: MessageEvent<SupportedCodecsMessage | { type: "error"; message: string }>) => {
      if (e.data.type === "supported-codecs") {
        setVideoCodecs(e.data.videoCodecs);
        setAudioCodecs(e.data.audioCodecs);
        setLoading(false);
      } else if (e.data.type === "error") {
        setError(e.data.message);
        setLoading(false);
      }
      worker.terminate();
    };

    worker.addEventListener("message", handleMessage);

    return () => {
      worker.terminate();
    };
  }, [width, height]);

  return { videoCodecs, audioCodecs, loading, error };
}
