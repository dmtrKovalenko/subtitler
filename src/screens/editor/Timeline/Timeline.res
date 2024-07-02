open CanvasSize

@react.component
let make = (~sectionSize: UseEditorLayout.sectionSize) => {
  let editorContext = EditorContext.useEditorContext()

  let size = React.useMemo4(() => {
    let scale = Web.Window.devicePixelRatio
    let maxSceneWidth = sectionSize.width -. timeline_margin_x->Float.fromInt
    let frameToPxRatio = maxSceneWidth /. editorContext.videoMeta.duration

    {
      width: sectionSize.width,
      height: sectionSize.height,
      scaledWidth: sectionSize.width *. scale,
      scaledHeight: sectionSize.height *. scale,
      scale,
      maxSceneWidth,
      frameToPxRatio,
      pxToFrameRation: 1. /. frameToPxRatio,
    }
  }, (sectionSize.height, sectionSize.width, sectionSize.scale, editorContext.videoMeta.duration))

  <div className="relative">
    <SceneMapCanvas size />
    <SeekBarCanvas size />
  </div>
}
