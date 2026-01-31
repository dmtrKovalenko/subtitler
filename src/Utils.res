module Array = {
  let last = arr => arr->Belt.Array.get(arr->Array.length - 1)

  @send
  external spliceInPlace: (array<'a>, ~start: int, ~remove: int) => array<'a> = "splice"

  let removeInPlace = (arr, ~index) => spliceInPlace(arr, ~start=index, ~remove=1)
  @new external makeUninitializedUnsafe: int => array<'a> = "Array"
  @set external truncateToLengthUnsafe: (array<'a>, int) => unit = "length"

  let filterMapWithIndex = (a, f) => {
    let l = RescriptCore.Array.length(a)
    let r = makeUninitializedUnsafe(l)
    let j = ref(0)
    for i in 0 to l - 1 {
      let v = Core__Array.getUnsafe(a, i)
      switch f(v, i) {
      | None => ()
      | Some(v) =>
        Core__Array.setUnsafe(r, j.contents, v)
        j.contents = j.contents + 1
      }
    }
    truncateToLengthUnsafe(r, j.contents)
    r
  }
}

module Math = {
  @inline
  let divideFloat = (a, b) => a /. b
  @inline
  let divideInt = (a, b) => a / b
  @inline
  let divideAsFloat = (a, b) => Belt.Float.fromInt(a) /. Belt.Float.fromInt(b)

  @scope("Math") @val
  external floor: float => int = "floor"

  @scope("Math") @val
  external round: float => int = "round"

  @scope("Math") @val
  external maxI: (int, int) => int = "max"

  @scope("Math") @val
  external minI: (int, int) => int = "min"

  let divideWithRemainder = (x, y) => {
    let reminder: float = %raw(`x % y`)

    (Js.Math.floor(x /. y), reminder)
  }

  let minMax = (~min, ~max) => val => {
    val < min ? min : val > max ? max : val
  }
}

module Option = {
  let unwrap = option =>
    switch option {
    | Some(val) => val
    | None => failwith("expect option to contain value")
    }

  let flatten = option =>
    switch option {
    | Some(Some(val)) => Some(val)
    | _ => None
    }
  @inline
  let unwrapOr = (option, default) =>
    switch option {
    | Some(val) => val
    | None => default
    }

  @inline
  let unwrapOrElse = (option, elseFn) =>
    switch option {
    | Some(val) => Some(val)
    | None => elseFn()
    }

  let some = val => Some(val)

  let zip = (a, b) => {
    switch (a, b) {
    | (Some(a), Some(b)) => Some((a, b))
    | _ => None
    }
  }
}

module Log = {
  let logU = a => Js.Console.log(a)
  let logU2 = (a, b) => Js.Console.log2(a, b)

  let andReturn = a => {
    Js.Console.log(a)
    a
  }
  let andReturn2 = (a, b) => {
    Js.Console.log2(a, b)
    a
  }
}

module Path = {
  let getFilename = path => {
    Js.String.replaceByRe(%re("/^.*[\\\/]/"), "", path)
  }
}

module TextUtils = {
  /**
   * Trims only dots and commas from the start and end of each word.
   * Preserves all other punctuation like ?, !, apostrophes, etc.
   * Example: "Hello, world..." -> "Hello world"
   * Example: "What's up?" -> "What's up?"
   * Example: "don't stop!" -> "don't stop!"
   */
  @genType
  let stripPunctuation = (text: string): string => {
    text
    ->String.splitByRegExp(%re("/\s+/"))
    ->Core__Array.filterMap(word => word)
    ->Core__Array.map(word => {
      // Trim dots and commas from start and end only
      word
      ->String.replaceRegExp(%re("/^[.,]+/g"), "")
      ->String.replaceRegExp(%re("/[.,]+$/g"), "")
    })
    ->Core__Array.filter(word => String.length(word) > 0)
    ->Core__Array.join(" ")
  }
}

module Bool = {
  @inline
  let invert = a => !a
  let then = a => a ? Some() : None
}

module Duration = {
  let leftPad = n =>
    n > 9.49
      ? n->Js.Float.toFixedWithPrecision(~digits=0)
      : `0${n->Js.Float.toFixedWithPrecision(~digits=0)}`

  let formatSeconds = seconds => {
    let (hours, reminder) = Math.divideWithRemainder(seconds, 3600.)
    let (minutes, seconds) = Math.divideWithRemainder(reminder, 60.)
    let hours = Belt.Int.toFloat(hours)
    let minutes = Belt.Int.toFloat(minutes)

    if hours > 1.0 {
      `${hours->leftPad}:${minutes->leftPad}:${seconds->leftPad}`
    } else {
      `${minutes->leftPad}:${seconds->leftPad}`
    }
  }

  let formatMillis = timestamp => {
    let (minutes, rawSeconds) = Math.divideWithRemainder(timestamp, 60.)
    let seconds = rawSeconds->Js.Math.floor_float
    let millis = (rawSeconds -. seconds) *. 1000.

    // outputs 00:00,000
    `${minutes->Int.toString->String.padStart(2, "0")}:${seconds
      ->Float.toFixed(~digits=0)
      ->String.padStart(2, "0")},${millis
      ->Float.toFixed(~digits=0)
      ->String.padStart(3, "0")}`
  }

  // parses 00:00,000 string and outputs seconds
  let parseMillisInputToSecondsTimestampString = timestamp => {
    let minutesString = timestamp->String.slice(~start=0, ~end=2)
    let secondsString = timestamp->String.slice(~start=3, ~end=5)
    let millisString = timestamp->String.slice(~start=6, ~end=9)

    switch (
      Float.fromString(minutesString),
      Float.fromString(secondsString),
      Float.fromString(millisString),
    ) {
    | (Some(minutes), Some(seconds), Some(millis)) =>
      let totalSeconds = minutes *. 60. +. seconds +. millis /. 1000.
      Ok(totalSeconds)
    | _ => Error("Invalid timestamp format")
    }
  }

  let parseMillisInputToSeconds = inputStr => {
    if inputStr->String.length !== 9 {
      Error("Input string is not completed")
    } else {
      parseMillisInputToSecondsTimestampString(inputStr)
    }
  }

  let formatFrame = (frame, fps) => {
    Math.divideAsFloat(frame, fps)->formatSeconds
  }
}

let neverRerender = React.memoCustomCompareProps(_, (_, _) => true)
