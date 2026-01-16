/* TypeScript file generated from Editor.res by genType. */

/* eslint-disable */
/* tslint:disable */

import * as EditorJS from './Editor.res.mjs';

import type {style as Style_style} from './Style.gen';

import type {subtitlesManager as ChunksList_subtitlesManager} from '../../../src/screens/editor/ChunksList/ChunksList.gen';

import type {t as Core__Promise_t} from '@rescript/core/src/Core__Promise.gen';

export type props<subtitlesManager,render,rendererPreviewCanvasRef,videoFileName> = {
  readonly subtitlesManager: subtitlesManager; 
  readonly render: render; 
  readonly rendererPreviewCanvasRef: rendererPreviewCanvasRef; 
  readonly videoFileName: videoFileName
};

export const a: <T1>() => {[id: string]: T1} = EditorJS.a as any;

export const Editor: React.ComponentType<{
  readonly subtitlesManager: ChunksList_subtitlesManager; 
  readonly render: (_1:Style_style, _2:string, _3:string, _4:string) => Core__Promise_t<void>; 
  readonly rendererPreviewCanvasRef: any; 
  readonly videoFileName: string
}> = EditorJS.make as any;
