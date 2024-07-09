open Subtitles

@genType
type playState = Playing | Paused | Idle | StoppedForRender

/// This state should only contain a state that changes that affect the animation runtime or will likely change 60 t/s
@genType
type state = {
  ts: float,
  startPlayingTs: float,
  playState: playState,
  currentPlayingCue: option<currentPlayingCue>,
  volume: option<int>,
}

@genType
type action =
  | Seek(float)
  | NewFrame(float)
  | Play
  | Pause
  | SetVolume(int)
  | StopForRender
  | AbortRender
  | UpdateCurrentCue

let currentFps: ref<option<int>> = ref(None)

let min_volume = 0
let max_volume = 100
let validateVolume = Utils.Math.minMax(~min=min_volume, ~max=max_volume)

@inline
let volume_key = "subtitles_volume"

module MakePlayer = (Ctx: Types.Ctx) => {
  module PlayerState = {
    type t = state

    let volume = switch Dom.Storage.getItem(volume_key, Dom.Storage.localStorage) {
    | Some(savedValue) => savedValue->Belt.Int.fromString
    | None => Some(60)
    }

    let initial = {
      ts: 0.,
      startPlayingTs: 0.,
      playState: Idle,
      currentPlayingCue: lookupCurrentCue(~timestamp=0., ~subtitles=Ctx.subtitlesRef.current),
      volume,
    }
  }

  include UseObservable.Pubsub(PlayerState)

  let renderFrame = () => {
    switch (Ctx.dom.canvasRef.current->Js.Nullable.toOption, get().playState) {
    | (None, _) | (_, StoppedForRender) => ()
    | (Some(el), _) => {
        let ctx = Webapi.Canvas.CanvasElement.getContext2d(el)

        Web.Video.drawOnCanvas(
          ctx,
          Ctx.dom.videoElement,
          ~dx=0,
          ~dy=0,
          ~dirtyWidth=Ctx.videoMeta.width,
          ~dirtyHeight=Ctx.videoMeta.height,
        )
      }
    }
  }

  let reducer = action => {
    let state = get()
    switch action {
    | AbortRender => {...state, playState: Paused}
    // if we stopped for render we ignore any state change
    | _ if state.playState === StoppedForRender => state
    | Seek(ts) | NewFrame(ts) if ts >= Ctx.videoMeta.duration || ts < 0. => {
        ...state,
        ts: 0.,
        playState: Paused,
        startPlayingTs: ts,
      }
    | Seek(ts) => {
        ...state,
        ts,
        startPlayingTs: ts,
        playState: state.playState === Idle ? Paused : state.playState,
        currentPlayingCue: lookupCurrentCue(~timestamp=ts, ~subtitles=Ctx.subtitlesRef.current),
      }
    | NewFrame(ts) => {
        ...state,
        ts,
        playState: state.playState === Idle ? Paused : state.playState,
        currentPlayingCue: getOrLookupCurrentCue(
          ~timestamp=ts,
          ~subtitles=Ctx.subtitlesRef.current,
          ~prevCue=state.currentPlayingCue,
        ),
      }
    | Play if state.ts <= 0. || state.ts >= Ctx.videoMeta.duration => {
        ...state,
        ts: 0.,
        playState: Playing,
      }
    | Play => {...state, playState: Playing, startPlayingTs: state.ts}
    | Pause => {...state, playState: Paused}
    | SetVolume(volume) => {
        ...state,
        volume: Some(volume),
      }
    | UpdateCurrentCue => {
        let currentPlayingCue = lookupCurrentCue(
          ~timestamp=state.ts,
          ~subtitles=Ctx.subtitlesRef.current,
        )

        {...state, currentPlayingCue}
      }
    | StopForRender => {...state, playState: StoppedForRender}
    }
  }

  let rec onFrame = dispatch => {
    renderFrame()
    let seconds = Web.Video.currentTime(Ctx.dom.videoElement)

    if get().playState === Playing {
      dispatch(NewFrame(seconds))
    }

    if !Web.Video.paused(Ctx.dom.videoElement) {
      Webapi.requestAnimationFrame(_ => onFrame(dispatch))
    }
  }

  let sideEffect = (action, dispatch) => {
    let startPlaying = (currentTs: float) => {
      get().volume->Option.forEach(volume =>
        Ctx.dom.videoElement->Web.Video.setVolume(volume->Float.fromInt /. 100.)
      )
      Ctx.dom.videoElement->Web.Video.play
      Ctx.dom.videoElement->Web.Video.setCurrentTime(currentTs)

      Webapi.requestAnimationFrame(_ => onFrame(dispatch))
      ()
    }

    switch action {
    | _ if get().playState === StoppedForRender => ()
    | Play if get().playState !== Playing => startPlaying(get().ts)
    | Seek(currentTs) => {
        Ctx.dom.videoElement->Web.Video.setCurrentTime(currentTs)
        renderFrame()
      }
    | NewFrame(currentTs) if get().playState !== Playing => {
        Ctx.dom.videoElement->Web.Video.setCurrentTime(currentTs)
        renderFrame()
      }
    | Pause => Web.Video.pause(Ctx.dom.videoElement)
    | SetVolume(volume) => {
        Ctx.dom.videoElement->Web.Video.setVolume(volume->Float.fromInt /. 100.)
        Dom.Storage.setItem(volume_key, volume->Js.Int.toString, Dom.Storage.localStorage)
      }
    | StopForRender => Web.Video.pause(Ctx.dom.videoElement)
    | _ => ()
    }
  }

  let rec dispatch = action => {
    sideEffect(action, dispatch)
    reducer(action)->set
  }
}
