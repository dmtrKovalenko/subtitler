open Icons

// Video formats
type videoFormat = MP4 | WebM | MOV

// Video codecs
type videoCodec = AVC | HEVC | VP9 | VP8 | AV1

// Audio codecs
type audioCodec = AAC | Opus | MP3 | Vorbis | FLAC

type formatInfo = {
  format: videoFormat,
  label: string,
  extension: string,
  mimeType: string,
  description: string,
  supportedVideoCodecs: array<videoCodec>,
  supportedAudioCodecs: array<audioCodec>,
}

type videoCodecInfo = {
  codec: videoCodec,
  id: string,
  label: string,
  description: string,
}

type audioCodecInfo = {
  codec: audioCodec,
  id: string,
  label: string,
  description: string,
}

let videoCodecFromString = str =>
  switch str {
  | "avc" => Some(AVC)
  | "hevc" => Some(HEVC)
  | "vp9" => Some(VP9)
  | "vp8" => Some(VP8)
  | "av1" => Some(AV1)
  | _ => None
  }

let audioCodecFromString = str =>
  switch str {
  | "aac" => Some(AAC)
  | "opus" => Some(Opus)
  | "mp3" => Some(MP3)
  | "vorbis" => Some(Vorbis)
  | "flac" => Some(FLAC)
  | _ => None
  }

let videoCodecs: array<videoCodecInfo> = [
  {codec: AVC, id: "avc", label: "H.264 (AVC)", description: "Best compatibility"},
  {codec: HEVC, id: "hevc", label: "H.265 (HEVC)", description: "Better compression"},
  {codec: VP9, id: "vp9", label: "VP9", description: "Open standard"},
  {codec: VP8, id: "vp8", label: "VP8", description: "Legacy WebM"},
  {codec: AV1, id: "av1", label: "AV1", description: "Best compression"},
]

let audioCodecs: array<audioCodecInfo> = [
  {codec: AAC, id: "aac", label: "AAC", description: "Best compatibility"},
  {codec: Opus, id: "opus", label: "Opus", description: "Best quality"},
  {codec: MP3, id: "mp3", label: "MP3", description: "Universal"},
  {codec: Vorbis, id: "vorbis", label: "Vorbis", description: "Open standard"},
  {codec: FLAC, id: "flac", label: "FLAC", description: "Lossless"},
]

let formats: array<formatInfo> = [
  {
    format: MP4,
    label: "MP4",
    extension: ".mp4",
    mimeType: "video/mp4",
    description: "Best compatibility",
    supportedVideoCodecs: [AVC, HEVC, VP9, VP8, AV1],
    supportedAudioCodecs: [AAC, Opus, MP3, Vorbis, FLAC],
  },
  {
    format: WebM,
    label: "WebM",
    extension: ".webm",
    mimeType: "video/webm",
    description: "Smaller file size",
    supportedVideoCodecs: [VP9, VP8, AV1],
    supportedAudioCodecs: [Opus, Vorbis],
  },
  {
    format: MOV,
    label: "MOV",
    extension: ".mov",
    mimeType: "video/quicktime",
    description: "Apple devices",
    supportedVideoCodecs: [AVC, HEVC, VP9, VP8, AV1],
    supportedAudioCodecs: [AAC, Opus, MP3, Vorbis, FLAC],
  },
]

let formatToString = format =>
  switch format {
  | MP4 => "mp4"
  | WebM => "webm"
  | MOV => "mov"
  }

let videoCodecToString = codec =>
  switch codec {
  | AVC => "avc"
  | HEVC => "hevc"
  | VP9 => "vp9"
  | VP8 => "vp8"
  | AV1 => "av1"
  }

let audioCodecToString = codec =>
  switch codec {
  | AAC => "aac"
  | Opus => "opus"
  | MP3 => "mp3"
  | Vorbis => "vorbis"
  | FLAC => "flac"
  }

let formatToLabel = format =>
  formats->Array.find(f => f.format == format)->Option.map(f => f.label)->Option.getOr("Unknown")

let videoCodecToLabel = codec =>
  videoCodecs->Array.find(c => c.codec == codec)->Option.map(c => c.label)->Option.getOr("Unknown")

let audioCodecToLabel = codec =>
  audioCodecs->Array.find(c => c.codec == codec)->Option.map(c => c.label)->Option.getOr("Unknown")

let getFormatInfo = format => formats->Array.find(f => f.format == format)

let getDefaultVideoCodec = format =>
  switch format {
  | MP4 => AVC
  | MOV => AVC
  | WebM => VP9
  }

let getDefaultAudioCodec = format =>
  switch format {
  | MP4 => AAC
  | MOV => AAC
  | WebM => Opus
  }

let getSupportedVideoCodecs = format =>
  formats
  ->Array.find(f => f.format == format)
  ->Option.map(f => f.supportedVideoCodecs)
  ->Option.getOr([])

