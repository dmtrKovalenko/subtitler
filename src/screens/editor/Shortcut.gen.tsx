/* TypeScript file generated from Shortcut.res by genType. */

/* eslint-disable */
/* tslint:disable */

import * as ShortcutJS from './Shortcut.res.mjs';

export type modifier = "Shift" | "Meta" | "Ctrl" | "NoModifier";

export type shortcut<action> = {
  readonly action: action; 
  readonly key: string; 
  readonly modifier: modifier
};

export type action = 
    "PlayOrPause"
  | "SeekForward"
  | "SeekBack"
  | "IncreaseVolume"
  | "DecreaseVolume"
  | "EditCurrentSubtitle"
  | "ToggleDock"
  | "StartRender"
  | "ToggleFullScreen"
  | "SeekToStart"
  | "SeekToEnd"
  | "Mute"
  | "SeekToNextCue"
  | "SeekToPreviousCue";

export const formatAction: (action:action) => string = ShortcutJS.formatAction as any;
