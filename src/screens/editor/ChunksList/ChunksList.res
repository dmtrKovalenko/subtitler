@react.component
let make = React.memo((~subtitles) => {
  <div className="flex flex-col gap-6">
    {subtitles
    ->Array.mapWithIndex((chunk, i) => <ChunkEditor key={i->Int.toString} chunk />)
    ->React.array}
  </div>
})
