open Icons
open Cx
open Webapi
open Player
module DocumentEvent = Dom.EventTarget.Impl(Dom.Window)

module DockDivider = {
  @react.component
  let make = Utils.neverRerender(() =>
    <div>
      <hr className="mx-2 h-9 border-gray-600 border bg-none" />
    </div>
  )
}

module DockSpace = {
  let baseClass = "flex items-center justify-center p-2 shadow rounded-xl relative bottom-3 bg-zinc-700 duration-300"

  @react.component
  let make = React.memo((~children, ~className="") => {
    <div className={cx([baseClass, className])}> {children} </div>
  })
}

@send external focus: Dom.Element.t => unit = "focus"

module DockButton = {
  @react.component
  let make = React.memo(
    React.forwardRef((~children, ~label, ~onClick: 'a => unit, ~highlight=false) => {
      <button
        onClick={_ => onClick()}
        className={cx([
          DockSpace.baseClass,
          "group hover:scale-110",
          highlight
            ? "bg-gradient-to-tr from-orange-400/80 to-pink-400/80 hover:from-orange-300/80 hover:to-pink-300/80"
            : "bg-slate-700 hover:bg-slate-500",
        ])}>
        <span className="sr-only"> {React.string(label)} </span>
        <span className="group-active:scale-90 transition-transform"> {children} </span>
      </button>
    }),
  )
}

type fpsMarker = Green | Yellow | Red | White

let getFpsMarker = (fps, desiredFps) => {
  let desiredFps = desiredFps->Belt.Float.fromInt

  switch fps {
  | None => White
  | Some(fps) if fps < desiredFps *. 0.5 => Red
  | Some(fps) if fps < desiredFps *. 0.8 => Yellow
  | _ => Green
  }
}

type dir = Back | Forth

@react.component
let make = (~fullScreenToggler: Hooks.toggle) => {
  let context = EditorContext.useEditorContext()
  let (isCollapsed, collapsedToggle) = Hooks.useToggle(false)
  let (player, playerDispatch) = context.usePlayer()

  //  let (debouncedFps, _) = UseDebounce.useThrottle(
  //    AnimationRuntime.AudioRuntime.runtimeFps.contents,
  //    ~ms=100,
  //  )

  let handlePlayOrPause = _ => {
    open Player

    switch context.getImmediatePlayerState().playState {
    | Playing => Pause
    | _ => Play
    }
    ->playerDispatch
    ->ignore
  }

  let handleSetVolume = Hooks.useEvent(value => {
    value->Option.forEach(value => playerDispatch(SetVolume(value)))
  })

  let increaseVolume = Hooks.useEvent(() => {
    context.getImmediatePlayerState().volume->Option.forEach(volume =>
      (volume + 5)->Player.validateVolume->SetVolume->playerDispatch
    )
  })

  let decreaseVolume = Hooks.useEvent(() => {
    context.getImmediatePlayerState().volume->Option.forEach(volume =>
      (volume - 5)->Player.validateVolume->SetVolume->playerDispatch
    )
  })

  let handleSeekLeft = Hooks.useEvent(() => {
    playerDispatch(Seek(context.getImmediatePlayerState().frame -. 2.))
  })

  let handleSeekRight = Hooks.useEvent(() => {
    playerDispatch(Seek(context.getImmediatePlayerState().frame +. 2.))
  })

  let toggleMute = Hooks.useEvent(() => {
    playerDispatch(SetVolume(0))
  })

  let seekToStart = Hooks.useEvent(() => {
    playerDispatch(Seek(0.))
  })

  let seekToEnd = Hooks.useEvent(() => {
    playerDispatch(Seek(context.videoMeta.duration))
  })

  let toggleDock = Hooks.useEvent(() => {
    collapsedToggle.toggle()
    Js.Console.log("Press t to show/hide dock controls")
  })

  React.useEffect1(() => {
    let handleKeydown = e => {
      open! Dom

      if (
        e
        ->KeyboardEvent.target
        ->EventTarget.unsafeAsElement
        ->Web.Element.isFocusable
        ->Utils.Bool.invert
      ) {
        switch e->KeyboardEvent.key {
        | " " => handlePlayOrPause()
        | "0" | "J" | "Home" => seekToStart()
        | "ArrowLeft" if e->KeyboardEvent.shiftKey => seekToStart()
        | "G" | "End" => seekToEnd()
        | "ArrowRight" if e->KeyboardEvent.shiftKey => seekToEnd()
        | "ArrowDown" | "h" if e->KeyboardEvent.ctrlKey => toggleMute()
        | "ArrowLeft" | "j" => handleSeekLeft()
        | "ArrowRight" | "k" => handleSeekRight()
        | "ArrowUp" | "l" => increaseVolume()
        | "ArrowDown" | "h" => decreaseVolume()
        | "t" | "T" => collapsedToggle.toggle()
        | "f" | "F" => fullScreenToggler.toggle()
        | _ => ()
        }
      }
    }

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

  <div
    className={Cx.cx([
      "absolute bottom-0 w-auto transition-transform transform-gpu left-1/2 px-4 pt-1 space-x-2 bg-zinc-900/30 border-t border-x border-gray-100/20 shadow-xl rounded-t-lg backdrop-blur-lg flex -translate-x-1/2",
      isCollapsed ? "translate-y-16 duration-300" : "",
    ])}>
    <DockSpace className="tabular-nums space-x-1">
      <span> {player.frame->Utils.Duration.formatSeconds->React.string} </span>
      <span className="normal-nums relative bottom-px"> {React.string(" / ")} </span>
      <span>
        {context.videoMeta.duration
        ->Utils.Duration.formatSeconds
        ->React.string}
      </span>
    </DockSpace>
    <DockDivider />
    <DockButton onClick=handleSeekLeft label="Play forward 5 seconds">
      <PlayBackIcon text={5->Js.Int.toString} backward=true className="h-6 w-6" />
    </DockButton>
    <DockButton onClick=handlePlayOrPause highlight=true label="Play">
      {switch player.playState {
      | CantPlay => <Spinner />
      | Playing => <PauseIcon className="h-6 w-6" />
      | Paused
      | WaitingForAction =>
        <PlayIcon className="h-6 w-6" />
      }}
    </DockButton>
    <DockButton onClick=handleSeekRight label="Play back 5 seconds">
      <PlayBackIcon text={5->Js.Int.toString} className="h-6 w-6" />
    </DockButton>
    <DockSpace>
      {switch player.volume {
      | Some(volume) => <VolumeIcon high={volume > 50} mute={volume === 0} className="h-6 w-6" />
      | _ => <VolumeIcon mute=true className="h-6 w-6 text-gray-500" />
      }}
      <Slider
        disabled={player.volume->Option.isNone}
        min=Player.min_volume
        max=Player.max_volume
        step=1
        value={player.volume->Utils.Option.unwrapOr(0)}
        onValueChange={handleSetVolume}
      />
    </DockSpace>
    <DockDivider />
    <DockButton onClick=fullScreenToggler.toggle label="Turn on/off full-screen mode">
      <FullScreenIcon className="h-6 w-6" />
    </DockButton>
    <DockButton onClick=toggleDock label="Show/Hide dock controls">
      <CollapseIcon
        className={Cx.cx(["h-6 w-6 transition-transform", isCollapsed ? "rotate-180" : ""])}
      />
    </DockButton>
  </div>
}
