@react.component @module("react-fontpicker-ts-lite")
external make: (
  ~autoLoad: bool,
  ~defaultValue: string,
  ~loading: React.element=?,
  ~value: string => unit=?,
) => React.element = "default"
