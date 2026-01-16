// Styled DropdownMenu component bindings
module Root = {
  @react.component @module("./DropdownMenu")
  external make: (
    ~children: React.element,
    ~open_: bool=?,
    ~onOpenChange: bool => unit=?,
  ) => React.element = "DropdownMenu"
}

module Trigger = {
  @react.component @module("./DropdownMenu")
  external make: (
    ~children: React.element,
    ~className: string=?,
    ~asChild: bool=?,
  ) => React.element = "DropdownMenuTrigger"
}

module Content = {
  @react.component @module("./DropdownMenu")
  external make: (
    ~children: React.element,
    ~className: string=?,
    ~sideOffset: int=?,
    ~align: [#start | #center | #end]=?,
  ) => React.element = "DropdownMenuContent"
}

module Item = {
  @react.component @module("./DropdownMenu")
  external make: (
    ~children: React.element,
    ~className: string=?,
    ~onClick: unit => unit=?,
    ~disabled: bool=?,
  ) => React.element = "DropdownMenuItem"
}

module RadioGroup = {
  @react.component @module("./DropdownMenu")
  external make: (
    ~children: React.element,
    ~value: string=?,
    ~onValueChange: string => unit=?,
    ~className: string=?,
  ) => React.element = "DropdownMenuRadioGroup"
}

module RadioItem = {
  @react.component @module("./DropdownMenu")
  external make: (~children: React.element, ~value: string, ~className: string=?) => React.element =
    "DropdownMenuRadioItem"
}

module Separator = {
  @react.component @module("./DropdownMenu")
  external make: (~className: string=?) => React.element = "DropdownMenuSeparator"
}

module Label = {
  @react.component @module("./DropdownMenu")
  external make: (~children: React.element, ~className: string=?) => React.element =
    "DropdownMenuLabel"
}
