import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { LeftSidebar } from "@/components/left-sidebar";
import { EmailListItem } from "@/components/ui/email-list-item";
import { EmailDetail } from "@/components/ui/email-detail";
import { ContactSidebar } from "@/components/ui/contact-sidebar";
import { BottomPane, Integration } from "@/components/ui/bottom-pane";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface EmailClientProps {
  userId: number;
}

export function EmailClient({ userId }: EmailClientProps) {
  const { toast } = useToast();
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedTagId, setSelectedTagId] = useState<number | undefined>(undefined);
  const [selectedEmailId, setSelectedEmailId] = useState<number | undefined>(undefined);
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showContactSidebar, setShowContactSidebar] = useState(false);
  const [showBottomPane, setShowBottomPane] = useState(false);
  const [contactId, setContactId] = useState<number | undefined>(undefined);

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: [`/api/user-preferences/${userId}`],
    enabled: !!userId,
  });

  // Fetch email accounts
  const { data: accounts = [] } = useQuery({
    queryKey: [`/api/email-accounts?userId=${userId}`],
    enabled: !!userId,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: [`/api/tags?userId=${userId}`],
    enabled: !!userId,
  });

  // Fetch emails based on selected filters
  const { data: emails = [], isLoading: emailsLoading } = useQuery({
    queryKey: [
      `/api/emails`,
      selectedAccountId,
      selectedCategoryId,
      selectedTagId
    ],
    queryFn: async () => {
      let url = "/api/emails";
      
      const params = new URLSearchParams();
      if (selectedAccountId) {
        params.append("accountId", selectedAccountId.toString());
      } else if (accounts.length > 0) {
        params.append("accountId", accounts[0].id.toString());
      }
      
      if (selectedCategoryId) {
        params.append("categoryId", selectedCategoryId.toString());
      }
      
      if (selectedTagId) {
        params.append("tagId", selectedTagId.toString());
      }
      
      url = `${url}?${params.toString()}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch emails");
      return await res.json();
    },
    enabled: accounts.length > 0,
  });

  // Fetch selected email details
  const { data: selectedEmail } = useQuery({
    queryKey: [`/api/emails/${selectedEmailId}`],
    enabled: !!selectedEmailId,
  });

  // Fetch contact details
  const { data: contact } = useQuery({
    queryKey: [`/api/contacts/${contactId}`],
    enabled: !!contactId,
  });

  // Star/unstar email mutation
  const starEmailMutation = useMutation({
    mutationFn: async ({ id, isStarred, starColor = "#eab308" }: { id: number; isStarred: boolean; starColor?: string }) => {
      const response = await apiRequest(
        "PUT",
        `/api/emails/${id}`,
        { isStarred, starColor: isStarred ? starColor : null }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/emails`] });
      if (selectedEmailId) {
        queryClient.invalidateQueries({ queryKey: [`/api/emails/${selectedEmailId}`] });
      }
    },
  });

  // Mark email as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "PUT",
        `/api/emails/${id}`,
        { isRead: true }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/emails`] });
    },
  });

  // Archive email mutation
  const archiveEmailMutation = useMutation({
    mutationFn: async (id: number) => {
      // For now, we'll just mark as read and return success
      // In a real app, this would move to an archive folder/category
      const response = await apiRequest(
        "PUT",
        `/api/emails/${id}`,
        { isRead: true }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/emails`] });
      setSelectedEmailId(undefined);
      toast({
        title: "Email archived",
        description: "The email has been moved to archive",
      });
    },
  });

  // Delete email mutation
  const deleteEmailMutation = useMutation({
    mutationFn: async (id: number) => {
      // For now, we'll just mark as read and return success
      // In a real app, this would delete or move to trash
      const response = await apiRequest(
        "PUT",
        `/api/emails/${id}`,
        { isRead: true }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/emails`] });
      setSelectedEmailId(undefined);
      toast({
        title: "Email deleted",
        description: "The email has been moved to trash",
      });
    },
  });

  // Update user preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: any) => {
      const response = await apiRequest(
        "PUT",
        `/api/user-preferences/${userId}`,
        preferences
      );
      return response.json();
    },
  });

  // Initialize selection with first account if none selected
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // When selecting an email, mark it as read if it's unread
  useEffect(() => {
    if (selectedEmailId) {
      const email = emails.find(e => e.id === selectedEmailId);
      if (email && !email.isRead) {
        markAsReadMutation.mutate(selectedEmailId);
      }
      
      if (email) {
        setContactId(email.sender.id);
      }
    }
  }, [selectedEmailId, emails]);

  // Handlers
  const handleEmailSelect = (emailId: number) => {
    setSelectedEmailId(emailId);
  };

  const handleAccountSelect = (accountId: number) => {
    setSelectedAccountId(accountId);
    setSelectedCategoryId(undefined);
    setSelectedTagId(undefined);
    setSelectedEmailId(undefined);
  };

  const handleAllInboxesSelect = () => {
    setSelectedAccountId(undefined);
    setSelectedCategoryId(undefined);
    setSelectedTagId(undefined);
    setSelectedEmailId(undefined);
  };

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId === selectedCategoryId ? undefined : categoryId);
    setSelectedTagId(undefined);
    setSelectedEmailId(undefined);
  };

  const handleTagSelect = (tagId: number) => {
    setSelectedTagId(tagId === selectedTagId ? undefined : tagId);
    setSelectedCategoryId(undefined);
    setSelectedEmailId(undefined);
  };

  const handleCreateTagClick = () => {
    toast({
      title: "Create tag",
      description: "This feature is not implemented yet.",
    });
  };

  const handleComposeClick = () => {
    toast({
      title: "Compose email",
      description: "This feature is not implemented yet.",
    });
  };

  const handleEmailSelection = (id: number, selected: boolean) => {
    if (selected) {
      setSelectedEmails(prev => [...prev, id]);
    } else {
      setSelectedEmails(prev => prev.filter(emailId => emailId !== id));
    }
  };

  const handleStarEmail = (id: number, starred: boolean) => {
    starEmailMutation.mutate({ id, isStarred: starred });
  };

  const handleSettingsClick = () => {
    toast({
      title: "Settings",
      description: "This feature is not implemented yet.",
    });
  };

  const handleHelpClick = () => {
    toast({
      title: "Help & Feedback",
      description: "This feature is not implemented yet.",
    });
  };

  const handleBackClick = () => {
    setSelectedEmailId(undefined);
  };

  const handleReplyClick = () => {
    toast({
      title: "Reply",
      description: "This feature is not implemented yet.",
    });
  };

  const handleForwardClick = () => {
    toast({
      title: "Forward",
      description: "This feature is not implemented yet.",
    });
  };

  const handleArchiveClick = () => {
    if (selectedEmailId) {
      archiveEmailMutation.mutate(selectedEmailId);
    }
  };

  const handleDeleteClick = () => {
    if (selectedEmailId) {
      deleteEmailMutation.mutate(selectedEmailId);
    }
  };

  const handleContactSidebarToggle = () => {
    setShowContactSidebar(!showContactSidebar);
  };

  const handleContactClose = () => {
    setShowContactSidebar(false);
  };

  const handleAddToTasksClick = () => {
    setShowBottomPane(true);
  };

  const handleBottomPaneClose = () => {
    setShowBottomPane(false);
  };

  const handleIntegrationClick = (integration: Integration) => {
    toast({
      title: `${integration.name} integration`,
      description: `This would connect to ${integration.name}.`,
    });
  };

  const recentEmails = selectedEmail?.sender?.id
    ? emails
        .filter(email => email.sender.id === selectedEmail.sender.id)
        .slice(0, 3)
        .map(email => ({
          id: email.id,
          subject: email.subject,
          date: email.date,
          isSelected: email.id === selectedEmailId,
        }))
    : [];

  return (
    <div className="flex flex-col h-screen">
      {/* Header Component */}
      <header className="bg-white border-b border-neutral-200 p-2 flex items-center justify-between h-14 shadow-sm">
        {/* Logo and Brand */}
        <div className="flex items-center">
          <div className="flex items-center p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6" stroke="white" strokeWidth="2" fill="none"></polyline>
            </svg>
            <span className="ml-2 text-lg font-semibold text-neutral-800">NEXUS<span className="text-primary">.email</span></span>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="flex-grow max-w-3xl mx-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search emails..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
          </div>
        </div>
        
        {/* User Profile and Settings */}
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={handleSettingsClick}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </Button>
          <div className="ml-2 mr-2">
            <div className="h-8 w-8 rounded-full bg-neutral-300 flex items-center justify-center text-neutral-600 font-semibold">
              {userId ? "U" : "G"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Resizable Columns */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 overflow-hidden"
      >
        {/* Left Sidebar */}
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={30}
          className="bg-white"
        >
          <LeftSidebar
            accounts={accounts}
            categories={categories}
            tags={tags}
            selectedAccountId={selectedAccountId}
            selectedCategoryId={selectedCategoryId}
            selectedTagId={selectedTagId}
            onComposeClick={handleComposeClick}
            onAccountSelect={handleAccountSelect}
            onAllInboxesSelect={handleAllInboxesSelect}
            onCategorySelect={handleCategorySelect}
            onTagSelect={handleTagSelect}
            onCreateTagClick={handleCreateTagClick}
            onSettingsClick={handleSettingsClick}
            onHelpClick={handleHelpClick}
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* Email List */}
        <ResizablePanel
          defaultSize={30}
          minSize={20}
          maxSize={50}
          className="bg-white border-r border-neutral-200 flex flex-col h-full"
        >
          {/* Email List Controls */}
          <div className="p-2 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
              </Button>
              <Button variant="ghost" size="icon" className="ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </Button>
              <Button variant="ghost" size="icon" className="ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                  <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-neutral-500">
                {emails.length > 0 ? `1-${emails.length} of ${emails.length}` : "No emails"}
              </span>
              <Button variant="ghost" size="icon" className="ml-1" disabled={emails.length === 0}>
                <ChevronLeft className="h-5 w-5 text-neutral-600" />
              </Button>
              <Button variant="ghost" size="icon" disabled={emails.length === 0}>
                <ChevronRight className="h-5 w-5 text-neutral-600" />
              </Button>
            </div>
          </div>
          
          {/* Email List */}
          <div className="overflow-y-auto flex-1">
            {emailsLoading ? (
              <div className="p-4 text-center text-neutral-500">Loading emails...</div>
            ) : emails.length > 0 ? (
              <ul className="divide-y divide-neutral-100">
                {emails.map((email) => (
                  <EmailListItem
                    key={email.id}
                    id={email.id}
                    selected={selectedEmails.includes(email.id) || email.id === selectedEmailId}
                    onSelect={handleEmailSelection}
                    sender={email.sender}
                    subject={email.subject}
                    preview={email.snippet}
                    date={email.date}
                    isRead={email.isRead}
                    isStarred={email.isStarred}
                    starColor={email.starColor}
                    onStarClick={handleStarEmail}
                    tags={email.tags}
                    accountColor={email.accountId && accounts.find(a => a.id === email.accountId)?.color}
                    showAccountIndicator={selectedAccountId === undefined}
                    hasAttachments={email.attachments && email.attachments.length > 0}
                    attachments={email.attachments}
                    onClick={() => handleEmailSelect(email.id)}
                  />
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-neutral-500">No emails found</div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Email Detail View */}
        <ResizablePanel defaultSize={50} className="bg-white flex flex-col h-full">
          {selectedEmailId && selectedEmail ? (
            <EmailDetail
              subject={selectedEmail.subject}
              sender={selectedEmail.sender}
              recipients={selectedEmail.recipients}
              date={selectedEmail.date}
              body={selectedEmail.body}
              isStarred={selectedEmail.isStarred}
              starColor={selectedEmail.starColor}
              onStarClick={(starred) => handleStarEmail(selectedEmailId, starred)}
              attachments={selectedEmail.attachments}
              tags={selectedEmail.tags}
              onBackClick={handleBackClick}
              onReplyClick={handleReplyClick}
              onForwardClick={handleForwardClick}
              onArchiveClick={handleArchiveClick}
              onDeleteClick={handleDeleteClick}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-500">
              Select an email to view its contents
            </div>
          )}
        </ResizablePanel>

        {/* Contact Information Sidebar */}
        <ContactSidebar
          contact={contact || { id: 0, name: "", email: "" }}
          recentEmails={recentEmails}
          visible={showContactSidebar && !!contact}
          onClose={handleContactClose}
          onEmailSelect={handleEmailSelect}
          onAddToTasksClick={handleAddToTasksClick}
        />
      </ResizablePanelGroup>

      {/* Bottom Integration Pane */}
      <BottomPane
        visible={showBottomPane}
        onClose={handleBottomPaneClose}
        onIntegrationClick={handleIntegrationClick}
      />
    </div>
  );
}
