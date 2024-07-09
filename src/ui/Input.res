module Field = {
  @react.component @module("@headlessui/react")
  external make: (~className: string=?, ~children: React.element) => React.element = "Field"
}

module Label = {
  module HeadlessLabel = {
    @react.component @module("@headlessui/react")
    external make: (
      @as("htmlFor") ~forId: string=?,
      ~className: string=?,
      ~children: React.element,
    ) => React.element = "Label"
  }

  @react.component
  let make = (~forId=?, ~children: React.element, ~className: option<string>=?) => {
    <HeadlessLabel
      ?forId
      className={Cx.cx(["text-sm/6 ml-1.5 font-medium text-white", className->Option.getOr("")])}>
      {children}
    </HeadlessLabel>
  }
}

type position = Left | Right

@react.component
let make = (
  ~defaultValue=?,
  ~inputRef=?,
  ~placeholder=?,
  ~onKeyDown=?,
  ~readOnly=?,
  ~label,
  ~value: option<string>=?,
  ~type_: option<string>=?,
  ~className=?,
  ~labelHidden=?,
  ~adornment: option<React.element>=?,
  ~adornmentPosition=?,
  ~adornmentClassName=?,
  ~onChange=?,
  ~min=?,
  ~max=?,
) => {
  let ref = inputRef
  let id = React.useId()

  <Field className={className->Option.getOr("")}>
    <Label forId={id} className={Cx.cx([labelHidden->Option.getOr(false) ? "sr-only" : ""])}>
      {React.string(label)}
    </Label>
    <div className="relative rounded-lg flex">
      {adornment
      ->Option.map(adornment => {
        <div
          className={Cx.cx([
            adornmentClassName->Option.getOr(""),
            "absolute m-1 px-2 inset-y-0 flex justify-center items-center",
            switch adornmentPosition {
            | Some(Right) => "right-0"
            | _ => "left-0"
            },
          ])}>
          {adornment}
        </div>
      })
      ->Option.getOr(React.null)}
      <input
        id
        ?ref
        ?onKeyDown
        ?defaultValue
        ?placeholder
        ?min
        ?max
        readOnly={readOnly->Option.getOr(false)}
        type_={type_->Option.getOr("text")}
        value={value->Option.getOr(%raw("undefined"))}
        onChange={(e: JsxEvent.Form.t) => {
          onChange->Option.forEach(onChange => onChange(JsxEvent.Form.currentTarget(e)["value"]))
        }}
        className={Cx.cx([
          "block w-full rounded-lg border-none bg-white/10 py-1.5 px-3 text-sm/6 text-white focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400",
          switch (adornment, adornmentPosition) {
          | (Some(_), Some(Right)) => "pr-12"
          | (Some(_), _) => "pl-12"
          | _ => ""
          },
        ])}
      />
    </div>
  </Field>
}
