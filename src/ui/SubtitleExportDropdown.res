open Icons

@module("../utils/subtitleExport")
external exportToSRT: (array<'a>, string) => Promise.t<unit> = "exportToSRT"
@module("../utils/subtitleExport")
external exportToVTT: (array<'a>, string) => Promise.t<unit> = "exportToVTT"

type exportFormat = SRT | VTT

@react.component
let make = (~subtitles, ~sideOffset, ~align, ~videoFileName, ~children, ~className="") => {
  let handleExport = format => {
    switch format {
    | SRT =>
      subtitles
      ->exportToSRT(videoFileName)
      ->Promise.catch(err => {
        UseAnalytics.logException(err)
        Promise.resolve()
      })
      ->ignore
    | VTT =>
      subtitles
      ->exportToVTT(videoFileName)
      ->Promise.catch(err => {
        UseAnalytics.logException(err)
        Promise.resolve()
      })
      ->ignore
    }
  }

  // Don't render if no subtitles available
  if Array.length(subtitles) === 0 {
    React.null
  } else {
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild=true> {children} </DropdownMenu.Trigger>
      <DropdownMenu.Content sideOffset align>
        <DropdownMenu.Label> {"Export as"->React.string} </DropdownMenu.Label>
        <DropdownMenu.Item onClick={() => handleExport(SRT)}>
          <span className="flex items-center">
            <ChatBubbleIcon className="mr-2 h-4 w-4" />
            {"SRT Format"->React.string}
          </span>
        </DropdownMenu.Item>
        <DropdownMenu.Item onClick={() => handleExport(VTT)}>
          <span className="flex items-center">
            <ChatBubbleIcon className="mr-2 h-4 w-4" />
            {"WebVTT Format"->React.string}
          </span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  }
}
