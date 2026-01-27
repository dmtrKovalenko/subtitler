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
  showBackground: bool,
  background: wordAnimationBackground,
  // Font styling for active word
  showFont: bool,
  font: wordAnimationFont,
  // Pop/scale effect for active word
  showPop: bool,
  pop: wordAnimationPop,
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
  // Background - enabled by default
  showBackground: true,
  background: defaultWordAnimationBackground,
  // Font - enabled by default (to show white text on orange bg)
  showFont: true,
  font: defaultWordAnimationFont,
  // Pop - disabled by default
  showPop: false,
  pop: defaultWordAnimationPop,
}

// Persistable style preferences (excludes video-dependent properties like x, y, blockSize)
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
}

let stylePreferencesStorageKey = "subtitler.stylePreferences"
let stylePreferencesVersion = 2

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

let saveStylePreferences = (style: style) => {
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

  // Load persisted preferences
  let savedPrefs = loadStylePreferences()

  let initial = {
    // Video-dependent properties (always calculated fresh)
    x: center,
    y: if Ctx.videoMeta.width > Ctx.videoMeta.height {
      Ctx.videoMeta.height - Ctx.videoMeta.height / 6
    } else {
      Ctx.videoMeta.height / 7
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
  }

  let reducer = (state, action) => {
    let newState = switch action {
    | SetPosition(x, y) => {...state, x, y}
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
    }

    // Persist preferences on every change
    saveStylePreferences(newState)

    newState
  }
})
