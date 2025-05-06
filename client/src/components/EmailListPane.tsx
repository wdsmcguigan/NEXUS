import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Mail, Star, Paperclip, Tag, Clock, Trash, Archive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '../lib/queryClient';
import type { Email, Contact, Tag as TagType, StarColor } from '../shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ItemContextMenu from './ContextMenu';
import { useTabContext } from '../context/TabContext';
import tabFactory from '../services/TabFactory';
import { useTagContext, TagItem } from '../context/TagContext';
import { useDependencyProvider } from '../hooks/useDependencyHooks';
import { DependencyDataTypes, DependencySyncStrategy } from '../lib/dependency/DependencyInterfaces';
import { useEmailListPanel } from '../context/PanelDependencyContext';
import { toast } from '../hooks/use-toast';

interface EmailListPaneProps {
  tabId?: string;
  view?: string;
  [key: string]: any;
}

export function EmailListPane({ tabId, view, ...props }: EmailListPaneProps) {
  // Component should have a panel ID from the parent
  const panelId = props.panelId || 'defaultPanel';
  
  const [emails, setEmails] = useState<(Email & { fromContact?: Contact, tags?: (TagType & { id: number })[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('primary');
  const tabContext = useTabContext();
  const { tags: globalTags } = useTagContext();
  
  // Register with both dependency systems for backward compatibility
  
  // 1. Legacy system
  // Add type prefix to tabId for dependency matching
  const instanceId = tabId ? `_EMAIL_LIST_${tabId}` : '_EMAIL_LIST_default';
  
  const dependencyProvider = useDependencyProvider<Email>(
    instanceId,
    DependencyDataTypes.EMAIL_DATA,
    { 
      acceptsMultiple: true,
      syncStrategy: DependencySyncStrategy.BOTH // Changed from PULL to BOTH for better data flow
    }
  );
  
  // 2. Panel dependency system
  const { updateSelectedEmail, componentId } = useEmailListPanel(tabId || 'default', panelId);
  
  // Extract the methods we need from the legacy provider
  const updateSelectedEmailData = dependencyProvider.updateProviderData;
  const getDependentConsumers = dependencyProvider.getDependentConsumers;
  const connectionCount = useMemo(() => {
    return getDependentConsumers().length;
  }, [getDependentConsumers]);
  
  // Log dependency status for debugging
  useEffect(() => {
    console.log(`[EmailListPane ${tabId}] Provider registered:`, dependencyProvider.isRegistered);
    console.log(`[EmailListPane ${tabId}] Connected consumers:`, getDependentConsumers());
    console.log(`[EmailListPane ${tabId}] Panel component ID:`, componentId);
  }, [tabId, dependencyProvider.isRegistered, getDependentConsumers, componentId]);

  // Fetch emails for the current view/category
  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      try {
        const category = view || selectedCategory;
        const response = await apiRequest(`/api/emails?category=${category}`);
        if (response.ok) {
          const data = await response.json();
          setEmails(data);
        }
      } catch (error) {
        console.error('Error fetching emails:', error);
        
        // For demo purposes, load sample data if API fails
        const sampleEmails = [
          {
            id: 1,
            accountId: 1,
            fromContactId: 1,
            subject: "Q3 Marketing Campaign Review",
            body: "Hi Team, I've reviewed the Q3 marketing plan and have some feedback...",
            timestamp: new Date("2023-06-20T10:42:00").toISOString(),
            category: "primary",
            isRead: true,
            isArchived: false,
            isTrashed: false,
            starColor: "gold" as StarColor,
            todoText: null,
            todoCompleted: false,
            fromContact: {
              id: 1,
              name: "Sarah Johnson",
              email: "sarah.johnson@example.com",
              company: "Acme Marketing",
              avatarUrl: null,
              notes: "Marketing Director",
            },
            tags: [
              { id: 1, name: "Work", parentId: null, bgColor: "#e2e8f0", textColor: "#1e293b", emoji: "💼" },
              { id: 2, name: "Projects", parentId: 1, bgColor: "#eef2ff", textColor: "#3730a3", emoji: "📊" }
            ]
          },
          {
            id: 2,
            accountId: 2,
            fromContactId: 2,
            subject: "Weekend hiking plans",
            body: "Hey! Are we still on for hiking this weekend? The weather forecast looks good...",
            timestamp: new Date("2023-06-20T09:15:00").toISOString(),
            category: "primary",
            isRead: false,
            isArchived: false,
            isTrashed: false,
            starColor: "none" as StarColor,
            todoText: null,
            todoCompleted: false,
            fromContact: {
              id: 2,
              name: "Michael Chen",
              email: "michael.chen@example.com",
              company: null,
              avatarUrl: null,
              notes: "Hiking buddy",
            },
            tags: [
              { id: 3, name: "Personal", parentId: null, bgColor: "#f3e8ff", textColor: "#6b21a8", emoji: "🏠" },
              { id: 4, name: "Travel", parentId: 3, bgColor: "#ecfdf5", textColor: "#065f46", emoji: "✈️" }
            ]
          },
          {
            id: 3,
            accountId: 1,
            fromContactId: 3,
            subject: "Project status update",
            body: "Hello, Here's the weekly status update for Project Aurora...",
            timestamp: new Date("2023-06-19T16:30:00").toISOString(),
            category: "primary",
            isRead: false,
            isArchived: false,
            isTrashed: false,
            starColor: "red" as StarColor,
            todoText: "Review project timelines",
            todoCompleted: false,
            fromContact: {
              id: 3,
              name: "Alex Rodriguez",
              email: "alex.rodriguez@example.com",
              company: "TechCorp",
              avatarUrl: null,
              notes: "Project Manager",
            },
            tags: [
              { id: 1, name: "Work", parentId: null, bgColor: "#e2e8f0", textColor: "#1e293b", emoji: "💼" },
              { id: 2, name: "Projects", parentId: 1, bgColor: "#eef2ff", textColor: "#3730a3", emoji: "📊" }
            ]
          }
        ];
        setEmails(sampleEmails);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [view, selectedCategory]);

  // Filter emails based on search term
  const filteredEmails = emails.filter(email => 
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
    email.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.fromContact?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle star color
  const handleStarClick = async (emailId: number, currentColor: StarColor) => {
    // Colors cycle: none -> gold -> green -> blue -> orange -> red -> none
    const starColors: StarColor[] = ["none", "gold", "green", "blue", "orange", "red"];
    const currentIndex = starColors.indexOf(currentColor);
    const nextIndex = (currentIndex + 1) % starColors.length;
    const newStarColor = starColors[nextIndex];
    
    try {
      await apiRequest(`/api/emails/${emailId}/star`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          starColor: newStarColor
        }),
      });
      
      // Update local state
      setEmails(emails.map(email => {
        if (email.id === emailId) {
          return { ...email, starColor: newStarColor };
        }
        return email;
      }));
    } catch (error) {
      console.error('Error updating star color:', error);
      
      // Update local state even if API fails for demo
      setEmails(emails.map(email => {
        if (email.id === emailId) {
          return { ...email, starColor: newStarColor };
        }
        return email;
      }));
    }
  };

  // Mark email as read/unread
  const handleReadStatusToggle = async (emailId: number, isCurrentlyRead: boolean) => {
    try {
      await apiRequest(`/api/emails/${emailId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isRead: !isCurrentlyRead
        }),
      });
      
      // Update local state
      setEmails(emails.map(email => {
        if (email.id === emailId) {
          return { ...email, isRead: !isCurrentlyRead };
        }
        return email;
      }));
    } catch (error) {
      console.error('Error updating read status:', error);
      
      // Update local state even if API fails for demo
      setEmails(emails.map(email => {
        if (email.id === emailId) {
          return { ...email, isRead: !isCurrentlyRead };
        }
        return email;
      }));
    }
  };

  // Get star color for rendering
  const getStarColorClass = (color: StarColor) => {
    switch(color) {
      case 'red': return 'text-red-500';
      case 'orange': return 'text-orange-500';
      case 'gold': return 'text-yellow-500';
      case 'green': return 'text-green-500';
      case 'blue': return 'text-blue-500';
      default: return 'text-neutral-500';
    }
  };
  
  // When the selected email changes, update the dependency data
  useEffect(() => {
    if (selectedEmailId !== null) {
      const selectedEmail = emails.find(email => email.id === selectedEmailId);
      
      console.log(`[EmailListPane ${tabId}] Email selected:`, selectedEmailId);
      console.log(`[EmailListPane ${tabId}] Found email:`, selectedEmail);
      console.log(`[EmailListPane ${tabId}] Connection count:`, connectionCount);
      
      if (selectedEmail) {
        // Add explicit logging for debugging
        console.log(`[EmailListPane ${tabId}] Selected email details:`, {
          id: selectedEmail.id,
          subject: selectedEmail.subject,
          timestamp: selectedEmail.timestamp
        });
        
        // Create an enriched data structure for dependency updates
        const emailData = {
          ...selectedEmail,
          metadata: {
            selectionTimestamp: Date.now(),
            source: `EmailListPane-${tabId}`,
            updateType: 'email-selected'
          }
        };
        
        // Update both dependency systems
        // 1. Legacy system
        console.log(`[EmailListPane ${tabId}] Updating legacy dependency system with email data`);
        updateSelectedEmailData(emailData);
        
        // 2. Panel dependency system
        console.log(`[EmailListPane ${tabId}] Updating panel dependency system with email data`);
        updateSelectedEmail(emailData);
        
        // Force dependency status updates
        console.log(`[EmailListPane ${tabId}] Attempting to force connection status updates`);
        
        if (connectionCount > 0) {
          // Show toast notification to make dependency connection clear to user
          toast({
            title: "Email selected",
            description: `Sending email data to connected viewers (${connectionCount})`,
            duration: 2000,
          });
          
          const consumers = getDependentConsumers();
          console.log(`[EmailListPane ${tabId}] Broadcasting email data to consumers:`, consumers);
          
          // Explicitly log each consumer for debugging
          consumers.forEach(consumer => {
            console.log(`[EmailListPane ${tabId}] Sending data to consumer:`, consumer);
          });
        }
      }
    } else {
      // Send null when no email is selected
      console.log(`[EmailListPane ${tabId}] No email selected, sending null to consumers`);
      
      // Update both dependency systems with null
      updateSelectedEmailData(null);
      updateSelectedEmail(null);
    }
  }, [selectedEmailId, emails, connectionCount, tabId, updateSelectedEmailData, updateSelectedEmail, getDependentConsumers]);

  // Handle email click with keyboard modifiers
  const handleEmailClick = (e: React.MouseEvent, emailId: number) => {
    if (e.ctrlKey || e.metaKey) {
      // If Ctrl/Cmd key is pressed, open in new tab
      e.preventDefault();
      tabFactory.createTab(
        tabContext,
        {
          componentId: 'email-detail',
          props: { emailId },
          title: `Email: ${emails.find(email => email.id === emailId)?.subject || 'Email'}`
        }
      );
    } else {
      // Normal click behavior
      setSelectedEmailId(emailId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white">
      {/* Email toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-neutral-800">
        <Input
          type="text"
          placeholder="Search emails..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-neutral-900 border-neutral-800"
        />
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="text-neutral-400 border-neutral-800">
            <Archive size={16} className="mr-1" /> Archive
          </Button>
          <Button variant="outline" size="sm" className="text-neutral-400 border-neutral-800">
            <Trash size={16} className="mr-1" /> Delete
          </Button>
        </div>
      </div>
      
      {/* Category tabs */}
      <div className="flex border-b border-neutral-800">
        {['primary', 'social', 'promotions', 'updates'].map((category) => (
          <button
            key={category}
            className={`px-4 py-2 text-sm ${
              selectedCategory === category
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-neutral-400 hover:text-white'
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Email list */}
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <Mail size={48} className="mb-2 opacity-30" />
              <p>No emails found</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-800">
              {filteredEmails.map((email) => (
                <ItemContextMenu
                  key={email.id}
                  actionData={{
                    componentId: 'email-detail',
                    props: { emailId: email.id },
                    title: `Email: ${email.subject}`
                  }}
                >
                  <li 
                    className={`
                      p-3 flex items-start gap-3 cursor-pointer hover:bg-neutral-900
                      ${selectedEmailId === email.id ? 'bg-neutral-900' : ''}
                      ${!email.isRead ? 'bg-neutral-900/30' : ''}
                    `}
                    onClick={(e) => handleEmailClick(e, email.id)}
                  >
                    {/* Email actions */}
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <button 
                        className={`${getStarColorClass(email.starColor)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStarClick(email.id, email.starColor);
                        }}
                      >
                        <Star size={18} fill={email.starColor !== 'none' ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    
                    {/* Email content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${!email.isRead ? 'text-white' : 'text-neutral-300'}`}>
                          {email.fromContact?.name || 'Unknown Sender'}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {email.timestamp && formatDistanceToNow(new Date(email.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className={`${!email.isRead ? 'font-semibold text-white' : 'text-neutral-300'}`}>
                        {email.subject}
                      </div>
                      
                      <div className="text-sm text-neutral-400 truncate mt-1">
                        {email.body?.substring(0, 100)}...
                      </div>
                      
                      {/* Tags and indicators */}
                      <div className="flex items-center gap-2 mt-2">
                        {email.tags?.map((tag) => {
                          // Find the matching tag in our global context if it exists
                          const globalTag = globalTags.find(gt => gt.id === tag.id?.toString()) || 
                                        globalTags.flatMap(gt => gt.children || [])
                                              .find(child => child.id === tag.id?.toString());
                          
                          // Use global tag properties if available, otherwise use the email tag properties
                          const displayTag = globalTag || {
                            name: tag.name,
                            color: tag.bgColor || '#e2e8f0',
                            textColor: tag.textColor || '#1e293b',
                            emoji: tag.emoji
                          };
                          
                          return (
                            <Badge 
                              key={tag.id} 
                              variant="outline"
                              className="flex items-center gap-1 px-2 py-0 text-xs" 
                              style={{ 
                                backgroundColor: displayTag.color, 
                                color: displayTag.textColor,
                                borderColor: 'transparent' 
                              }}
                            >
                              {displayTag.emoji && <span>{displayTag.emoji}</span>}
                              {displayTag.name}
                            </Badge>
                          );
                        })}
                        
                        {email.todoText && (
                          <Badge 
                            variant="outline" 
                            className="flex items-center gap-1 bg-amber-950/30 text-amber-400 border-amber-800 text-xs"
                          >
                            <Clock size={12} />
                            Todo
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Email actions */}
                    <div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-neutral-500 hover:text-white hover:bg-neutral-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReadStatusToggle(email.id, email.isRead);
                        }}
                      >
                        <Mail size={16} className={email.isRead ? 'opacity-50' : ''} />
                      </Button>
                    </div>
                  </li>
                </ItemContextMenu>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default EmailListPane;