// Updating module paths to use Heroicons outline style from "@heroicons/react/24/outline"
module MusicalNotesIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "MusicalNoteIcon"
}

module FontIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "FontAdjustmentsIcon"
}

module CaptionsIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "ChatAlt2Icon"
}

module PlayIcon = {
  @react.component @module("@heroicons/react/24/solid")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "PlayIcon"
}

module ForwardIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~color: option<string>=?,
    ~className: string=?,
    ~style: option<ReactDOM.Style.t>=?,
  ) => React.element = "ArrowUturnRightIcon"
}

module BackwardIcon = {
  @react.component
  let make = (
    ~color: option<string>=?,
    ~className: option<string>=?,
    ~style: option<ReactDOM.Style.t>=?,
  ) => {
    <ForwardIcon color style className={Cx.cx([className->Option.getOr(""), "scale-x-[-1]"])} />
  }
}

module VolumeIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~high: bool=?,
    ~mute: bool=?,
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "SpeakerWaveIcon"
}

module VolumeLowIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "SpeakerXMarkIcon"
}

module FullScreenIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "ArrowsPointingOutIcon"
}

module CollapseIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "EyeSlashIcon"
}

module PauseIcon = {
  @react.component @module("@heroicons/react/24/solid")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "PauseIcon"
}

module ArrowRightIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "ArrowRightIcon"
}

module BarsCenterLeftIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "Bars3BottomLeftIcon"
}

module BarsIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "Bars3Icon"
}

module BarsCenterRightIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "Bars3BottomRightIcon"
}

module RenderIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "SparklesIcon"
}

module EditIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "PencilSquareIcon"
}

module AlertIcon = {
  @react.component @module("@heroicons/react/24/outline")
  external make: (
    ~title: string=?,
    ~color: string=?,
    ~className: string=?,
    ~style: ReactDOM.Style.t=?,
  ) => React.element = "ExclamationTriangleIcon"
}

module BorderRadiusIcon = {
  @react.component
  let make = (~color="currentColor", ~className="", ~style=?) => {
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke=color
      className
      ?style>
      <path d="M4 14C4 9.58172 7.58172 6 12 6H20" strokeWidth="2" strokeLinecap="round" />
    </svg>
  }
}
