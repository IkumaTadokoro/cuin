import {
  type Component,
  createSignal,
  type JSX,
  onCleanup,
  type ParentProps,
} from "solid-js";

const MIN_THUMB_HEIGHT = 20;
const HIDE_DELAY_MS = 1000;

type ScrollAreaProps = ParentProps & {
  class?: string;
  style?: JSX.CSSProperties;
};

export const ScrollArea: Component<ScrollAreaProps> = (props) => {
  // biome-ignore lint/suspicious/noUnassignedVariables: assigned via JSX ref
  let viewportRef: HTMLDivElement | undefined;
  // biome-ignore lint/suspicious/noUnassignedVariables: assigned via JSX ref
  let contentRef: HTMLDivElement | undefined;
  // biome-ignore lint/suspicious/noUnassignedVariables: assigned via JSX ref
  let thumbRef: HTMLDivElement | undefined;

  const [isHovering, setIsHovering] = createSignal(false);
  const [isDragging, setIsDragging] = createSignal(false);
  const [thumbHeight, setThumbHeight] = createSignal(0);
  const [thumbTop, setThumbTop] = createSignal(0);
  const [showScrollbar, setShowScrollbar] = createSignal(false);

  let hideTimeout: ReturnType<typeof setTimeout> | undefined;
  let dragStartY = 0;
  let dragStartScrollTop = 0;
  let cachedViewportHeight = 0;
  let cachedContentHeight = 0;
  let rafId: number | undefined;
  let isInitialized = false;

  const updateThumbFromCache = () => {
    if (cachedContentHeight <= cachedViewportHeight) {
      setShowScrollbar(false);
      return;
    }

    setShowScrollbar(true);

    const thumbHeightRatio = cachedViewportHeight / cachedContentHeight;
    const newThumbHeight = Math.max(
      thumbHeightRatio * cachedViewportHeight,
      MIN_THUMB_HEIGHT
    );
    setThumbHeight(newThumbHeight);

    const scrollTop = viewportRef?.scrollTop ?? 0;
    const scrollRatio =
      scrollTop / (cachedContentHeight - cachedViewportHeight);
    const maxThumbTop = cachedViewportHeight - newThumbHeight;
    setThumbTop(scrollRatio * maxThumbTop);
  };

  const updateThumbLazy = () => {
    if (!(viewportRef && contentRef)) {
      return;
    }

    if (rafId !== undefined) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      rafId = undefined;
      if (!(viewportRef && contentRef)) {
        return;
      }

      cachedViewportHeight = viewportRef.clientHeight;
      cachedContentHeight = contentRef.scrollHeight;
      updateThumbFromCache();
      isInitialized = true;
    });
  };

  const handleScroll = () => {
    if (isInitialized) {
      updateThumbFromCache();
    } else {
      updateThumbLazy();
    }

    setIsHovering(true);
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (!isDragging()) {
        setIsHovering(false);
      }
    }, HIDE_DELAY_MS);
  };

  const handleThumbMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY = e.clientY;
    dragStartScrollTop = viewportRef?.scrollTop ?? 0;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!viewportRef) {
      return;
    }

    const deltaY = e.clientY - dragStartY;
    const scrollableHeight = cachedContentHeight - cachedViewportHeight;
    const thumbTrackHeight = cachedViewportHeight - thumbHeight();

    const scrollDelta = (deltaY / thumbTrackHeight) * scrollableHeight;
    viewportRef.scrollTop = dragStartScrollTop + scrollDelta;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    hideTimeout = setTimeout(() => {
      setIsHovering(false);
    }, HIDE_DELAY_MS);
  };

  const handleTrackClick = (e: MouseEvent) => {
    if (!viewportRef || e.target === thumbRef) {
      return;
    }

    const trackRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const scrollableHeight = cachedContentHeight - cachedViewportHeight;

    const clickRatio = clickY / cachedViewportHeight;
    viewportRef.scrollTop = clickRatio * scrollableHeight;
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    updateThumbLazy();
  };

  onCleanup(() => {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
    }
    clearTimeout(hideTimeout);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  });

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: scroll container wrapper
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: scroll container wrapper
    <div
      class={`relative ${props.class || ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => {
        if (!isDragging()) {
          setIsHovering(false);
        }
      }}
      style={props.style}
    >
      <div
        class="size-full overflow-y-auto rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-brand-100/50"
        onScroll={handleScroll}
        ref={viewportRef}
        style={{ "scrollbar-width": "none" }}
        tabindex="0"
      >
        <div class="pr-4" ref={contentRef}>
          {props.children}
        </div>
      </div>

      {showScrollbar() && (
        <div
          aria-hidden="true"
          class="absolute top-0 right-0 flex h-full w-2.5 cursor-pointer select-none border-l border-l-transparent p-px transition-opacity duration-100 ease-linear"
          classList={{
            "opacity-100": isHovering() || isDragging(),
            "opacity-0": !(isHovering() || isDragging()),
          }}
          onClick={handleTrackClick}
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: decorative scrollbar thumb */}
          {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: decorative scrollbar thumb */}
          <div
            class="absolute w-full rounded-full bg-brand-200 transition-opacity hover:bg-brand-300"
            onMouseDown={handleThumbMouseDown}
            ref={thumbRef}
            style={{
              height: `${thumbHeight()}px`,
              top: `${thumbTop()}px`,
            }}
          />
        </div>
      )}
    </div>
  );
};
