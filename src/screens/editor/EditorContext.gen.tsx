/* TypeScript file generated from EditorContext.res by genType. */

/* eslint-disable */
/* tslint:disable */

import * as EditorContextJS from './EditorContext.res.mjs';

import type {Dom_Element_t as Webapi_Dom_Element_t} from 'rescript-webapi/src/Webapi.gen';

import type {action as Player_action} from '../../../src/Player.gen';

import type {renderVideoFrame as Types_renderVideoFrame} from './Types.gen';

import type {state as Player_state} from '../../../src/Player.gen';

import type {subtitleCue as Types_subtitleCue} from './Types.gen';

import type {videoMeta as Types_videoMeta} from './Types.gen';

export type editorContext = {
  readonly videoMeta: Types_videoMeta; 
  readonly canvasRef: {
    current: (null | (null | undefined | Webapi_Dom_Element_t))
  }; 
  readonly getImmediatePlayerState: () => Player_state; 
  readonly usePlayer: () => [Player_state, (_1:Player_action) => void]; 
  readonly seekUnsafe: (ts:number, _2:(() => void)) => void; 
  readonly renderFrame: Types_renderVideoFrame
};

export type ReactComponent_props<children> = { readonly children: children };

export const makeEditorContextComponent: (videoMeta:Types_videoMeta, videoElement:{ current: (null | Webapi_Dom_Element_t) }, subtitlesRef:Types_subtitleCue[], canvasRef:{ current: (null | (null | undefined | Webapi_Dom_Element_t)) }) => { readonly make: (_1:ReactComponent_props<JSX.Element>) => JSX.Element } = EditorContextJS.makeEditorContextComponent as any;
