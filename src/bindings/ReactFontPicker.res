type localFont = {
  name: string,
  sane: string,
  cased: string,
  variants: array<string>,
}

type fontVariantsInfo = {
  name: string,
  variants: array<string>,
}

let parseVariantString = (variant: string): option<Style.fontWeight> => {
  let match = variant->String.split(",")

  if match[0] !== Some("0") {
    None
  } else {
    switch match[1] {
    | Some("100") => Some(Thin)
    | Some("200") => Some(ExtraLight)
    | Some("300") => Some(Light)
    | Some("400") => Some(Regular)
    | Some("500") => Some(Medium)
    | Some("600") => Some(SemiBold)
    | Some("700") => Some(Bold)
    | Some("800") => Some(ExtraBold)
    | Some("900") => Some(Black)
    | _ => None
    }
  }
}

module ReactFontPicker = {
  @react.component @module("react-fontpicker-ts")
  external make: (
    ~inputId: string=?,
    ~autoLoad: bool=?,
    ~loadFonts: array<string>=?,
    ~defaultValue: string,
    ~loading: React.element=?,
    ~value: string => unit=?,
    ~loadAllVariants: bool=?,
    ~fontsLoaded: bool => unit=?,
    ~localFonts: array<localFont>=?,
    ~fontVariants: fontVariantsInfo => unit=?,
  ) => React.element = "default"
}

@react.component
let make = React.memo((~inputId, ~onFontLoad, ~onFontVariantInfo) => {
  let (fontToLoad, setFontToLoad) = React.useState(_ => None)

  <ReactFontPicker
    inputId={inputId}
    loadAllVariants=true
    autoLoad=false
    loadFonts={fontToLoad->Option.map(font => [font])->Option.getOr([])}
    loading={<div className="py-0.5 pl-3 font-light text-white text-base">
      {React.string("Inter")}
    </div>}
    defaultValue="Inter"
    value={Hooks.useEvent(val => {
      setFontToLoad(_ => Some(val))
    })}
    localFonts=[
      {
        name: "Virgil",
        sane: "virgil",
        cased: "Virgil",
        variants: ["0,400", "0,500", "0,600", "0,700", "0,800", "0,900"],
      },
    ]
    fontVariants={Hooks.useEvent(info =>
      info.variants
      ->Array.filterMap(parseVariantString)
      ->onFontVariantInfo
    )}
    fontsLoaded={Hooks.useEvent(_ => {
      setTimeout(() => fontToLoad->Option.forEach(onFontLoad), 100)->ignore
    })}
  />
})
