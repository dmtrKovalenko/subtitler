import * as React from "react";
import clsx from "clsx";

type ToggleGroupHighlight = "neutral" | "accent-gradient";
type ToggleSize = "base" | "small";

interface ToggleGroupProps<T extends string | number | null>
  extends Omit<React.HTMLProps<HTMLDivElement>, "onChange" | "size" | "value"> {
  /**
   * The smaller size compacts the toggle by reducing padding.
   *
   * @default "base"
   */
  size?: ToggleSize;
  /**
   * The color to highlight selected state. Use `accent-gradient` when the control is the most important in the current context.
   *
   * @default "neutral"
   */
  highlight?: ToggleGroupHighlight;
  value: T;
  onChange: (value: T) => void;
  children: Array<React.ReactElement<ToggleButtonProps<T>>>;
}

const BASE_BUTTON_PADDING_X_REM = 0.3;
const BASE_BUTTON_PADDING_Y_REM = 0.3;
// this is 1px on each size coming from the divide-x style
const BUTTON_DIVIDE_X_SIZE = 2;

/**
 *
 * # Toggle Button Group or Segmented Control
 *
 * A segmented control is a linear set of two or more segments, each of which functions as a button.
 * Every item within toggle group has equal size and is highlighted by the internal inset panel that is
 * moving within the whole group overflowing currently selected choice.
 *
 * ## When to use?
 *
 * Use it when you have 2 or more choices that user might need to select in a linear fashion.
 * E.g. switching between modes of an input, selecting a filter, or displaying a toolbar.
 *
 * ## When not to use?
 *
 * For navigation use tabs instead.
 * For form inputs use radio buttons.
 *
 *
 * ## Accessibility
 * - Make sure that `aria-current` indicate the current selected item.
 * - In case `prefers-reduce-motion` animation is disabled
 *
 * ## Additional info
 *
 * - The children of the toggle group must always be an instance of a `ToggleButton` component.
 * - When you want to specifically highlight the tab group provide `highlight="accent-gradient"` prop
 * it will turn the selection surface highlighting to the accent gradient. Might be useful when the
 * segmened control is the primary action in the certain component.
 */
export const ToggleGroup = <T extends ToggleSize | string | number | null>({
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
        "relative outline-none focus-visible:ring-2 ring-orange-500 rounded-md bg-white/10 !py-1.5",
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
  size?: ToggleSize;
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
        "inline-flex flex-1 text-white items-center justify-center gap-2 overflow-auto px-2 outline-none",
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
