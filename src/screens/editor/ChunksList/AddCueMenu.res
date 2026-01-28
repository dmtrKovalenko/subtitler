// AddCueMenu.res - FAB button with dropdown menu for adding/splitting cues

@react.component
let make = (
  ~hasPauseBefore: bool,
  ~hasPauseAfter: bool,
  ~wordChunks: array<WordTimestamps.wordChunk>,
  ~onAddBefore: unit => unit,
  ~onAddAfter: unit => unit,
  ~onSplit: int => unit,
  ~onSplitPreviewChange: option<int> => unit,
) => {
  let (isOpen, setIsOpen) = React.useState(_ => false)
  let (splitPreview, setSplitPreview) = React.useState(_ => None)

  let wordCount = Array.length(wordChunks)
  let canSplit = wordCount >= 2

  // Reset preview when dropdown closes
  React.useEffect1(() => {
    if !isOpen {
      setSplitPreview(_ => None)
      onSplitPreviewChange(None)
    }
    None
  }, [isOpen])

  // Update parent with preview changes
  React.useEffect1(() => {
    onSplitPreviewChange(splitPreview)
    None
  }, [splitPreview])

  <DropdownMenu.Root open_=isOpen onOpenChange={v => setIsOpen(_ => v)}>
    <DropdownMenu.Trigger asChild=true>
      <button
        type_="button"
        className="absolute -bottom-4 right-1 rounded-full bg-zinc-900 border-2 border-orange-500 p-2 shadow-lg transition-all opacity-0 scale-90 group-focus-within:opacity-100 group-focus-within:scale-100 hover:scale-115 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 z-50">
        <Icons.AdjustmentsVerticalIcon className="size-5 text-orange-500" />
      </button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content sideOffset={8} align=#end>
      <DropdownMenu.Label> {React.string("Add or split cue")} </DropdownMenu.Label>
      // Add cue BEFORE
      <DropdownMenu.Item
        onClick={_ => {
          onAddBefore()
          setIsOpen(_ => false)
        }}
        disabled={!hasPauseBefore}>
        <span className="flex items-center gap-2">
          <Icons.ArrowUpLeftIcon className="size-4" />
          {React.string("Add cue before")}
        </span>
      </DropdownMenu.Item>
      {!hasPauseBefore
        ? <div className="px-3 py-1 text-xs text-zinc-500">
            {React.string("No pause gap available")}
          </div>
        : React.null}
      // Add cue AFTER
      <DropdownMenu.Item
        onClick={_ => {
          onAddAfter()
          setIsOpen(_ => false)
        }}
        disabled={!hasPauseAfter}>
        <span className="flex items-center gap-2">
          <Icons.ArrowDownLeftIcon className="size-4" />
          {React.string("Add cue after")}
        </span>
      </DropdownMenu.Item>
      {!hasPauseAfter
        ? <div className="px-3 py-1 text-xs text-zinc-500">
            {React.string("No pause gap available")}
          </div>
        : React.null}
      <DropdownMenu.Separator />
      // Split current cue by words
      {canSplit
        ? <>
            <DropdownMenu.Label>
              <span className="flex items-center gap-2">
                <Icons.ScissorsIcon className="size-4" />
                {React.string("Split current cue")}
              </span>
            </DropdownMenu.Label>
            <div className="flex flex-col gap-2 p-3 min-w-48">
              <Slider
                value={splitPreview->Option.getOr(wordCount / 2)}
                min={1}
                max={wordCount}
                step={1}
                onValueChange={v => setSplitPreview(_ => Some(v))}
              />
              <button
                type_="button"
                onClick={_ => {
                  onSplit(splitPreview->Option.getOr(wordCount / 2))
                  setIsOpen(_ => false)
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium transition-colors">
                {React.string("Split")}
              </button>
            </div>
          </>
        : <div className="px-3 py-2 text-xs text-zinc-500">
            {React.string("Need at least 2 words to split")}
          </div>}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
}
