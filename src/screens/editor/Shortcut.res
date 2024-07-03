open Webapi
open Dom

module DocumentEvent = Dom.EventTarget.Impl(Dom.Window)

type modifier = Shift | Meta | Ctrl | NoModifier
@genType
type shortcut<'action> = {action: 'action, key: string, modifier: modifier}

@genType
type action =
  | PlayOrPause
  | SeekForward
  | SeekBack
  | IncreaseVolume
  | DecreaseVolume
  | EditCurrentSubtitle
  | ToggleDock
  | StartRender
  | ToggleFullScreen
  | SeekToStart
  | SeekToEnd
  | Mute
  | SeekToNextCue
  | SeekToPreviousCue

@genType
let formatAction = action => {
  switch action {
  | PlayOrPause => "Play or Pause"
  | SeekForward => "Seek Forward"
  | SeekBack => "Seek Back"
  | IncreaseVolume => "Increase Volume"
  | DecreaseVolume => "Decrease Volume"
  | EditCurrentSubtitle => "Edit Current Subtitle"
  | ToggleDock => "Toggle Dock"
  | ToggleFullScreen => "Toggle Full Screen"
  | SeekToStart => "Seek To Start"
  | SeekToEnd => "Seek To End"
  | Mute => "Mute"
  | StartRender => "Render final video"
  | SeekToNextCue => "Seek to next cue"
  | SeekToPreviousCue => "Seek to previous cue"
  }
}

let validateEventModifier = (e, modifier) => {
  switch modifier {
  | Ctrl => e->KeyboardEvent.ctrlKey
  | Shift => e->KeyboardEvent.shiftKey
  | Meta => e->KeyboardEvent.metaKey
  | NoModifier =>
    !KeyboardEvent.shiftKey(e) &&
    !KeyboardEvent.metaKey(e) &&
    !KeyboardEvent.ctrlKey(e) &&
    e
    ->KeyboardEvent.target
    ->EventTarget.unsafeAsElement
    ->Web.isFocusable
    ->Utils.Bool.invert
  }
}

let matchAction = (e, shortcuts) => {
  shortcuts->Array.find(shortcut =>
    shortcut.key === e->KeyboardEvent.key && e->validateEventModifier(shortcut.modifier)
  )
}

let useKeyboardShortcuts = (shortcuts, fn) => {
  let handleKeydown = Hooks.useEvent(e => {
    matchAction(e, shortcuts)->Option.forEach(fn)
  })

  React.useEffect1(() => {
    Dom.window
    ->DocumentEvent.asEventTarget
    ->Dom.EventTarget.addKeyDownEventListener(handleKeydown)

    Some(
      () =>
        Dom.window
        ->DocumentEvent.asEventTarget
        ->Dom.EventTarget.removeKeyDownEventListener(handleKeydown),
    )
  }, [])
}
