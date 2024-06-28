/* TypeScript file generated from Editor.res by genType. */

/* eslint-disable */
/* tslint:disable */

import * as EditorJS from './Editor.res.mjs';

import type {Jsx_element as PervasivesU_Jsx_element} from './PervasivesU.gen';

import type {subtitleCue as Subtitles_subtitleCue} from './Subtitles.gen';

export type props<subtitles,transcriptionInProgress> = { readonly subtitles: subtitles; readonly transcriptionInProgress: transcriptionInProgress };

export const a: <T1>() => {[id: string]: T1} = EditorJS.a as any;

export const Editor: (_1:props<Subtitles_subtitleCue[],boolean>) => PervasivesU_Jsx_element = EditorJS.make as any;
