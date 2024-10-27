import { Switch } from '@headlessui/react'

type Props = {
  labelId: string
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export default function Example({ enabled, labelId, onChange }: Props) {
  return (
    <Switch
      aria-labelledby={labelId}
      checked={enabled}
      onChange={onChange}
      className="group relative flex h-7 w-14 cursor-pointer rounded-full bg-white/10 p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-2 data-[focus]:outline-orange-400 data-[checked]:bg-white/10"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
      />
    </Switch>
  )
}

