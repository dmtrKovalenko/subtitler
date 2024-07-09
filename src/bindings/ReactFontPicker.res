@react.component @module("react-fontpicker-ts-lite")
external make: (
  ~inputId: string=?,
  ~autoLoad: bool,
  ~defaultValue: string,
  ~loading: React.element=?,
  ~value: string => unit=?,
  ~loadAllVariants: bool=?,
  ~fontsLoaded: bool => unit=?,
) => React.element = "default"
