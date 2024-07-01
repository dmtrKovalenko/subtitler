/* TypeScript file generated from Player.res by genType. */

/* eslint-disable */
/* tslint:disable */

import type {currentPlayingCue as Subtitles_currentPlayingCue} from '../src/screens/editor/Subtitles.gen';

export type playState = 
    "Playing"
  | "Paused"
  | "WaitingForAction"
  | "CantPlay"
  | "StoppedForRender";

export type state = {
  readonly ts: number; 
  readonly startPlayingTs: number; 
  readonly playState: playState; 
  readonly currentPlayingCue: (undefined | Subtitles_currentPlayingCue); 
  readonly volume: (undefined | number)
};

export type action = 
    "AllowPlay"
  | "Play"
  | "Pause"
  | "StopForRender"
  | "UpdateCurrentCue"
  | { TAG: "Seek"; _0: number }
  | { TAG: "NewFrame"; _0: number }
  | { TAG: "SetVolume"; _0: number };