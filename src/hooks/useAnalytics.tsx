export function createLogger(): (
  label: string,
  options?: { props?: any; callback?: () => void },
) => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  return (
    // @ts-expect-error analytics types
    window.plausible ||
    function () {
      // @ts-expect-error analytics types
      (window.plausible.q = window.plausible.q || []).push(arguments);
    }
  );
}

export function logException(
  error: unknown,
  info?: React.ErrorInfo | undefined,
) {
  createLogger()("error", {
    props: {
      error,
      info,
    },
  });
}
