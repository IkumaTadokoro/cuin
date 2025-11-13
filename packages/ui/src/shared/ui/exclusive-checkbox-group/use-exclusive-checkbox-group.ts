import {
  type CollectionItem,
  createListCollection,
} from "@ark-ui/solid/collection";
import { createMemo, createSignal } from "solid-js";

export interface ExclusiveCheckboxItem extends CollectionItem {
  value: string;
  label: string;
}

export type UseExclusiveCheckboxGroupProps = {
  items: ExclusiveCheckboxItem[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};

export function useExclusiveCheckboxGroup(
  props: UseExclusiveCheckboxGroupProps
) {
  const collection = createListCollection({ items: props.items });

  const allValues = collection.items.map((item) => item.value);
  const [selectedValues, setSelectedValues] = createSignal<string[]>(
    props.defaultValue ?? allValues
  );

  const selectedCount = createMemo(() => selectedValues().length);

  const toggleCheckbox = (value: string) => {
    setSelectedValues((prev) => {
      const newValue = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];
      props.onValueChange?.(newValue);
      return newValue;
    });
  };

  const handleLabelClick = (value: string) => {
    const count = selectedCount();
    const isSelected = selectedValues().includes(value);

    let newValue: string[];

    if (count >= 2) {
      newValue = [value];
    } else if (count === 1) {
      if (isSelected) {
        newValue = allValues;
      } else {
        newValue = [value];
      }
    } else {
      newValue = selectedValues();
    }

    setSelectedValues(newValue);
    props.onValueChange?.(newValue);
  };

  const getOverlayText = (value: string) => {
    const count = selectedCount();
    const isSelected = selectedValues().includes(value);

    if (count >= 2) {
      return "Only";
    }
    if (count === 1) {
      return isSelected ? "All" : "Only";
    }
    return null;
  };

  const isChecked = (value: string) => selectedValues().includes(value);

  return {
    collection,
    selectedValues,
    selectedCount,
    toggleCheckbox,
    handleLabelClick,
    getOverlayText,
    isChecked,
  };
}
