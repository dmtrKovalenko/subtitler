/* TypeScript file generated from Player.res by genType. */

/* eslint-disable */
/* tslint:disable */

export type playState = 
    "Playing"
  | "Paused"
  | "WaitingForAction"
  | "CantPlay";

export type state = {
  readonly frame: number; 
  readonly startPlayingFrame: number; 
  readonly playState: playState; 
  readonly volume: (undefined | number)
};

export type action = 
    "AllowPlay"
  | "Play"
  | "Pause"
  | { TAG: "Seek"; _0: number }
  | { TAG: "NewFrame"; _0: number }
  | { TAG: "SetVolume"; _0: number };
