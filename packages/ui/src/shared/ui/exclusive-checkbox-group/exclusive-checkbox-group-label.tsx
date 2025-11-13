import type { HTMLProps, PolymorphicProps } from "@ark-ui/solid/factory";
import { useExclusiveCheckboxGroupContext } from "./use-exclusive-checkbox-group-context";
import { useExclusiveCheckboxGroupItemContext } from "./use-exclusive-checkbox-group-item-context";

export interface ExclusiveCheckboxGroupLabelBaseProps
  extends PolymorphicProps<"button"> {}
export interface ExclusiveCheckboxGroupLabelProps
  extends HTMLProps<"button">,
    ExclusiveCheckboxGroupLabelBaseProps {}

export const ExclusiveCheckboxGroupLabel = (
  props: ExclusiveCheckboxGroupLabelProps
) => {
  const group = useExclusiveCheckboxGroupContext();
  const { value, setHoveredPart } = useExclusiveCheckboxGroupItemContext();

  return (
    <button
      class="relative flex flex-1 cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left"
      onClick={(e) => {
        group.handleLabelClick(value);
        e.stopPropagation();
      }}
      onMouseEnter={() => setHoveredPart("label")}
      onMouseLeave={() => setHoveredPart(null)}
      type="button"
      {...props}
    >
      {props.children}
    </button>
  );
};
