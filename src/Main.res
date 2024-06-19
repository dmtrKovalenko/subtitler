%%raw("import './index.css'")

module AppLol = {
  @react.component @module("./LolApp.tsx")
  external make: unit => React.element = "default"
}

switch ReactDOM.querySelector("#root") {
| Some(domElement) =>
  ReactDOM.Client.createRoot(domElement)->ReactDOM.Client.Root.render(
    <React.StrictMode>
      <AppLol />
    </React.StrictMode>,
  )
| None => ()
}
