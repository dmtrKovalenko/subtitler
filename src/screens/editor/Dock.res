open Icons
open Cx
open Shortcut
open Webapi
open ChunksList
open Player
module DocumentEvent = Dom.EventTarget.Impl(Dom.Window)

// didn't found a better way to interop this with gentype to intercept Promise ts type
module Promise = {
  let catch = Core__Promise.catch
  let resolve = Core__Promise.resolve
}

@gentype
let shortcuts = [
  {key: " ", modifier: NoModifier, action: PlayOrPause},
  {key: "ArrowRight", modifier: NoModifier, action: SeekForward},
  {key: "l", modifier: NoModifier, action: SeekForward},
  {key: "ArrowLeft", modifier: NoModifier, action: SeekBack},
  {key: "h", modifier: NoModifier, action: SeekBack},
  {key: "ArrowUp", modifier: NoModifier, action: SeekToPreviousCue},
  {key: "k", modifier: NoModifier, action: SeekToPreviousCue},
  {key: "ArrowDown", modifier: NoModifier, action: SeekToNextCue},
  {key: "j", modifier: NoModifier, action: SeekToNextCue},
  {key: "i", modifier: NoModifier, action: EditCurrentSubtitle},
  {key: "Enter", modifier: NoModifier, action: EditCurrentSubtitle},
  {key: "t", modifier: NoModifier, action: ToggleDock},
  {key: "r", modifier: NoModifier, action: StartRender},
  {key: "f", modifier: NoModifier, action: ToggleFullScreen},
  {key: "m", modifier: NoModifier, action: Mute},
  {key: "Home", modifier: NoModifier, action: SeekToStart},
  {key: "ArrowLeft", modifier: Meta, action: SeekToStart},
  {key: "End", modifier: NoModifier, action: SeekToEnd},
  {key: "ArrowRight", modifier: Meta, action: SeekToEnd},
]

module DockDivider = {
  @react.component
  let make = Utils.neverRerender(() =>
    <div>
      <hr className="mx-2 h-9 border-gray-600 border bg-none" />
    </div>
  )
}

module DockSpace = {
  let baseClass = "flex items-center justify-center p-2 shadow rounded-xl relative bottom-3 bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 duration-300"

  @react.component
  let make = React.memo((~children, ~className="") => {
    <div className={cx([baseClass, className])}> {children} </div>
  })
}

@send external focus: Dom.Element.t => unit = "focus"

module DockButton = {
  @react.component
  let make = React.memo(
    React.forwardRef((~children, ~label, ~className="", ~onClick: 'a => unit, ~highlight=false) => {
      <button
        onClick={_ => onClick()}
        className={cx([
          DockSpace.baseClass,
          "group hover:scale-110 transition-all duration-200",
          highlight
            ? "bg-gradient-to-tr from-amber-500/90 via-orange-500/90 to-fuchsia-400/80 hover:from-orange-300/80 hover:to-fuchsia-200/80 focus-visible:!ring-white"
            : "bg-slate-700 hover:bg-slate-500",
          className,
        ])}>
        <span className="sr-only"> {React.string(label)} </span>
        <span className="group-active:scale-90 flex items-center gap-2 transition-transform">
          {children}
        </span>
      </button>
    }),
  )
}

