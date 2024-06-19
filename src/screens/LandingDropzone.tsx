import * as React from "react";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";
import { Combobox } from "../ui/Combobox";
import { ALL_LANGUAGES, LANGUAGE_NAME_MAP } from "./languages";
import { SubtitlesStrikethrough } from "../ui/SubtitlesStrikethrough";

type LandingDropzoneProps = {
  language: string;
  setLanguage: (language: string) => void;
  onDrop: (acceptedFiles: File[]) => void;
  model: string;
  setModel: (model: string) => void;
};

const MODELS: Record<string, string> = {
  "Xenova/whisper-tiny": "Tiny (152 Mb)",
  "Xenova/whisper-base": "Base (291 Mb)",
};

const ALL_MODELS = Object.keys(MODELS);

export const LandingDropzone: React.FC<LandingDropzoneProps> = ({
  onDrop,
  language,
  setLanguage,
  model,
  setModel,
}) => {
  const { isDragReject, fileRejections, getRootProps, isDragActive, open } =
    useDropzone({
      onDrop,
      accept: {
        "video/mp4": [".mp4"],
      },
    });

  return (
    <div className="p-4 w-screen h-screen">
      <div
        {...getRootProps({
          onClick: (e) => {
            if (
              ["A", "BUTTON", "INPUT", "TEXTAREA", "SELECT"].includes(
                (e.target as HTMLElement).tagName,
              )
            ) {
              e.stopPropagation();
            }
          },
        })}
        className={clsx(
          "mt-1 flex items-center flex-col w-full h-full justify-center rounded-xl border-2 border-dashed p-6 border-gray-500 transition-colors focus:border-accent-500 focus:outline-none active:border-orange-400",
          {
            "border-red-400": isDragReject,
            "border-blue-400": isDragActive,
            "border-gray-300": !isDragReject && !isDragActive,
          },
        )}
      >
        {fileRejections.length > 0 && (
          <div className="mb-4 bg-red-200 px-4 py-2 shadow-red-400 shadow rounded-2xl">
            <p className="text-red-500 font-medium text-lg">
              We only support .mp4 files
            </p>
          </div>
        )}

        <div className="container">
          <h1 className="text-4xl text-center font-bold tracking-tight sm:text-6xl">
            Free on-device AI{" "}
            <SubtitlesStrikethrough>captions</SubtitlesStrikethrough> generator
          </h1>
          <p className="mx-16 text-center text-balance mt-4 text-gray-400 text-xl">
            Start right now by dragging your video file anywhere. Make sure that
            we are performing all the text-to-speech processing and video
            rendering right in your browser and{" "}
            <strong>do not send anything</strong> to the server.
          </p>
          <div className="mt-8 flex gap-6 justify-between mx-auto max-w-[34rem]">
            <Combobox
              options={ALL_LANGUAGES}
              selected={language}
              formatValue={(lang) =>
                typeof lang === "undefined" ? "" : LANGUAGE_NAME_MAP[lang]
              }
              setSelected={(lang) => setLanguage(lang || "en")}
              filter={(query: string) => (option: string) => {
                const name = LANGUAGE_NAME_MAP[option];
                return name.toLowerCase().includes(query.toLowerCase());
              }}
              getId={(lang) => lang}
              className="flex-1"
            />

            <Combobox
              options={ALL_MODELS}
              selected={model}
              formatValue={(lang) =>
                typeof lang === "undefined" ? "" : MODELS[lang]
              }
              setSelected={(model) => {
                if (model) {
                  setModel(model);
                }
              }}
              filter={(query: string) => (option: string) => {
                const name = MODELS[option];
                return name.toLowerCase().includes(query.toLowerCase());
              }}
              getId={(lang) => lang}
              className="flex-1"
            />
            <button
              onClick={open}
              className="mx-auto outline-none focus-visible:ring ring-orange-500 ring-offset-zinc-900 ring-offset-2 rounded-lg bg-orange-600 inline-flex items-center px-6 font-medium"
            >
              Let's go!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
