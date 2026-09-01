import { X, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { OutlineItem } from "./types";
import { Button } from "@/components/ui/button";

interface TableOfContentsProps {
  outline: OutlineItem[] | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPage: (pageNumber: number) => void;
}

export function TableOfContents({
  outline,
  isOpen,
  onClose,
  onNavigateToPage,
}: TableOfContentsProps) {
  if (!isOpen || !outline || outline.length === 0) return null;

  return (
    <aside
      aria-label="Table of contents"
      className="fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-border bg-background/95 backdrop-blur-sm sm:w-80"
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <h2 className="text-sm font-semibold">Contents</h2>
        <Button
          variant="ghost"
          size="icon"
          className="squircle h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Close table of contents"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <nav>
          <ul className="space-y-0.5">
            {outline.map((item, idx) => (
              <TocNode
                key={`${item.title}-${idx}`}
                item={item}
                depth={0}
                onSelect={(page) => {
                  onNavigateToPage(page);
                }}
              />
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

function TocNode({
  item,
  depth,
  onSelect,
}: {
  item: OutlineItem;
  depth: number;
  onSelect: (page: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const hasChildren = item.items && item.items.length > 0;

  const handleClick = () => {
    if (item.pageIndex !== undefined) {
      onSelect(item.pageIndex + 1);
    } else if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <li>
      <div
        className="group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={isExpanded ? "Collapse section" : "Expand section"}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="h-5 w-5" />
        )}

        <button
          type="button"
          onClick={handleClick}
          className="flex-1 truncate text-left text-[13px] text-foreground/90 group-hover:text-foreground"
          title={item.title}
        >
          <span className={item.bold ? "font-medium" : ""}>{item.title}</span>
        </button>

        {item.pageIndex !== undefined ? (
          <span className="text-xs text-muted-foreground/70">{item.pageIndex + 1}</span>
        ) : null}
      </div>

      {hasChildren && isExpanded ? (
        <ul className="space-y-0.5">
          {item.items.map((sub, sIdx) => (
            <TocNode
              key={`${sub.title}-${sIdx}`}
              item={sub}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
