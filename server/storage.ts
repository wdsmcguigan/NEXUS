import {
  users, type User, type InsertUser,
  emailAccounts, type EmailAccount, type InsertEmailAccount,
  contacts, type Contact, type InsertContact,
  tags, type Tag, type InsertTag,
  emails, type Email, type InsertEmail, type EmailWithDetails,
  emailRecipients, type EmailRecipient, type InsertEmailRecipient,
  emailAttachments, type EmailAttachment, type InsertEmailAttachment,
  emailTags, type EmailTag, type InsertEmailTag,
  userPreferences, type UserPreference, type InsertUserPreference,
  type TagWithChildren, type Category, type StarColor
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Email Accounts
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  getEmailAccount(id: number): Promise<EmailAccount | undefined>;
  getEmailAccountsByUserId(userId: number): Promise<EmailAccount[]>;

  // Contacts
  createContact(contact: InsertContact): Promise<Contact>;
  getContact(id: number): Promise<Contact | undefined>;
  getContactByEmail(email: string): Promise<Contact | undefined>;

  // Tags
  createTag(tag: InsertTag): Promise<Tag>;
  getTag(id: number): Promise<Tag | undefined>;
  getTagsByUserId(userId: number): Promise<TagWithChildren[]>;

  // Emails
  createEmail(email: InsertEmail): Promise<Email>;
  getEmail(id: number): Promise<Email | undefined>;
  getEmailWithDetails(id: number): Promise<EmailWithDetails | undefined>;
  getEmailsByAccountId(accountId: number, category?: string): Promise<Email[]>;
  updateEmailStar(id: number, starColor: StarColor): Promise<Email>;
  updateEmailReadStatus(id: number, isRead: boolean): Promise<Email>;
  archiveEmail(id: number): Promise<Email>;
  trashEmail(id: number): Promise<Email>;
  
  // Email Todos
  addTodoToEmail(id: number, todoText: string): Promise<Email>;
  updateTodoStatus(id: number, todoCompleted: boolean): Promise<Email>;
  removeTodoFromEmail(id: number): Promise<Email>;
  getEmailsWithTodos(userId: number): Promise<Email[]>;

  // Email Recipients
  addRecipientToEmail(recipient: InsertEmailRecipient): Promise<EmailRecipient>;

  // Email Attachments
  addAttachmentToEmail(attachment: InsertEmailAttachment): Promise<EmailAttachment>;

  // Email Tags
  addTagToEmail(emailTag: InsertEmailTag): Promise<EmailTag>;
  removeTagFromEmail(emailId: number, tagId: number): Promise<void>;

  // User Preferences
  saveUserPreferences(preferences: InsertUserPreference): Promise<UserPreference>;
  getUserPreferences(userId: number): Promise<UserPreference | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private emailAccountsData: Map<number, EmailAccount>;
  private contactsData: Map<number, Contact>;
  private tagsData: Map<number, Tag>;
  private emailsData: Map<number, Email>;
  private emailRecipientsData: Map<number, EmailRecipient>;
  private emailAttachmentsData: Map<number, EmailAttachment>;
  private emailTagsData: Map<number, EmailTag>;
  private userPreferencesData: Map<number, UserPreference>;

  private currentUserId: number;
  private currentEmailAccountId: number;
  private currentContactId: number;
  private currentTagId: number;
  private currentEmailId: number;
  private currentEmailRecipientId: number;
  private currentEmailAttachmentId: number;
  private currentEmailTagId: number;
  private currentUserPreferenceId: number;

  constructor() {
    this.usersData = new Map();
    this.emailAccountsData = new Map();
    this.contactsData = new Map();
    this.tagsData = new Map();
    this.emailsData = new Map();
    this.emailRecipientsData = new Map();
    this.emailAttachmentsData = new Map();
    this.emailTagsData = new Map();
    this.userPreferencesData = new Map();

    this.currentUserId = 1;
    this.currentEmailAccountId = 1;
    this.currentContactId = 1;
    this.currentTagId = 1;
    this.currentEmailId = 1;
    this.currentEmailRecipientId = 1;
    this.currentEmailAttachmentId = 1;
    this.currentEmailTagId = 1;
    this.currentUserPreferenceId = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create a user
    const user: User = {
      id: this.currentUserId++,
      username: "johndoe",
      password: "password123",
      displayName: "John Doe",
      avatarInitials: "JD",
    };
    this.usersData.set(user.id, user);

    // Create email accounts
    const workAccount: EmailAccount = {
      id: this.currentEmailAccountId++,
      userId: user.id,
      email: "work@example.com",
      accountType: "work",
      isActive: true,
    };
    this.emailAccountsData.set(workAccount.id, workAccount);

    const personalAccount: EmailAccount = {
      id: this.currentEmailAccountId++,
      userId: user.id,
      email: "personal@gmail.com",
      accountType: "personal",
      isActive: true,
    };
    this.emailAccountsData.set(personalAccount.id, personalAccount);

    const schoolAccount: EmailAccount = {
      id: this.currentEmailAccountId++,
      userId: user.id,
      email: "school@university.edu",
      accountType: "school",
      isActive: true,
    };
    this.emailAccountsData.set(schoolAccount.id, schoolAccount);

    // Create contacts
    const contacts = [
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        company: "Acme Corporation",
        jobTitle: "Marketing Director",
        phone: "(555) 123-4567",
        website: "acme.example.com",
        notes: "- Prefers communication via email\n- Schedule calls in the morning (PST)\n- Interested in content marketing strategies",
        avatarInitials: "SJ",
        avatarColor: "bg-teal-500",
      },
      {
        name: "Michael Chen",
        email: "michael.chen@gmail.com",
        phone: "(555) 987-6543",
        notes: "Friend from hiking group",
        avatarInitials: "MC",
        avatarColor: "bg-blue-500",
      },
      {
        name: "Alex Rodriguez",
        email: "alex.rodriguez@example.com",
        company: "Tech Innovations",
        jobTitle: "Project Manager",
        avatarInitials: "AR",
        avatarColor: "bg-purple-500",
      },
      {
        name: "Priya Patel",
        email: "priya.patel@example.com",
        company: "Global Solutions",
        jobTitle: "Team Lead",
        avatarInitials: "PP",
        avatarColor: "bg-green-500",
      },
      {
        name: "Financial Aid Office",
        email: "financial.aid@university.edu",
        company: "University",
        jobTitle: "Administrative Office",
        avatarInitials: "FA",
        avatarColor: "bg-yellow-500",
      },
      {
        name: "Emily Turner",
        email: "emily.turner@gmail.com",
        notes: "Family member",
        avatarInitials: "ET",
        avatarColor: "bg-red-500",
      },
      {
        name: "Dr. Wilson",
        email: "dr.wilson@university.edu",
        company: "University",
        jobTitle: "Professor",
        avatarInitials: "DW",
        avatarColor: "bg-indigo-500",
      },
      {
        name: "David Lee",
        email: "david.lee@example.com",
        company: "Creative Studios",
        jobTitle: "Design Director",
        avatarInitials: "DL",
        avatarColor: "bg-pink-500",
      },
    ];

    contacts.forEach(contactData => {
      const contact: Contact = {
        id: this.currentContactId++,
        ...contactData,
      };
      this.contactsData.set(contact.id, contact);
    });

    // Create tags hierarchy
    const createTag = (name: string, parentId: number | null = null, bgColor: string = '#e2e8f0', textColor: string = '#000000', emoji: string | null = '🏷️'): Tag => {
      const tag: Tag = {
        id: this.currentTagId++,
        userId: user.id,
        name,
        parentId: parentId,
        bgColor,
        textColor,
        emoji
      };
      this.tagsData.set(tag.id, tag);
      return tag;
    };

    // Create color-themed tags with emojis
    const workTag = createTag("Work", null, '#e1f0ff', '#0369a1', '💼');
    const projectsTag = createTag("Projects", workTag.id, '#e1f0ff', '#0369a1', '📊');
    const clientsTag = createTag("Clients", workTag.id, '#e1f0ff', '#0369a1', '🤝');
    const teamTag = createTag("Team", workTag.id, '#e1f0ff', '#0369a1', '👥');

    const personalTag = createTag("Personal", null, '#fdf4ff', '#a21caf', '🏠');
    const familyTag = createTag("Family", personalTag.id, '#fdf4ff', '#a21caf', '👨‍👩‍👧‍👦');
    const financeTag = createTag("Finance", personalTag.id, '#fdf4ff', '#a21caf', '💰');
    const travelTag = createTag("Travel", personalTag.id, '#fdf4ff', '#a21caf', '✈️');

    const newslettersTag = createTag("Newsletters", null, '#ecfdf5', '#047857', '📰');
    const schoolTag = createTag("School", null, '#fef2f2', '#b91c1c', '🎓');
    const urgentTag = createTag("Urgent", null, '#fee2e2', '#dc2626', '⚠️');
    const todoTag = createTag("Todo", null, '#fef3c7', '#d97706', '✅');

    // Create email data
    const createEmail = (
      accountId: number,
      fromContactId: number,
      subject: string,
      body: string,
      timestamp: Date,
      category: Category = "primary",
      starColor: StarColor = "none",
      isRead: boolean = false,
      hasTodo: boolean = false,
      todoText: string | null = null,
      todoCompleted: boolean = false,
      tags: number[] = []
    ): Email => {
      const email: Email = {
        id: this.currentEmailId++,
        accountId,
        fromContactId,
        subject,
        body,
        timestamp,
        isRead,
        category,
        starColor,
        priority: "none",
        isTrashed: false,
        isArchived: false,
        hasTodo,
        todoText,
        todoCompleted,
      };
      this.emailsData.set(email.id, email);
      
      // Add tags to the email if provided
      if (tags.length > 0) {
        tags.forEach(tagId => {
          const emailTag: EmailTag = {
            id: this.currentEmailTagId++,
            emailId: email.id,
            tagId: tagId
          };
          this.emailTagsData.set(emailTag.id, emailTag);
        });
      }
      
      return email;
    };

    // Find contacts by name
    const findContactByName = (name: string): Contact => {
      return Array.from(this.contactsData.values()).find(c => c.name === name)!;
    };

    // Create emails from contacts
    createEmail(
      workAccount.id,
      findContactByName("Sarah Johnson").id,
      "Q3 Marketing Campaign Review",
      `Hi Team,\n\nI've reviewed the Q3 marketing plan and have some feedback on our digital strategy. Can we discuss the social media campaign timing? I think we should align it better with the product launch in August.\n\nHere are my main observations:\n\n- The content calendar needs more variety - we're relying too heavily on product features and not enough on customer stories.\n- Budget allocation seems weighted toward traditional channels, but our Q2 results showed better ROI from digital.\n- The influencer strategy needs refinement - let's focus on micro-influencers with higher engagement rather than reach alone.\n- We should increase our A/B testing budget to optimize landing page conversions before scaling the paid campaigns.\n\nI've attached a revised budget proposal and content calendar for your review. Could we schedule a meeting tomorrow to discuss these changes?\n\nAlso, I'd like to get everyone's thoughts on bringing forward the podcast launch. The production team says they can be ready by mid-July instead of September.\n\nLooking forward to your feedback.\n\nBest regards,\nSarah`,
      new Date("2023-06-20T10:42:00"),
      "primary",
      "gold",
      true,
      false,
      null,
      false,
      [workTag.id, projectsTag.id]
    );

    createEmail(
      personalAccount.id,
      findContactByName("Michael Chen").id,
      "Weekend hiking plans",
      "Hey! Are we still on for hiking this weekend? The weather forecast looks good for Saturday morning. I found a new trail we could try.",
      new Date("2023-06-20T09:15:00"),
      "primary",
      "none",
      false,
      false,
      null,
      false,
      [personalTag.id, travelTag.id]
    );

    createEmail(
      workAccount.id,
      findContactByName("Alex Rodriguez").id,
      "Project status update",
      "Here's the latest status report for the client project. We're on track for the deliverables but there might be a delay with the API integration.",
      new Date("2023-06-19T14:30:00"),
      "primary",
      "red",
      false,
      true,
      "Follow up with dev team about API integration delay",
      false,
      [workTag.id, clientsTag.id, urgentTag.id, todoTag.id]
    );

    createEmail(
      workAccount.id,
      findContactByName("Priya Patel").id,
      "Team meeting agenda",
      "Attached is the agenda for tomorrow's team meeting. Please review the topics and let me know if you'd like to add anything else for discussion.",
      new Date("2023-06-19T11:20:00"),
      "primary",
      "none",
      false,
      false,
      null,
      false,
      [workTag.id, teamTag.id]
    );

    createEmail(
      schoolAccount.id,
      findContactByName("Financial Aid Office").id,
      "Scholarship application deadline",
      "This is a reminder that the application deadline for the merit scholarship is approaching. All materials must be submitted by next Friday.",
      new Date("2023-06-17T09:00:00"),
      "primary",
      "none",
      false,
      false,
      null,
      false,
      [schoolTag.id, urgentTag.id]
    );

    createEmail(
      personalAccount.id,
      findContactByName("Emily Turner").id,
      "Family dinner on Sunday?",
      "Hi! Mom and Dad are planning a family dinner this Sunday at 6 PM. Are you able to make it? Please let me know so I can tell them.",
      new Date("2023-06-17T16:45:00"),
      "primary",
      "green",
      false,
      false,
      null,
      false,
      [personalTag.id, familyTag.id]
    );

    createEmail(
      schoolAccount.id,
      findContactByName("Dr. Wilson").id,
      "Course registration reminder",
      "Just a reminder that course registration for the fall semester opens next Monday. As your advisor, I recommend scheduling a meeting to discuss your options.",
      new Date("2023-05-12T13:10:00"),
      "primary",
      "none",
      true,
      false,
      null,
      false,
      [schoolTag.id]
    );

    createEmail(
      workAccount.id,
      findContactByName("David Lee").id,
      "Client presentation feedback",
      "Great job on the client presentation yesterday! I've compiled the feedback from the team and have some suggestions for the next iteration.",
      new Date("2023-05-10T15:30:00"),
      "primary",
      "orange",
      true,
      false,
      null,
      false,
      [workTag.id, clientsTag.id]
    );

    // Create user preferences
    const preferences: UserPreference = {
      id: this.currentUserPreferenceId++,
      userId: user.id,
      theme: "light",
      selectedAccount: workAccount.id,
      leftSidebarWidth: 250,
      rightSidebarWidth: 300,
      bottomPaneHeight: 60,
      emailListWidth: 350,
    };
    this.userPreferencesData.set(preferences.id, preferences);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.usersData.set(id, user);
    return user;
  }

  // Email Account methods
  async createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount> {
    const id = this.currentEmailAccountId++;
    const emailAccount: EmailAccount = { ...account, id };
    this.emailAccountsData.set(id, emailAccount);
    return emailAccount;
  }

  async getEmailAccount(id: number): Promise<EmailAccount | undefined> {
    return this.emailAccountsData.get(id);
  }

  async getEmailAccountsByUserId(userId: number): Promise<EmailAccount[]> {
    return Array.from(this.emailAccountsData.values()).filter(
      (account) => account.userId === userId
    );
  }

  // Contact methods
  async createContact(contact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const newContact: Contact = { ...contact, id };
    this.contactsData.set(id, newContact);
    return newContact;
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contactsData.get(id);
  }

  async getContactByEmail(email: string): Promise<Contact | undefined> {
    return Array.from(this.contactsData.values()).find(
      (contact) => contact.email === email
    );
  }

  // Tag methods
  async createTag(tag: InsertTag): Promise<Tag> {
    const id = this.currentTagId++;
    const newTag: Tag = { ...tag, id };
    this.tagsData.set(id, newTag);
    return newTag;
  }

  async getTag(id: number): Promise<Tag | undefined> {
    return this.tagsData.get(id);
  }

  async getTagsByUserId(userId: number): Promise<TagWithChildren[]> {
    const userTags = Array.from(this.tagsData.values()).filter(
      (tag) => tag.userId === userId
    );

    // Create a map for quick lookup
    const tagMap = new Map<number, TagWithChildren>();
    userTags.forEach((tag) => {
      tagMap.set(tag.id, { ...tag, children: [] });
    });

    // Build the hierarchy
    const rootTags: TagWithChildren[] = [];
    tagMap.forEach((tag) => {
      if (tag.parentId === null) {
        rootTags.push(tag);
      } else {
        const parent = tagMap.get(tag.parentId);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(tag);
        }
      }
    });

    return rootTags;
  }

  // Email methods
  async createEmail(email: InsertEmail): Promise<Email> {
    const id = this.currentEmailId++;
    const newEmail: Email = { ...email, id };
    this.emailsData.set(id, newEmail);
    return newEmail;
  }

  async getEmail(id: number): Promise<Email | undefined> {
    return this.emailsData.get(id);
  }

  async getEmailWithDetails(id: number): Promise<EmailWithDetails | undefined> {
    const email = this.emailsData.get(id);
    if (!email) return undefined;

    const fromContact = this.contactsData.get(email.fromContactId);
    if (!fromContact) return undefined;

    const recipients = Array.from(this.emailRecipientsData.values())
      .filter((recipient) => recipient.emailId === id)
      .map((recipient) => {
        const contact = this.contactsData.get(recipient.contactId);
        return { ...recipient, contact: contact! };
      });

    const attachments = Array.from(this.emailAttachmentsData.values()).filter(
      (attachment) => attachment.emailId === id
    );

    const emailTags = Array.from(this.emailTagsData.values())
      .filter((emailTag) => emailTag.emailId === id)
      .map((emailTag) => {
        const tag = this.tagsData.get(emailTag.tagId);
        return { ...emailTag, tag: tag! };
      });

    return {
      ...email,
      fromContact,
      recipients,
      attachments,
      tags: emailTags,
    };
  }

  async getEmailsByAccountId(accountId: number, category?: string): Promise<(Email & { fromContact?: any, tags?: any[] })[]> {
    // Get base emails
    const emails = Array.from(this.emailsData.values()).filter(
      (email) => email.accountId === accountId && !email.isTrashed && !email.isArchived
    );

    // Filter by category if specified
    const filteredEmails = category 
      ? emails.filter((email) => email.category === category)
      : emails;
    
    // Enhance emails with contact and tag information
    return Promise.all(filteredEmails.map(async (email) => {
      // Get from contact
      const fromContact = this.contactsData.get(email.fromContactId);
      
      // Get tags
      const emailTags = Array.from(this.emailTagsData.values())
        .filter((emailTag) => emailTag.emailId === email.id)
        .map((emailTag) => {
          const tag = this.tagsData.get(emailTag.tagId);
          return { ...emailTag, tag };
        });
      
      return {
        ...email,
        fromContact,
        tags: emailTags
      };
    }));
  }

  async updateEmailStar(id: number, starColor: StarColor): Promise<Email> {
    const email = this.emailsData.get(id);
    if (!email) {
      throw new Error("Email not found");
    }

    const updatedEmail = { ...email, starColor };
    this.emailsData.set(id, updatedEmail);
    return updatedEmail;
  }

  async updateEmailReadStatus(id: number, isRead: boolean): Promise<Email> {
    const email = this.emailsData.get(id);
    if (!email) {
      throw new Error("Email not found");
    }

    const updatedEmail = { ...email, isRead };
    this.emailsData.set(id, updatedEmail);
    return updatedEmail;
  }

  async archiveEmail(id: number): Promise<Email> {
    const email = this.emailsData.get(id);
    if (!email) {
      throw new Error("Email not found");
    }

    const updatedEmail = { ...email, isArchived: true };
    this.emailsData.set(id, updatedEmail);
    return updatedEmail;
  }

  async trashEmail(id: number): Promise<Email> {
    const email = this.emailsData.get(id);
    if (!email) {
      throw new Error("Email not found");
    }

    const updatedEmail = { ...email, isTrashed: true };
    this.emailsData.set(id, updatedEmail);
    return updatedEmail;
  }
  
  async addTodoToEmail(id: number, todoText: string): Promise<Email> {
    const email = this.emailsData.get(id);
    if (!email) {
      throw new Error("Email not found");
    }

    const updatedEmail = { ...email, hasTodo: true, todoText, todoCompleted: false };
    this.emailsData.set(id, updatedEmail);
    return updatedEmail;
  }
  
  async updateTodoStatus(id: number, todoCompleted: boolean): Promise<Email> {
    const email = this.emailsData.get(id);
    if (!email) {
      throw new Error("Email not found");
    }
    
    if (!email.hasTodo) {
      throw new Error("Email does not have a todo");
    }

    const updatedEmail = { ...email, todoCompleted };
    this.emailsData.set(id, updatedEmail);
    return updatedEmail;
  }
  
  async removeTodoFromEmail(id: number): Promise<Email> {
    const email = this.emailsData.get(id);
    if (!email) {
      throw new Error("Email not found");
    }

    const updatedEmail = { ...email, hasTodo: false, todoText: null, todoCompleted: false };
    this.emailsData.set(id, updatedEmail);
    return updatedEmail;
  }
  
  async getEmailsWithTodos(userId: number): Promise<Email[]> {
    const userAccounts = await this.getEmailAccountsByUserId(userId);
    const accountIds = userAccounts.map(account => account.id);
    
    return Array.from(this.emailsData.values()).filter(
      email => accountIds.includes(email.accountId) && 
               email.hasTodo &&
               !email.isTrashed && 
               !email.isArchived
    );
  }

  // Email Recipients methods
  async addRecipientToEmail(recipient: InsertEmailRecipient): Promise<EmailRecipient> {
    const id = this.currentEmailRecipientId++;
    const newRecipient: EmailRecipient = { ...recipient, id };
    this.emailRecipientsData.set(id, newRecipient);
    return newRecipient;
  }

  // Email Attachments methods
  async addAttachmentToEmail(attachment: InsertEmailAttachment): Promise<EmailAttachment> {
    const id = this.currentEmailAttachmentId++;
    const newAttachment: EmailAttachment = { ...attachment, id };
    this.emailAttachmentsData.set(id, newAttachment);
    return newAttachment;
  }

  // Email Tags methods
  async addTagToEmail(emailTag: InsertEmailTag): Promise<EmailTag> {
    const id = this.currentEmailTagId++;
    const newEmailTag: EmailTag = { ...emailTag, id };
    this.emailTagsData.set(id, newEmailTag);
    return newEmailTag;
  }

  async removeTagFromEmail(emailId: number, tagId: number): Promise<void> {
    const emailTagToRemove = Array.from(this.emailTagsData.values()).find(
      (emailTag) => emailTag.emailId === emailId && emailTag.tagId === tagId
    );

    if (emailTagToRemove) {
      this.emailTagsData.delete(emailTagToRemove.id);
    }
  }

  // User Preferences methods
  async saveUserPreferences(preferences: InsertUserPreference): Promise<UserPreference> {
    // Check if preferences already exist for this user
    const existingPreferences = Array.from(this.userPreferencesData.values()).find(
      (pref) => pref.userId === preferences.userId
    );

    if (existingPreferences) {
      // Update existing preferences
      const updatedPreferences = { ...existingPreferences, ...preferences };
      this.userPreferencesData.set(existingPreferences.id, updatedPreferences);
      return updatedPreferences;
    } else {
      // Create new preferences
      const id = this.currentUserPreferenceId++;
      const newPreferences: UserPreference = { ...preferences, id };
      this.userPreferencesData.set(id, newPreferences);
      return newPreferences;
    }
  }

  async getUserPreferences(userId: number): Promise<UserPreference | undefined> {
    return Array.from(this.userPreferencesData.values()).find(
      (pref) => pref.userId === userId
    );
  }
}

export const storage = new MemStorage();
