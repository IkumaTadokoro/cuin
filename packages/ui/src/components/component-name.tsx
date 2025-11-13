import { BiLogosReact as ReactIcon } from "solid-icons/bi";
import { twMerge } from "tailwind-merge";

type Props = {
  name: string;
  class?: string;
};

export default function ComponentName({ name, class: className }: Props) {
  return (
    <div
      class={twMerge("flex items-center gap-1 font-mono text-sm", className)}
    >
      <ReactIcon class={"text-blue-500 text-lg"} />
      <p class="tracking-wide">{name}</p>
    </div>
  );
}
