import type { HTMLProps, PolymorphicProps } from "@ark-ui/solid/factory";
import { useExclusiveCheckboxGroupContext } from "./use-exclusive-checkbox-group-context";
import { useExclusiveCheckboxGroupItemContext } from "./use-exclusive-checkbox-group-item-context";

export interface ExclusiveCheckboxGroupControlBaseProps
  extends PolymorphicProps<"input"> {}
export interface ExclusiveCheckboxGroupControlProps
  extends HTMLProps<"input">,
    ExclusiveCheckboxGroupControlBaseProps {}

export const ExclusiveCheckboxGroupControl = (
  props: ExclusiveCheckboxGroupControlProps
) => {
  const group = useExclusiveCheckboxGroupContext();
  const { value, setHoveredPart } = useExclusiveCheckboxGroupItemContext();

  return (
    <div class="relative">
      <input
        checked={group.isChecked(value)}
        class="cursor-pointer accent-brand-700"
        onClick={(e) => {
          group.toggleCheckbox(value);
          e.stopPropagation();
        }}
        onMouseEnter={() => setHoveredPart("control")}
        onMouseLeave={() => setHoveredPart(null)}
        type="checkbox"
        {...props}
      />
    </div>
  );
};
