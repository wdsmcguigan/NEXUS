import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accountTypeEnum = pgEnum('account_type', ['work', 'personal', 'school']);
export type AccountType = 'work' | 'personal' | 'school';

export const categoryEnum = pgEnum('category', ['primary', 'social', 'promotions', 'updates']);
export type Category = 'primary' | 'social' | 'promotions' | 'updates';

export const emailPriorityEnum = pgEnum('email_priority', ['high', 'medium', 'low', 'none']);
export type EmailPriority = 'high' | 'medium' | 'low' | 'none';

export const starColorEnum = pgEnum('star_color', ['red', 'orange', 'gold', 'green', 'blue', 'none']);
export type StarColor = 'red' | 'orange' | 'gold' | 'green' | 'blue' | 'none';

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  avatarInitials: text("avatar_initials").notNull(),
});

// Email accounts table
export const emailAccounts = pgTable("email_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  email: text("email").notNull().unique(),
  accountType: accountTypeEnum("account_type").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Contacts table
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("job_title"),
  website: text("website"),
  notes: text("notes"),
  avatarInitials: text("avatar_initials").notNull(),
  avatarColor: text("avatar_color").notNull(),
});

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  parentId: integer("parent_id").references(() => tags.id),
});

// Emails table
export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => emailAccounts.id),
  fromContactId: integer("from_contact_id").notNull().references(() => contacts.id),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  isRead: boolean("is_read").notNull().default(false),
  category: categoryEnum("category").notNull().default('primary'),
  starColor: starColorEnum("star_color").notNull().default('none'),
  priority: emailPriorityEnum("priority").notNull().default('none'),
  isTrashed: boolean("is_trashed").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
});

// Email recipients
export const emailRecipients = pgTable("email_recipients", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").notNull().references(() => emails.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  recipientType: text("recipient_type").notNull(), // "to", "cc", "bcc"
});

// Email attachments
export const emailAttachments = pgTable("email_attachments", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").notNull().references(() => emails.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileContent: text("file_content").notNull(),
});

// Email tags
export const emailTags = pgTable("email_tags", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").notNull().references(() => emails.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
});

// User preferences
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  theme: text("theme").notNull().default('light'),
  selectedAccount: integer("selected_account").references(() => emailAccounts.id),
  leftSidebarWidth: integer("left_sidebar_width").notNull().default(250),
  rightSidebarWidth: integer("right_sidebar_width").notNull().default(300),
  bottomPaneHeight: integer("bottom_pane_height").notNull().default(60),
  emailListWidth: integer("email_list_width").notNull().default(350),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatarInitials: true,
});

export const insertEmailAccountSchema = createInsertSchema(emailAccounts).pick({
  userId: true,
  email: true,
  accountType: true,
  isActive: true,
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  name: true,
  email: true,
  phone: true,
  company: true,
  jobTitle: true,
  website: true,
  notes: true,
  avatarInitials: true,
  avatarColor: true,
});

export const insertTagSchema = createInsertSchema(tags).pick({
  userId: true,
  name: true,
  parentId: true,
});

export const insertEmailSchema = createInsertSchema(emails).pick({
  accountId: true,
  fromContactId: true,
  subject: true,
  body: true,
  timestamp: true,
  isRead: true,
  category: true,
  starColor: true,
  priority: true,
  isTrashed: true,
  isArchived: true,
});

export const insertEmailRecipientSchema = createInsertSchema(emailRecipients).pick({
  emailId: true,
  contactId: true,
  recipientType: true,
});

export const insertEmailAttachmentSchema = createInsertSchema(emailAttachments).pick({
  emailId: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  fileContent: true,
});

export const insertEmailTagSchema = createInsertSchema(emailTags).pick({
  emailId: true,
  tagId: true,
});

export const insertUserPreferenceSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  theme: true,
  selectedAccount: true,
  leftSidebarWidth: true,
  rightSidebarWidth: true,
  bottomPaneHeight: true,
  emailListWidth: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;
export type EmailAccount = typeof emailAccounts.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

export type InsertEmailRecipient = z.infer<typeof insertEmailRecipientSchema>;
export type EmailRecipient = typeof emailRecipients.$inferSelect;

export type InsertEmailAttachment = z.infer<typeof insertEmailAttachmentSchema>;
export type EmailAttachment = typeof emailAttachments.$inferSelect;

export type InsertEmailTag = z.infer<typeof insertEmailTagSchema>;
export type EmailTag = typeof emailTags.$inferSelect;

export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;
export type UserPreference = typeof userPreferences.$inferSelect;

// Extended types for frontend use
export type EmailWithDetails = Email & {
  fromContact: Contact;
  recipients: (EmailRecipient & { contact: Contact })[];
  attachments: EmailAttachment[];
  tags: (EmailTag & { tag: Tag })[];
};

export type TagWithChildren = Tag & {
  children?: TagWithChildren[];
};
