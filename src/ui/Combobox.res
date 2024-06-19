module Combobox = {
  // Define a generic type TValue
  type tValue<'a>

  // Define the prop structure
  @react.component @module("./Combobox.tsx")
  external make: (
    ~options: array<tValue<'a>>,
    ~selected: tValue<'a>,
    ~formatValue: tValue<'a> => string,
    ~setSelected: option<tValue<'a>> => unit,
    ~filter: string => tValue<'a> => bool,
    ~getId: tValue<'a> => string,
  ) => React.element = "Combobox"
}

