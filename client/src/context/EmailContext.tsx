import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { 
  User, 
  EmailAccount, 
  Email, 
  EmailWithDetails, 
  UserPreference, 
  TagWithChildren,
  Category,
  StarColor
} from '@shared/schema';

// Define context types
type MailboxType = 'all' | 'inbox' | 'starred' | 'sent' | 'drafts' | 'trash' | 'archived' | 'todo';

interface EmailContextState {
  userId: number;
  user: User | null;
  accounts: EmailAccount[];
  selectedAccount: EmailAccount | null;
  emails: Email[];
  selectedEmail: EmailWithDetails | null;
  preferences: UserPreference | null;
  tags: TagWithChildren[];
  selectedMailbox: MailboxType;
  selectedCategory: Category;
  isLoading: boolean;
  error: string | null;
}

interface EmailContextActions {
  setSelectedAccount: (account: EmailAccount) => void;
  setSelectedEmail: (email: Email | null) => void;
  setSelectedMailbox: (mailbox: MailboxType) => void;
  setSelectedCategory: (category: Category) => void;
  toggleEmailStar: (email: Email) => void;
  markEmailAsRead: (email: Email) => void;
  archiveEmail: (email: Email) => void;
  trashEmail: (email: Email) => void;
  updatePreferences: (partialPrefs: Partial<UserPreference>) => void;
  initializeEmailContext: (data: {
    user: User;
    accounts: EmailAccount[];
    preferences: UserPreference;
    tags: TagWithChildren[];
  }) => void;
}

type EmailContextType = EmailContextState & EmailContextActions;

// Create context
const EmailContext = createContext<EmailContextType | undefined>(undefined);

// Context provider component
interface EmailProviderProps {
  children: ReactNode;
}

