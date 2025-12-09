import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";

type UseLazyHighlightOptions = {
  containerRef: Accessor<HTMLElement | undefined>;
  enabled?: Accessor<boolean>;
  rootMargin?: string;
};

export function useLazyHighlight(options: UseLazyHighlightOptions) {
  const { containerRef, enabled = () => true, rootMargin = "200px" } = options;

  const [shouldHighlight, setShouldHighlight] = createSignal(false);

  createEffect(() => {
    const container = containerRef();
    if (!(container && enabled())) {
      return;
    }

    if (shouldHighlight()) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const details = container.closest("details");
            if (!details || details.open) {
              setShouldHighlight(true);
              observer.disconnect();
            }
          }
        }
      },
      {
        rootMargin,
        threshold: 0,
      }
    );

    observer.observe(container);

    onCleanup(() => observer.disconnect());
  });

  return shouldHighlight;
}
