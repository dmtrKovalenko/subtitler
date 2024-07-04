import * as React from "react";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";
import { GithubIcon, HeartIcon, TwitterIcon } from "./SocialIcons";
import { Combobox } from "../ui/Combobox";
import { ALL_LANGUAGES, LANGUAGE_NAME_MAP } from "./languages";
import { SubtitlesStrikethrough } from "../ui/SubtitlesStrikethrough";
import { isFocusable } from "../bindings/Web.gen";

type LandingDropzoneProps = {
  language: string;
  setLanguage: (language: string) => void;
  onDrop: (acceptedFiles: File[]) => void;
  model: string;
  setModel: (model: string) => void;
};

const MODELS: Record<string, string> = {
  "whisper-tiny": "Tiny (152 Mb)",
  "whisper-base": "Base (291 Mb)",
  //"whisper-small": "Medium (586 Mb)",
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
    <div className="p-4 flex flex-col w-screen h-screen">
      <div
        {...getRootProps({
          onClick: (e) => {
            if (
              isFocusable(e.target as HTMLElement) ||
              !e.currentTarget.contains(e.target as HTMLElement)
            ) {
              e.stopPropagation();
            }
          },
        })}
        className={clsx(
          "mt-1 relative isolate flex-1 flex items-center flex-col w-full h-full justify-center rounded-2xl border-2 border-dashed p-6 border-gray-500 transition-colors focus:border-accent-500 focus:outline-none active:border-orange-400 focus:border-orange-400",
          {
            "border-red-400": isDragReject,
            "border-blue-400": isDragActive,
            "border-gray-300": !isDragReject && !isDragActive,
          },
        )}
      >
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
        {fileRejections.length > 0 && (
          <div className="mb-4 bg-red-200 px-4 py-2 shadow-red-400 shadow rounded-2xl">
            <p className="text-red-500 font-medium text-lg">
              We only support .mp4 files
            </p>
          </div>
        )}

        <div className="container flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl text-center font-bold tracking-tight sm:text-6xl">
            Free on-device AI{" "}
            <SubtitlesStrikethrough>captions</SubtitlesStrikethrough> generator
          </h1>
          <p className="mx-16 text-center text-balance mt-4 text-gray-400 text-xl">
            Start right now by dragging your video file anywhere. Rest assured
            that we perform all the text-to-speech processing and video
            rendering right in your browser, and{" "}
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
        <div className="mt-auto flex gap-6">
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full outline-none focus-visible:ring ring-orange-500 ring-offset-zinc-900 ring-offset-2"
            href="https://github.com/dmtrKovalenko/subtitler"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Project sources</span>
            <GithubIcon className="transition size-7 hover:scale-125 active:scale-90 hover:text-orange-500" />
          </a>
          <a
            target="_blank"
            className="rounded-full outline-none focus-visible:ring ring-orange-500 ring-offset-zinc-900 ring-offset-2"
            rel="noopener noreferrer"
            href="https://x.com/neogoose_btw"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Follow on twitter</span>
            <TwitterIcon className="transition size-7 hover:scale-125 active:scale-90 hover:text-orange-500" />
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full outline-none focus-visible:ring ring-orange-500 ring-offset-zinc-900 ring-offset-2"
            href="https://github.com/sponsors/dmtrKovalenko"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Support this project developlment</span>
            <HeartIcon
              aria-hidden
              className="transition size-7 hover:scale-125 active:scale-90 hover:text-orange-500"
            />
          </a>
        </div>
      </div>
    </div>
  );
};
