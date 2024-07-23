/* TypeScript file generated from Subtitles.res by genType. */

/* eslint-disable */
/* tslint:disable */

import * as SubtitlesJS from './Subtitles.res.mjs';

export type timestamp = [number, (null | undefined | number)];

export type subtitleCue = {
  readonly id: (undefined | number); 
  readonly text: string; 
  readonly isInProgress: (undefined | boolean); 
  readonly timestamp: timestamp
};

export type currentPlayingCue = { readonly currentIndex: number; readonly currentCue: subtitleCue };

export const getOrLookupCurrentCue: (timestamp:number, subtitles:subtitleCue[], prevCue:(undefined | currentPlayingCue)) => (undefined | currentPlayingCue) = SubtitlesJS.getOrLookupCurrentCue as any;
