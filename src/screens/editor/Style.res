open Types

type align = Left | Center | Right

type fontWeight =
  | @as(100) Thin
  | @as(200) ExtraLight
  | @as(300) Light
  | @as(400) Regular
  | @as(500) Medium
  | @as(600) SemiBold
  | @as(700) Bold
  | @as(800) ExtraBold
  | @as(900) Black

let all_font_weights = [Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black]

type size = {
  width: int,
  height: int,
}

@genType
type background = {
  color: string,
  strokeColor: option<string>,
  strokeWidth: int,
  opacity: float,
  paddingX: int,
  paddingY: int,
  borderRadius: int,
}

@genType
type wordAnimationBackground = {
  color: string,
  opacity: float,
  paddingX: int,
  paddingY: int,
  borderRadius: int,
}

@genType
type wordAnimationFont = {
  color: option<string>,
  fontWeight: option<fontWeight>,
}

@genType
type wordAnimationPop = {scale: float} // 1.0 - 1.2 range

@genType
type wordAnimation = {
  // Background highlight for active word
  enableBackground: bool,
  background: wordAnimationBackground,
  // Font styling for active word
  enableFont: bool,
  font: wordAnimationFont,
  // Pop/scale effect for active word
  enablePop: bool,
  pop: wordAnimationPop,
  // Slide effect - background slides smoothly between words
  enableSlide: bool,
}

@genType
type style = {
  x: int,
  y: int,
  fontFamily: string,
  fontWeight: fontWeight,
  fontSizePx: int,
  color: string,
  strokeColor: option<string>,
  strokeWidth: int,
  align: align,
  blockSize: size,
  fontVariants: array<fontWeight>,
  showBackground: bool,
  background: background,
  showWordAnimation: bool,
  wordAnimation: wordAnimation,
  // Hide punctuation from rendered subtitles (preserves in source for resizing)
  hidePunctuation: bool,
}

@genType
type changeStyleAction =
  | ResetFontVariants
  | Resize(size)
  | SetAlign(align)
  | SetBackground(background)
  | SetBlockHeight(int)
  | SetBlockWidth(int)
  | SetColor(string)
  | SetFontFamily(string)
  | SetFontSizePx(int)
  | SetFontVariants(array<fontWeight>)
  | SetFontWeight(fontWeight)
  | SetPosition(int, int)
  | SetStrokeColor(string)
  | SetStrokeWidth(int)
  | ToggleBackground
  | ToggleWordAnimation
  | SetWordAnimation(wordAnimation)
  | ToggleHidePunctuation

let defaultBackground: background = {
  color: "#000000",
  opacity: 0.5,
  paddingY: 16,
  paddingX: 16,
  strokeWidth: 1,
  strokeColor: None,
  borderRadius: 32,
}

let defaultWordAnimationBackground: wordAnimationBackground = {
  color: "#f97316", // Orange
  opacity: 1.0,
  paddingX: 6,
  paddingY: 4,
  borderRadius: 4,
}

let defaultWordAnimationFont: wordAnimationFont = {
  color: None,
  fontWeight: None,
}

let defaultWordAnimationPop: wordAnimationPop = {
  scale: 1.15,
}

let defaultWordAnimation: wordAnimation = {
  enableBackground: true,
  background: defaultWordAnimationBackground,
  // Font - enabled by default but matches the color of main subtitles
  enableFont: true,
  font: defaultWordAnimationFont,
  enableSlide: true,
  enablePop: false,
  pop: defaultWordAnimationPop,
}

// Persistable style preferences (excludes video-dependent properties like blockSize)
@genType
type stylePreferences = {
  fontFamily: string,
  fontWeight: fontWeight,
  fontSizePx: int,
  color: string,
  strokeColor: option<string>,
  strokeWidth: int,
  align: align,
  showBackground: bool,
  background: background,
  showWordAnimation: bool,
  wordAnimation: wordAnimation,
  hidePunctuation: bool,
  // Position with video dimensions for conditional restore
  x: option<int>,
  y: option<int>,
  videoWidth: option<int>,
  videoHeight: option<int>,
}

let defaultPreferences: stylePreferences = {
  fontFamily: "Inter",
  fontWeight: Regular,
  fontSizePx: 0, // Will be overridden by video-dependent calculation
  color: "#ffffff",
  strokeColor: None,
  strokeWidth: 1,
  align: Center,
  showBackground: false,
  background: defaultBackground,
  showWordAnimation: false,
  wordAnimation: defaultWordAnimation,
  hidePunctuation: true,
  x: None,
  y: None,
  // we store the video x and y was set for to only restore position
  // if video dimensions matches on load
  videoWidth: None,
  videoHeight: None,
}

let stylePreferencesStorageKey = "subtitler.stylePreferences"
let stylePreferencesVersion = 5

let loadStylePreferences = (): option<stylePreferences> => {
  open Dom.Storage2

  let storedState = localStorage->getItem(stylePreferencesStorageKey)
  let storedVersion =
    localStorage
    ->getItem(stylePreferencesStorageKey ++ ".version")
    ->Option.flatMap(val => Int.fromString(val, ~radix=10))

  switch (storedState, storedVersion) {
  | (Some(storedState), Some(storedVersion)) if storedVersion == stylePreferencesVersion =>
    try {
      Some(storedState->JSON.parseExn->Obj.magic)
    } catch {
    | _ => None
    }
  | _ => None
  }
}

