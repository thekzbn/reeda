import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";
import { Info, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Sonner
      theme={theme}
      className="toaster group font-sans"
      toastOptions={{
        classNames: {
          toast:
            "group toast font-sans group-[.toaster]:font-sans group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-none group-[.toaster]:rounded-lg group-[.toaster]:px-3.5 group-[.toaster]:py-2.5 group-[.toaster]:text-xs group-[.toaster]:font-medium group-[.toaster]:tracking-tight group-[.toaster]:gap-2.5",
          title: "group-[.toast]:font-sans group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:text-foreground",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs group-[.toast]:font-normal group-[.toast]:font-sans",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md group-[.toast]:px-2.5 group-[.toast]:py-1 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:font-sans",
          cancelButton:
            "group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground group-[.toast]:rounded-md group-[.toast]:px-2.5 group-[.toast]:py-1 group-[.toast]:text-xs group-[.toast]:font-sans",
          success: "group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground",
          error: "group-[.toaster]:border-destructive/50 group-[.toaster]:bg-background group-[.toaster]:text-foreground",
          warning: "group-[.toaster]:border-amber-500/40 group-[.toaster]:bg-background group-[.toaster]:text-foreground",
          info: "group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground",
        },
      }}
      icons={{
        success: <Info className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.2]" />,
        error: <Info className="h-3.5 w-3.5 text-destructive dark:text-red-400 shrink-0 stroke-[2.2]" />,
        warning: <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 stroke-[2.2]" />,
        info: <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 stroke-[2]" />,
        loading: <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />,
      }}
      {...props}
    />
  );
};

export { Toaster };