export const EmailProvider: React.FC<EmailProviderProps> = ({ children }) => {
  // State initialization
  const [userId] = useState<number>(1); // Default user ID for demo
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailWithDetails | null>(null);
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [tags, setTags] = useState<TagWithChildren[]>([]);
  const [selectedMailbox, setSelectedMailbox] = useState<MailboxType>('inbox');
  const [selectedCategory, setSelectedCategory] = useState<Category>('primary');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize context with fetched data
  const initializeEmailContext = useCallback((data: {
    user: User;
    accounts: EmailAccount[];
    preferences: UserPreference;
    tags: TagWithChildren[];
  }) => {
    setUser(data.user);
    setAccounts(data.accounts);
    
    // Set selected account based on preferences or default to first account
    const preferredAccount = data.accounts.find(
      account => account.id === data.preferences.selectedAccount
    );
    const accountToSelect = preferredAccount || data.accounts[0];
    setSelectedAccount(accountToSelect);
    
    setPreferences(data.preferences);
    setTags(data.tags);
    
    // Set default mailbox to 'all'
    setSelectedMailbox('all');
    
    // Fetch emails for the selected account
    if (accountToSelect) {
      fetchEmails(accountToSelect.id, 'primary');
    }
  }, []);

  // Fetch emails for a specific account and category
  const fetchEmails = useCallback(async (accountId: number, category?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = category 
        ? `/api/emails/account/${accountId}?category=${category}`
        : `/api/emails/account/${accountId}`;
        
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch emails: ${response.statusText}`);
      }
      
      const data = await response.json();
      setEmails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching emails');
      console.error('Error fetching emails:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update selected account and fetch its emails
  const handleSelectAccount = useCallback((account: EmailAccount) => {
    setSelectedAccount(account);
    setSelectedEmail(null);
    fetchEmails(account.id, selectedCategory);
    
    // Update user preferences
    if (preferences) {
      updatePreferences({ selectedAccount: account.id });
    }
  }, [selectedCategory, preferences]);

  // Update selected email with full details
  const handleSelectEmail = useCallback(async (email: Email | null) => {
    if (!email) {
      setSelectedEmail(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/emails/${email.id}`, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch email details: ${response.statusText}`);
      }
      
      const emailWithDetails = await response.json();
      setSelectedEmail(emailWithDetails);
      
      // Mark as read if not already read
      if (!email.isRead) {
        markEmailAsRead(email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching email details');
      console.error('Error fetching email details:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update selected mailbox
  const handleSelectMailbox = useCallback((mailbox: MailboxType) => {
    setSelectedMailbox(mailbox);
    setSelectedEmail(null);
    
    // Fetch emails for the selected mailbox based on filters
    if (selectedAccount) {
      if (mailbox === 'all') {
        // Fetch all emails for the account (without filtering by category)
        fetch(`/api/emails/account/${selectedAccount.id}`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => setEmails(data))
          .catch(err => console.error('Error fetching all emails:', err));
      } else if (mailbox === 'inbox') {
        // Fetch emails using the specified category filter
        fetchEmails(selectedAccount.id, selectedCategory);
      } else if (mailbox === 'starred') {
        // Filter for emails with a star color
        fetch(`/api/emails/account/${selectedAccount.id}`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            const starredEmails = data.filter((email: Email) => email.starColor !== 'none');
            setEmails(starredEmails);
          })
          .catch(err => console.error('Error fetching starred emails:', err));
      } else if (mailbox === 'archived') {
        // Fetch archived emails for the account
        fetch(`/api/emails/account/${selectedAccount.id}/archived`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => setEmails(data))
          .catch(err => {
            console.error('Error fetching archived emails:', err);
            // Fallback to client-side filtering if endpoint doesn't exist
            fetch(`/api/emails/account/${selectedAccount.id}`, { credentials: 'include' })
              .then(res => res.json())
              .then(data => {
                const archivedEmails = data.filter((email: Email) => email.isArchived);
                setEmails(archivedEmails);
              });
          });
      } else if (mailbox === 'todo') {
        // Fetch emails with todos for the account
        fetch(`/api/emails/todos/user/${userId}`, { credentials: 'include' })
          .then(res => res.json())
          .then(data => setEmails(data))
          .catch(err => {
            console.error('Error fetching todo emails:', err);
            // Fallback to client-side filtering if endpoint doesn't exist
            fetch(`/api/emails/account/${selectedAccount.id}`, { credentials: 'include' })
              .then(res => res.json())
              .then(data => {
                const todoEmails = data.filter((email: Email) => email.hasTodo);
                setEmails(todoEmails);
              });
          });
      } else if (mailbox === 'sent' || mailbox === 'drafts' || mailbox === 'trash') {
        // These would need backend support
        // For now, set empty list or implement client-side filtering
        setEmails([]);
      }
    }
  }, [selectedAccount, selectedCategory, userId]);

  // Update selected category
  const handleSelectCategory = useCallback((category: Category) => {
    setSelectedCategory(category);
    setSelectedEmail(null);
    
    if (selectedAccount) {
      fetchEmails(selectedAccount.id, category);
    }
  }, [selectedAccount]);

  // Toggle email star status with 5-color cycling
  const toggleEmailStar = useCallback(async (email: Email) => {
    try {
      // Define the color cycle order
      const starCycle: StarColor[] = ['gold', 'red', 'orange', 'green', 'blue', 'none'];
      
      // Find the current color position in the cycle
      const currentIndex = starCycle.indexOf(email.starColor);
      
      // Get the next color in the cycle, or circle back to the first color
      const nextIndex = (currentIndex + 1) % starCycle.length;
      const newStarColor = starCycle[nextIndex];
      
      // Optimistic update
      const updatedEmails = emails.map(e => 
        e.id === email.id ? { ...e, starColor: newStarColor } : e
      );
      setEmails(updatedEmails);
      
      // Update selected email if it's the same one
      if (selectedEmail && selectedEmail.id === email.id) {
        setSelectedEmail({ ...selectedEmail, starColor: newStarColor });
      }
      
      // API call
      await apiRequest('PATCH', `/api/emails/${email.id}/star`, { starColor: newStarColor });
    } catch (err) {
      // Revert on error
      console.error('Error toggling email star:', err);
      
      // Fetch emails again to get the correct state
      if (selectedAccount) {
        fetchEmails(selectedAccount.id, selectedCategory);
      }
    }
  }, [emails, selectedEmail, selectedAccount, selectedCategory]);

  // Mark email as read
  const markEmailAsRead = useCallback(async (email: Email) => {
    if (email.isRead) return;
    
    try {
      // Optimistic update
      const updatedEmails = emails.map(e => 
        e.id === email.id ? { ...e, isRead: true } : e
      );
      setEmails(updatedEmails);
      
      // API call
      await apiRequest('PATCH', `/api/emails/${email.id}/read`, { isRead: true });
    } catch (err) {
      console.error('Error marking email as read:', err);
      
      // Fetch emails again on error
      if (selectedAccount) {
        fetchEmails(selectedAccount.id, selectedCategory);
      }
    }
  }, [emails, selectedAccount, selectedCategory]);

  // Archive email
  const archiveEmail = useCallback(async (email: Email) => {
    try {
      // Optimistic update
      const updatedEmails = emails.filter(e => e.id !== email.id);
      setEmails(updatedEmails);
      
      // Clear selected email if it's the one being archived
      if (selectedEmail && selectedEmail.id === email.id) {
        setSelectedEmail(null);
      }
      
      // API call
      await apiRequest('PATCH', `/api/emails/${email.id}/archive`, {});
    } catch (err) {
      console.error('Error archiving email:', err);
      
      // Fetch emails again on error
      if (selectedAccount) {
        fetchEmails(selectedAccount.id, selectedCategory);
      }
    }
  }, [emails, selectedEmail, selectedAccount, selectedCategory]);

  // Trash email
  const trashEmail = useCallback(async (email: Email) => {
    try {
      // Optimistic update
      const updatedEmails = emails.filter(e => e.id !== email.id);
      setEmails(updatedEmails);
      
      // Clear selected email if it's the one being trashed
      if (selectedEmail && selectedEmail.id === email.id) {
        setSelectedEmail(null);
      }
      
      // API call
      await apiRequest('PATCH', `/api/emails/${email.id}/trash`, {});
    } catch (err) {
      console.error('Error trashing email:', err);
      
      // Fetch emails again on error
      if (selectedAccount) {
        fetchEmails(selectedAccount.id, selectedCategory);
      }
    }
  }, [emails, selectedEmail, selectedAccount, selectedCategory]);

  // Update user preferences
  const updatePreferences = useCallback(async (partialPrefs: Partial<UserPreference>) => {
    if (!preferences || !userId) return;
    
    try {
      // Optimistic update
      const updatedPreferences = { ...preferences, ...partialPrefs };
      setPreferences(updatedPreferences);
      
      // API call
      await apiRequest('POST', '/api/preferences', {
        ...updatedPreferences,
        userId
      });
    } catch (err) {
      console.error('Error updating preferences:', err);
      
      // Revert on error
      setPreferences(preferences);
    }
  }, [preferences, userId]);

  // Effect to update emails when account or category changes
  React.useEffect(() => {
    if (selectedAccount) {
      fetchEmails(selectedAccount.id, selectedCategory);
    }
  }, [selectedAccount, selectedCategory]);

  // Context value
  const contextValue: EmailContextType = {
    // State
    userId,
    user,
    accounts,
    selectedAccount,
    emails,
    selectedEmail,
    preferences,
    tags,
    selectedMailbox,
    selectedCategory,
    isLoading,
    error,
    
    // Actions
    setSelectedAccount: handleSelectAccount,
    setSelectedEmail: handleSelectEmail,
    setSelectedMailbox: handleSelectMailbox,
    setSelectedCategory: handleSelectCategory,
    toggleEmailStar,
    markEmailAsRead,
    archiveEmail,
    trashEmail,
    updatePreferences,
    initializeEmailContext,
  };

  return (
    <EmailContext.Provider value={contextValue}>
      {children}
    </EmailContext.Provider>
  );
};

// Custom hook for using the email context
export const useEmailContext = () => {
  const context = useContext(EmailContext);
  
  if (context === undefined) {
    throw new Error('useEmailContext must be used within an EmailProvider');
  }
  
  return context;
};
