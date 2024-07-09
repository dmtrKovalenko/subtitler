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
  let make = (~ts: option<float>, ~label, ~allowEmpty, ~onChange, ~readonly) => {
    let inputRef = useMask({
      mask: "__:__,___",
      replacement: Js.Dict.fromArray([("_", RegExp.fromString("\\d"))]),
    })

    let (parseError, setParseError) = React.useState(_ => None)
    let parsedValue = ts->Option.map(Utils.Duration.formatMillis)->Option.getOr("")

    React.useEffect(() => {
      inputRef.current
      ->Js.Nullable.toOption
      ->Utils.Option.zip(ts)
      ->Option.forEach(((input, timestamp)) => {
        input
        ->Webapi.Dom.HtmlInputElement.ofElement
        ->Option.forEach(
          input => {
            input->Webapi.Dom.HtmlInputElement.setValue(Utils.Duration.formatMillis(timestamp))
          },
        )
      })

      None
    }, [ts])

    let adornment = React.useMemo1(() => {
      parseError->Option.map(message =>
        <span title=message>
          <Icons.AlertIcon className="text-red-500 size-6" />
        </span>
      )
    }, [parseError])

    <Input
      label
      labelHidden=true
      ?adornment
      adornmentPosition=Right
      readOnly=readonly
      inputRef={ReactDOM.Ref.domRef(inputRef)}
      onKeyDown={useEditorInputHandler()}
      onChange={value => {
        let value = value->String.trim === "" ? None : Some(value)

        switch value->Option.map(Utils.Duration.parseMillisInputToSeconds) {
        | Some(Error(message)) => setParseError(_ => Some(message))
        | None if allowEmpty =>
          onChange(None)
          setParseError(_ => None)
        | None => setParseError(_ => Some("Timestamp is required"))
        | Some(Ok(value)) =>
          onChange(Some(value))
          setParseError(_ => None)
        }
      }}
      defaultValue={parsedValue}
      placeholder="till the next cue"
      className={Cx.cx([
        "w-full ",
        parseError->Option.isSome ? "ring-red-500 rounded-lg ring-2 focus:ring-0" : "",
      ])}
    />
  }
}

// globally exported and used as a singleton ref to the current textarea cue input
let globalCurrentTextAreaRef: React.ref<Js.Nullable.t<Dom.element>> = React.createRef()

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
  let previousWasCurrentRef = React.useRef(current)

  React.useEffect1(() => {
    if current && !previousWasCurrentRef.current && !Web.isFocusingInteractiveElement() {
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

    previousWasCurrentRef.current = current
    None
  }, [current])

  let seekToThisCue = React.useCallback1(_ => {
    if !readonly {
      ctx.playerImmediateDispatch(Pause)
      ctx.playerImmediateDispatch(NewFrame(start))
    }
  }, [start])

  <div
    ref={ReactDOM.Ref.domRef(ref)}
    onFocus=seekToThisCue
    className={Cx.cx([
      "gap-3 flex focus-within:border-zinc-500 transition-colors flex-col rounded-xl border-2 border-zinc-700 p-2 bg-zinc-900",
      current ? "!border-zinc-500" : "",
    ])}>
    <div className="flex items-center gap-1">
      <TimestampEditor
        label={"Start time of cue " ++ index->Int.toString}
        readonly
        allowEmpty=false
        ts={Some(start)}
        onChange={seconds => {
          let seconds = seconds->Utils.Option.unwrap
          onTimestampChange(index, (seconds, chunk.timestamp->snd))
          ctx.playerImmediateDispatch(NewFrame(seconds))
          ctx.playerImmediateDispatch(UpdateCurrentCue)
        }}
      />
      <Icons.ArrowRightIcon className="text-white size-10" />
      <TimestampEditor
        label={"Start time of cue " ++ index->Int.toString}
        readonly
        allowEmpty=true
        ts={Js.Nullable.toOption(end)}
        onChange={seconds => {
          onTimestampChange(index, (chunk.timestamp->fst, Js.Nullable.fromOption(seconds)))
        }}
      />
    </div>
    <textarea
      ref={ReactDOM.Ref.callbackDomRef(el => globalCurrentTextAreaRef.current = el)}
      readOnly=readonly
      value={chunk.text}
      rows={chunk.text === "" ? 2 : 3}
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
