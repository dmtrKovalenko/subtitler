module Popover = {
  module Root = {
    @react.component @module("@radix-ui/react-popover")
    external make: (~children: React.element) => React.element = "Root"
  }

  module Trigger = {
    @react.component @module("@radix-ui/react-popover")
    external make: (~asChild: bool=?, ~children: React.element) => React.element = "Trigger"
  }

  module Portal = {
    @react.component @module("@radix-ui/react-popover")
    external make: (~children: React.element) => React.element = "Portal"
  }

  module Content = {
    @react.component @module("@radix-ui/react-popover")
    external make: (
      ~className: string=?,
      ~side: [#top | #bottom | #left | #right]=?,
      ~sideOffset: int=?,
      ~align: [#start | #center | #end]=?,
      ~children: React.element,
    ) => React.element = "Content"
  }

  module Arrow = {
    @react.component @module("@radix-ui/react-popover")
    external make: (~className: string=?) => React.element = "Arrow"
  }
}

module SliderPrimitive = {
  module Root = {
    @react.component @module("@radix-ui/react-slider")
    external make: (
      ~orientation: [#horizontal | #vertical]=?,
      ~value: array<int>,
      ~onValueChange: array<int> => unit=?,
      ~min: int,
      ~max: int,
      ~step: int=?,
      ~disabled: bool=?,
      ~className: string=?,
      ~children: React.element,
    ) => React.element = "Root"
  }

  module Track = {
    @react.component @module("@radix-ui/react-slider")
    external make: (~className: string=?, ~children: React.element) => React.element = "Track"
  }

  module Range = {
    @react.component @module("@radix-ui/react-slider")
    external make: (~className: string=?) => React.element = "Range"
  }

  module Thumb = {
    @react.component @module("@radix-ui/react-slider")
    external make: (~className: string=?) => React.element = "Thumb"
  }
}

let contentClassName = "z-50 rounded-xl border border-white/10 bg-zinc-800/95 p-3 shadow-xl backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"

@react.component
let make = (
  ~volume: option<int>,
  ~onVolumeChange: int => unit,
  ~minVolume: int,
  ~maxVolume: int,
  ~children: React.element,
) => {
  let handleChange = values => {
    values->Array.get(0)->Option.forEach(onVolumeChange)
  }

  let currentVolume = volume->Option.getOr(0)

  <Popover.Root>
    <Popover.Trigger asChild=true> {children} </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content className=contentClassName side=#top sideOffset=12 align=#center>
        <div className="flex flex-col items-center gap-3 w-12">
          <SliderPrimitive.Root
            orientation=#vertical
            value=[currentVolume]
            onValueChange=handleChange
            min=minVolume
            max=maxVolume
            step=1
            disabled={volume->Option.isNone}
            className="relative flex flex-col items-center select-none h-28 w-4">
            <SliderPrimitive.Track className="relative flex-grow w-1 rounded-full bg-slate-600">
              <SliderPrimitive.Range className="absolute bg-white rounded-full w-full" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
              className="block cursor-grab w-4 h-4 bg-white transition-transform shadow-xl rounded-full focus:ring-2 ring-offset-1 ring-orange-400 focus:bg-gradient-to-tr from-orange-400 to-orange-600"
            />
          </SliderPrimitive.Root>
          <span className="text-xs text-zinc-400 tabular-nums">
            {React.string(`${currentVolume->Int.toString}%`)}
          </span>
        </div>
        <Popover.Arrow className="fill-zinc-800/95" />
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
}
