/* TypeScript file generated from EditorContext.res by genType. */

/* eslint-disable */
/* tslint:disable */

import * as EditorContextJS from './EditorContext.res.mjs';

import type {AudioBuffer_t as WebAudio_AudioBuffer_t} from '../../../src/bindings/WebAudio.gen';

import type {Dom_Element_t as Webapi_Dom_Element_t} from 'rescript-webapi/src/Webapi.gen';

import type {action as Player_action} from '../../../src/Player.gen';

import type {changeStyleAction as Style_changeStyleAction} from './Style.gen';

import type {dom as Types_dom} from './Types.gen';

import type {state as Player_state} from '../../../src/Player.gen';

import type {style as Style_style} from './Style.gen';

import type {subtitleCue as Subtitles_subtitleCue} from './Subtitles.gen';

import type {videoMeta as Types_videoMeta} from './Types.gen';

export type editorContext = {
  readonly ctx: unknown; 
  readonly videoMeta: Types_videoMeta; 
  readonly dom: Types_dom; 
  readonly getImmediatePlayerState: () => Player_state; 
  readonly getImmediateStyleState: () => Style_style; 
  readonly playerImmediateDispatch: (_1:Player_action) => void; 
  readonly usePlayer: () => [Player_state, (_1:Player_action) => void]; 
  readonly usePlayerSelector: unknown; 
  readonly useStyle: () => [Style_style, (_1:Style_changeStyleAction) => void]
};

export type ReactComponent_props<children> = { readonly children: children };

export const useEditorContext: () => editorContext = EditorContextJS.useEditorContext as any;

export const makeEditorContextComponent: (videoMeta:Types_videoMeta, videoElement:{ current: (null | Webapi_Dom_Element_t) }, timelineVideoElement:{ current: (null | Webapi_Dom_Element_t) }, subtitlesRef:{ current: (null | Subtitles_subtitleCue[]) }, canvasRef:{ current: (null | (null | undefined | Webapi_Dom_Element_t)) }, audioBuffer:(undefined | WebAudio_AudioBuffer_t)) => { readonly make: (_1:ReactComponent_props<JSX.Element>) => JSX.Element } = EditorContextJS.makeEditorContextComponent as any;
