type decodeInput = {
  dataUri: string,
  canvas: Dom.element,
  setStatus: string => unit,
}

@module("./Decode?worker") @val external start: decodeInput => unit = "start"
