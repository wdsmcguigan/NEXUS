import * as React from "react";
import { cn } from "@/lib/utils";

export interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  bgColor?: string;
  textColor?: string;
  emoji?: string | null;
  variant?: "default" | "outline";
  showDot?: boolean;
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  ({ 
    className, 
    color = "#3b82f6", 
    bgColor,
    textColor,
    emoji,
    variant = "default", 
    showDot = true,
    children, 
    ...props 
  }, ref) => {
    // Determine colors based on variant and provided props
    const tagBgColor = variant === "default" 
      ? bgColor || `${color}20` // 20 is for 12% opacity
      : "transparent";
    
    const tagTextColor = textColor || color;
    const tagBorderColor = variant === "default" ? "transparent" : color;

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
          "transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
          "border dark:border-neutral-700",
          className
        )}
        style={{
          backgroundColor: tagBgColor,
          color: tagTextColor,
          borderColor: tagBorderColor,
          borderWidth: variant === "outline" ? "1px" : "0",
          borderStyle: "solid"
        }}
        {...props}
      >
        {emoji ? (
          <span className="mr-1 flex-shrink-0">{emoji}</span>
        ) : showDot ? (
          <span 
            className="w-2 h-2 rounded-full mr-1 flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        ) : null}
        {children}
      </div>
    );
  }
);

Tag.displayName = "Tag";

export { Tag };
