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

let adornmentClassName = "font-mono rounded-md  m-1 bg-zinc-500 px-3 inset-y-0"
@react.component
let make = Utils.neverRerender(() => {
  let id = React.useId()
  let editorContext = EditorContext.useEditorContext()
  let (style, dispatch) = editorContext.useStyle()

  <div className="overflow-auto pb-6">
    <div className="flex flex-col gap-6">
      <div
        className="rounded-xl focus-within:border-zinc-500 border transition-colors border-transparent grid grid-cols-2 gap-2 bg-white/5 p-3 w-full">
        <Input
          labelHidden=true
          type_="number"
          label="Y coordinate"
          adornmentClassName
          className="w-full"
          min="0"
          max="999"
          step=1.0
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
          type_="number"
          min="0"
          max="999"
          step=1.0
          label="X coordinate"
          className="w-full"
          adornment={"Y"->React.string}
          adornmentClassName
          value={style.y->Belt.Int.toString}
          onChange={value =>
            value
            ->parseInt
            ->Option.map(val => Style.SetPosition(style.x, val))
            ->Option.forEach(dispatch)}
        />
        <Input
          type_="number"
          min="0"
          max="999"
          step=1.0
          labelHidden=true
          label="Width"
          className="w-full"
          adornment={"W"->React.string}
          adornmentClassName
          value={style.blockSize.width->Belt.Int.toString}
          onChange={value =>
            value
            ->parseInt
            ->Option.map(val => Style.SetBlockWidth(val))
            ->Option.forEach(dispatch)}
        />
        <Input
          type_="number"
          min="0"
          max="999"
          step=1.0
          labelHidden=true
          label="Height"
          className="w-full"
          adornment={"H"->React.string}
          adornmentClassName
          value={style.blockSize.height->Belt.Int.toString}
          onChange={value =>
            value
            ->parseInt
            ->Option.map(val => Style.SetBlockHeight(val))
            ->Option.forEach(dispatch)}
        />
      </div>
      <div
        className="rounded-xl focus-within:border-zinc-500 border transition-colors border-transparent grid grid-cols-3 md:grid-cols-6 gap-2 bg-white/5 p-3 w-full">
        <Input.Field className="col-span-3">
          <Input.Label forId={"font-picker" ++ id} className="whitespace-nowrap">
            {React.string("Font")}
          </Input.Label>
          <ReactFontPicker
            inputId={"font-picker" ++ id}
            initialFont={style.fontFamily}
            onFontVariantInfo={Hooks.useEvent(variants => {
              dispatch(Array.length(variants) > 0 ? SetFontVariants(variants) : ResetFontVariants)
            })}
            onFontLoad={Hooks.useEvent(val => {
              dispatch(SetFontFamily(val))
            })}
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
          <Input
            type_="number"
            label="width"
            adornmentClassName
            min="0"
            step=1.0
            max="999"
            value={style.strokeWidth->Belt.Int.toString}
            onChange={value =>
              value
              ->Int.fromString
              ->Option.forEach(strokeWidth => dispatch(Style.SetStrokeWidth(strokeWidth)))}
          />
        </div>
        <Input.Field className="col-span-3">
          <Input.Label className="whitespace-nowrap"> {React.string("Font weight")} </Input.Label>
          <Combobox
            selected={style.fontWeight}
            setSelected={value => value->Option.forEach(value => dispatch(SetFontWeight(value)))}
            options={style.fontVariants}
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
          <Input.Label forId={""} className="whitespace-nowrap">
            {React.string("Text align")}
          </Input.Label>
          <ToggleButton.Group
            value={style.align} onChange={value => dispatch(Style.SetAlign(value))}>
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
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-4">
          <ToggleSwitch
            labelId="background-title"
            enabled={style.showBackground}
            onChange={_ => dispatch(Style.ToggleBackground)}
          />
          <h3 id="background-title"> {React.string("Background")} </h3>
        </div>
        <div
          className={Cx.cx([
            "rounded-xl focus-within:border-zinc-500 border transition-colors border-transparent grid grid-cols-4 gap-2 bg-white/5 p-3 w-full",
            style.showBackground ? "brightness-100" : "brightness-50 pointer-events-none",
          ])}>
          <Input
            type_="color"
            label="Fill"
            className="w-full col-span-1 flex-1"
            value={style.background.color}
            onChange={value => dispatch(Style.SetBackground({...style.background, color: value}))}
          />
          <Input
            type_="number"
            label="Opacity"
            className="w-full col-span-1 flex-1"
            min="0"
            max="1"
            step=0.1
            value={style.background.opacity->Belt.Float.toString}
            onChange={value =>
              value
              ->Float.fromString
              ->Option.map(val => Style.SetBackground({...style.background, opacity: val}))
              ->Option.forEach(dispatch)}
          />
          <Input
            type_="color"
            label="Stroke"
            className="w-full col-span-1 flex-1"
            value={style.background.color}
            onChange={value =>
              dispatch(Style.SetBackground({...style.background, strokeColor: Some(value)}))}
          />
          <Input
            type_="number"
            label="width"
            adornmentClassName
            className="w-full"
            min="0"
            step=1.0
            max="999"
            value={style.background.strokeWidth->Belt.Int.toString}
            onChange={value =>
              value
              ->Int.fromString
              ->Option.forEach(strokeWidth =>
                dispatch(Style.SetBackground({...style.background, strokeWidth}))
              )}
          />
          <Input
            type_="number"
            label="Border radius"
            className="w-full col-span-2"
            min="0"
            step=1.0
            max="999"
            adornmentClassName="font-mono rounded-md   bg-zinc-500 px-2.5 inset-y-0"
            adornment={<Icons.BorderRadiusIcon color="white" className="size-4" />}
            value={style.background.borderRadius->Int.toString}
            onChange={value =>
              value
              ->Int.fromString
              ->Option.forEach(borderRadius =>
                dispatch(Style.SetBackground({...style.background, borderRadius}))
              )}
          />
          <Input
            type_="number"
            label="Padding X"
            adornmentClassName
            className="w-full"
            min="0"
            step=1.0
            max="999"
            value={style.background.paddingX->Belt.Int.toString}
            onChange={value =>
              value
              ->Int.fromString
              ->Option.forEach(paddingX =>
                dispatch(Style.SetBackground({...style.background, paddingX}))
              )}
          />
          <Input
            type_="number"
            label="Padding Y"
            adornmentClassName
            className="w-full"
            min="0"
            step=1.0
            max="999"
            value={style.background.paddingY->Belt.Int.toString}
            onChange={value =>
              value
              ->Int.fromString
              ->Option.forEach(paddingY =>
                dispatch(Style.SetBackground({...style.background, paddingY}))
              )}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-4">
          <ToggleSwitch
            labelId="word-animation-title"
            enabled={style.showWordAnimation}
            onChange={_ => dispatch(Style.ToggleWordAnimation)}
          />
          <h3 id="word-animation-title"> {React.string("Current word highlight")} </h3>
        </div>
        <div
          className={Cx.cx([
            "rounded-xl focus-within:border-zinc-500 border transition-colors border-transparent flex flex-col gap-3 bg-white/5 p-2 w-full",
            style.showWordAnimation ? "brightness-100" : "brightness-50 pointer-events-none",
          ])}>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                id="word-anim-background" className="text-base text-white flex items-center gap-2">
                <Icons.PaintBrushIcon className="size-5" />
                {React.string("Background")}
              </label>
              <ToggleSwitch
                labelId="word-anim-background"
                enabled={style.wordAnimation.showBackground}
                onChange={showBackground =>
                  dispatch(Style.SetWordAnimation({...style.wordAnimation, showBackground}))}
              />
            </div>
            <div
              className={Cx.cx([
                "grid grid-cols-4 gap-2 pl-7",
                style.wordAnimation.showBackground
                  ? "brightness-100"
                  : "brightness-50 pointer-events-none",
              ])}>
              <Input
                type_="color"
                label="Fill"
                className="w-full col-span-1 flex-1"
                value={style.wordAnimation.background.color}
                onChange={value =>
                  dispatch(
                    Style.SetWordAnimation({
                      ...style.wordAnimation,
                      background: {...style.wordAnimation.background, color: value},
                    }),
                  )}
              />
              <Input
                type_="number"
                label="Opacity"
                className="w-full col-span-1 flex-1"
                min="0"
                max="1"
                step=0.1
                value={style.wordAnimation.background.opacity->Belt.Float.toString}
                onChange={value =>
                  value
                  ->Float.fromString
                  ->Option.forEach(opacity =>
                    dispatch(
                      Style.SetWordAnimation({
                        ...style.wordAnimation,
                        background: {...style.wordAnimation.background, opacity},
                      }),
                    )
                  )}
              />
              <Input
                type_="number"
                label="Radius"
                className="w-full col-span-1"
                min="0"
                step=1.0
                max="99"
                adornmentClassName="font-mono rounded-md bg-zinc-500 px-2.5 inset-y-0"
                adornment={<Icons.BorderRadiusIcon color="white" className="size-4" />}
                value={style.wordAnimation.background.borderRadius->Int.toString}
                onChange={value =>
                  value
                  ->Int.fromString
                  ->Option.forEach(borderRadius =>
                    dispatch(
                      Style.SetWordAnimation({
                        ...style.wordAnimation,
                        background: {...style.wordAnimation.background, borderRadius},
                      }),
                    )
                  )}
              />
              <Input
                type_="number"
                label="Padding X"
                adornmentClassName
                className="w-full col-span-2"
                min="0"
                step=1.0
                max="99"
                value={style.wordAnimation.background.paddingX->Belt.Int.toString}
                onChange={value =>
                  value
                  ->Int.fromString
                  ->Option.forEach(paddingX =>
                    dispatch(
                      Style.SetWordAnimation({
                        ...style.wordAnimation,
                        background: {...style.wordAnimation.background, paddingX},
                      }),
                    )
                  )}
              />
              <Input
                type_="number"
                label="Padding Y"
                adornmentClassName
                className="w-full col-span-2"
                min="0"
                step=1.0
                max="99"
                value={style.wordAnimation.background.paddingY->Belt.Int.toString}
                onChange={value =>
                  value
                  ->Int.fromString
                  ->Option.forEach(paddingY =>
                    dispatch(
                      Style.SetWordAnimation({
                        ...style.wordAnimation,
                        background: {...style.wordAnimation.background, paddingY},
                      }),
                    )
                  )}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label id="word-anim-font" className="text-base text-white flex items-center gap-2">
                <Icons.LanguageIcon className="size-5" />
                {React.string("Font")}
              </label>
              <ToggleSwitch
                labelId="word-anim-font"
                enabled={style.wordAnimation.showFont}
                onChange={showFont =>
                  dispatch(Style.SetWordAnimation({...style.wordAnimation, showFont}))}
              />
            </div>
            <div
              className={Cx.cx([
                "grid grid-cols-4 gap-2 pl-7",
                style.wordAnimation.showFont
                  ? "brightness-100"
                  : "brightness-50 pointer-events-none",
              ])}>
              <Input
                type_="color"
                label="Color"
                className="w-full col-span-2 flex-1"
                value={style.wordAnimation.font.color->Option.getOr(style.color)}
                onChange={value =>
                  dispatch(
                    Style.SetWordAnimation({
                      ...style.wordAnimation,
                      font: {...style.wordAnimation.font, color: Some(value)},
                    }),
                  )}
              />
              <Input.Field className="col-span-2">
                <Input.Label className="whitespace-nowrap"> {React.string("Weight")} </Input.Label>
                <Combobox
                  selected={style.wordAnimation.font.fontWeight->Option.getOr(style.fontWeight)}
                  setSelected={value =>
                    value->Option.forEach(fontWeight =>
                      dispatch(
                        Style.SetWordAnimation({
                          ...style.wordAnimation,
                          font: {...style.wordAnimation.font, fontWeight: Some(fontWeight)},
                        }),
                      )
                    )}
                  options={style.fontVariants}
                  formatValue={formatFontWeight}
                  filter={value => item =>
                    item
                    ->formatFontWeight
                    ->String.toLowerCase
                    ->String.includes(value)}
                />
              </Input.Field>
            </div>
          </div>
          // Pop/Scale Effect
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label id="word-anim-pop" className="text-base text-white flex items-center gap-2">
                <Icons.ArrowsPointingOutIcon className="size-5" />
                {React.string("Pop")}
              </label>
              <ToggleSwitch
                labelId="word-anim-pop"
                enabled={style.wordAnimation.showPop}
                onChange={showPop =>
                  dispatch(Style.SetWordAnimation({...style.wordAnimation, showPop}))}
              />
            </div>
            <div
              className={Cx.cx([
                "grid grid-cols-4 gap-2 pl-7",
                style.wordAnimation.showPop
                  ? "brightness-100"
                  : "brightness-50 pointer-events-none",
              ])}>
              <Input
                type_="number"
                label="Scale"
                className="w-full col-span-2"
                min="1.0"
                max="1.2"
                step=0.01
                value={style.wordAnimation.pop.scale->Belt.Float.toString}
                onChange={value =>
                  value
                  ->Float.fromString
                  ->Option.forEach(scale =>
                    dispatch(
                      Style.SetWordAnimation({
                        ...style.wordAnimation,
                        pop: {scale: scale},
                      }),
                    )
                  )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
})
