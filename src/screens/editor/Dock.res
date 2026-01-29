open Icons
open Cx
open Shortcut
open Webapi
open ChunksList
open Player
open VideoExportFormatDropdown

module DockButton = {
  @react.component @module("../../ui/DockButton")
  external make: (
    ~children: React.element,
    ~label: string,
    ~className: string=?,
    ~onClick: unit => unit=?,
    ~highlight: bool=?,
  ) => React.element = "default"
}

module DocumentEvent = Dom.EventTarget.Impl(Dom.Window)

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
  {key: "r", modifier: NoModifier, action: StartRender},
  {key: "f", modifier: NoModifier, action: ToggleFullScreen},
  {key: "m", modifier: NoModifier, action: Mute},
  {key: "Home", modifier: NoModifier, action: SeekToStart},
  {key: "ArrowLeft", modifier: Meta, action: SeekToStart},
  {key: "End", modifier: NoModifier, action: SeekToEnd},
  {key: "ArrowRight", modifier: Meta, action: SeekToEnd},
  {key: "ArrowUp", modifier: Meta, action: IncreaseVolume},
  {key: "ArrowDown", modifier: Meta, action: DecreaseVolume},
]

module DockDivider = {
  @react.component
  let make = Utils.neverRerender(() =>
    <div className="hidden md:block">
      <hr className="mx-2 h-9 border-gray-600 border bg-none" />
    </div>
  )
}

module DockSpace = {
  let baseClass = "flex items-center justify-center p-1.5 md:p-2 shadow rounded-lg md:rounded-xl bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 duration-300 md:relative md:bottom-3"

  @react.component
  let make = React.memo((~children, ~className="") => {
    <div className={cx([baseClass, className])}> {children} </div>
  })
}

@send external focus: Dom.Element.t => unit = "focus"

let volumeIcon = volume =>
  switch volume {
  | Some(v) if v > 0 => <VolumeIcon className="size-5 md:size-7" />
  | _ => <VolumeLowIcon className="size-5 md:size-7 text-gray-400" />
  }

@react.component
let make = (~subtitlesManager, ~render, ~fullScreenToggler: Hooks.toggle, ~videoFileName) => {
  let context = EditorContext.useEditorContext()
  let (isCollapsed, collapsedToggle) = Hooks.useToggle(false)
  let (player, playerDispatch) = context.usePlayer()
  let (exportSettings, setExportSettings) = React.useState(() => makeDefaultSettings())

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

  let handleSeekLeft = Hooks.useEvent(() =>
    playerDispatch(Seek(context.getImmediatePlayerState().ts -. 2.))
  )
  let handleSeekRight = Hooks.useEvent(() =>
    playerDispatch(Seek(context.getImmediatePlayerState().ts +. 2.))
  )
  let toggleMute = Hooks.useEvent(() => playerDispatch(SetVolume(0)))
  let seekToStart = Hooks.useEvent(() => playerDispatch(Seek(0.)))
  let seekToEnd = Hooks.useEvent(() => playerDispatch(Seek(context.videoMeta.duration)))

  let editCurrentSubtitle = Hooks.useEvent(() => {
    Webapi.Dom.document
    ->Webapi.Dom.Document.getElementById("current-cue-textarea")
    ->Option.flatMap(Dom.HtmlTextAreaElement.ofElement)
    ->Option.forEach(textarea => {
      Dom.HtmlTextAreaElement.focus(textarea)
      let len = Dom.HtmlTextAreaElement.value(textarea)->String.length
      Dom.HtmlTextAreaElement.setSelectionStart(textarea, Some(len))
      Dom.HtmlTextAreaElement.setSelectionEnd(textarea, Some(len))
    })
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
      switch subtitlesManager.activeSubtitles->Array.get(currentIndex + shift) {
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
    render(
      context.getImmediateStyleState(),
      exportSettings.format->formatToString,
      exportSettings.videoCodec->videoCodecToString,
      exportSettings.audioCodec->audioCodecToString,
    )
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
      "flex flex-row items-center gap-1.5 px-2 py-1 overflow-x-auto max-w-full",
      "md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2 md:px-4 md:pt-1 md:pb-0 md:gap-2 md:bg-zinc-900/30 md:border-t md:border-x md:border-gray-100/20 md:shadow-xl md:rounded-t-lg md:backdrop-blur-lg md:overflow-visible",
      isCollapsed ? "md:translate-y-16 md:duration-300" : "",
    ])}>
    <DockSpace
      className="tabular-nums text-xs md:text-sm gap-0.5 md:space-x-1 whitespace-nowrap shrink-0">
      <span> {player.ts->Utils.Duration.formatSeconds->React.string} </span>
      <span className="normal-nums"> {React.string("/")} </span>
      <span> {context.videoMeta.duration->Utils.Duration.formatSeconds->React.string} </span>
    </DockSpace>
    <DockDivider />
    <DockButton onClick=handleSeekLeft label="Seek backward">
      <BackwardIcon className="size-5" />
    </DockButton>
    <DockButton onClick=handlePlayOrPause highlight=true label="Play/Pause">
      {switch player.playState {
      | StoppedForRender => <Spinner size=1.25 className="" />
      | Playing => <PauseIcon className="size-6" />
      | Paused | Idle => <PlayIcon className="size-6" />
      }}
    </DockButton>
    <DockButton onClick=handleSeekRight label="Seek forward">
      <ForwardIcon className="size-5" />
    </DockButton>
    <div className="md:hidden">
      <VolumePopover
        volume={player.volume}
        onVolumeChange={handleSetVolume}
        minVolume={Player.min_volume}
        maxVolume={Player.max_volume}>
        <DockButton label="Volume"> {volumeIcon(player.volume)} </DockButton>
      </VolumePopover>
    </div>
    <DockSpace className="hidden md:flex w-40 shrink-0">
      {volumeIcon(player.volume)}
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
    <div className="hidden md:block">
      <DockButton onClick=fullScreenToggler.toggle label="Fullscreen">
        <FullScreenIcon className="size-6" />
      </DockButton>
    </div>
    <div className="hidden md:block">
      <DockButton onClick=editCurrentSubtitle label="Edit subtitle">
        <EditIcon className="size-6" />
      </DockButton>
    </div>
    {switch subtitlesManager.transcriptionState {
    | TranscriptionInProgress => React.null
    | SubtitlesReady(_) =>
      let subtitles = subtitlesManager.activeSubtitles
      <>
        <DockDivider />
        <SubtitleExportDropdown sideOffset={5} align=#start subtitles videoFileName>
          <DockButton label="Export subtitles" className="hover:!scale-100">
            <DownloadIcon className="size-5 md:mr-2 md:size-4" />
            <span className="hidden md:inline"> {React.string("Export")} </span>
          </DockButton>
        </SubtitleExportDropdown>
        <VideoExportFormatDropdown
          settings=exportSettings
          onSettingsChange={settings => setExportSettings(_ => settings)}
          onRender={startRender}
          sideOffset={5}
          align=#end>
          <DockButton
            highlight=true
            label="Render video"
            className="whitespace-nowrap font-medium hover:!scale-100 md:hover:!scale-105 md:hover:!bg-orange-400 px-2 md:px-4">
            <RocketIcon className="size-5" />
            <span className="hidden md:inline ml-1"> {React.string("Render")} </span>
          </DockButton>
        </VideoExportFormatDropdown>
      </>
    }}
  </div>
}