@react.component
let make = (~subtitlesManager, ~render, ~fullScreenToggler: Hooks.toggle) => {
  let context = EditorContext.useEditorContext()
  let (isCollapsed, collapsedToggle) = Hooks.useToggle(false)
  let (player, playerDispatch) = context.usePlayer()

  let handlePlayOrPause = _ => {
    open Player

    switch context.getImmediatePlayerState().playState {
    | Playing => Pause
    | _ => Play
    }
    ->playerDispatch
    ->ignore
  }

  let handleSetVolume = Hooks.useEvent(value => playerDispatch(SetVolume(value)))

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
    playerDispatch(Seek(context.getImmediatePlayerState().ts -. 2.))
  })

  let handleSeekRight = Hooks.useEvent(() => {
    playerDispatch(Seek(context.getImmediatePlayerState().ts +. 2.))
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

  let editCurrentSubtitle = Hooks.useEvent(() => {
    setTimeout(() =>
      ChunkEditor.globalCurrentTextAreaRef.current
      ->Js.Nullable.toOption
      ->Option.flatMap(Dom.HtmlInputElement.ofElement)
      ->Option.forEach(Dom.HtmlInputElement.focus)
    , 0)->ignore
  })

  let moveToCue = Hooks.useEvent(shift => {
    let currentOrLastCue =
      context.getImmediatePlayerState().currentPlayingCue->Utils.Option.unwrapOrElse(() =>
        Subtitles.lookUpLastPlayedCue(
          ~subtitles=subtitlesManager.activeSubtitles,
          ~timestamp=context.getImmediatePlayerState().ts,
        )
      )

    switch currentOrLastCue {
    | Some({currentIndex, _}) =>
      let newIndex = currentIndex + shift

      switch subtitlesManager.activeSubtitles->Array.get(newIndex) {
      | Some(newCue) => playerDispatch(Seek(newCue->Subtitles.start))
      | None => ()
      }
    | None if shift < 0 => handleSeekLeft()
    | None if shift > 0 => handleSeekRight()
    | None => ()
    }
  })

  let startRender = Hooks.useEvent(_ => {
    playerDispatch(StopForRender)
    render(context.getImmediateStyleState())
    ->Promise.catch(_ => playerDispatch(AbortRender)->Promise.resolve)
    ->ignore
  })

  shortcuts->useKeyboardShortcuts(shortcut =>
    switch shortcut.action {
    | PlayOrPause => handlePlayOrPause()
    | SeekForward => handleSeekRight()
    | SeekBack => handleSeekLeft()
    | IncreaseVolume => increaseVolume()
    | DecreaseVolume => decreaseVolume()
    | EditCurrentSubtitle => editCurrentSubtitle()
    | ToggleDock => collapsedToggle.toggle()
    | StartRender => startRender()
    | ToggleFullScreen => fullScreenToggler.toggle()
    | SeekToStart => seekToStart()
    | SeekToEnd => seekToEnd()
    | SeekToNextCue => moveToCue(1)
    | SeekToPreviousCue => moveToCue(-1)
    | Mute => toggleMute()
    }
  )

  <div
    className={Cx.cx([
      "absolute bottom-0 w-auto transition-transform transform-gpu left-1/2 px-4 pt-1 space-x-2 bg-zinc-900/30 border-t border-x border-gray-100/20 shadow-xl rounded-t-lg backdrop-blur-lg flex -translate-x-1/2",
      isCollapsed ? "translate-y-16 duration-300" : "",
    ])}>
    <DockSpace className="tabular-nums space-x-1">
      <span> {player.ts->Utils.Duration.formatSeconds->React.string} </span>
      <span className="normal-nums relative bottom-px"> {React.string(" / ")} </span>
      <span>
        {context.videoMeta.duration
        ->Utils.Duration.formatSeconds
        ->React.string}
      </span>
    </DockSpace>
    <DockDivider />
    <DockButton onClick=handleSeekLeft label="Play forward 5 seconds">
      <BackwardIcon className="size-5 mx-0.5" />
    </DockButton>
    <DockButton onClick=handlePlayOrPause highlight=true label="Play">
      {switch player.playState {
      | StoppedForRender => <Spinner size=1.5 className="mx-1" />
      | Playing => <PauseIcon className="size-6 mx-0.5" />
      | Paused
      | Idle =>
        <PlayIcon className="size-6 mx-0.5" />
      }}
    </DockButton>
    <DockButton onClick=handleSeekRight label="Play back 5 seconds">
      <ForwardIcon className="size-5 mx-0.5" />
    </DockButton>
    <DockSpace className="w-40">
      {switch player.volume {
      | Some(volume) if volume > 0 => <VolumeIcon className="size-7" />
      | _ => <VolumeLowIcon className="size-7 text-gray-400" />
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
      <FullScreenIcon className="size-6 mx-0.5" />
    </DockButton>
    <DockButton onClick=editCurrentSubtitle label="Edit current subtitle">
      <EditIcon className="size-6 mx-0.5" />
    </DockButton>
    {switch subtitlesManager.transcriptionState {
    | TranscriptionInProgress => React.null
    | _ =>
      <>
        <DockDivider />
        <DockButton
          highlight=true
          label="Render video file"
          onClick={startRender}
          className="whitespace-nowrap flex font-medium hover:!bg-orange-400 px-4">
          <RenderIcon className="size-5" />
          {React.string("Render video")}
        </DockButton>
      </>
    }}
  </div>
}
