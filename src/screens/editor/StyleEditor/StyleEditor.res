let font_weight_options = [
  Style.Thin,
  Style.ExtraLight,
  Style.Light,
  Style.Regular,
  Style.Medium,
  Style.SemiBold,
  Style.Bold,
  Style.ExtraBold,
  Style.Black,
]

let formatFontWeight = weight =>
  switch weight {
  | Style.Thin => "Thin"
  | Style.ExtraLight => "Extra Light"
  | Style.Light => "Light"
  | Style.Regular => "Regular"
  | Style.Medium => "Medium"
  | Style.SemiBold => "Semi Bold"
  | Style.Bold => "Bold"
  | Style.ExtraBold => "Extra Bold"
  | Style.Black => "Black"
  }

let parseInt = value =>
  if value == "" {
    Some(0)
  } else {
    Belt.Int.fromString(value)
  }

@react.component
let make = Utils.neverRerender(() => {
  let editorContext = EditorContext.useEditorContext()
  let (style, dispatch) = editorContext.useStyle()
  let fontInProgressRef = React.useRef(None)

  <div className="flex flex-col gap-6">
    <div
      className="rounded-xl focus-within:border-zinc-500 border transition-colors border-transparent grid grid-cols-2 gap-2 bg-white/5 p-3 w-full">
      <Input
        labelHidden=true
        label="Y coordinate"
        className="w-full"
        min="0"
        adornment={"X"->React.string}
        value={style.x->Belt.Int.toString}
        onChange={value =>
          value
          ->parseInt
          ->Option.map(val => Style.SetPosition(val, style.y))
          ->Option.forEach(dispatch)}
      />
      <Input
        labelHidden=true
        label="X coordinate"
        className="w-full"
        adornment={"Y"->React.string}
        value={style.y->Belt.Int.toString}
        onChange={value =>
          value
          ->parseInt
          ->Option.map(val => Style.SetPosition(style.x, val))
          ->Option.forEach(dispatch)}
      />
      <Input
        labelHidden=true
        label="Width"
        className="w-full"
        adornment={"W"->React.string}
        value={style.blockSize.width->Belt.Int.toString}
        onChange={value =>
          value
          ->parseInt
          ->Option.map(val => Style.SetBlockWidth(val))
          ->Option.forEach(dispatch)}
      />
      <Input
        labelHidden=true
        label="Height"
        className="w-full"
        adornment={"H"->React.string}
        value={style.blockSize.height->Belt.Int.toString}
        onChange={value =>
          value
          ->parseInt
          ->Option.map(val => Style.SetBlockHeight(val))
          ->Option.forEach(dispatch)}
      />
    </div>
    <div
      className="rounded-xl focus-within:border-zinc-500 border transition-colors border-transparent grid grid-cols-6 gap-2 bg-white/5 p-3 w-full">
      <Input.Field className="col-span-3">
        <Input.Label className="whitespace-nowrap"> {React.string("Font")} </Input.Label>
        <ReactFontPicker
          loadAllVariants=true
          autoLoad=true
          loading={<div className="py-0.5 pl-3 font-light text-white text-base">
            {React.string("Inter")}
          </div>}
          defaultValue="Inter"
          value={val => fontInProgressRef.current = Some(val)}
          fontsLoaded={_ => {
            fontInProgressRef.current->Option.forEach(font => {
              dispatch(Style.SetFontFamily(font))
              fontInProgressRef.current = None
            })
          }}
        />
      </Input.Field>
      <div className="flex gap-2 col-span-3">
        <Input
          type_="color"
          label="Fill"
          className="w-full col-span-1 flex-1"
          value={style.color}
          onChange={value => dispatch(Style.SetColor(value))}
        />
        <Input
          type_="color"
          label="Stroke"
          className="w-full col-span-1 flex-1"
          value={style.strokeColor->Option.getOr(style.color)}
          onChange={value => dispatch(Style.SetStrokeColor(value))}
        />
      </div>
      <Input.Field className="col-span-3">
        <Input.Label className="whitespace-nowrap"> {React.string("Font weight")} </Input.Label>
        <Combobox
          selected={style.fontWeight}
          setSelected={value => value->Option.forEach(value => dispatch(SetFontWeight(value)))}
          options={font_weight_options}
          formatValue={formatFontWeight}
          filter={value => item =>
            item
            ->formatFontWeight
            ->String.toLowerCase
            ->String.includes(value)}
        />
      </Input.Field>
      <Input
        label="Size"
        type_="number"
        min="0"
        max="999"
        value={style.fontSizePx->Belt.Int.toString}
        className="min-w-[4ch]"
        onChange={value =>
          value
          ->parseInt
          ->Option.map(val => Style.SetFontSizePx(val))
          ->Option.forEach(dispatch)}
      />
      <Input.Field className="col-span-2">
        <Input.Label className="whitespace-nowrap"> {React.string("Text align")} </Input.Label>
        <ToggleButton.Group value={style.align} onChange={value => dispatch(Style.SetAlign(value))}>
          <ToggleButton.Button value={Style.Left}>
            <Icons.BarsCenterLeftIcon className="size-4" />
          </ToggleButton.Button>
          <ToggleButton.Button value={Style.Center}>
            <Icons.BarsIcon className="size-4" />
          </ToggleButton.Button>
          <ToggleButton.Button value={Style.Right}>
            <Icons.BarsCenterRightIcon className="size-4" />
          </ToggleButton.Button>
        </ToggleButton.Group>
      </Input.Field>
    </div>
  </div>
})
