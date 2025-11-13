import Resizable from "@corvu/resizable";

const ResizableRoot = Resizable;
const ResizablePanel = Resizable.Panel;
const ResizableHandle = () => (
  <Resizable.Handle
    aria-label="Resize Handle"
    class="after:-translate-x-1/2 data-[panel-group-direction=vertical]:after:-translate-y-1/2 relative flex w-px items-center justify-center bg-brand-200 after:absolute after:inset-y-0 after:left-1/2 after:w-1 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand-100 focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90"
  />
);

export { ResizableRoot, ResizablePanel, ResizableHandle };
