module RadixProgress = {
  module Root = {
    @react.component @module("@radix-ui/react-progress")
    external make: (
      ~className: string=?,
      ~value: float,
      ~children: React.element,
    ) => React.element = "Root"
  }

  module Indicator = {
    @react.component @module("@radix-ui/react-progress")
    external make: (~className: string=?, ~style: ReactDOMStyle.t=?) => React.element = "Indicator"
  }
}

@genType.as("Progress") @react.component
let make = (~progress: float, ~name: string) => {
  <RadixProgress.Root
    className="relative overflow-hidden border-2 border-white rounded-full w-full h-8"
    value=progress>
    <RadixProgress.Indicator
      className="bg-white size-full transition-transform duration-[660ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
      style={ReactDOMStyle.make(
        ~transform=`translateX(-${(100. -. progress)->Float.toString}%)`,
        (),
      )}
    />
    <span className="absolute top-0.5 left-4 mix-blend-exclusion"> {name->React.string} </span>
    <span className="absolute right-4 top-0.5 mix-blend-exclusion">
      {`${progress->Float.toFixed(~digits=0)}%`->React.string}
    </span>
  </RadixProgress.Root>
}
