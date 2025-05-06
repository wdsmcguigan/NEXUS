/**
 * Schema types for the application
 */

// Email data types
export type StarColor = 'none' | 'gold' | 'green' | 'blue' | 'orange' | 'red';

export interface Email {
  id: number;
  accountId: number;
  fromContactId: number;
  subject: string;
  body: string;
  snippet?: string;
  timestamp?: string;
  category?: string;
  isRead: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
  isStarred?: boolean;
  starColor?: StarColor;
  todoText?: string | null;
  todoCompleted?: boolean;
  labels?: string[];
  folder?: string;
  tags?: any[];
  attachments?: EmailAttachment[];
  fromName?: string;
  fromEmail?: string;
  fromContact?: Contact;
  recipients?: EmailRecipient[];
}

// Extended email details with additional information
export interface EmailWithDetails extends Email {
  fromContact?: Contact;
  recipients?: EmailRecipient[];
  tags?: EmailTagAssociation[];
}

export interface EmailRecipient {
  id: number;
  emailId: number;
  contactId: number;
  type: 'to' | 'cc' | 'bcc';
  contact: Contact;
}

export interface EmailTagAssociation {
  id: number;
  emailId: number;
  tagId: number;
  tag: Tag;
}

export interface Tag {
  id: number;
  name: string;
  parentId: number | null;
  bgColor: string;
  textColor: string;
  emoji: string | null;
}

export interface EmailAttachment {
  id: number;
  emailId: number;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface EmailFolder {
  id: string;
  name: string;
  count: number;
  icon?: string;
}

export interface EmailLabel {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface EmailTag {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface EmailAccount {
  id: number;
  email: string;
  name: string;
  defaultAccount: boolean;
  provider: string;
  folders: EmailFolder[];
  labels: EmailLabel[];
  signature?: string;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  avatar?: string;
  notes?: string;
  tags: string[];
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  layout: any; // Layout configuration
  defaultAccount: number;
  notificationsEnabled: boolean;
  soundsEnabled: boolean;
  composeDefaults: {
    signature: boolean;
    format: 'html' | 'plain';
    font: string;
    fontSize: number;
  };
}

export interface SearchFilter {
  id: string;
  name: string;
  query: string;
  isSaved: boolean;
  icon?: string;
}

// Template types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  tags: string[];
  isDefault: boolean;
  lastUsed?: string;
}

// Integration types
export interface Integration {
  id: string;
  name: string;
  type: string;
  isEnabled: boolean;
  settings: Record<string, any>;
}