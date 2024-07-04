module AudioParam = {
  type t

  @get external getDefaultValue: t => float = "defaultValue"

  @get external getMaxValue: t => float = "maxValue"

  @get external getMinValue: t => float = "minValue"

  @get external getValue: t => float = "value"

  @set external setValue: (t, float) => unit = "value"

  @send external setValueAtTime: (t, ~value: float, ~startTime: float) => unit = "setValueAtTime"

  @send
  external linearRampToValueAtTime: (t, ~value: float, ~endTime: float) => t =
    "linearRampToValueAtTime"

  @send
  external exponentialRampToValueAtTime: (t, ~value: float, ~endTime: float) => t =
    "exponentialRampToValueAtTime"

  @send
  external setTargetAtTime: (t, ~target: float, ~startTime: float, ~timeConstant: float) => t =
    "setTargetAtTime"

  @send
  external setValueCurveAtTime: (
    t,
    ~values: array<float>,
    ~startTime: float,
    ~duration: float,
  ) => t = "SetValueCurveAtTime"

  @send external cancelScheduledValues: (t, ~startTime: float) => t = "cancelScheduledValues"

  @send external cancelAndHoldAtTime: (t, ~cancelTime: float) => t = "cancelAndHoldAtTime"
}

@genType
module AudioBuffer = {
  @genType.import("webaudio") @genType.as("AudioBuffer")
  type t

  @get external getDuration: t => float = "duration"
  @get external getLength: t => int = "length"
  @get external getNumberOfChannels: t => int = "numberOfChannels"
  @get external getSampleRate: t => int = "sampleRate"
  @send external getChannelData: (t, int) => Float32Array.t = "getChannelData"
}

module AudioNode = {
  type t = {"gain": {@set "value": float}}

  @send external connect: (t, t) => unit = "connect"
  @send external disconnect: t => unit = "disconnect"
  @get external getNumberOfInputs: t => int = "numberOfInputs"

  @get external getGain: t => AudioParam.t = "gain"
  @set external setGainLevel: (t, float) => unit = "gain.value"
  @send external start: (t, float) => unit = "start"
  @send external stop: t => unit = "stop"
  @send
  external startWithOffset: (t, ~startTime: float, ~offset: float, ~duration: float) => unit =
    "start"

  @set
  external setBuffer: (t, AudioBuffer.t) => unit = "buffer"

  let setGainValue = (gainNode, ~value, ~startTime) =>
    gainNode->getGain->AudioParam.setValueAtTime(~value, ~startTime)
}

module AudioContext = {
  type t = {
    destination: AudioNode.t,
    currentTime: float,
  }

  @new external create: unit => t = "AudioContext"
  @get external getDestination: t => AudioNode.t = "destination"
  @get external getCurrentTime: t => float = "currentTime"
  @send external createGain: t => AudioNode.t = "createGain"
  @send external createOscillator: t => AudioNode.t = "create"
  @send
  external createMediaElementSource: (t, Dom.element) => AudioNode.t = "createMediaElementSource"
  @send
  external createBufferSource: t => AudioNode.t = "createBufferSource"

  // AudioNode
  @get external fromAudioNode: AudioNode.t => t = "context"
  @send
  external decodeAudioData: ArrayBuffer.t => Js.Promise.t<AudioBuffer.t> = "decodeAudioData"
}
