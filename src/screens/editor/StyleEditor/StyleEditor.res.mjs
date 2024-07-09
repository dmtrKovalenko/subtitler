// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Input from "../../../ui/Input.res.mjs";
import * as Utils from "../../../Utils.res.mjs";
import * as React from "react";
import * as Belt_Int from "rescript/lib/es6/belt_Int.js";
import * as Combobox from "../../../ui/Combobox.res.mjs";
import * as Caml_option from "rescript/lib/es6/caml_option.js";
import * as Core__Option from "@rescript/core/src/Core__Option.res.mjs";
import * as ToggleButton from "../../../ui/ToggleButton.res.mjs";
import * as EditorContext from "../EditorContext.res.mjs";
import * as React$1 from "@headlessui/react";
import * as JsxRuntime from "react/jsx-runtime";
import ReactFontpickerTsLite from "react-fontpicker-ts-lite";
import * as Outline from "@heroicons/react/24/outline";

var font_weight_options = [
  100,
  200,
  300,
  400,
  500,
  600,
  700,
  800,
  900
];

function formatFontWeight(weight) {
  switch (weight) {
    case 100 :
        return "Thin";
    case 200 :
        return "Extra Light";
    case 300 :
        return "Light";
    case 400 :
        return "Regular";
    case 500 :
        return "Medium";
    case 600 :
        return "Semi Bold";
    case 700 :
        return "Bold";
    case 800 :
        return "Extra Bold";
    case 900 :
        return "Black";
    
  }
}

function $$parseInt(value) {
  if (value === "") {
    return 0;
  } else {
    return Belt_Int.fromString(value);
  }
}

var adornmentClassName = "font-mono rounded-md  m-1 bg-zinc-500 px-3 inset-y-0";

