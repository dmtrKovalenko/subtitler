/* TypeScript file generated from Editor.res by genType. */

/* eslint-disable */
/* tslint:disable */

import * as EditorJS from './Editor.res.mjs';

import type {style as Style_style} from './Style.gen';

import type {subtitlesManager as ChunksList_subtitlesManager} from '../../../src/screens/editor/ChunksList/ChunksList.gen';

import type {t as Core__Promise_t} from '@rescript/core/src/Core__Promise.gen';

export type props<subtitlesManager,render,rendererPreviewCanvasRef,renderCanvasKey,videoFileName,onResetPlayerState> = {
  readonly subtitlesManager: subtitlesManager; 
  readonly render: render; 
  readonly rendererPreviewCanvasRef: rendererPreviewCanvasRef; 
  readonly renderCanvasKey: renderCanvasKey; 
  readonly videoFileName: videoFileName; 
  readonly onResetPlayerState: onResetPlayerState
};

export const a: <T1>() => {[id: string]: T1} = EditorJS.a as any;

export const Editor: React.ComponentType<{
  readonly subtitlesManager: ChunksList_subtitlesManager; 
  readonly render: (_1:Style_style, _2:string, _3:string, _4:string) => Core__Promise_t<void>; 
  readonly rendererPreviewCanvasRef: any; 
  readonly renderCanvasKey: number; 
  readonly videoFileName: string; 
  readonly onResetPlayerState: (_1:(() => void)) => void
}> = EditorJS.make as any;
