import {
  ark,
  type HTMLProps,
  type PolymorphicProps,
} from "@ark-ui/solid/factory";
import { createSplitProps } from "../../lib/create-split-props";
import {
  type UseExclusiveCheckboxGroupProps,
  useExclusiveCheckboxGroup,
} from "./use-exclusive-checkbox-group";
import { ExclusiveCheckboxGroupProvider } from "./use-exclusive-checkbox-group-context";

export interface ExclusiveCheckboxGroupRootBaseProps
  extends UseExclusiveCheckboxGroupProps,
    PolymorphicProps<"div"> {}

export interface ExclusiveCheckboxGroupRootProps
  extends HTMLProps<"div">,
    ExclusiveCheckboxGroupRootBaseProps {}

export const ExclusiveCheckboxGroupRoot = (
  props: ExclusiveCheckboxGroupRootProps
) => {
  const [useGroupProps, localProps] =
    createSplitProps<UseExclusiveCheckboxGroupProps>()(props, [
      "items",
      "defaultValue",
      "onValueChange",
    ]);

  const group = useExclusiveCheckboxGroup(useGroupProps);

  return (
    <ExclusiveCheckboxGroupProvider value={group}>
      <ark.div {...localProps} />
    </ExclusiveCheckboxGroupProvider>
  );
};
