type maskInput = {
  mask: string,
  replacement: Js.Dict.t<RegExp.t>,
}

@module("@react-input/mask")
external useMask: maskInput => React.ref<Js.nullable<Webapi.Dom.Element.t>> = "useMask"

module TimestampEditor = {
  @react.component
  let make = (~ts: option<float>) => {
    let inputRef = useMask({
      mask: "__:__",
      replacement: Js.Dict.fromArray([("_", RegExp.fromString("\\d"))]),
    })

    let duration = Utils.Duration.formatSeconds(ts->Option.getWithDefault(0.0))

    <input
      ref={ReactDOM.Ref.domRef(inputRef)}
      defaultValue={duration}
      className="block w-full rounded-lg border-none bg-white/10 py-1.5 px-3 text-sm/6 text-white focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400"
    />
  }
}

@react.component
let make = (~chunk: Subtitles.subtitleCue) => {
  let (start, end) = chunk.timestamp
  <div
    className="gap-3 flex focus-within:border-zinc-500 transition-colors flex-col rounded-xl border-2 border-zinc-700 p-2 bg-zinc-900">
    <div className="flex items-center gap-1">
      <TimestampEditor ts={Some(start)} />
      <Icons.ArrowRightIcon className="text-white size-10" />
      <TimestampEditor ts={Js.Nullable.toOption(end)} />
    </div>
    <textarea
      rows={3}
      value={chunk.text}
      className={Cx.cx([
        "col-span-2 block w-full resize-none rounded-lg border-none bg-white/10 py-1.5 px-3 text-sm/6 text-white",
        "focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400",
      ])}
    />
  </div>
}
