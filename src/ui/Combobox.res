// Define the prop structure
@react.component @module("./Combobox.tsx")
external make: (
  ~options: array<'a>,
  ~selected: 'a,
  ~formatValue: 'a => string,
  ~setSelected: option<'a> => unit,
  ~filter: string => 'a => bool,
  ~getId: 'a => string=?,
) => React.element = "Combobox"
