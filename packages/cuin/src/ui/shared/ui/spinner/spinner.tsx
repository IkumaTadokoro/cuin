import type { Component } from "solid-js";

type Props = {
  size?: "sm" | "md";
};

export const Spinner: Component<Props> = (props) => {
  const sizeClass = () => {
    switch (props.size ?? "md") {
      case "sm":
        return "h-4 w-4 border-2";
      case "md":
        return "h-5 w-5 border-2";
      default: {
        throw new Error(`Unexpected size: ${props.size}`);
      }
    }
  };

  return (
    <div
      class={`animate-spin rounded-full border-brand-300 border-t-brand-700 ${sizeClass()}`}
    />
  );
};