var make = Utils.neverRerender(function (props) {
      var id = React.useId();
      var editorContext = EditorContext.useEditorContext();
      var match = editorContext.useStyle();
      var dispatch = match[1];
      var style = match[0];
      var fontInProgressRef = React.useRef(undefined);
      return JsxRuntime.jsxs("div", {
                  children: [
                    JsxRuntime.jsxs("div", {
                          children: [
                            JsxRuntime.jsx(Input.make, {
                                  label: "Y coordinate",
                                  value: String(style.x),
                                  className: "w-full",
                                  labelHidden: true,
                                  adornment: "X",
                                  adornmentClassName: adornmentClassName,
                                  onChange: (function (value) {
                                      Core__Option.forEach(Core__Option.map($$parseInt(value), (function (val) {
                                                  return {
                                                          TAG: "SetPosition",
                                                          _0: val,
                                                          _1: style.y
                                                        };
                                                })), dispatch);
                                    }),
                                  min: "0"
                                }),
                            JsxRuntime.jsx(Input.make, {
                                  label: "X coordinate",
                                  value: String(style.y),
                                  className: "w-full",
                                  labelHidden: true,
                                  adornment: "Y",
                                  adornmentClassName: adornmentClassName,
                                  onChange: (function (value) {
                                      Core__Option.forEach(Core__Option.map($$parseInt(value), (function (val) {
                                                  return {
                                                          TAG: "SetPosition",
                                                          _0: style.x,
                                                          _1: val
                                                        };
                                                })), dispatch);
                                    })
                                }),
                            JsxRuntime.jsx(Input.make, {
                                  label: "Width",
                                  value: String(style.blockSize.width),
                                  className: "w-full",
                                  labelHidden: true,
                                  adornment: "W",
                                  adornmentClassName: adornmentClassName,
                                  onChange: (function (value) {
                                      Core__Option.forEach(Core__Option.map($$parseInt(value), (function (val) {
                                                  return {
                                                          TAG: "SetBlockWidth",
                                                          _0: val
                                                        };
                                                })), dispatch);
                                    })
                                }),
                            JsxRuntime.jsx(Input.make, {
                                  label: "Height",
                                  value: String(style.blockSize.height),
                                  className: "w-full",
                                  labelHidden: true,
                                  adornment: "H",
                                  adornmentClassName: adornmentClassName,
                                  onChange: (function (value) {
                                      Core__Option.forEach(Core__Option.map($$parseInt(value), (function (val) {
                                                  return {
                                                          TAG: "SetBlockHeight",
                                                          _0: val
                                                        };
                                                })), dispatch);
                                    })
                                })
                          ],
                          className: "rounded-xl focus-within:border-zinc-500 border transition-colors border-transparent grid grid-cols-2 gap-2 bg-white/5 p-3 w-full"
                        }),
                    JsxRuntime.jsxs("div", {
                          children: [
                            JsxRuntime.jsxs(React$1.Field, {
                                  className: "col-span-3",
                                  children: [
                                    JsxRuntime.jsx(Input.Label.make, {
                                          forId: "font-picker" + id,
                                          children: "Font",
                                          className: "whitespace-nowrap"
                                        }),
                                    JsxRuntime.jsx(ReactFontpickerTsLite, {
                                          inputId: "font-picker" + id,
                                          autoLoad: true,
                                          defaultValue: "Inter",
                                          loading: Caml_option.some(JsxRuntime.jsx("div", {
                                                    children: "Inter",
                                                    className: "py-0.5 pl-3 font-light text-white text-base"
                                                  })),
                                          value: (function (val) {
                                              fontInProgressRef.current = val;
                                            }),
                                          loadAllVariants: true,
                                          fontsLoaded: (function (param) {
                                              Core__Option.forEach(fontInProgressRef.current, (function (font) {
                                                      dispatch({
                                                            TAG: "SetFontFamily",
                                                            _0: font
                                                          });
                                                      fontInProgressRef.current = undefined;
                                                    }));
                                            })
                                        })
                                  ]
                                }),
                            JsxRuntime.jsxs("div", {
                                  children: [
                                    JsxRuntime.jsx(Input.make, {
                                          label: "Fill",
                                          value: style.color,
                                          type_: "color",
                                          className: "w-full col-span-1 flex-1",
                                          onChange: (function (value) {
                                              dispatch({
                                                    TAG: "SetColor",
                                                    _0: value
                                                  });
                                            })
                                        }),
                                    JsxRuntime.jsx(Input.make, {
                                          label: "Stroke",
                                          value: Core__Option.getOr(style.strokeColor, style.color),
                                          type_: "color",
                                          className: "w-full col-span-1 flex-1",
                                          onChange: (function (value) {
                                              dispatch({
                                                    TAG: "SetStrokeColor",
                                                    _0: value
                                                  });
                                            })
                                        })
                                  ],
                                  className: "flex gap-2 col-span-3"
                                }),
                            JsxRuntime.jsxs(React$1.Field, {
                                  className: "col-span-3",
                                  children: [
                                    JsxRuntime.jsx(Input.Label.make, {
                                          children: "Font weight",
                                          className: "whitespace-nowrap"
                                        }),
                                    JsxRuntime.jsx(Combobox.make, {
                                          options: font_weight_options,
                                          selected: style.fontWeight,
                                          formatValue: formatFontWeight,
                                          setSelected: (function (value) {
                                              Core__Option.forEach(value, (function (value) {
                                                      dispatch({
                                                            TAG: "SetFontWeight",
                                                            _0: value
                                                          });
                                                    }));
                                            }),
                                          filter: (function (value) {
                                              return function (item) {
                                                return formatFontWeight(item).toLowerCase().includes(value);
                                              };
                                            })
                                        })
                                  ]
                                }),
                            JsxRuntime.jsx(Input.make, {
                                  label: "Size",
                                  value: String(style.fontSizePx),
                                  type_: "number",
                                  className: "min-w-[4ch]",
                                  onChange: (function (value) {
                                      Core__Option.forEach(Core__Option.map($$parseInt(value), (function (val) {
                                                  return {
                                                          TAG: "SetFontSizePx",
                                                          _0: val
                                                        };
                                                })), dispatch);
                                    }),
                                  min: "0",
                                  max: "999"
                                }),
                            JsxRuntime.jsxs(React$1.Field, {
                                  className: "col-span-2",
                                  children: [
                                    JsxRuntime.jsx(Input.Label.make, {
                                          forId: "",
                                          children: "Text align",
                                          className: "whitespace-nowrap"
                                        }),
                                    JsxRuntime.jsxs(ToggleButton.Group.make, {
                                          children: [
                                            JsxRuntime.jsx(ToggleButton.Button.make, {
                                                  children: Caml_option.some(JsxRuntime.jsx(Outline.Bars3BottomLeftIcon, {
                                                            className: "size-4"
                                                          })),
                                                  value: "Left"
                                                }),
                                            JsxRuntime.jsx(ToggleButton.Button.make, {
                                                  children: Caml_option.some(JsxRuntime.jsx(Outline.Bars3Icon, {
                                                            className: "size-4"
                                                          })),
                                                  value: "Center"
                                                }),
                                            JsxRuntime.jsx(ToggleButton.Button.make, {
                                                  children: Caml_option.some(JsxRuntime.jsx(Outline.Bars3BottomRightIcon, {
                                                            className: "size-4"
                                                          })),
                                                  value: "Right"
                                                })
                                          ],
                                          onChange: (function (value) {
                                              dispatch({
                                                    TAG: "SetAlign",
                                                    _0: value
                                                  });
                                            }),
                                          value: style.align
                                        })
                                  ]
                                })
                          ],
                          className: "rounded-xl focus-within:border-zinc-500 border transition-colors border-transparent grid grid-cols-6 gap-2 bg-white/5 p-3 w-full"
                        })
                  ],
                  className: "flex flex-col gap-6"
                });
    });

export {
  font_weight_options ,
  formatFontWeight ,
  $$parseInt ,
  adornmentClassName ,
  make ,
}
/* make Not a pure module */
