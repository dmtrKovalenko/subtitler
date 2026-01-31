import * as React from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import clsx from "clsx";

type TabsProps = {
  defaultIndex?: number;
  className?: string;
  tabs: Array<{
    id: string;
    name: React.ReactNode;
    content: React.ReactNode;
  }>;
};

export default function Tabs({ tabs, defaultIndex, className }: TabsProps) {
  return (
    <TabGroup className="flex flex-col h-full" defaultIndex={defaultIndex}>
      <TabList className="flex gap-2 md:gap-4 justify-center px-3 py-2 bg-zinc-900/50 flex-shrink-0">
        {tabs.map(({ name, id }) => (
          <Tab
            key={id}
            data-tab-id={id}
            className={clsx(
              "rounded-full transition-all py-2 px-4 text-sm md:text-base font-medium text-white/70",
              "focus:outline-none outline-offset-1",
              "data-[selected]:font-semibold data-[selected]:text-white data-[selected]:bg-white/10",
              "data-[hover]:bg-white/5 data-[selected]:data-[hover]:bg-white/10",
              "data-[focus]:outline-1 data-[focus]:outline-white",
              className,
            )}
          >
            {name}
          </Tab>
        ))}
      </TabList>
      <TabPanels className="flex-1 min-h-0 overflow-hidden">
        {tabs.map(({ content, id }) => (
          <TabPanel key={id} unmount={true} className="h-full overflow-auto">
            {content}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}
