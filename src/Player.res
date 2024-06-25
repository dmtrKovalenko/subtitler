type playState = Playing | Paused | WaitingForAction | CantPlay

/// This state should only contain a state that changes that affect the animation runtime or will likely change 60 t/s
@genType
type state = {
  frame: float,
  startPlayingFrame: float,
  playState: playState,
  volume: option<int>,
}

@genType
type action =
  | Seek(float)
  | NewFrame(float)
  | AllowPlay
  | Play
  | Pause
  | SetVolume(int)

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
      frame: 0.,
      startPlayingFrame: 0.,
      playState: Paused,
      volume,
    }
  }

  let renderFrame = () => {
    switch Ctx.canvasRef.current->Js.Nullable.toOption {
    | Some(el) => {
        let ctx = Webapi.Canvas.CanvasElement.getContext2d(el)
        Ctx.renderVideoFrame(ctx)
      }
    | None => ()
    }
  }

  include UseObservable.Pubsub(PlayerState)
  let reducer = action => {
    let state = get()
    switch action {
    | Seek(frame) | NewFrame(frame) if frame >= Ctx.videoMeta.duration || frame < 0. => {
        ...state,
        frame: 0.,
        playState: Paused,
        startPlayingFrame: frame,
      }
    | Seek(frame) | NewFrame(frame) => {
        ...state,
        frame,
        startPlayingFrame: switch action {
        | Seek(frame) => frame
        | _ => state.startPlayingFrame
        },
      }
    | AllowPlay => {...state, playState: WaitingForAction}
    | Play if state.frame <= 0. || state.frame >= Ctx.videoMeta.duration => {
        ...state,
        frame: 0.,
        playState: Playing,
      }
    | Play => {...state, playState: Playing, startPlayingFrame: state.frame}
    | Pause => {...state, playState: Paused}
    | SetVolume(volume) => {
        ...state,
        volume: Some(volume),
      }
    }
  }

  let rec onFrame = dispatch => {
    renderFrame()
    let seconds = Web.Video.currentTime(Ctx.videoElement)

    if get().playState === Playing {
      dispatch(NewFrame(seconds))
    }

    if !Web.Video.paused(Ctx.videoElement) {
      Webapi.requestAnimationFrame(_ => onFrame(dispatch))
    }
  }

  let sideEffect = (action, dispatch) => {
    let startPlaying = (currentTs: float) => {
      Ctx.videoElement->Web.Video.play
      Ctx.videoElement->Web.Video.setCurrentTime(currentTs)

      Webapi.requestAnimationFrame(_ => onFrame(dispatch))
      ()
    }

    switch action {
    | Play if get().playState !== Playing => startPlaying(get().frame)
    | Seek(newFrame) => startPlaying(newFrame)
    | NewFrame(currentTs) if get().playState !== Playing => {
        Ctx.videoElement->Web.Video.setCurrentTime(currentTs)
        renderFrame()
      }
    | Pause => Web.Video.pause(Ctx.videoElement)
    | SetVolume(volume) => {
        // AnimationRuntime.AudioRuntime.setVolume(volume)
        Js.log("set volume")

        Dom.Storage.setItem(volume_key, volume->Js.Int.toString, Dom.Storage.localStorage)
      }
    | _ => ()
    }
  }

  let rec dispatch = action => {
    sideEffect(action, dispatch)
    reducer(action)->set
  }
}
