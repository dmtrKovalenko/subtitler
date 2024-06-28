/* TypeScript file generated from Types.res by genType. */

/* eslint-disable */
/* tslint:disable */

import type {Dom_Element_t as Webapi_Dom_Element_t} from 'rescript-webapi/src/Webapi.gen';

export type videoMeta = {
  readonly width: number; 
  readonly height: number; 
  readonly duration: number
};

export type dom = {
  readonly videoElement: Webapi_Dom_Element_t; 
  readonly timelineVideoElement: Webapi_Dom_Element_t; 
  readonly canvasRef: {
    current: (null | (null | undefined | Webapi_Dom_Element_t))
  }
};
