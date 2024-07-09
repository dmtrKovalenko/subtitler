type toggleGroupHighlight = [#neutral | #accentGradient]
type toggleSize = [#base | #small]

module Button = {
  @react.component @module("./ToggleButton")
  external make: (
    ~className: string=?,
    ~size: toggleSize=?,
    ~children: React.element=?,
    ~selected: bool=?,
    ~type_: string=?, // `type_` used because `type` is a reserved word in ReScript
    ~value: 'value,
    ~onClick: JsxEvent.Form.t => unit=?,
  ) => React.element = "ToggleButton"
}

module Group = {
  @react.component @module("./ToggleButton")
  external make: (
    ~id: string=?,
    ~className: string=?,
    ~children: React.element,
    ~onChange: 'value => unit,
    ~highlight: toggleGroupHighlight=?,
    ~size: toggleSize=?,
    ~value: 'value,
  ) => React.element = "ToggleGroup"
}
