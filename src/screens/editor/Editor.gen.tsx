/* TypeScript file generated from Editor.res by genType. */

/* eslint-disable */
/* tslint:disable */

import * as EditorJS from './Editor.res.mjs';

import type {Jsx_element as PervasivesU_Jsx_element} from './PervasivesU.gen';

import type {style as Style_style} from './Style.gen';

import type {subtitlesManager as ChunksList_subtitlesManager} from '../../../src/screens/editor/ChunksList/ChunksList.gen';

export type props<subtitlesManager,render,rendererPreviewCanvasRef> = {
  readonly subtitlesManager: subtitlesManager; 
  readonly render: render; 
  readonly rendererPreviewCanvasRef: rendererPreviewCanvasRef
};

export const a: <T1>() => {[id: string]: T1} = EditorJS.a as any;

export const Editor: (_1:props<ChunksList_subtitlesManager,((_1:Style_style) => void),any>) => PervasivesU_Jsx_element = EditorJS.make as any;
