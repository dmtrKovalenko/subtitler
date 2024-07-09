open Test

test("parseValidDuration", () => {
  let duration = Utils.Duration.parseMillisInputToSeconds("00:12,000")
  Assert.okEqual(duration, 12.0)
})

test("parseInvalidDuration", () => {
  let duration = Utils.Duration.parseMillisInputToSeconds("0012,000")
  Assert.isErr(duration)
})

test("parseRoundedDuration", () => {
  let duration = Utils.Duration.parseMillisInputToSeconds("00:12,550")
  Assert.okEqual(duration, 12.55)
})

test("formatDuration", () => {
  let duration = Utils.Duration.formatMillis(12.00)
  Assert.stringEqual(duration, "00:12,000")
})

test("formatRoundedDuration", () => {
  let duration = Utils.Duration.formatMillis(12.55)
  Assert.stringEqual(duration, "00:12,550")
})
