module Field = {
  @react.component @module("@headlessui/react")
  external make: (~className: string=?, ~children: React.element) => React.element = "Field"
}

module Label = {
  module HeadlessLabel = {
    @react.component @module("@headlessui/react")
    external make: (~className: string=?, ~children: React.element) => React.element = "Label"
  }

  @react.component
  let make = (~children: React.element, ~className: string=?) => {
    <HeadlessLabel
      className={Cx.cx(["text-sm/6 ml-1.5 font-medium text-white", className->Option.getOr("")])}>
      {children}
    </HeadlessLabel>
  }
}

@react.component
let make = (
  ~value: string=?,
  ~type_: string=?,
  ~className=?,
  ~labelHidden=?,
  ~adornment=?,
  ~label,
  ~onChange=?,
) => {
  <Field className={className->Option.getOr("")}>
    <Label className={Cx.cx([labelHidden->Option.getOr(false) ? "sr-only" : ""])}>
      {React.string(label)}
    </Label>
    <div className="relative rounded-lg flex">
      {adornment
      ->Option.map(adornment => {
        <div
          className="pointer-events-none font-mono rounded-md absolute m-1 bg-zinc-500 px-3 inset-y-0 left-0 flex justify-center items-center">
          {adornment}
        </div>
      })
      ->Option.getOr(React.null)}
      <input
        type_={type_->Option.getOr("text")}
        value={value->Option.getOr(%raw("undefined"))}
        onChange={(e: JsxEvent.Form.t) => {
          onChange->Option.forEach(onChange => onChange(JsxEvent.Form.currentTarget(e)["value"]))
        }}
        className={Cx.cx([
          "block w-full rounded-lg border-none bg-white/10 py-1.5 px-3 text-sm/6 text-white focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400",
          Option.isSome(adornment) ? "pl-12" : "",
        ])}
      />
    </div>
  </Field>
}
