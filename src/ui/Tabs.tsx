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
    <TabGroup as={React.Fragment} defaultIndex={defaultIndex}>
      <TabList className="flex gap-4">
        {tabs.map(({ name, id }) => (
          <Tab
            key={id}
            className={clsx(
              "rounded-full transition-all py-2 px-3 text-base/6 data-[selected]:font-semibold text-white focus:outline-none data-[selected]:bg-white/10 data-[hover]:bg-white/5 data-[selected]:data-[hover]:bg-white/10 outline-offset-1 data-[focus]:outline-1 data-[focus]:outline-white",
              className,
            )}
          >
            {name}
          </Tab>
        ))}
      </TabList>
      <TabPanels className="mt-3 w-full h-full">
        {tabs.map(({ content, id }) => (
          <TabPanel as={React.Fragment} key={id}>
            {content}
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}
