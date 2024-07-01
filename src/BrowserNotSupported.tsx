import BrowserGif from "./assets/giphy.webp";

export function isBrowserSupported() {
  return (
    // @ts-expect-error
    navigator.gpu &&
    window.VideoDecoder &&
    window.AudioContext &&
    window.showSaveFilePicker
  );
}

export function BrowserNotSupported() {
  return (
    <>
      <main className="relative isolate flex flex-col bg-[#66cccc] min-h-screen">
        <div className="mx-auto max-w-7xl px-6 pt-12 md:pt-32 lg:pt-32 text-center sm:pt-40 lg:px-8">
          <p className="text-base font-semibold leading-8 text-gray-800">
            we're sorry
          </p>
          <h1 className="text-5xl sm:text-7xl md:-mt-4 font-bold tracking-tight text-black md:text-8xl">
            Your browser is not supported
          </h1>

          <p className="mt-4 mx-auto text-center text-balance text-lg md:text-xl text-black/90 sm:mt-12 max-w-2xl">
            Our subtitles generator uses some cool browser features like GPU
            access and video codecs to transcribe and render videos on your
            device. They are 100% aviailable in{" "}
            <strong className="text-orange-900">
              the latest desktop Google Chrome
            </strong>
            .
          </p>
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
