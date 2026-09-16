import { Toaster as Sonner } from "sonner";
import { Check, AlertCircle, Info, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-none group-[.toaster]:rounded-lg group-[.toaster]:px-3.5 group-[.toaster]:py-2.5 group-[.toaster]:text-xs group-[.toaster]:font-medium group-[.toaster]:tracking-tight group-[.toaster]:gap-2.5",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs group-[.toast]:font-normal",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md group-[.toast]:px-2.5 group-[.toast]:py-1 group-[.toast]:text-xs group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground group-[.toast]:rounded-md group-[.toast]:px-2.5 group-[.toast]:py-1 group-[.toast]:text-xs",
          success: "group-[.toaster]:border-border",
          error: "group-[.toaster]:border-destructive/50",
          warning: "group-[.toaster]:border-amber-500/40",
          info: "group-[.toaster]:border-border",
        },
      }}
      icons={{
        success: <Check className="h-3.5 w-3.5 text-primary shrink-0 stroke-[2.2]" />,
        error: <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 stroke-[2.2]" />,
        info: <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 stroke-[2]" />,
        loading: <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />,
      }}
      {...props}
    />
  );
};

export { Toaster };
