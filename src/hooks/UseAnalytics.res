type logOptions = {
  props?: Js.Json.t,
  callback?: unit => unit,
}

@module("./useAnalytics")
external log: (string, ~options: logOptions=?) => unit = "log"

@module("./useAnalytics")
external logException: (exn, ~info: 'a=?) => unit = "logException"
