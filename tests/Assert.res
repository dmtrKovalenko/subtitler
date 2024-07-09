open Test

let intEqual = (~message=?, a: int, b: int) =>
  assertion(~message?, ~operator="Int equals", (a, b) => a === b, a, b)

let floatEqual = (~message=?, a: float, b: float) =>
  assertion(~message?, ~operator="Float equals", (a, b) => a === b, a, b)

let stringEqual = (~message=?, a: string, b: string) =>
  assertion(~message?, ~operator="String equals", (a, b) => a === b, a, b)

let okEqual = (~message=?, a: result<'a, 'c>, b: 'a) =>
  assertion(~message?, ~operator="Ok equals", (a, b) => a == Ok(b), a, b)

let isErr = (~message=?, a: result<'a, 'c>) =>
  assertion(~message?, ~operator="Ok equals", (a, _) => a->Result.isError, a, ())
