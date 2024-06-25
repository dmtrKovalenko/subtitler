open Belt
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
  let framesBreak = editorContext.videoMeta.duration->Float.toInt / maxFramesInScene

  let i = ref(0)
  let rec seekAndRender = () => {
    editorContext.seekUnsafe(~ts=(framesBreak * i.contents)->Float.fromInt, _ => {
      editorContext.renderFrame(
        ctx,
        ~dy=timeline_margin_y,
        ~dx=timeline_margin_x / 2 + i.contents * width,
        ~dirtyHeight=scene_height_size,
        ~dirtyWidth=width,
      )

      if i.contents < maxFramesInScene {
        i := i.contents + 1
        seekAndRender()
      }
    })
  }

  seekAndRender()
}

let renderAudioWaveForm = (
  ctx,
  ~endFrame,
  ~startFrame,
  ~x0,
  ~y0,
  ~audioSpaceWidth,
  ~audioName,
  ~editorContext: EditorContext.editorContext,
) => {
  //  let audioInfo = switch media {
  //  | Some(Media(Audio(audioInfo))) => audioInfo
  //  | _ => failwith(`Unknown audio file ${audioName}. Did you forget to add it to your media folder?`)
  //  }
  //
  //  let positionStart = 0
  //  let positionEnd = Js.Int.fromFloat(
  //    (endFrame - startFrame)->Float.fromInt /.
  //    editorContext.videoMeta.fps->Float.fromInt *.
  //    audioInfo.sampleRate->Float.fromInt,
  //  )
  //  let length = positionEnd - positionStart
  //
  //  let step = 1.
  //  let sector = length->Js.Float.fromInt /. audioSpaceWidth *. step
  //
  //  let position = ref(positionStart)
  //  let mid = Float.fromInt(audio_height / 2)
  //  let x = ref(x0)
  //
  //  ctx->Canvas2d.beginPath
  //  ctx->Canvas2d.setStrokeStyle(String, "#e2e8f0")
  //
  //  while x.contents < audioSpaceWidth || position.contents < positionEnd {
  //    let pcm = audioInfo.fltpData->Web.Float32Array.at(position.contents)->Utils.Option.un//wrapOr(0.0)
  //
  //    let y = mid +. y0 +. pcm *. mid
  //    ctx->Canvas2d.lineTo(~x=x.contents, ~y)
  //
  //    position := (position.contents->Float.fromInt +. sector)->Utils.Math.floor
  //    x := (x.contents +. step)->Js.Math.floor
  //  }
  //
  //  ctx->Canvas2d.stroke

  ()
}

let renderAudioMap = (ctx, size, editorContext: EditorContext.editorContext) => {
  //  let xStack = []
  //
  //  editorContext.videoMeta.audioMap
  //  ->Js.Nullable.toOption
  //  ->Option.forEach(audioMap => audioMap->Js.Array.reduce((startY, track) => {
  //      let x = frameToX(track.start, size)
  //
  //      let startY =
  //        xStack
  //        ->Array.getIndexBy(((lastX, _)) => x > lastX)
  //        ->Option.map(index => {
  //          let (_, startY) = xStack[index]->Utils.Option.unwrap
  //          xStack->Belt.Array.truncateToLengthUnsafe(index)
  //
  //          startY
  //        })
  //        ->Utils.Option.unwrapOr(startY)
  //
  //      let y = Float.fromInt(timeline_margin_y + scene_height_size + startY)
  //      let width = Float.fromInt(track.end - track.start) *. size.frameToPxRatio
  //
  //      xStack->Js.Array.push((x +. width, startY))->ignore
  //      ctx->Canvas2d.save
  //
  //      let textX = x +. 2.
  //      let textY = y -. 8.
  //      let textHeight = 14.
  //
  //      // this is level 2 safe needed for a clip around track name text to prevent same st//ack names overflow.
  //      ctx->Canvas2d.save
  //      ctx->Canvas2d.rect(
  //        ~x=textX -. 10.,
  //        ~y=textY -. textHeight +. 4.,
  //        ~w=width +. 8.0,
  //        ~h=textHeight,
  //      )
  //
  //      ctx->Canvas2d.clip
  //      ctx->Canvas2d.setFillStyle(String, "#e2e8f0")
  //      track.name->Canvas2d.fillText(ctx, ~x=textX, ~y=textY)
  //      ctx->Canvas2d.restore
  //      ctx->Canvas2d.beginPath
  //
  //      ctx->renderRoundedRect(
  //        ~x,
  //        ~y,
  //        ~width,
  //        ~height=Float.fromInt(scene_height_size / 2),
  //        ~radius=8.0,
  //        (),
  //      )
  //      ctx->Canvas2d.clip
  //
  //      ctx->Canvas2d.setFillStyle(String, "#059669")
  //      ctx->Canvas2d.fillRect(~x, ~y, ~w=width, ~h=Float.fromInt(scene_height_size / 2))
  //
  //      ctx
  //      ->renderAudioWaveForm(
  //        ~x0=x,
  //        ~y0=y,
  //        ~audioName=track.name,
  //        ~audioSpaceWidth=width,
  //        ~editorContext,
  //        ~startFrame=track.start,
  //        ~endFrame=track.end,
  //      )
  //      ->ignore
  //
  //      ctx->Canvas2d.closePath
  //      ctx->Canvas2d.restore
  //
  //      startY + audio_height + audio_height / 2
  //    }, 32)->ignore)
  ()
}

let renderTimeSlots = (ctx, size, editorContext: EditorContext.editorContext) => {
  let coordinate_step = 100
  let full_timestamp_each_steps = 2

  let stepsCount =
    size.maxSceneWidth
    ->Utils.Math.divideFloat(coordinate_step->Float.fromInt)
    ->Js.Math.floor

  let stepDuration = editorContext.videoMeta.duration->Float.toInt / stepsCount

  Range.forEach(0, stepsCount, i => {
    let x = (i * coordinate_step + timeline_margin_x / 2)->Float.fromInt

    ctx->Canvas2d.beginPath
    ctx->Canvas2d.moveTo(~x, ~y=0.)
    ctx->Canvas2d.lineTo(~x, ~y=18.)

    ctx->Canvas2d.setStrokeStyle(String, "#475569")
    ctx->Canvas2d.stroke

    if mod(i, full_timestamp_each_steps) === 0 {
      ctx->Canvas2d.font("12px sans-serif")
      ctx->Canvas2d.setFillStyle(String, "#64748b")

      //      (i * stepDuration)
      //      ->Float.fromInt
      //      ->Utils.Math.divideFloat(editorContext.videoMeta.fps->Float.fromInt)
      //      ->Utils.Duration.formatSeconds
      //      ->Canvas2d.fillText(ctx, ~x=x +. 8., ~y=14.)
    }
  })
}

@react.component
let make = (~size: canvasSize) => {
  let canvasRef = React.useRef(Js.Nullable.null)
  let editorContext = EditorContext.useEditorContext()

  useCanvasScale(canvasRef, size)

  React.useEffect1(() => {
    canvasRef.current
    ->Js.Nullable.toOption
    ->Belt.Option.map(element => {
      let ctx = Webapi.Canvas.CanvasElement.getContext2d(element)

      ctx->renderTimeSlots(size, editorContext)
      //      ctx->renderScenes(size, editorContext)

      ctx->Canvas2d.save
      ctx->renderAudioMap(size, editorContext)
      ctx->Canvas2d.restore
      ctx->renderMainScene(size, editorContext)

      ()
    })
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
}
