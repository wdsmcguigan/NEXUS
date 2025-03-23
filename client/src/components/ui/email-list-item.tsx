import * as React from "react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { Checkbox } from "./checkbox";
import { Tag } from "./tag";
import { Star } from "lucide-react";
import { starColors } from "@/lib/data";
import { StarColor } from "@shared/schema";

export interface EmailSender {
  id: number;
  name: string;
  email: string;
  imageUrl?: string;
}

export interface EmailTag {
  id: number;
  name: string;
  color: string;
  textColor?: string;
  bgColor?: string;
  emoji?: string | null;
}

export interface EmailAttachment {
  name: string;
  size: number;
  type: string;
}

export interface EmailItemProps {
  id: number;
  selected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
  sender: EmailSender;
  subject: string;
  preview: string;
  date: Date | string;
  isRead: boolean;
  isStarred: boolean;
  starColor?: StarColor;
  onStarClick?: (id: number, starred: boolean) => void;
  tags?: EmailTag[];
  accountColor?: string;
  showAccountIndicator?: boolean;
  hasAttachments?: boolean;
  attachments?: EmailAttachment[];
  hasTodo?: boolean;
  todoCompleted?: boolean;
  onClick?: () => void;
}

function formatEmailDate(date: Date | string): string {
  const emailDate = typeof date === "string" ? new Date(date) : date;
  
  if (isToday(emailDate)) {
    return format(emailDate, "h:mm a");
  } else if (isYesterday(emailDate)) {
    return "Yesterday";
  } else {
    return format(emailDate, "MMM d");
  }
}

const EmailListItem = React.forwardRef<HTMLLIElement, EmailItemProps>(
  ({
    id,
    selected = false,
    onSelect,
    sender,
    subject,
    preview,
    date,
    isRead,
    isStarred,
    starColor = "none",
    onStarClick,
    tags = [],
    accountColor,
    showAccountIndicator = false,
    hasAttachments = false,
    attachments = [],
    hasTodo = false,
    todoCompleted = false,
    onClick,
    ...props
  }, ref) => {
    const handleCheckboxChange = (checked: boolean) => {
      if (onSelect) {
        onSelect(id, checked);
      }
    };

    const handleStarClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onStarClick) {
        onStarClick(id, !isStarred);
      }
    };

    // Get the correct star color class from our mapping
    const starColorClass = starColor !== 'none' ? starColors[starColor] : 'text-neutral-300 hover:text-star-gold';

    return (
      <li
        ref={ref}
        className={cn(
          "relative group cursor-pointer border-b border-neutral-200 dark:border-neutral-800",
          isRead ? "bg-white dark:bg-neutral-900" : "bg-neutral-50 dark:bg-neutral-800",
          !isRead && accountColor ? `border-l-4 border-[${accountColor}]` : "",
          selected ? "bg-primary/5" : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
        )}
        onClick={onClick}
        data-selected={selected}
        {...props}
      >
        <div className="p-3 flex">
          {/* Selection and star */}
          <div className="flex flex-col items-center mr-3">
            <Checkbox
              checked={selected}
              onCheckedChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-neutral-300 text-primary"
            />
            <button
              className={cn(
                "mt-2",
                starColorClass
              )}
              onClick={handleStarClick}
              aria-label={isStarred ? "Change star color" : "Add star"}
            >
              <Star className="h-5 w-5 transition-colors duration-150" />
            </button>
          </div>
          
          {/* Email content preview */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {showAccountIndicator && accountColor && (
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: accountColor }} />
                )}
                <p className={cn(
                  "text-sm text-neutral-900 dark:text-neutral-100 truncate", 
                  !isRead && "font-semibold"
                )}>
                  {sender.name}
                </p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">{formatEmailDate(date)}</p>
            </div>
            
            <p className={cn(
              "text-sm text-neutral-900 dark:text-neutral-100 truncate mt-0.5", 
              !isRead && "font-medium"
            )}>
              {hasTodo && (
                <span className={`mr-1 ${todoCompleted ? "text-green-500" : "text-amber-500"}`}>
                  {todoCompleted ? "✓" : "□"}
                </span>
              )}
              {subject}
            </p>
            
            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{preview}</p>
            
            {/* Tags/Labels */}
            {tags.length > 0 && (
              <div className="flex mt-1.5 gap-1.5 flex-wrap">
                {tags.map((tag) => (
                  <Tag 
                    key={tag.id} 
                    color={tag.color || tag.bgColor || "bg-neutral-200 dark:bg-neutral-700"}
                    variant="outline"
                    className="text-xs py-0 px-1.5 h-5"
                  >
                    {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
                    <span className={tag.textColor}>{tag.name}</span>
                  </Tag>
                ))}
              </div>
            )}
          </div>
          
          {/* Attachment indicator */}
          {hasAttachments && (
            <div className="ml-2 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </li>
    );
  }
);

EmailListItem.displayName = "EmailListItem";

export { EmailListItem };
