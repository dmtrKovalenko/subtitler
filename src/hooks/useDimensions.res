open Webapi

module DocumentEvent = Dom.EventTarget.Impl(Dom.Window)

type dimensions = {
  width: int,
  height: int,
}

let getDimensions = _ => {
  // Proper signature and return type for clarity
  {width: Dom.window->Dom.Window.innerWidth, height: Dom.window->Dom.Window.innerHeight}
}

let useDimensions = () => {
  let (dimensions, setDimensions) = React.useState(getDimensions)

  React.useLayoutEffect(() => {
    let handleResize = _ => {
      setDimensions(getDimensions) // Calling the function correctly
    }

    // Proper use of pipe operators and lambda expression
    Dom.window
    ->DocumentEvent.asEventTarget
    ->Dom.EventTarget.addEventListener("resize", handleResize)

    Some(
      () => {
        // Proper lambda function syntax
        Dom.window
        ->DocumentEvent.asEventTarget
        ->Dom.EventTarget.removeEventListener("resize", handleResize)
      },
    )
  }, [])

  dimensions
}
