type maskInput = {
  mask: string,
  replacement: Js.Dict.t<RegExp.t>,
}

@module("@react-input/mask")
external useMask: maskInput => React.ref<Js.nullable<Webapi.Dom.Element.t>> = "useMask"

let useEditorInputHandler = () => {
  let ctx = EditorContext.useEditorContext()

  Hooks.useEvent(event => {
    let key = ReactEvent.Keyboard.key(event)

    switch key {
    | "Escape" => ReactEvent.Keyboard.target(event)["blur"]()
    | " "
      if event->ReactEvent.Keyboard.shiftKey ||
      event->ReactEvent.Keyboard.ctrlKey ||
      event->ReactEvent.Keyboard.metaKey =>
      ctx.playerImmediateDispatch(Play)
    | _ => ()
    }
  })
}

module TimestampEditor = {
  @react.component
  let make = (~ts: option<float>, ~onChange, ~readonly) => {
    let inputRef = useMask({
      mask: "__:__,___",
      replacement: Js.Dict.fromArray([("_", RegExp.fromString("\\d"))]),
    })

    let (hasParseError, setHasParseError) = React.useState(_ => false)
    let parsedValue = ts->Option.map(Utils.Duration.formatMiilis)->Option.getOr("")

    React.useEffect(() => {
      inputRef.current
      ->Js.Nullable.toOption
      ->Utils.Option.zip(ts)
      ->Option.forEach(((input, timestamp)) => {
        input
        ->Webapi.Dom.HtmlInputElement.ofElement
        ->Option.forEach(
          input => {
            input->Webapi.Dom.HtmlInputElement.setValue(Utils.Duration.formatMiilis(timestamp))
          },
        )
      })

      None
    }, [ts])

    <input
      readOnly=readonly
      ref={ReactDOM.Ref.domRef(inputRef)}
      onKeyDown={useEditorInputHandler()}
      onChange={e => {
        let value = ReactEvent.Form.target(e)["value"]
        switch Utils.Duration.parseMillisInputToSeconds(value) {
        | None => setHasParseError(_ => true)
        | Some(value) =>
          onChange(value)
          setHasParseError(_ => false)
        }
      }}
      defaultValue={parsedValue}
      placeholder="till the next cue"
      className={Cx.cx([
        "block w-full rounded-lg border-none bg-white/10 py-1.5 px-3 text-sm/6 text-white focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400",
        hasParseError ? "ring-red-500 ring-2 focus:ring-0" : "",
      ])}
    />
  }
}

// lol this is soo bad but it works
module CurrentTextArea = {
  @set
  external setCurrentCueTextArea: (
    Webapi.Dom.Window.t,
    option<Webapi.Dom.HtmlInputElement.t>,
  ) => unit = "__fframes_currentcue_textarea"
  @get
  external getCurrentTextArea: Webapi.Dom.Window.t => option<Webapi.Dom.HtmlInputElement.t> =
    "__fframes_currentcue_textarea"
}

@react.component
let make = React.memo((
  ~index: int,
  ~readonly,
  ~current,
  ~chunk: Subtitles.subtitleCue,
  ~removeChunk,
  ~onTimestampChange: (int, Subtitles.timestamp) => unit,
  ~onTextChange: (int, string) => unit,
) => {
  let (start, end) = chunk.timestamp
  let ctx = EditorContext.useEditorContext()

  let ref = React.useRef(null)
  let textAreaRef = React.useRef(null)
  let previousCurrentRef = React.useRef(current)

  React.useEffect1(() => {
    open Webapi
    if current && !previousCurrentRef.current && !Web.isFocusingInteractiveElement() {
      Dom.window->CurrentTextArea.setCurrentCueTextArea(
        textAreaRef.current->Js.Nullable.toOption->Option.flatMap(Dom.HtmlInputElement.ofElement),
      )

      ref.current
      ->Js.Nullable.toOption
      ->Option.forEach(
        el =>
          el->Webapi.Dom.Element.scrollIntoViewWithOptions({
            "behavior": "smooth",
            "block": "start",
          }),
      )
    }

    previousCurrentRef.current = current
    None
  }, [current])

  let seekToThisCue = React.useCallback1(_ => {
    if !readonly {
      ctx.playerImmediateDispatch(Pause)
      ctx.playerImmediateDispatch(NewFrame(start))
    }
  }, [start])

  <div
    id={current ? "current-cue" : ""}
    ref={ReactDOM.Ref.domRef(ref)}
    onFocus=seekToThisCue
    className={Cx.cx([
      "gap-3 flex focus-within:border-zinc-500 transition-colors flex-col rounded-xl border-2 border-zinc-700 p-2 bg-zinc-900",
      current ? "!border-zinc-500" : "",
    ])}>
    <div className="flex items-center gap-1">
      <TimestampEditor
        readonly
        ts={Some(start)}
        onChange={seconds => {
          onTimestampChange(index, (seconds, chunk.timestamp->snd))
          ctx.playerImmediateDispatch(NewFrame(seconds))
          ctx.playerImmediateDispatch(UpdateCurrentCue)
        }}
      />
      <Icons.ArrowRightIcon className="text-white size-10" />
      <TimestampEditor
        readonly
        ts={Js.Nullable.toOption(end)}
        onChange={seconds => {
          onTimestampChange(index, (chunk.timestamp->fst, Value(seconds)))
        }}
      />
    </div>
    <textarea
      rows={chunk.text === "" ? 2 : 3}
      readOnly=readonly
      ref={ReactDOM.Ref.domRef(textAreaRef)}
      value={chunk.text}
      onChange={e => onTextChange(index, ReactEvent.Form.target(e)["value"])}
      onKeyDown={useEditorInputHandler()}
      className={Cx.cx([
        "col-span-2 block w-full resize-none rounded-lg border-none bg-white/10 py-1.5 px-3 text-sm/6 text-white",
        "focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400",
      ])}
    />
    {if chunk.text == "" {
      <div className="flex gap-2">
        <button
          type_="button"
          onClick={_ => removeChunk(index, ~joinSiblingsTimestamps=false)}
          className="flex-1 inline-flex justify-center items-center bg-red-700/60 hover:bg-red-500/60 transition-colors focus-visible:outline-zinc-300 focus:outline-none focus:outline-2 focus-visible:-outline-offset-2 py-1.5 rounded-lg">
          {React.string("Remove cue")}
        </button>
        <button
          type_="button"
          onClick={_ => removeChunk(index, ~joinSiblingsTimestamps=true)}
          className="flex-[1.5] inline-flex justify-center items-center bg-amber-600/80 hover:bg-amber-500/60 transition-colors focus-visible:outline-zinc-300 focus:outline-none focus:outline-2 focus-visible:-outline-offset-2 py-1.5 rounded-lg">
          {React.string("Remove and join siblings")}
        </button>
      </div>
    } else {
      {React.null}
    }}
  </div>
})