let getSupportedAudioCodecs = format =>
  formats
  ->Array.find(f => f.format == format)
  ->Option.map(f => f.supportedAudioCodecs)
  ->Option.getOr([])

type exportSettings = {
  format: videoFormat,
  videoCodec: videoCodec,
  audioCodec: audioCodec,
}

let makeDefaultSettings = () => {
  format: MP4,
  videoCodec: AVC,
  audioCodec: AAC,
}

let settingsToLabel = (settings: exportSettings) => {
  let formatLabel = formatToLabel(settings.format)
  let videoLabel = videoCodecToLabel(settings.videoCodec)
  `${formatLabel} / ${videoLabel}`
}

module FormatSelector = {
  @react.component
  let make = (~selectedFormat, ~onFormatChange) => {
    <div className="space-y-1">
      <DropdownMenu.Label className="text-xs text-gray-400">
        {"Container"->React.string}
      </DropdownMenu.Label>
      <DropdownMenu.RadioGroup
        value={formatToString(selectedFormat)}
        onValueChange={value => {
          switch value {
          | "mp4" => onFormatChange(MP4)
          | "webm" => onFormatChange(WebM)
          | "mov" => onFormatChange(MOV)
          | _ => ()
          }
        }}>
        {formats
        ->Array.map(formatInfo =>
          <DropdownMenu.RadioItem
            key={formatInfo.extension} value={formatToString(formatInfo.format)}>
            <span className="flex items-center justify-between w-full">
              <span className="flex items-center">
                {selectedFormat == formatInfo.format
                  ? <CheckIcon className="mr-2 h-4 w-4 text-orange-400" />
                  : <span className="mr-2 h-4 w-4" />}
                {formatInfo.label->React.string}
              </span>
              <span className="text-xs text-gray-400 ml-4">
                {formatInfo.description->React.string}
              </span>
            </span>
          </DropdownMenu.RadioItem>
        )
        ->React.array}
      </DropdownMenu.RadioGroup>
    </div>
  }
}

module VideoCodecSelector = {
  @react.component
  let make = (
    ~selectedFormat,
    ~selectedCodec,
    ~onCodecChange,
    ~browserSupportedCodecs: array<string>,
  ) => {
    let formatSupportedCodecs = getSupportedVideoCodecs(selectedFormat)
    // Filter by both format support AND browser support
    let availableCodecs =
      videoCodecs->Array.filter(c =>
        formatSupportedCodecs->Array.includes(c.codec) &&
          browserSupportedCodecs->Array.includes(c.id)
      )

    <div className="space-y-1">
      <DropdownMenu.Label className="text-xs text-gray-400">
        {"Video Codec"->React.string}
      </DropdownMenu.Label>
      {if Array.length(availableCodecs) == 0 {
        <div className="px-2 py-1 text-xs text-gray-500 italic">
          {"No supported codecs found"->React.string}
        </div>
      } else {
        <DropdownMenu.RadioGroup
          value={videoCodecToString(selectedCodec)}
          onValueChange={value => {
            videoCodecFromString(value)->Option.forEach(onCodecChange)
          }}>
          {availableCodecs
          ->Array.map(codecInfo =>
            <DropdownMenu.RadioItem key={codecInfo.id} value={codecInfo.id}>
              <span className="flex items-center justify-between w-full">
                <span className="flex items-center">
                  {selectedCodec == codecInfo.codec
                    ? <CheckIcon className="mr-2 h-4 w-4 text-orange-400" />
                    : <span className="mr-2 h-4 w-4" />}
                  {codecInfo.label->React.string}
                </span>
                <span className="text-xs text-gray-400 ml-4">
                  {codecInfo.description->React.string}
                </span>
              </span>
            </DropdownMenu.RadioItem>
          )
          ->React.array}
        </DropdownMenu.RadioGroup>
      }}
    </div>
  }
}

module AudioCodecSelector = {
  @react.component
  let make = (
    ~selectedFormat,
    ~selectedCodec,
    ~onCodecChange,
    ~browserSupportedCodecs: array<string>,
  ) => {
    let formatSupportedCodecs = getSupportedAudioCodecs(selectedFormat)
    // Filter by both format support AND browser support
    let availableCodecs =
      audioCodecs->Array.filter(c =>
        formatSupportedCodecs->Array.includes(c.codec) &&
          browserSupportedCodecs->Array.includes(c.id)
      )

    <div className="space-y-1">
      <DropdownMenu.Label className="text-xs text-gray-400">
        {"Audio Codec"->React.string}
      </DropdownMenu.Label>
      {if Array.length(availableCodecs) == 0 {
        <div className="px-2 py-1 text-xs text-gray-500 italic">
          {"No supported codecs found"->React.string}
        </div>
      } else {
        <DropdownMenu.RadioGroup
          value={audioCodecToString(selectedCodec)}
          onValueChange={value => {
            audioCodecFromString(value)->Option.forEach(onCodecChange)
          }}>
          {availableCodecs
          ->Array.map(codecInfo =>
            <DropdownMenu.RadioItem key={codecInfo.id} value={codecInfo.id}>
              <span className="flex items-center justify-between w-full">
                <span className="flex items-center">
                  {selectedCodec == codecInfo.codec
                    ? <CheckIcon className="mr-2 h-4 w-4 text-orange-400" />
                    : <span className="mr-2 h-4 w-4" />}
                  {codecInfo.label->React.string}
                </span>
                <span className="text-xs text-gray-400 ml-4">
                  {codecInfo.description->React.string}
                </span>
              </span>
            </DropdownMenu.RadioItem>
          )
          ->React.array}
        </DropdownMenu.RadioGroup>
      }}
    </div>
  }
}

