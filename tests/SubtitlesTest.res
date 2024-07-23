open Test

test("resizeChunks", () => {
  let value = Subtitles.resizeChunks(
    [
      [
        {text: "Hello", id: Some(0.), isInProgress: None, timestamp: (0.0, Value(1.0))},
        {text: " world", id: Some(1.), isInProgress: None, timestamp: (1.0, Value(2.0))},
        {text: " It's", id: Some(1.), isInProgress: None, timestamp: (2.0, Value(3.0))},
        {text: " me", id: Some(1.), isInProgress: None, timestamp: (3.0, Value(4.0))},
        {text: " Mario", id: Some(1.), isInProgress: None, timestamp: (4.0, Value(5.0))},
      ],
    ],
    ~maxSize=10,
  )

  Assert.stringEqual((value->Array.getUnsafe(0)).text->String.trim, "Hello world")
  Assert.stringEqual((value->Array.getUnsafe(1)).text->String.trim, "It's me")
  Assert.stringEqual((value->Array.getUnsafe(2)).text->String.trim, "Mario")
})
