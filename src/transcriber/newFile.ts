import { isMobileOrTablet } from "./Constants";

export default {
    SAMPLING_RATE: 16000,
    DEFAULT_AUDIO_URL: `https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/${isMobileOrTablet ? "jfk" : "ted_60_16k"}.wav`,
    DEFAULT_MODEL,
    DEFAULT_SUBTASK: "transcribe",
    DEFAULT_LANGUAGE: "en",
    DEFAULT_QUANTIZED: isMobileOrTablet,
    DEFAULT_MULTILINGUAL: true,
    MODELS,
    ALL_MODELS,
    DEFUALT_CHUNK_THRESHOLD_CHARS: 65,
};

