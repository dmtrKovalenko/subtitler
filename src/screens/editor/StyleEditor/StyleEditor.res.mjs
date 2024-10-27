// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Cx from "rescript-classnames/src/Cx.res.mjs";
import * as Hooks from "../../../hooks/Hooks.res.mjs";
import * as Icons from "../../../ui/Icons.res.mjs";
import * as Input from "../../../ui/Input.res.mjs";
import * as Utils from "../../../Utils.res.mjs";
import * as React from "react";
import * as Belt_Int from "rescript/lib/es6/belt_Int.js";
import * as Combobox from "../../../ui/Combobox.res.mjs";
import * as Core__Int from "@rescript/core/src/Core__Int.res.mjs";
import * as Caml_option from "rescript/lib/es6/caml_option.js";
import * as Core__Float from "@rescript/core/src/Core__Float.res.mjs";
import * as Core__Option from "@rescript/core/src/Core__Option.res.mjs";
import * as ToggleButton from "../../../ui/ToggleButton.res.mjs";
import * as ToggleSwitch from "../../../ui/ToggleSwitch.res.mjs";
import * as EditorContext from "../EditorContext.res.mjs";
import * as ReactFontPicker from "../../../bindings/ReactFontPicker.res.mjs";
import * as React$1 from "@headlessui/react";
import * as JsxRuntime from "react/jsx-runtime";
import * as Outline from "@heroicons/react/24/outline";

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
      return JsxRuntime.jsxs("div", {
                  children: [
                    JsxRuntime.jsxs("div", {
                          children: [
                            JsxRuntime.jsx(Input.make, {
                                  step: 1.0,
                                  label: "Y coordinate",
                                  value: String(style.x),
                                  type_: "number",
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
                                  min: "0",
                                  max: "999"
                                }),
                            JsxRuntime.jsx(Input.make, {
                                  step: 1.0,
                                  label: "X coordinate",
                                  value: String(style.y),
                                  type_: "number",
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
                                    }),
                                  min: "0",
                                  max: "999"
                                }),
                            JsxRuntime.jsx(Input.make, {
                                  step: 1.0,
                                  label: "Width",
                                  value: String(style.blockSize.width),
                                  type_: "number",
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
                                    }),
                                  min: "0",
                                  max: "999"
                                }),
                            JsxRuntime.jsx(Input.make, {
                                  step: 1.0,
                                  label: "Height",
                                  value: String(style.blockSize.height),
                                  type_: "number",
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
                                    }),
                                  min: "0",
                                  max: "999"
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
                                    JsxRuntime.jsx(ReactFontPicker.make, {
                                          inputId: "font-picker" + id,
                                          onFontLoad: Hooks.useEvent(function (val) {
                                                dispatch({
                                                      TAG: "SetFontFamily",
                                                      _0: val
                                                    });
                                              }),
                                          onFontVariantInfo: Hooks.useEvent(function (variants) {
                                                dispatch(variants.length > 0 ? ({
                                                          TAG: "SetFontVariants",
                                                          _0: variants
                                                        }) : "ResetFontVariants");
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
                                        }),
                                    JsxRuntime.jsx(Input.make, {
                                          step: 1.0,
                                          label: "width",
                                          value: String(style.strokeWidth),
                                          type_: "number",
                                          adornmentClassName: adornmentClassName,
                                          onChange: (function (value) {
                                              Core__Option.forEach(Core__Int.fromString(value, undefined), (function (strokeWidth) {
                                                      dispatch({
                                                            TAG: "SetStrokeWidth",
                                                            _0: strokeWidth
                                                          });
                                                    }));
                                            }),
                                          min: "0",
                                          max: "999"
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
                                          options: style.fontVariants,
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
                        }),
                    JsxRuntime.jsxs("div", {
                          children: [
                            JsxRuntime.jsxs("div", {
                                  children: [
                                    JsxRuntime.jsx(ToggleSwitch.make, {
                                          labelId: "background-title",
                                          enabled: style.showBackground,
                                          onChange: (function (param) {
                                              dispatch("ToggleBackground");
                                            })
                                        }),
                                    JsxRuntime.jsx("h3", {
                                          children: "Background",
                                          id: "background-title"
                                        })
                                  ],
                                  className: "flex items-center gap-4"
                                }),
                            JsxRuntime.jsxs("div", {
                                  children: [
                                    JsxRuntime.jsx(Input.make, {
                                          label: "Fill",
                                          value: style.background.color,
                                          type_: "color",
                                          className: "w-full col-span-1 flex-1",
                                          onChange: (function (value) {
                                              var init = style.background;
                                              dispatch({
                                                    TAG: "SetBackground",
                                                    _0: {
                                                      color: value,
                                                      strokeColor: init.strokeColor,
                                                      strokeWidth: init.strokeWidth,
                                                      opacity: init.opacity,
                                                      paddingX: init.paddingX,
                                                      paddingY: init.paddingY,
                                                      borderRadius: init.borderRadius
                                                    }
                                                  });
                                            })
                                        }),
                                    JsxRuntime.jsx(Input.make, {
                                          step: 0.1,
                                          label: "Opacity",
                                          value: String(style.background.opacity),
                                          type_: "number",
                                          className: "w-full col-span-1 flex-1",
                                          onChange: (function (value) {
                                              Core__Option.forEach(Core__Option.map(Core__Float.fromString(value), (function (val) {
                                                          var init = style.background;
                                                          return {
                                                                  TAG: "SetBackground",
                                                                  _0: {
                                                                    color: init.color,
                                                                    strokeColor: init.strokeColor,
                                                                    strokeWidth: init.strokeWidth,
                                                                    opacity: val,
                                                                    paddingX: init.paddingX,
                                                                    paddingY: init.paddingY,
                                                                    borderRadius: init.borderRadius
                                                                  }
                                                                };
                                                        })), dispatch);
                                            }),
                                          min: "0",
                                          max: "1"
                                        }),
                                    JsxRuntime.jsx(Input.make, {
                                          label: "Stroke",
                                          value: style.background.color,
                                          type_: "color",
                                          className: "w-full col-span-1 flex-1",
                                          onChange: (function (value) {
                                              var init = style.background;
                                              dispatch({
                                                    TAG: "SetBackground",
                                                    _0: {
                                                      color: init.color,
                                                      strokeColor: init.strokeColor,
                                                      strokeWidth: value,
                                                      opacity: init.opacity,
                                                      paddingX: init.paddingX,
                                                      paddingY: init.paddingY,
                                                      borderRadius: init.borderRadius
                                                    }
                                                  });
                                            })
                                        }),
                                    JsxRuntime.jsx(Input.make, {
                                          step: 1.0,
                                          label: "Stroke width",
                                          value: String(style.background.strokeWidth),
                                          type_: "number",
                                          className: "w-full",
                                          adornmentClassName: adornmentClassName,
                                          onChange: (function (value) {
                                              Core__Option.forEach(Core__Int.fromString(value, undefined), (function (strokeWidth) {
                                                      var init = style.background;
                                                      dispatch({
                                                            TAG: "SetBackground",
                                                            _0: {
                                                              color: init.color,
                                                              strokeColor: init.strokeColor,
                                                              strokeWidth: strokeWidth,
                                                              opacity: init.opacity,
                                                              paddingX: init.paddingX,
                                                              paddingY: init.paddingY,
                                                              borderRadius: init.borderRadius
                                                            }
                                                          });
                                                    }));
                                            }),
                                          min: "0",
                                          max: "999"
                                        }),
                                    JsxRuntime.jsx(Input.make, {
                                          step: 1.0,
                                          label: "Border radius",
                                          value: style.background.borderRadius.toString(),
                                          type_: "number",
                                          className: "w-full col-span-2",
                                          adornment: Caml_option.some(JsxRuntime.jsx(Icons.BorderRadiusIcon.make, {
                                                    color: "white",
                                                    className: "size-4"
                                                  })),
                                          adornmentClassName: "font-mono rounded-md   bg-zinc-500 px-2.5 inset-y-0",
                                          onChange: (function (value) {
                                              Core__Option.forEach(Core__Int.fromString(value, undefined), (function (borderRadius) {
                                                      var init = style.background;
                                                      dispatch({
                                                            TAG: "SetBackground",
                                                            _0: {
                                                              color: init.color,
                                                              strokeColor: init.strokeColor,
                                                              strokeWidth: init.strokeWidth,
                                                              opacity: init.opacity,
                                                              paddingX: init.paddingX,
                                                              paddingY: init.paddingY,
                                                              borderRadius: borderRadius
                                                            }
                                                          });
                                                    }));
                                            }),
                                          min: "0",
                                          max: "999"
                                        }),
                                    JsxRuntime.jsx(Input.make, {
                                          step: 1.0,
                                          label: "Padding X",
                                          value: String(style.background.paddingX),
                                          type_: "number",
                                          className: "w-full",
                                          adornmentClassName: adornmentClassName,
                                          onChange: (function (value) {
                                              Core__Option.forEach(Core__Int.fromString(value, undefined), (function (paddingX) {
                                                      var init = style.background;
                                                      dispatch({
                                                            TAG: "SetBackground",
                                                            _0: {
                                                              color: init.color,
                                                              strokeColor: init.strokeColor,
                                                              strokeWidth: init.strokeWidth,
                                                              opacity: init.opacity,
                                                              paddingX: paddingX,
                                                              paddingY: init.paddingY,
                                                              borderRadius: init.borderRadius
                                                            }
                                                          });
                                                    }));
                                            }),
                                          min: "0",
                                          max: "999"
                                        }),
                                    JsxRuntime.jsx(Input.make, {
                                          step: 1.0,
                                          label: "Padding Y",
                                          value: String(style.background.paddingY),
                                          type_: "number",
                                          className: "w-full",
                                          adornmentClassName: adornmentClassName,
                                          onChange: (function (value) {
                                              Core__Option.forEach(Core__Int.fromString(value, undefined), (function (paddingY) {
                                                      var init = style.background;
                                                      dispatch({
                                                            TAG: "SetBackground",
                                                            _0: {
                                                              color: init.color,
                                                              strokeColor: init.strokeColor,
                                                              strokeWidth: init.strokeWidth,
                                                              opacity: init.opacity,
                                                              paddingX: init.paddingX,
                                                              paddingY: paddingY,
                                                              borderRadius: init.borderRadius
                                                            }
                                                          });
                                                    }));
                                            }),
                                          min: "0",
                                          max: "999"
                                        })
                                  ],
                                  className: Cx.cx([
                                        "rounded-xl focus-within:border-zinc-500 border transition-colors border-transparent grid grid-cols-4 gap-2 bg-white/5 p-3 w-full",
                                        style.showBackground ? "brightness-100" : "brightness-50 pointer-events-none"
                                      ])
                                })
                          ],
                          className: "flex flex-col gap-1.5"
                        })
                  ],
                  className: "flex flex-col gap-6"
                });
    });

export {
  formatFontWeight ,
  $$parseInt ,
  adornmentClassName ,
  make ,
}
/* make Not a pure module */
