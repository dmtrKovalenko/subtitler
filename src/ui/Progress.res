module Progress = {
  // Define the prop structure
  @react.component @module("./Progress.tsx")
  external make: (~progress: float) => React.element = "Progress"
}
