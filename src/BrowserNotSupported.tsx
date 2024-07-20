import clsx from "clsx";
import BrowserGif from "./assets/giphy.webp";
import { logException } from "./hooks/useAnalytics";

type support = "full" | "partial" | "none";

type FeaturesSupport = {
  WebGpu: support;
  VideoDecoder: support;
  AudioContext: support;
  showSaveFilePicker: support;
};

export function isBrowserSupported(): true | FeaturesSupport {
  if (
    /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent)
  ) {
    return true;
  }

  const canRunApp = Boolean(window.VideoDecoder && window.AudioContext);

  if (!canRunApp) {
    logException("browser_not_supported", {
      // @ts-expect-error
      gpu: !!navigator.gpu,
      VideoDecoder: !!window.VideoDecoder,
      AudioContext: !!window.AudioContext,
      showSaveFilePicker: !!window.showSaveFilePicker,
    });
  }

  return (
    canRunApp || {
      WebGpu:
        // @ts-expect-error
        !!navigator.gpu ? "full" : "none",
      VideoDecoder: !!window.VideoDecoder ? "full" : "none",
      AudioContext: !!window.AudioContext ? "full" : "none",
      showSaveFilePicker: !!window.showSaveFilePicker ? "full" : "partial",
    }
  );
}

export function BrowserNotSupported({
  features,
}: {
  features: FeaturesSupport;
}) {
  return (
    <>
      <main className="relative isolate flex flex-col bg-[#66cccc] min-h-screen">
        <div className="mx-auto max-w-7xl px-6 pt-12 md:pt-24 lg:pt-24 text-center sm:pt-40 lg:px-8">
          <p className="text-base font-semibold leading-8 text-gray-800">
            we're sorry
          </p>
          <h1 className="text-5xl sm:text-7xl md:-mt-4 font-bold tracking-tight text-black md:text-8xl">
            Your browser is not supported
          </h1>
          <p className="mt-4 mx-auto text-center text-balance sm:text-lg lg:text-xl text-black/90 sm:mt-12 max-w-3xl">
            Our subtitles generator requires some cutting-edge browser features.
            Here is a list of features that we miss.
            <br /> They are 100% aviailable in{" "}
            <strong className="text-orange-900">
              the latest desktop Google Chrome
            </strong>
            .
          </p>
          <div className="flex flex-wrap mt-4 justify-center mx-auto gap-2">
            {Object.entries(features).map(([feature, support]) => (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`https://caniuse.com/?search=${feature}`}
                className="inline-flex items-center rounded-full px-3 py-1.5 text font-medium text-gray-900 ring-1 gap-x-2  bg-gray-300  ring-inset"
              >
                {support === "none" && (
                  <svg
                    viewBox="0 0 6 6"
                    aria-hidden="true"
                    className="absolute fill-red-500 size-3 -z-1 animate-ping"
                  >
                    <circle r={3} cx={3} cy={3} />
                  </svg>
                )}
                <svg
                  viewBox="0 0 6 6"
                  aria-hidden="true"
                  className={clsx("size-3 z-10", {
                    " fill-red-500": support === "none",
                    " fill-green-500": support === "full",
                    " fill-amber-500": support === "partial",
                  })}
                >
                  <circle r={3} cx={3} cy={3} />
                </svg>
                {feature}
              </a>
            ))}
          </div>
          <div className="text-sm text-black text-center mt-2">
            Pssss, you can sometimes enable them yourself in your browser
            settings
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 md:py-12">
          <img
            src={BrowserGif}
            alt=""
            className="-z-10 mx-auto flex-1 object-contain object-top"
          />
        </div>
      </main>
    </>
  );
}