@react.component
let make = (
  ~settings: exportSettings,
  ~onSettingsChange,
  ~onRender,
  ~sideOffset,
  ~align,
  ~children,
) => {
  let supportedCodecs = UseSupportedCodecs.useSupportedCodecs()
  let (isOpen, setIsOpen) = React.useState(() => false)

  let handleFormatChange = format => {
    // When format changes, ensure codecs are compatible
    let formatVideoCodecs = getSupportedVideoCodecs(format)
    let formatAudioCodecs = getSupportedAudioCodecs(format)

    // Check if current video codec is supported by both format and browser
    let newVideoCodec = if (
      formatVideoCodecs->Array.includes(settings.videoCodec) &&
        supportedCodecs.videoCodecs->Array.includes(videoCodecToString(settings.videoCodec))
    ) {
      settings.videoCodec
    } else {
      // Find first codec that's supported by both format and browser
      let firstSupported =
        formatVideoCodecs->Array.find(c =>
          supportedCodecs.videoCodecs->Array.includes(videoCodecToString(c))
        )
      firstSupported->Option.getOr(getDefaultVideoCodec(format))
    }

    // Check if current audio codec is supported by both format and browser
    let newAudioCodec = if (
      formatAudioCodecs->Array.includes(settings.audioCodec) &&
        supportedCodecs.audioCodecs->Array.includes(audioCodecToString(settings.audioCodec))
    ) {
      settings.audioCodec
    } else {
      // Find first codec that's supported by both format and browser
      let firstSupported =
        formatAudioCodecs->Array.find(c =>
          supportedCodecs.audioCodecs->Array.includes(audioCodecToString(c))
        )
      firstSupported->Option.getOr(getDefaultAudioCodec(format))
    }

    onSettingsChange({
      format,
      videoCodec: newVideoCodec,
      audioCodec: newAudioCodec,
    })
  }

  let handleVideoCodecChange = videoCodec => {
    onSettingsChange({...settings, videoCodec})
  }

  let handleAudioCodecChange = audioCodec => {
    onSettingsChange({...settings, audioCodec})
  }

  let handleRenderClick = () => {
    setIsOpen(_ => false)
    onRender()
  }

  <DropdownMenu.Root open_=isOpen onOpenChange={isOpenValue => setIsOpen(_ => isOpenValue)}>
    <DropdownMenu.Trigger asChild=true> {children} </DropdownMenu.Trigger>
    <DropdownMenu.Content sideOffset align className="w-80">
      <DropdownMenu.Label className="text-xl"> {"Export Video"->React.string} </DropdownMenu.Label>
      <DropdownMenu.Label className="text-sm text-gray-400 -mt-1.5 !font-normal">
        {"This will render subtitled video locally using your browser and save it on the disc. Codecs and containers support here is managed by your browser."->React.string}
      </DropdownMenu.Label>
      {if supportedCodecs.loading {
        <div className="px-2 py-1 text-xs text-gray-400">
          {"Detecting supported codecs..."->React.string}
        </div>
      } else {
        React.null
      }}
      <DropdownMenu.Separator />
      <FormatSelector selectedFormat=settings.format onFormatChange=handleFormatChange />
      <DropdownMenu.Separator />
      <VideoCodecSelector
        selectedFormat=settings.format
        selectedCodec=settings.videoCodec
        onCodecChange=handleVideoCodecChange
        browserSupportedCodecs=supportedCodecs.videoCodecs
      />
      <DropdownMenu.Separator />
      <AudioCodecSelector
        selectedFormat=settings.format
        selectedCodec=settings.audioCodec
        onCodecChange=handleAudioCodecChange
        browserSupportedCodecs=supportedCodecs.audioCodecs
      />
      <DropdownMenu.Separator />
      <div className="p-2">
        <button
          onClick={_ => handleRenderClick()}
          disabled={supportedCodecs.loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          <RenderIcon className="size-5" />
          {"RENDER & DOWNLOAD"->React.string}
        </button>
      </div>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
}
