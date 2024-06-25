type tab = {
  id: string,
  name: React.element,
  content: React.element,
}

type tabsProps = {tabs: array<tab>}

@react.component @module("./Tabs")
external make: (~tabs: array<tab>, ~defaultIndex: int, ~className: string=?) => React.element =
  "default"
