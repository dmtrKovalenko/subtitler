declare module "rescript-webapi/src/Webapi.gen" {
  export type Dom_Element_t = HTMLElement;
}

declare module "Belt.gen" {
  export type Array_t = Array;
}

declare module "web" {
  /// <reference lib="dom" />
  export type AudioBuffer = globalThis.AudioBuffer;
}

declare module "./Promise.gen" {
  export type Promise_t = Promise;
}

declare module "@rescript/core/src/Core__Promise.gen" {
  export type t<T> = Promise<T>;
}

// React 19 JSX namespace compatibility for genType
declare namespace JSX {
  type Element = React.ReactElement;
}
