open Test

// Removes dots and commas from word boundaries
test("removes trailing comma and dot", () => {
  Assert.stringEqual(Utils.TextUtils.stripPunctuation("Hello, world."), "Hello world")
})

test("removes leading and trailing dots", () => {
  Assert.stringEqual(Utils.TextUtils.stripPunctuation("...Hello world..."), "Hello world")
})

test("removes multiple commas", () => {
  Assert.stringEqual(Utils.TextUtils.stripPunctuation("one, two, three,"), "one two three")
})

// Preserves other punctuation
test("preserves question and exclamation marks", () => {
  Assert.stringEqual(Utils.TextUtils.stripPunctuation("What?!"), "What?!")
})

test("preserves apostrophes in contractions", () => {
  Assert.stringEqual(Utils.TextUtils.stripPunctuation("don't, won't, can't."), "don't won't can't")
})

test("preserves mixed punctuation at end", () => {
  Assert.stringEqual(Utils.TextUtils.stripPunctuation("Wait, what?!"), "Wait what?!")
})

// Edge cases
test("handles empty string", () => {
  Assert.stringEqual(Utils.TextUtils.stripPunctuation(""), "")
})

test("handles only dots and commas", () => {
  Assert.stringEqual(Utils.TextUtils.stripPunctuation(".,. ,.,"), "")
})

test("handles extra spaces with punctuation", () => {
  Assert.stringEqual(Utils.TextUtils.stripPunctuation("Hello ... world"), "Hello world")
})
