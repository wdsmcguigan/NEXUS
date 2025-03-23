import * as React from "react";
import { cn } from "@/lib/utils";

export interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  variant?: "default" | "outline";
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  ({ className, color = "#3b82f6", variant = "default", children, ...props }, ref) => {
    const bgColor = variant === "default" ? `${color}20` : "transparent"; // 20 is for 12% opacity
    const textColor = variant === "default" ? color : color;
    const borderColor = variant === "default" ? "transparent" : color;

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
          "transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
          className
        )}
        style={{
          backgroundColor: bgColor,
          color: textColor,
          borderColor: borderColor,
          borderWidth: variant === "outline" ? "1px" : "0",
          borderStyle: "solid"
        }}
        {...props}
      >
        <span 
          className="w-2 h-2 rounded-full mr-1 flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        {children}
      </div>
    );
  }
);

Tag.displayName = "Tag";

export { Tag };
