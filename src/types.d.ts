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

interface ObjectConstructor {
  /**
   * Groups members of an iterable according to the return value of the passed callback.
   * @param items An iterable.
   * @param keySelector A callback which will be invoked for each item in items.
   */
  groupBy<K extends PropertyKey, T>(
    items: Iterable<T>,
    keySelector: (item: T, index: number) => K,
  ): Record<K, T[]>;
}

interface MapConstructor {
  /**
   * Groups members of an iterable according to the return value of the passed callback.
   * @param items An iterable.
   * @param keySelector A callback which will be invoked for each item in items.
   */
  groupBy<K, T>(
    items: Iterable<T>,
    keySelector: (item: T, index: number) => K,
  ): Map<K, T[]>;
}
