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
  let make = (~ts: option<float>, ~label, ~inProgress, ~allowEmpty, ~onChange, ~readonly) => {
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
      placeholder={inProgress ? "transcribing" : "till the next cue"}
      className={Cx.cx([
        "w-full",
        inProgress ? "animate-pulse pointer-events-none" : "",
        parseError->Option.isSome ? "ring-red-500 rounded-lg ring-2 focus:ring-0" : "",
      ])}
    />
  }
}

// globally exported and used as a singleton ref to the current (or last if nothing played)
// textarea cue input dom element
let globalCurrentCueTextAreaRef = ref(None)

// Component to show split preview text
module SplitPreviewText = {
  @react.component
  let make = (~wordChunks: array<WordTimestamps.wordChunk>, ~splitAt: int, ~isFirstHalf: bool) => {
    let words = if isFirstHalf {
      wordChunks->Array.slice(~start=0, ~end=splitAt)
    } else {
      wordChunks->Array.sliceToEnd(~start=splitAt)
    }

    let text = words->Array.map(w => w.text->String.trim)->Array.join(" ")

    <div
      className="col-span-2 block w-full rounded-lg border-2 border-dashed border-orange-400/50 bg-orange-500/10 py-1.5 px-3 text-sm/6 text-white/70">
      {React.string(text == "" ? "(empty)" : text)}
    </div>
  }
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
  ~hasPauseBefore: bool,
  ~hasPauseAfter: bool,
  ~wordChunks: array<WordTimestamps.wordChunk>,
  ~onAddBefore: unit => unit,
  ~onAddAfter: unit => unit,
  ~onSplit: int => unit,
  ~splitPreview: option<int>,
  ~onSplitPreviewChange: option<int> => unit,
  ~isAnySplitPreviewActive: bool,
  ~shouldFocus: bool,
  ~onFocused: unit => unit,
) => {
  let (start, end) = chunk.timestamp
  let ctx = EditorContext.useEditorContext()

  let ref = React.useRef(null)
  let textAreaRef = React.useRef(null)
  let previousWasCurrentRef = React.useRef(current)

  // Call hook unconditionally at the top level
  let editorInputHandler = useEditorInputHandler()

  // Don't auto-scroll when split preview is active or user is interacting with menus
  React.useEffect2(() => {
    if current {
      // Always update the ref when this cue is current
      globalCurrentCueTextAreaRef := Some(textAreaRef)

      // Only auto-scroll on transition to current
      if !previousWasCurrentRef.current {
        // Skip scroll if ANY split preview is active (user is in split menu)
        // or if user is focusing any interactive element
        let shouldScroll = !isAnySplitPreviewActive && !Web.isFocusingInteractiveElement()

        if shouldScroll {
          ref.current
          ->Js.Nullable.toOption
          ->Option.forEach(
            el =>
              el->Webapi.Dom.Element.scrollIntoViewWithOptions({
                "behavior": "smooth",
                "block": "nearest",
              }),
          )
        }
      }
    }

    previousWasCurrentRef.current = current
    None
  }, (current, isAnySplitPreviewActive))

  // Auto-focus and scroll when this cue should be focused (e.g., newly added)
  React.useEffect1(() => {
    if shouldFocus {
      // Scroll the cue into view
      ref.current
      ->Js.Nullable.toOption
      ->Option.forEach(
        el =>
          el->Webapi.Dom.Element.scrollIntoViewWithOptions({
            "behavior": "smooth",
            "block": "center",
          }),
      )

      // Focus the textarea after a small delay to ensure scroll completes
      let _ = Js.Global.setTimeout(
        () => {
          textAreaRef.current
          ->Js.Nullable.toOption
          ->Option.flatMap(Webapi.Dom.HtmlTextAreaElement.ofElement)
          ->Option.forEach(
            textarea => {
              textarea->Webapi.Dom.HtmlTextAreaElement.focus
            },
          )
        },
        100,
      )

      // Notify parent that focus has been handled
      onFocused()
    }
    None
  }, [shouldFocus])

  let seekToThisCue = React.useCallback1(_ => {
    if !readonly {
      ctx.playerImmediateDispatch(Pause)
      ctx.playerImmediateDispatch(NewFrame(start))
    }
  }, [start])

  let inProgress = chunk.isInProgress->Option.getOr(false)

  let handleBlur = React.useCallback2(e => {
    let newText = ReactEvent.Focus.target(e)["value"]
    if newText !== chunk.text {
      onTextChange(index, newText)
    }
  }, (chunk.text, index))

  // Show split preview if this cue is being split
  let showSplitPreview = splitPreview->Option.isSome

  <div
    ref={ReactDOM.Ref.domRef(ref)}
    onFocus=seekToThisCue
    className={Cx.cx([
      "group relative overflow-visible scroll-mt-24 gap-3 flex focus-within:border-orange-500 transition-colors flex-col rounded-xl border-2 border-zinc-700 p-2 bg-zinc-900",
      current ? "!border-orange-500" : "",
    ])}>
    <div className="flex items-center gap-1">
      <TimestampEditor
        inProgress
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
        inProgress
        label={"Start time of cue " ++ index->Int.toString}
        readonly
        allowEmpty=true
        ts={Js.Nullable.toOption(end)}
        onChange={seconds => {
          onTimestampChange(index, (chunk.timestamp->fst, Js.Nullable.fromOption(seconds)))
        }}
      />
    </div>
    {switch splitPreview {
    | Some(splitAt) =>
      // Show split preview - two text blocks
      <div className="flex flex-col gap-2">
        <SplitPreviewText wordChunks splitAt isFirstHalf=true />
        <div className="flex items-center justify-center">
          <div className="flex-1 h-px bg-orange-400/30" />
          <span className="px-2 text-xs text-orange-400">
            <Icons.ScissorsIcon className="size-4" />
          </span>
          <div className="flex-1 h-px bg-orange-400/30" />
        </div>
        <SplitPreviewText wordChunks splitAt isFirstHalf=false />
      </div>
    | None =>
      <textarea
        ref={ReactDOM.Ref.domRef(textAreaRef)}
        readOnly=readonly
        defaultValue={chunk.text}
        key={chunk.text}
        rows={chunk.text === "" ? 2 : 3}
        onBlur={handleBlur}
        onKeyDown={editorInputHandler}
        id={current ? "current-cue-textarea" : ""}
        className={Cx.cx([
          "col-span-2 block w-full resize-none rounded-lg border-none bg-white/10 py-1.5 px-3 text-sm/6 text-white",
          "focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400",
        ])}
      />
    }}
    {if chunk.text === "" && !showSplitPreview {
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
      React.null
    }}
    {!readonly
      ? <AddCueMenu
          hasPauseBefore
          hasPauseAfter
          wordChunks
          onAddBefore
          onAddAfter
          onSplit
          onSplitPreviewChange
        />
      : React.null}
  </div>
})
