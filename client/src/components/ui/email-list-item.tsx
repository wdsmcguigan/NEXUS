import * as React from "react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { Checkbox } from "./checkbox";
import { Tag } from "./tag";

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
  starColor?: string;
  onStarClick?: (id: number, starred: boolean) => void;
  tags?: EmailTag[];
  accountColor?: string;
  showAccountIndicator?: boolean;
  hasAttachments?: boolean;
  attachments?: EmailAttachment[];
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
    starColor = "#eab308", // yellow default
    onStarClick,
    tags = [],
    accountColor,
    showAccountIndicator = false,
    hasAttachments = false,
    attachments = [],
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

    return (
      <li
        ref={ref}
        className={cn(
          "hover:bg-neutral-50 relative group cursor-pointer",
          isRead ? "" : "font-medium",
          !isRead && accountColor ? `border-l-4 border-[${accountColor}]` : "",
          selected ? "bg-neutral-50" : ""
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
                isStarred ? "text-[#eab308]" : "text-neutral-300 hover:text-[#eab308]"
              )}
              onClick={handleStarClick}
              aria-label={isStarred ? "Remove star" : "Add star"}
              style={{ color: isStarred ? starColor : undefined }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
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
                  "text-sm text-neutral-900 truncate", 
                  !isRead && "font-semibold"
                )}>
                  {sender.name}
                </p>
              </div>
              <p className="text-xs text-neutral-500">{formatEmailDate(date)}</p>
            </div>
            
            <p className={cn(
              "text-sm text-neutral-900 truncate", 
              !isRead && "font-medium"
            )}>
              {subject}
            </p>
            
            <p className="text-sm text-neutral-500 truncate">{preview}</p>
            
            {/* Tags/Labels */}
            {tags.length > 0 && (
              <div className="flex mt-1 gap-1 flex-wrap">
                {tags.map((tag) => (
                  <Tag 
                    key={tag.id} 
                    color={tag.color}
                  >
                    {tag.name}
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