let saveStylePreferences = (style: style, ~videoWidth: int, ~videoHeight: int) => {
  open Dom.Storage2

  let prefs: stylePreferences = {
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontSizePx: style.fontSizePx,
    color: style.color,
    strokeColor: style.strokeColor,
    strokeWidth: style.strokeWidth,
    align: style.align,
    showBackground: style.showBackground,
    background: style.background,
    showWordAnimation: style.showWordAnimation,
    wordAnimation: style.wordAnimation,
    hidePunctuation: style.hidePunctuation,
    x: Some(style.x),
    y: Some(style.y),
    videoWidth: Some(videoWidth),
    videoHeight: Some(videoHeight),
  }

  localStorage->setItem(
    stylePreferencesStorageKey,
    prefs->Obj.magic->JSON.stringifyAny->Option.getOr(""),
  )
  localStorage->setItem(
    stylePreferencesStorageKey ++ ".version",
    string_of_int(stylePreferencesVersion),
  )
}

module type StyleObservable = UseObservable.Observable
  with type t = style
  and type action = changeStyleAction

module MakeRendererObservable = (Ctx: Ctx) => UseObservable.MakeObserver({
  type t = style
  type action = changeStyleAction

  let width = if Ctx.videoMeta.width > Ctx.videoMeta.height {
    Ctx.videoMeta.width / 4
  } else {
    Ctx.videoMeta.width / 3 * 2
  }

  let center = Ctx.videoMeta.width / 2 - width / 2
  let defaultFontSizePx = Ctx.videoMeta.height / 30

  let savedPrefs = loadStylePreferences()
  let savedPositionMatches =
    savedPrefs->Option.mapOr(false, p =>
      p.videoWidth == Some(Ctx.videoMeta.width) && p.videoHeight == Some(Ctx.videoMeta.height)
    )

  let defaultX = center
  let defaultY = if Ctx.videoMeta.width > Ctx.videoMeta.height {
    Ctx.videoMeta.height - Ctx.videoMeta.height / 6
  } else {
    Ctx.videoMeta.height / 7
  }

  let initial = {
    // Video-dependent properties (restore if dimensions match, otherwise calculate fresh)
    x: if savedPositionMatches {
      savedPrefs->Option.flatMap(p => p.x)->Option.getOr(defaultX)
    } else {
      defaultX
    },
    y: if savedPositionMatches {
      savedPrefs->Option.flatMap(p => p.y)->Option.getOr(defaultY)
    } else {
      defaultY
    },
    blockSize: {width, height: defaultFontSizePx},
    fontVariants: all_font_weights,
    // User preferences (loaded from storage or defaults)
    fontFamily: savedPrefs->Option.mapOr(defaultPreferences.fontFamily, p => p.fontFamily),
    fontWeight: savedPrefs->Option.mapOr(defaultPreferences.fontWeight, p => p.fontWeight),
    fontSizePx: savedPrefs
    ->Option.map(p => p.fontSizePx)
    ->Option.filter(size => size > 0)
    ->Option.getOr(defaultFontSizePx),
    color: savedPrefs->Option.mapOr(defaultPreferences.color, p => p.color),
    strokeColor: savedPrefs->Option.flatMap(p => p.strokeColor),
    strokeWidth: savedPrefs->Option.mapOr(defaultPreferences.strokeWidth, p => p.strokeWidth),
    align: savedPrefs->Option.mapOr(defaultPreferences.align, p => p.align),
    showBackground: savedPrefs->Option.mapOr(defaultPreferences.showBackground, p =>
      p.showBackground
    ),
    background: savedPrefs->Option.mapOr(defaultPreferences.background, p => p.background),
    showWordAnimation: savedPrefs->Option.mapOr(defaultPreferences.showWordAnimation, p =>
      p.showWordAnimation
    ),
    wordAnimation: savedPrefs->Option.mapOr(defaultPreferences.wordAnimation, p => p.wordAnimation),
    hidePunctuation: savedPrefs->Option.mapOr(defaultPreferences.hidePunctuation, p =>
      p.hidePunctuation
    ),
  }

  let reducer = (state: style, action): style => {
    let newState = switch action {
    | SetPosition(newX, newY) => {...state, x: newX, y: newY}
    | SetFontFamily(fontFamily) => {...state, fontFamily}
    | SetFontWeight(fontWeight) => {...state, fontWeight}
    | SetFontSizePx(fontSizePx) => {...state, fontSizePx}
    | SetColor(color) => {...state, color}
    | SetStrokeColor(strokeColor) => {...state, strokeColor: Some(strokeColor)}
    | SetBlockWidth(blockWidth) => {
        ...state,
        blockSize: {width: blockWidth, height: state.blockSize.height},
      }
    | SetBlockHeight(blockHeight) => {
        ...state,
        blockSize: {width: state.blockSize.width, height: blockHeight},
      }
    | SetAlign(align) => {...state, align}
    | Resize(size) => {...state, blockSize: size}
    | SetFontVariants(variants) if !Array.includes(variants, state.fontWeight) => {
        ...state,
        fontWeight: Array.includes(variants, Regular)
          ? Regular
          : variants[0]->Option.getOr(Regular),
        fontVariants: variants,
      }
    | SetFontVariants(fontVariants) => {...state, fontVariants}
    | ResetFontVariants => {...state, fontVariants: all_font_weights}
    | ToggleBackground => {...state, showBackground: !state.showBackground}
    | SetBackground(background) => {...state, background}
    | SetStrokeWidth(strokeWidth) => {...state, strokeWidth}
    | ToggleWordAnimation => {...state, showWordAnimation: !state.showWordAnimation}
    | SetWordAnimation(wordAnimation) => {...state, wordAnimation}
    | ToggleHidePunctuation => {...state, hidePunctuation: !state.hidePunctuation}
    }

    // Persist preferences on every change
    saveStylePreferences(
      newState,
      ~videoWidth=Ctx.videoMeta.width,
      ~videoHeight=Ctx.videoMeta.height,
    )

    newState
  }
})
