module Field = {
  @react.component @module("@headlessui/react")
  external make: (~className: string=?, ~children: React.element) => React.element = "Field"
}

module Label = {
  module HeadlessLabel = {
    @react.component @module("@headlessui/react")
    external make: (
      @as("htmlFor") ~forId: string=?,
      ~className: string=?,
      ~children: React.element,
    ) => React.element = "Label"
  }

  @react.component
  let make = (~forId=?, ~children: React.element, ~className: option<string>=?) => {
    <HeadlessLabel
      ?forId
      className={Cx.cx(["text-sm/6 ml-1.5 font-medium text-white", className->Option.getOr("")])}>
      {children}
    </HeadlessLabel>
  }
}

type position = Left | Right

let isActiveElement: Webapi.Dom.HtmlInputElement.t => bool = %raw(`
  function(input) {
    return document.activeElement === input;
  }
`)

let debounceDelay = 150

@react.component
let make = (
  ~value: int,
  ~onChange: int => unit,
  ~label: string,
  ~min: int=0,
  ~max: int=999,
  ~step: int=1,
  ~className: string="",
  ~labelHidden: bool=false,
  ~adornment: option<React.element>=?,
  ~adornmentPosition: position=Left,
  ~adornmentClassName: string="",
) => {
  let inputRef = React.useRef(Js.Nullable.null)
  let id = React.useId()

  let stableOnChange = Hooks.useEvent(onChange)
  let debouncedOnChange = ReactDebounce.useDebounced(stableOnChange, ~wait=debounceDelay)

  // imporotant to not reset the value if the input is focused and being edited
  React.useEffect1(() => {
    inputRef.current
    ->Js.Nullable.toOption
    ->Option.flatMap(Webapi.Dom.HtmlInputElement.ofElement)
    ->Option.forEach(input => {
      if !isActiveElement(input) {
        input->Webapi.Dom.HtmlInputElement.setValue(value->Int.toString)
      }
    })
    None
  }, [value])

  let handleChange = (e: JsxEvent.Form.t) => {
    let inputValue = JsxEvent.Form.currentTarget(e)["value"]
    switch Int.fromString(inputValue) {
    | Some(newValue) if newValue >= min && newValue <= max => debouncedOnChange(newValue)
    | _ => () // Invalid or out of range - let user keep typing
    }
  }

  let handleBlur = React.useCallback1(e => {
    let inputValue = ReactEvent.Focus.currentTarget(e)["value"]
    switch Int.fromString(inputValue) {
    | Some(newValue) =>
      // Clamp to min/max
      let clampedValue = Math.Int.max(Math.Int.min(newValue, max), min)
      stableOnChange(clampedValue)
      // Update input to show clamped value
      inputRef.current
      ->Js.Nullable.toOption
      ->Option.flatMap(Webapi.Dom.HtmlInputElement.ofElement)
      ->Option.forEach(input => {
        input->Webapi.Dom.HtmlInputElement.setValue(clampedValue->Int.toString)
      })
    | None =>
      // Invalid input - reset to current value
      inputRef.current
      ->Js.Nullable.toOption
      ->Option.flatMap(Webapi.Dom.HtmlInputElement.ofElement)
      ->Option.forEach(input => {
        input->Webapi.Dom.HtmlInputElement.setValue(value->Int.toString)
      })
    }
  }, [value])

  let handleKeyDown = (e: ReactEvent.Keyboard.t) => {
    if ReactEvent.Keyboard.key(e) === "Enter" {
      ReactEvent.Keyboard.currentTarget(e)["blur"]()
    }
  }

  <Field className>
    <Label forId={id} className={Cx.cx([labelHidden ? "sr-only" : "whitespace-nowrap"])}>
      {React.string(label)}
    </Label>
    <div className="relative rounded-lg flex">
      {adornment
      ->Option.map(adornment => {
        <div
          className={Cx.cx([
            adornmentClassName,
            "absolute m-1 px-2 inset-y-0 flex justify-center items-center",
            switch adornmentPosition {
            | Right => "right-0"
            | Left => "left-0"
            },
          ])}>
          {adornment}
        </div>
      })
      ->Option.getOr(React.null)}
      <input
        id
        ref={ReactDOM.Ref.domRef(inputRef)}
        type_="number"
        min={min->Int.toString}
        max={max->Int.toString}
        step={step->Float.fromInt}
        defaultValue={value->Int.toString}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={Cx.cx([
          "block w-full rounded-lg border-none bg-white/10 py-1.5 px-3 text-sm/6 text-white focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400",
          switch (adornment, adornmentPosition) {
          | (Some(_), Right) => "pr-12"
          | (Some(_), Left) => "pl-12"
          | _ => ""
          },
        ])}
      />
    </div>
  </Field>
}

