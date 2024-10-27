import * as React from "react";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";
import { GithubIcon, HeartIcon, TwitterIcon } from "./SocialIcons";
import { Combobox } from "../ui/Combobox";
import { ALL_LANGUAGES, LANGUAGE_NAME_MAP } from "./languages";
import { SubtitlesStrikethrough } from "../ui/SubtitlesStrikethrough";
import { isFocusable } from "../bindings/Web.gen";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { ALL_MODELS, MODELS, Model } from "../transcriber/Constants";
import { ProductHuntIcon } from "../ui/Icons.res.mjs";

type LandingDropzoneProps = {
  language: string;
  setLanguage: (language: string) => void;
  onDrop: (acceptedFiles: File[]) => void;
  model: Model;
  setModel: (model: Model) => void;
};

export const LandingDropzone: React.FC<LandingDropzoneProps> = ({
  onDrop,
  language,
  setLanguage,
  model,
  setModel,
}) => {
  const {
    isDragReject,
    fileRejections,
    getRootProps,
    isDragActive,
    getInputProps,
    open,
  } = useDropzone({
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
        <input {...getInputProps()} />
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
            Free no-signup <span className="sr-only">automatic</span> AI{" "}
            <SubtitlesStrikethrough>captions</SubtitlesStrikethrough> generator
          </h1>
          <p className="mx-16 text-center text-balance mt-4 text-gray-400 text-xl">
            Upload a video to get the automatic transcription or translation and
            get your subtitles rendered back into the video file in just a few
            clicks — completely for free with no signup required. Everything on
            this website is done entirely in your browser, ensuring that{" "}
            <strong>nothing is sent to the server</strong>.
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
                const name = MODELS[option as Model];
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
          {!window.showSaveFilePicker && (
            <div
              aria-hidden
              className="rounded-xl max-w-2xl mt-8 bg-amber-100 p-4"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon
                    aria-hidden="true"
                    className="size-6 text-amber-500"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-yellow-800">
                    Large file attention
                  </h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    <p>
                      Your browser does not support{" "}
                      <a
                        target="_blank"
                        rel="noopener noreferer"
                        href="https://caniuse.com/mdn-api_window_showsavefilepicker"
                        className="font-bold underline"
                      >
                        file system access
                      </a>
                      , so we do not recommend uploading large videos (longer
                      than 10 minutes or larger than 300mb) as your browser may
                      not be able to save them and all the work will be lost in
                      the void.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-auto flex gap-6">
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full outline-none focus-visible:ring ring-orange-500 ring-offset-zinc-900 ring-offset-2"
            href="https://www.producthunt.com/products/fframes-subtitles"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Producthunt</span>
            <ProductHuntIcon.make className="size-7 text-black" />
          </a>

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
