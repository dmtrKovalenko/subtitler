%%raw(`import "./Spinner.css";`)

@react.component @genType.as("Spinner")
let make = (~children=?) => {
  <span className="loader inline-flex items-center justify-center">
    {children->Option.getOr(React.null)}
  </span>
}
