@react.component @module("./ToggleSwitch.tsx")
external make: (~labelId: string, ~enabled: bool, ~onChange: bool => unit) => React.element =
  "default"
