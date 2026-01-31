module type Observable = {
  type t
  let initial: t

  type action
  let reducer: (t, action) => t
}

type unlisten = unit => unit

module type Observer = (ObservableT: Observable) =>
{
  type listener = ObservableT.t => unit

  let dispatch: ObservableT.action => unit
  let get: unit => ObservableT.t
  let subscribe: listener => unlisten
  let useObservable: unit => ObservableT.t
}

module type PubsubInit = {
  type t
  let initial: t
}

module Pubsub = (Init: PubsubInit) => {
  type listener = Init.t => unit
  type listenerId = {id: int, listener: listener}

  let mutableState = ref(Init.initial)
  let listeners: array<listenerId> = []

  let get = () => mutableState.contents

  let set = newState => {
    mutableState := newState
    listeners->Array.forEach(({listener}) => listener(mutableState.contents))
  }

  let nextId = ref(0)
  let subscribe = listener => {
    let id = nextId.contents
    nextId := id + 1

    let _ = listeners->Array.push({id, listener})

    () => {
      let index = listeners->Array.findIndex(li => li.id === id)

      if index >= 0 {
        let _ = listeners->Utils.Array.removeInPlace(~index)
      }
    }
  }

  @genType
  let useObservable = () => {
    let (_, forceUpdate) = React.useReducer((x, _) => x + 1, 0)

    React.useEffect0(() => {
      let unsubscribe = subscribe(_ => forceUpdate())

      Some(unsubscribe)
    })

    get()
  }

  // Selector-based hook that only re-renders when the selected value changes
  // This is critical for performance - components can subscribe to specific slices of state
  @genType
  let useObservableSelector = (selector: Init.t => 'a): 'a => {
    let selectedRef = React.useRef(selector(get()))
    let (_, forceUpdate) = React.useReducer((x, _) => x + 1, 0)

    React.useEffect0(() => {
      let unsubscribe = subscribe(state => {
        let newSelected = selector(state)

        // Only force update if the selected value actually changed
        if newSelected !== selectedRef.current {
          selectedRef.current = newSelected
          forceUpdate()
        }
      })

      Some(unsubscribe)
    })

    selectedRef.current
  }
}

module MakeObserver: Observer = (Observable: Observable) => {
  include Pubsub(Observable)

  let dispatch = action => {
    set(Observable.reducer(mutableState.contents, action))
  }
}
