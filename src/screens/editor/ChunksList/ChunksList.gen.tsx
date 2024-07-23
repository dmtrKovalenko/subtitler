/* TypeScript file generated from ChunksList.res by genType. */

/* eslint-disable */
/* tslint:disable */

import * as ChunksListJS from './ChunksList.res.mjs';

import type {subtitleCue as Subtitles_subtitleCue} from '../../../../src/screens/editor/Subtitles.gen';

import type {timestamp as Subtitles_timestamp} from '../../../../src/screens/editor/Subtitles.gen';

export type transcriptionState = 
    "TranscriptionInProgress"
  | { TAG: "SubtitlesNotEdited"; readonly resizedSubtitles: Subtitles_subtitleCue[]; readonly size: number }
  | { TAG: "SubtitlesEdited"; _0: Subtitles_subtitleCue[] };

export type subtitlesManager = {
  readonly activeSubtitles: Subtitles_subtitleCue[]; 
  readonly transcriptionState: transcriptionState; 
  readonly subtitlesRef: {
    current: (null | Subtitles_subtitleCue[])
  }; 
  readonly resizeSubtitles: (_1:number) => void; 
  readonly removeChunk: (_1:number, joinSiblingsTimestamps:boolean) => void; 
  readonly editText: (_1:number, _2:string) => void; 
  readonly editTimestamp: (_1:number, _2:Subtitles_timestamp) => void
};

export const useChunksState: (subtitles:Subtitles_subtitleCue[], transcriptionInProgress:boolean, default_chunk_size:number) => subtitlesManager = ChunksListJS.useChunksState as any;
