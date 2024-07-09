open CanvasSize

module Canvas = Webapi.Canvas
module Canvas2d = Webapi.Canvas.Canvas2d

@send
external drawImage: (
  Canvas.Canvas2d.t,
  ~imageData: Webapi.Dom.Element.t,
  ~dx: int,
  ~dy: int,
  ~dirtyWidth: int,
  ~dirtyHeight: int,
) => unit = "drawImage"

let renderRoundedRect = (ctx, ~x, ~y, ~width, ~height, ~radius, ()) => {
  ctx->Canvas2d.beginPath
  ctx->Canvas2d.moveTo(~x=x +. radius, ~y)

  ctx->Canvas2d.arcTo(~x1=x +. width, ~y1=y, ~x2=x +. width, ~y2=y +. height, ~r=radius)
  ctx->Canvas2d.arcTo(~x1=x +. width, ~y1=y +. height, ~x2=x, ~y2=y +. height, ~r=radius)
  ctx->Canvas2d.arcTo(~x1=x, ~y1=y +. height, ~x2=x, ~y2=y, ~r=radius)
  ctx->Canvas2d.arcTo(~x1=x, ~y1=y, ~x2=x +. width, ~y2=y, ~r=radius)

  ctx->Canvas2d.stroke
}

let clipOverTimeLineElement = (ctx, ~y, ~width, ~fill) => {
  let x = Float.fromInt(timeline_margin_x / 2)
  let height = Float.fromInt(scene_height_size)

  ctx->renderRoundedRect(~x, ~y, ~width, ~height, ~radius=12.0, ())
  ctx->Canvas2d.clip
  ctx->Canvas2d.setFillStyle(String, fill)
  ctx->Canvas2d.fillRect(~x, ~y, ~w=width, ~h=height)
}

let sceneRerenderCount = ref(0)
let renderMainScene = (ctx, size, editorContext: EditorContext.editorContext) => {
  let aspectRatio =
    editorContext.videoMeta.width->Float.fromInt /. editorContext.videoMeta.height->Float.fromInt

  let width = (Float.fromInt(scene_height_size) *. aspectRatio)->Utils.Math.floor
  ctx->clipOverTimeLineElement(
    ~y=timeline_margin_y->Float.fromInt,
    ~width=size.maxSceneWidth,
    ~fill="#000",
  )

  let maxFramesInScene = size.maxSceneWidth->Float.toInt / width
  let framesBreak = editorContext.videoMeta.duration /. maxFramesInScene->float_of_int

  let rec seekAndRenderAsync = (i, renderId) => {
    if renderId === sceneRerenderCount.contents {
      editorContext.dom.timelineVideoElement->Web.Video.setCurrentTime(
        float_of_int(i) *. framesBreak,
      )
      editorContext.dom.timelineVideoElement->Web.Video.onSeekedOnce(_ => {
        Web.Video.drawOnCanvas(
          ctx,
          editorContext.dom.timelineVideoElement,
          ~dy=timeline_margin_y,
          ~dx=timeline_margin_x / 2 + i * width,
          ~dirtyHeight=scene_height_size,
          ~dirtyWidth=width,
        )

        if i < maxFramesInScene {
          seekAndRenderAsync(i + 1, renderId)
        }
      })
    }
  }

  if editorContext.dom.timelineVideoElement->Web.Video.readyState > 1 {
    sceneRerenderCount := sceneRerenderCount.contents + 1
    seekAndRenderAsync(0, sceneRerenderCount.contents)
  } else {
    editorContext.dom.timelineVideoElement->Web.Video.onLoadedDataOnce(_ => {
      sceneRerenderCount := sceneRerenderCount.contents + 1

      seekAndRenderAsync(0, sceneRerenderCount.contents)
    })
  }
}

