@genType
type serde<'a> = {
  parse: string => 'a,
  serialize: 'a => string,
}

@genType
let serdeString = {
  parse: str => str,
  serialize: str => str,
}

@genType
let useStickyState = (persistKey, ~version, ~defaultValue, ~serde) => {
  open! Dom.Storage2

  let (state, setRawState) = React.useState(() => {
    let storedState = localStorage->getItem(persistKey)
    let storedVersion =
      localStorage
      ->getItem(persistKey ++ ".version")
      ->Option.flatMap(val => Int.fromString(val, ~radix=10))

    switch (storedState, storedVersion) {
    | (Some(storedState), Some(storedVersion)) if storedVersion == version =>
      try {
        storedState->serde.parse
      } catch {
      | _ => defaultValue
      }
    | _ => defaultValue
    }
  })

  let setState = React.useCallback(newState => {
    localStorage->setItem(persistKey, newState->serde.serialize)
    localStorage->setItem(persistKey ++ ".version", string_of_int(version))

    setRawState(_ => newState)
  }, [])

  (state, setState)
}
