/* TypeScript file generated from useStickyState.res by genType. */

/* eslint-disable */
/* tslint:disable */

import * as useStickyStateJS from './useStickyState.res.mjs';

export type serde<a> = { readonly parse: (_1:string) => a; readonly serialize: (_1:a) => string };

export const serdeString: serde<string> = useStickyStateJS.serdeString as any;

export const useStickyState: <T1>(persistKey:string, version:number, defaultValue:T1, serde:serde<T1>) => [T1, (_1:T1) => void] = useStickyStateJS.useStickyState as any;
