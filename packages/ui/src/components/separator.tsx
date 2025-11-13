import { twMerge } from "tailwind-merge";

type Props = {
  class?: string;
};

export default function Separator(props: Props) {
  return <hr class={twMerge("text-brand-100", props.class)} />;
}
