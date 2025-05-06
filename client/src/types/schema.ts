/**
 * Schema types for the client side application
 * These types match the server-side types in shared/schema.ts
 */

// Enums
export type AccountType = 'work' | 'personal' | 'school';
export type Category = 'primary' | 'social' | 'promotions' | 'updates';
export type EmailPriority = 'high' | 'medium' | 'low' | 'none';
export type StarColor = 'red' | 'orange' | 'gold' | 'green' | 'blue' | 'none';

// User
export interface User {
  id: number;
  username: string;
  displayName: string;
  email: string;
}

// Email Account
export interface EmailAccount {
  id: number;
  userId: number;
  email: string;
  name: string;
  type: AccountType;
  isDefault: boolean;
  smtpServer?: string | null;
  smtpPort?: number | null;
  imapServer?: string | null;
  imapPort?: number | null;
}

// Contact
export interface Contact {
  id: number;
  name: string;
  email: string;
  company?: string | null;
  avatarUrl?: string | null;
  notes?: string | null;
}

// Tag
export interface Tag {
  id: number;
  userId: number;
  name: string;
  parentId?: number | null;
  bgColor: string;
  textColor: string;
  emoji?: string | null;
}

export type TagType = Tag;

// Email
export interface Email {
  id: number;
  accountId: number;
  fromContactId: number;
  subject: string;
  body?: string | null;
  timestamp: string;
  category: Category;
  isRead: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  starColor: StarColor;
  todoText?: string | null;
  todoCompleted: boolean;
}

// Email Recipient
export interface EmailRecipient {
  id: number;
  emailId: number;
  contactId: number;
  type: 'to' | 'cc' | 'bcc';
  contact?: Contact;
}

// Email Attachment
export interface EmailAttachment {
  id: number;
  emailId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileContent?: string;
}

// Email Tag
export interface EmailTag {
  id: number;
  emailId: number;
  tagId: number;
  tag?: Tag;
}

// User Preference
export interface UserPreference {
  id: number;
  userId: number;
  theme: string;
  layout: string;
  signature?: string | null;
  defaultAccountId?: number | null;
  emailsPerPage: number;
  showNotifications: boolean;
}

// Detailed Email with relationships
export interface EmailWithDetails extends Email {
  fromContact: Contact;
  recipients: (EmailRecipient & { contact: Contact })[];
  attachments: EmailAttachment[];
  tags: (EmailTag & { tag: Tag })[];
}

// Tag with children for hierarchical display
export interface TagWithChildren extends Tag {
  children?: TagWithChildren[];
}