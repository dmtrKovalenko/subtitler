include UseDimensions
include UseEditorLayout

let useEvent = (fn: 'a => unit) => {
  let ref = React.useRef(fn)

  React.useLayoutEffect0(() => {
    ref.current = fn
    None
  })

  React.useCallback0(arg => ref.current(arg))
}

type toggle = {
  on: unit => unit,
  off: unit => unit,
  toggle: unit => unit,
}

let useToggle = default => {
  let (state, setState) = React.useState(_ => default)

  let on = React.useCallback0(() => setState(_ => true))
  let off = React.useCallback0(() => setState(_ => false))
  let toggle = React.useCallback0(() => setState(state => !state))

  (
    state,
    React.useMemo0(() => {
      on,
      off,
      toggle,
    }),
  )
}
