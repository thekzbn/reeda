import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof Group>) => (
  <Group
    className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
    {...props}
  />
);

const ResizablePanel = Panel;

const ResizableHandle = ({ className, ...props }: React.ComponentProps<typeof Separator>) => (
  <Separator
    className={cn(
      "group relative flex w-3 shrink-0 items-center justify-center -mx-1.5 z-20 cursor-col-resize touch-none select-none outline-none focus-visible:outline-none",
      "data-[panel-group-direction=vertical]:h-3 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:-my-1.5 data-[panel-group-direction=vertical]:cursor-row-resize",
      className,
    )}
    {...props}
  >
    {/* Thin vertical visible divider line */}
    <div
      className={cn(
        "h-full w-px bg-border transition-colors duration-150",
        "group-hover:bg-foreground/30 group-focus-visible:bg-primary group-data-[resize-handle-state=drag]:bg-primary",
        "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
      )}
    />

    {/* Centered subtle handle with two parallel vertical marks */}
    <div
      className={cn(
        "absolute flex h-6 w-2.5 items-center justify-center gap-[2px] rounded-[2px] border border-border/80 bg-background transition-colors duration-150 pointer-events-none",
        "group-hover:border-foreground/30 group-focus-visible:border-primary group-data-[resize-handle-state=drag]:border-primary group-data-[resize-handle-state=drag]:bg-background",
        "data-[panel-group-direction=vertical]:h-2.5 data-[panel-group-direction=vertical]:w-6 data-[panel-group-direction=vertical]:flex-col",
      )}
    >
      <span className="h-2.5 w-[1.5px] rounded-[0.5px] bg-muted-foreground/50 transition-colors group-hover:bg-foreground/80 group-data-[resize-handle-state=drag]:bg-primary" />
      <span className="h-2.5 w-[1.5px] rounded-[0.5px] bg-muted-foreground/50 transition-colors group-hover:bg-foreground/80 group-data-[resize-handle-state=drag]:bg-primary" />
    </div>
  </Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
