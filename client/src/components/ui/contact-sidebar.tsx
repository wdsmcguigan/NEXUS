import * as React from "react";
import { Button } from "./button";
import { X, Phone, Mail, MessageSquare, Plus } from "lucide-react";

export interface ContactInfoProps {
  contact: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    position?: string;
    location?: string;
    imageUrl?: string;
  };
  recentEmails?: {
    id: number;
    subject: string;
    date: Date | string;
    isSelected?: boolean;
  }[];
  visible: boolean;
  onClose: () => void;
  onEmailSelect?: (id: number) => void;
  onAddToTasksClick?: () => void;
}

export function ContactSidebar({
  contact,
  recentEmails = [],
  visible,
  onClose,
  onEmailSelect,
  onAddToTasksClick
}: ContactInfoProps) {
  return (
    <div className={`bg-white border-l border-neutral-200 h-full transition-all duration-300 overflow-hidden ${visible ? 'w-80' : 'w-0'}`}>
      {visible && (
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-800">Contact Information</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
            >
              <X className="h-5 w-5 text-neutral-500" />
            </Button>
          </div>
          
          {/* Contact Details */}
          <div className="flex flex-col items-center mb-6">
            <div className="h-20 w-20 rounded-full flex items-center justify-center bg-neutral-200 overflow-hidden">
              {contact.imageUrl ? (
                <img 
                  src={contact.imageUrl} 
                  alt={contact.name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-neutral-600">
                  {contact.name.charAt(0)}
                </span>
              )}
            </div>
            
            <h3 className="mt-3 text-lg font-medium text-neutral-900">{contact.name}</h3>
            {contact.position && (
              <p className="text-sm text-neutral-500">{contact.position}</p>
            )}
            
            <div className="mt-3 flex space-x-2">
              {contact.phone && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 border-transparent"
                >
                  <Phone className="h-5 w-5" />
                </Button>
              )}
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 border-transparent"
              >
                <Mail className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-green-50 text-green-600 hover:bg-green-100 border-transparent"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Contact Info List */}
          <div className="space-y-3 text-sm">
            <div className="flex">
              <span className="text-neutral-500 w-24">Email:</span>
              <span className="text-neutral-800 flex-1">{contact.email}</span>
            </div>
            
            {contact.phone && (
              <div className="flex">
                <span className="text-neutral-500 w-24">Phone:</span>
                <span className="text-neutral-800 flex-1">{contact.phone}</span>
              </div>
            )}
            
            {contact.company && (
              <div className="flex">
                <span className="text-neutral-500 w-24">Company:</span>
                <span className="text-neutral-800 flex-1">{contact.company}</span>
              </div>
            )}
            
            {contact.location && (
              <div className="flex">
                <span className="text-neutral-500 w-24">Location:</span>
                <span className="text-neutral-800 flex-1">{contact.location}</span>
              </div>
            )}
          </div>
          
          {/* Recent Communications */}
          {recentEmails.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Recent Emails</h3>
              <ul className="space-y-2">
                {recentEmails.map((email) => (
                  <li 
                    key={email.id}
                    className={`border-l-2 ${email.isSelected ? 'border-primary' : 'border-neutral-200'} pl-3 cursor-pointer hover:bg-neutral-50 py-1`}
                    onClick={() => onEmailSelect && onEmailSelect(email.id)}
                  >
                    <p className="text-sm font-medium text-neutral-800 truncate">{email.subject}</p>
                    <p className="text-xs text-neutral-500">
                      {typeof email.date === 'string' 
                        ? email.date 
                        : new Intl.DateTimeFormat('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }).format(email.date)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Add to Task List */}
          <div className="mt-auto pt-4 border-t border-neutral-200">
            <Button 
              variant="outline" 
              className="w-full bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-medium"
              onClick={onAddToTasksClick}
            >
              <Plus className="h-5 w-5 mr-2 text-neutral-500" />
              Add to Tasks
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
