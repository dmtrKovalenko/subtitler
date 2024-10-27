import * as React from "react";
import clsx from "clsx";

interface ToggleGroupProps<T extends string | number | null>
  extends Omit<React.HTMLProps<HTMLDivElement>, "onChange" | "size" | "value"> {
  value: T;
  onChange: (value: T) => void;
  children: Array<React.ReactElement<ToggleButtonProps<T>>>;
}

const BASE_BUTTON_PADDING_X_REM = 0.3;
const BASE_BUTTON_PADDING_Y_REM = 0.3;
// this is 1px on each size coming from the divide-x style
const BUTTON_DIVIDE_X_SIZE = 2;

export const ToggleGroup = <T extends string | number | null>({
  className,
  children,
  onChange,
  value,
  ...other
}: ToggleGroupProps<T>) => {
  const { toggleButtons, selectedButtonIndex } = React.useMemo(() => {
    let selectedButtonIndex: number | null = null;

    const toggleButtons = React.Children.map(children, (child, i) => {
      if (!React.isValidElement(child) || child.type !== ToggleButton) {
        console.error("ToggleGroup can only have ToggleButton children");
        return null;
      }

      const isSelected = child.props.value === value;
      if (isSelected) {
        selectedButtonIndex = i;
      }

      return React.cloneElement(child, {
        selected: isSelected,
        "aria-current": isSelected,
        onClick: () => {
          onChange(child.props.value);
        },
      });
    });

    return {
      toggleButtons,
      selectedButtonIndex,
    };
  }, [children, onChange, value]);

  // we have an absolute floating panel that covers the full size of the segment (they all equal)
  // but to make it perfect and overflow also the segmentation borders we need
  // to have different logic for the first, last, and all the other elements.
  const { width, transform } = React.useMemo(() => {
    if (selectedButtonIndex === null) {
      return { width: undefined, transform: undefined };
    }

    // the equal size of the every button
    const segmentWidth = `${(1 / toggleButtons.length) * 100}%`;
    const baseTransformShift = `${selectedButtonIndex * 100}%`;

    if (selectedButtonIndex === 0) {
      return {
        width: segmentWidth,
        transform: `translateX(${BASE_BUTTON_PADDING_X_REM}rem)`,
      };
    }

    // transform 100% is the width of the element itself, but we scale it to overflow the divide borders
    // so we need to escape this additional width by subtracting it from translateX
    const dividersShift =
      selectedButtonIndex * BUTTON_DIVIDE_X_SIZE + BUTTON_DIVIDE_X_SIZE / 2;

    // the last elements needs to respect the left and the right paddings together
    if (selectedButtonIndex === toggleButtons.length - 1) {
      return {
        width: `calc((${segmentWidth} + ${BUTTON_DIVIDE_X_SIZE}px))`,
        transform: `translateX(calc(${baseTransformShift} - (${dividersShift}px + ${BASE_BUTTON_PADDING_X_REM}rem)))`,
      };
    }

    return {
      transform: `translateX(calc(${baseTransformShift} - ${dividersShift}px))`,
      width: `calc(${segmentWidth} + ${BUTTON_DIVIDE_X_SIZE}px)`,
    };
  }, [BASE_BUTTON_PADDING_X_REM, selectedButtonIndex, toggleButtons.length]);

  return (
    <div
      role="tablist"
      tabIndex={0}
      style={{
        padding: `${BASE_BUTTON_PADDING_Y_REM}rem 0`,
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          const nextIndex = Math.max(
            0,
            Math.min(
              toggleButtons.length - 1,
              selectedButtonIndex! + (e.key === "ArrowRight" ? 1 : -1),
            ),
          );
          onChange(toggleButtons[nextIndex].props.value);
        }
      }}
      className={clsx(
        "relative outline-none focus-visible:ring-2 ring-orange-400 rounded-md bg-white/10 !py-1.5",
        className,
      )}
      {...other}
    >
      {selectedButtonIndex !== null && toggleButtons ? (
        <div
          aria-hidden
          className={clsx(
            "absolute top-1.5 z-0 flex text-white flex-none rounded-lg transition-transform bg-zinc-800 ",
          )}
          style={{
            width,
            transform,
            // this additional 0.1 rem is geometrically not needed but without it border actually overflows the panel.
            top: `${BASE_BUTTON_PADDING_Y_REM / 2 + 0.1}rem`,
            height: `calc(100% - ${BASE_BUTTON_PADDING_Y_REM * 2}rem)`,
          }}
        >
          {toggleButtons[selectedButtonIndex]}
        </div>
      ) : null}

      <div className="flex w-full divide-x divide-zinc-500 py-1">
        {toggleButtons}
      </div>
    </div>
  );
};

interface ToggleButtonProps<T>
  extends Omit<React.HTMLProps<HTMLButtonElement>, "size" | "value"> {
  value: T;
  selected?: boolean;
}

export const ToggleButton = <T extends string | number>({
  className,
  children,
  selected,
  type: _type,
  ...other
}: ToggleButtonProps<T>) => {
  return (
    <button
      tabIndex={-1}
      type="button"
      className={clsx(
        "inline-flex flex-1 text-white items-center justify-cenuer gap-2 overflow-auto px-2 outline-none",
        selected
          ? "pointer-events-none"
          : // we turn it rounded only if user manually uses tab to focus otherwise divide style affected
          "focus-visible:rounded-md focus-visible:",
        className,
      )}
      {...other}
    >
      {children}
    </button>
  );
};
