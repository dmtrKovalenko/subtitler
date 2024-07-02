/* TypeScript file generated from Editor.res by genType. */

/* eslint-disable */
/* tslint:disable */

import * as EditorJS from './Editor.res.mjs';

import type {style as Style_style} from './Style.gen';

import type {subtitlesManager as ChunksList_subtitlesManager} from '../../../src/screens/editor/ChunksList/ChunksList.gen';

import type {t as Promise_t} from './Promise.gen';

export type props<subtitlesManager,render,rendererPreviewCanvasRef> = {
  readonly subtitlesManager: subtitlesManager; 
  readonly render: render; 
  readonly rendererPreviewCanvasRef: rendererPreviewCanvasRef
};

export const a: <T1>() => {[id: string]: T1} = EditorJS.a as any;

export const Editor: React.ComponentType<{
  readonly subtitlesManager: ChunksList_subtitlesManager; 
  readonly render: (_1:Style_style) => Promise_t<void>; 
  readonly rendererPreviewCanvasRef: any
}> = EditorJS.make as any;
