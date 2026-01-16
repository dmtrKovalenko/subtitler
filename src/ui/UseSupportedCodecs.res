type supportedCodecs = {
  videoCodecs: array<string>,
  audioCodecs: array<string>,
  loading: bool,
  error: Js.Nullable.t<string>,
}

@module("../hooks/useSupportedCodecs")
external useSupportedCodecs: (~width: int=?, ~height: int=?, unit) => supportedCodecs =
  "useSupportedCodecs"