let renderAudioWaveForm = (
  ctx,
  ~startTs,
  ~endTs,
  ~x0,
  ~y0,
  ~audioSpaceWidth,
  ~editorContext: EditorContext.editorContext,
) => {
  module Ctx = unpack(editorContext.ctx)

  Ctx.audioBuffer->Option.map(audioBuffer => {
    let positionStart = 0
    let positionEnd = Int.fromFloat(
      (endTs -. startTs) *.
        audioBuffer
        ->WebAudio.AudioBuffer.getSampleRate
        ->Float.fromInt,
    )
    let length = positionEnd - positionStart

    let step = 1.
    let sector = length->Float.fromInt /. audioSpaceWidth *. step

    let position = ref(positionStart)
    let mid = Float.fromInt(audio_height / 2)
    let x = ref(x0)

    ctx->Canvas2d.beginPath
    ctx->Canvas2d.setStrokeStyle(String, "#e2e8f0")

    let fltpData = audioBuffer->WebAudio.AudioBuffer.getChannelData(0)

    while x.contents < audioSpaceWidth || position.contents < positionEnd {
      let pcm = fltpData->TypedArray.get(position.contents)->Option.getOr(0.0)

      let y = mid +. y0 +. pcm *. mid
      ctx->Canvas2d.lineTo(~x=x.contents, ~y)

      position := (position.contents->Float.fromInt +. sector)->Utils.Math.floor
      x := (x.contents +. step)->Js.Math.floor_float
    }

    ctx->Canvas2d.stroke
  })
}

let renderAudio = (ctx, size, editorContext: EditorContext.editorContext) => {
  let x = tsToFrame(0., size)

  let y = Float.fromInt(timeline_margin_y + scene_height_size + timeline_margin_y / 4)
  let width = editorContext.videoMeta.duration *. size.frameToPxRatio

  ctx->Canvas2d.beginPath
  ctx->renderRoundedRect(
    ~x,
    ~y,
    ~width,
    ~height=Float.fromInt(scene_height_size / 2),
    ~radius=8.0,
    (),
  )
  ctx->Canvas2d.clip

  ctx->Canvas2d.setFillStyle(String, "#059669")
  ctx->Canvas2d.fillRect(~x, ~y, ~w=width, ~h=Float.fromInt(scene_height_size / 2))

  ctx
  ->renderAudioWaveForm(
    ~x0=x,
    ~y0=y,
    ~audioSpaceWidth=width,
    ~editorContext,
    ~startTs=0.,
    ~endTs=editorContext.videoMeta.duration,
  )
  ->ignore

  ctx->Canvas2d.closePath
  ctx->Canvas2d.restore
}

let renderTimeSlots = (ctx, size, editorContext: EditorContext.editorContext) => {
  let coordinate_step = 100
  let full_timestamp_each_steps = 2

  let stepsCount =
    size.maxSceneWidth
    ->Utils.Math.divideFloat(coordinate_step->Float.fromInt)
    ->Js.Math.floor

  let stepDuration = editorContext.videoMeta.duration /. stepsCount->Float.fromInt

  Belt.Range.forEach(0, stepsCount, i => {
    let x = (i * coordinate_step + timeline_margin_x / 2)->Float.fromInt

    ctx->Canvas2d.beginPath
    ctx->Canvas2d.moveTo(~x, ~y=0.)
    ctx->Canvas2d.lineTo(~x, ~y=18.)

    ctx->Canvas2d.setStrokeStyle(String, "#52525b")
    ctx->Canvas2d.stroke

    if mod(i, full_timestamp_each_steps) === 0 {
      ctx->Canvas2d.font("12px sans-serif")
      ctx->Canvas2d.setFillStyle(String, "#52525b")

      let a = (Float.fromInt(i) *. stepDuration)->Utils.Duration.formatSeconds
      ctx->Canvas2d.fillText(a, ~x=x +. 8., ~y=14., ~maxWidth=100., ())
    }
  })
}

@react.component
let make = React.memo((~size: canvasSize) => {
  let canvasRef = React.useRef(Js.Nullable.null)
  let editorContext = EditorContext.useEditorContext()

  useCanvasScale(canvasRef, size)

  React.useEffect1(() => {
    canvasRef.current
    ->Js.Nullable.toOption
    ->Belt.Option.map(
      element => {
        let ctx = Webapi.Canvas.CanvasElement.getContext2d(element)

        ctx->renderTimeSlots(size, editorContext)

        ctx->Canvas2d.save
        ctx->renderAudio(size, editorContext)
        ctx->Canvas2d.restore
        ctx->renderMainScene(size, editorContext)

        ()
      },
    )
    ->ignore

    None
  }, [size])

  <canvas
    className="absolute inset-0"
    style={ReactDOMStyle.make(
      ~height=`${size.height->Float.toString}px`,
      ~width=`${size.width->Float.toString}px`,
      (),
    )}
    width={`${size.scaledWidth->Js.Math.floor->Int.toString}px`}
    height={`${size.scaledHeight->Js.Math.floor->Int.toString}px`}
    ref={ReactDOM.Ref.domRef(canvasRef)}
  />
})
