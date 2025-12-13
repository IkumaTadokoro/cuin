type Props = {
  class?: string;
};

export default function Separator(props: Props) {
  return <hr class={`text-brand-100 ${props.class ?? ""}`} />;
}
