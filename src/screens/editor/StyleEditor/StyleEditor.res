let font_weight_options = [
  Renderer.Thin,
  Renderer.ExtraLight,
  Renderer.Light,
  Renderer.Regular,
  Renderer.Medium,
  Renderer.SemiBold,
  Renderer.Bold,
  Renderer.ExtraBold,
  Renderer.Black,
]

let formatFontWeight = weight =>
  switch weight {
  | Renderer.Thin => "Thin"
  | Renderer.ExtraLight => "Extra Light"
  | Renderer.Light => "Light"
  | Renderer.Regular => "Regular"
  | Renderer.Medium => "Medium"
  | Renderer.SemiBold => "Semi Bold"
  | Renderer.Bold => "Bold"
  | Renderer.ExtraBold => "Extra Bold"
  | Renderer.Black => "Black"
  }

let parseInt = value =>
  if value == "" {
    Some(0)
  } else {
    Belt.Int.fromString(value)
  }

@react.component
let make = () => {
  let style = Renderer.useObservable()

  <div className="flex flex-col gap-6">
    <div
      className="rounded-xl focus-within:border-zinc-500 border transition-colors border-transparent grid grid-cols-2 gap-4 bg-white/5 p-3 w-full">
      <Input
        labelHidden=true
        label="Y coordinate"
        className="w-full"
        adornment={"X"->React.string}
        value={style.x->Belt.Int.toString}
        onChange={value =>
          value
          ->parseInt
          ->Option.map(val => Renderer.SetX(val))
          ->Option.forEach(Renderer.dispatch)}
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
          ->Option.map(val => Renderer.SetY(val))
          ->Option.forEach(Renderer.dispatch)}
      />
      <Input
        labelHidden=true
        label="Width"
        className="w-full"
        adornment={"W"->React.string}
        value={style.blockWidth->Belt.Int.toString}
        onChange={value =>
          value
          ->parseInt
          ->Option.map(val => Renderer.SetBlockWidth(val))
          ->Option.forEach(Renderer.dispatch)}
      />
      <Input
        labelHidden=true
        label="Height"
        className="w-full"
        adornment={"H"->React.string}
        value={style.blockHeight->Belt.Int.toString}
        onChange={value =>
          value
          ->parseInt
          ->Option.map(val => Renderer.SetBlockHeight(val))
          ->Option.forEach(Renderer.dispatch)}
      />
    </div>
    <div
      className="rounded-xl focus-within:border-zinc-500 border transition-colors border-transparent grid grid-cols-6 gap-4 bg-white/5 p-3 w-full">
      <Input.Field className="col-span-4">
        <Input.Label className="whitespace-nowrap"> {React.string("Font")} </Input.Label>
        <ReactFontPicker
          autoLoad=true
          loading={<div className="py-0.5 pl-3 font-light text-white text-base">
            {React.string("Inter")}
          </div>}
          defaultValue="Inter"
        />
      </Input.Field>
      <Input
        type_="color"
        label="Fill"
        className="w-full col-span-1"
        onChange={value => Renderer.dispatch(Renderer.SetColor(value))}
      />
      <Input.Field className="col-span-3">
        <Input.Label className="whitespace-nowrap"> {React.string("Text Align")} </Input.Label>
        <Combobox
          selected={style.fontWeight}
          setSelected={value =>
            value->Option.forEach(value => Renderer.dispatch(SetFontWeight(value)))}
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
        value={style.fontSizePx->Belt.Int.toString}
        onChange={value =>
          value
          ->parseInt
          ->Option.map(val => Renderer.SetFontSizePx(val))
          ->Option.forEach(Renderer.dispatch)}
      />
      <Input.Field className="col-span-2">
        <Input.Label className="whitespace-nowrap"> {React.string("Text Align")} </Input.Label>
        <ToggleButton.Group
          value={style.align} onChange={value => Renderer.dispatch(Renderer.SetAlign(value))}>
          <ToggleButton.Button value={Renderer.Left}>
            <Icons.BarsCenterLeftIcon className="size-4" />
          </ToggleButton.Button>
          <ToggleButton.Button value={Renderer.Center}>
            <Icons.BarsIcon />
          </ToggleButton.Button>
          <ToggleButton.Button value={Renderer.Right}>
            <Icons.BarsCenterRightIcon />
          </ToggleButton.Button>
        </ToggleButton.Group>
      </Input.Field>
    </div>
  </div>
}
