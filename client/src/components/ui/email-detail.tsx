import * as React from "react";
import { format } from "date-fns";
import { Button } from "./button";
import { Tag } from "./tag";
import { 
  ArrowLeft, 
  Archive, 
  Trash2, 
  MoreHorizontal, 
  CornerUpRight, 
  Forward 
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmailAttachment {
  name: string;
  size: number;
  type: string;
}

export interface EmailDetailProps {
  subject: string;
  sender: {
    id: number;
    name: string;
    email: string;
    imageUrl?: string;
  };
  recipients?: {
    type: string;
    contact: {
      id: number;
      name: string;
      email: string;
    };
  }[];
  date: Date | string;
  body: string;
  isStarred: boolean;
  starColor?: string;
  onStarClick?: (starred: boolean) => void;
  attachments?: EmailAttachment[];
  tags?: {
    id: number;
    name: string;
    color: string;
  }[];
  onBackClick?: () => void;
  onReplyClick?: () => void;
  onForwardClick?: () => void;
  onArchiveClick?: () => void;
  onDeleteClick?: () => void;
}

const formatEmailSize = (size: number): string => {
  const kb = size / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  } else {
    return `${(kb / 1024).toFixed(1)} MB`;
  }
};

export function EmailDetail({
  subject,
  sender,
  recipients = [],
  date,
  body,
  isStarred,
  starColor = "#eab308",
  onStarClick,
  attachments = [],
  tags = [],
  onBackClick,
  onReplyClick,
  onForwardClick,
  onArchiveClick,
  onDeleteClick
}: EmailDetailProps) {
  const emailDate = typeof date === "string" ? new Date(date) : date;
  const formattedDate = format(emailDate, "MMM d, yyyy, h:mm a");

  const handleStarClick = () => {
    if (onStarClick) {
      onStarClick(!isStarred);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else if (type.includes("presentation") || type.includes("powerpoint")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-8h1v2h-1V5zm1 4h-1v2h1V9zm-6 4h2v2H7v-2zm8-8h1v4h-1V5z" clipRule="evenodd" />
        </svg>
      );
    } else if (type.includes("image")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Email Actions Toolbar */}
      <div className="p-2 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackClick}
          >
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onArchiveClick}
          >
            <Archive className="h-5 w-5 text-neutral-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDeleteClick}
          >
            <Trash2 className="h-5 w-5 text-neutral-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
          >
            <MoreHorizontal className="h-5 w-5 text-neutral-600" />
          </Button>
        </div>
        
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center"
            onClick={onReplyClick}
          >
            <CornerUpRight className="h-5 w-5 mr-1 text-neutral-500" />
            Reply
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center ml-1"
            onClick={onForwardClick}
          >
            <Forward className="h-5 w-5 mr-1 text-neutral-500" />
            Forward
          </Button>
        </div>
      </div>
      
      {/* Email Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Email Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-neutral-900">{subject}</h1>
          
          <div className="flex items-start mt-3">
            <div 
              className="h-10 w-10 rounded-full flex-shrink-0 bg-neutral-200 flex items-center justify-center overflow-hidden"
            >
              {sender.imageUrl ? (
                <img
                  src={sender.imageUrl}
                  alt={sender.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold text-neutral-600">
                  {sender.name.charAt(0)}
                </span>
              )}
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{sender.name}</p>
                  <p className="text-sm text-neutral-500">{sender.email}</p>
                </div>
                
                <div className="text-sm text-neutral-500 flex items-center">
                  <span>{formattedDate}</span>
                  <button 
                    className={cn("ml-2", isStarred ? "text-[#eab308]" : "text-neutral-300 hover:text-[#eab308]")}
                    onClick={handleStarClick}
                    style={{ color: isStarred ? starColor : undefined }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex mt-1">
                <div className="flex items-center">
                  <span className="text-sm text-neutral-500">To:</span>
                  <span className="ml-1 text-sm text-neutral-700">
                    {recipients.filter(r => r.type === "to").map(r => r.contact.name).join(", ") || "me"}
                  </span>
                </div>
              </div>
              
              {/* Tags */}
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
          </div>
        </div>
        
        {/* Email Body */}
        <div 
          className="prose max-w-none text-neutral-800" 
          dangerouslySetInnerHTML={{ __html: body }}
        />
        
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-6 border-t border-neutral-200 pt-4">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">
              Attachments ({attachments.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {attachments.map((attachment, index) => (
                <div 
                  key={index}
                  className="border border-neutral-200 rounded-lg overflow-hidden w-40 group hover:border-primary transition-colors"
                >
                  <div className="bg-neutral-50 p-2 flex justify-center items-center h-24">
                    {getFileIcon(attachment.type)}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-neutral-700 truncate">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatEmailSize(attachment.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