// Float version for opacity, scale, etc.
module Float = {
  @react.component
  let make = (
    ~value: float,
    ~onChange: float => unit,
    ~label: string,
    ~min: float=0.0,
    ~max: float=1.0,
    ~step: float=0.1,
    ~className: string="",
    ~labelHidden: bool=false,
    ~adornment: option<React.element>=?,
    ~adornmentPosition: position=Left,
    ~adornmentClassName: string="",
  ) => {
    let id = React.useId()
    let inputRef = React.useRef(Js.Nullable.null)
    let stableOnChange = Hooks.useEvent(onChange)
    let debouncedOnChange = ReactDebounce.useDebounced(stableOnChange, ~wait=debounceDelay)

    React.useEffect1(() => {
      inputRef.current
      ->Js.Nullable.toOption
      ->Option.flatMap(Webapi.Dom.HtmlInputElement.ofElement)
      ->Option.forEach(input => {
        if !isActiveElement(input) {
          input->Webapi.Dom.HtmlInputElement.setValue(value->Float.toString)
        }
      })
      None
    }, [value])

    let handleChange = (e: JsxEvent.Form.t) => {
      let inputValue = JsxEvent.Form.currentTarget(e)["value"]
      // Only update if valid float within range
      switch Float.fromString(inputValue) {
      | Some(newValue) if newValue >= min && newValue <= max => debouncedOnChange(newValue)
      | _ => () // Invalid or out of range - let user keep typing
      }
    }

    let handleBlur = React.useCallback1(e => {
      let inputValue = ReactEvent.Focus.currentTarget(e)["value"]
      switch Float.fromString(inputValue) {
      | Some(newValue) =>
        let clampedValue = newValue->Math.max(min)->Math.min(max)
        stableOnChange(clampedValue)
        inputRef.current
        ->Js.Nullable.toOption
        ->Option.flatMap(Webapi.Dom.HtmlInputElement.ofElement)
        ->Option.forEach(input => {
          input->Webapi.Dom.HtmlInputElement.setValue(clampedValue->Float.toString)
        })
      | None =>
        inputRef.current
        ->Js.Nullable.toOption
        ->Option.flatMap(Webapi.Dom.HtmlInputElement.ofElement)
        ->Option.forEach(input => {
          input->Webapi.Dom.HtmlInputElement.setValue(value->Float.toString)
        })
      }
    }, [value])

    let handleKeyDown = (e: ReactEvent.Keyboard.t) => {
      if ReactEvent.Keyboard.key(e) === "Enter" {
        ReactEvent.Keyboard.currentTarget(e)["blur"]()
      }
    }

    <Field className>
      <Label forId={id} className={Cx.cx([labelHidden ? "sr-only" : "whitespace-nowrap"])}>
        {React.string(label)}
      </Label>
      <div className="relative rounded-lg flex">
        {adornment
        ->Option.map(adornment => {
          <div
            className={Cx.cx([
              adornmentClassName,
              "absolute m-1 px-2 inset-y-0 flex justify-center items-center",
              switch adornmentPosition {
              | Right => "right-0"
              | Left => "left-0"
              },
            ])}>
            {adornment}
          </div>
        })
        ->Option.getOr(React.null)}
        <input
          id
          ref={ReactDOM.Ref.domRef(inputRef)}
          type_="number"
          min={min->Float.toString}
          max={max->Float.toString}
          step
          defaultValue={value->Float.toString}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={Cx.cx([
            "block w-full rounded-lg border-none bg-white/10 py-1.5 px-3 text-sm/6 text-white focus:outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400",
            switch (adornment, adornmentPosition) {
            | (Some(_), Right) => "pr-12"
            | (Some(_), Left) => "pl-12"
            | _ => ""
            },
          ])}
        />
      </div>
    </Field>
  }
}
