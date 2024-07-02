import * as React from "react";
import {
  Combobox as HeadlessCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useState } from "react";

type ComboboxProps<TValue extends string | number> = {
  options: TValue[];
  selected: TValue | null;
  formatValue: (value: TValue) => string;
  setSelected: (value: TValue | null) => void;
  filter: (query: string) => (option: TValue) => boolean;
  getId?: (value: TValue) => string;
  className?: string;
};

export function Combobox<TValue extends string | number>({
  selected,
  setSelected,
  formatValue,
  options,
  filter,
  getId,
  className,
}: ComboboxProps<TValue>) {
  const [query, setQuery] = useState("");

  const filterFn = filter(query);
  const filteredOptions = query === "" ? options : options.filter(filterFn);

  return (
    <HeadlessCombobox value={selected} onChange={(value) => setSelected(value)}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={clsx("relative", className)}
      >
        <ComboboxInput
          className={clsx(
            "w-full capitalize rounded-lg border-none bg-white/10 py-1.5 pr-8 pl-3 text-sm/6 text-white",
            "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-orange-500",
          )}
          displayValue={formatValue}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ComboboxButton
          aria-label="Open dropdown list"
          className="group absolute inset-y-0 right-0 px-2.5"
        >
          <ChevronDownIcon className="size-4 fill-white/60 group-data-[hover]:fill-white" />
        </ComboboxButton>
      </div>
      <Transition
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        afterLeave={() => setQuery("")}
      >
        <ComboboxOptions
          portal
          anchor={{
            to: "bottom",
            gap: "0.25rem",
          }}
          className="z-10 w-[var(--input-width)] rounded-xl border border-white/5 bg-white/5 p-1 empty:hidden backdrop-blur-xl"
        >
          {filteredOptions.map((value) => (
            <ComboboxOption
              key={getId?.(value) ?? value.toString()}
              value={value}
              className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
            >
              <CheckIcon className="invisible size-4 fill-white group-data-[selected]:visible" />
              <div className="text-sm/6 text-white capitalize">
                {formatValue(value)}
              </div>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Transition>
    </HeadlessCombobox>
  );
}
