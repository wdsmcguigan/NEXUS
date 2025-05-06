/**
 * Schema types for the application
 */

// Email data types
export interface Email {
  id: number;
  accountId: number;
  fromContactId: number;
  subject: string;
  body: string;
  snippet: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  starColor?: string;
  labels: string[];
  folder: string;
  tags: string[];
  attachments: EmailAttachment[];
  fromName?: string;
  fromEmail?: string;
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