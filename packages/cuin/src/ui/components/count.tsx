type CountProps = {
  value: number;
};

export function Count(props: CountProps) {
  return (
    <span class="text-subtext-color text-xs tabular-nums">{props.value}</span>
  );
}
