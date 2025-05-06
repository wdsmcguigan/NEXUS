import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Reply, Forward, Star, FileText, Tag, Clock, Paperclip, ArrowLeft, MoreHorizontal, Download, Trash, Archive } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { apiRequest } from '../lib/queryClient';
import type { Email, EmailWithDetails, Contact, Tag as TagType, EmailAttachment, StarColor } from '../shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useTagContext, TagItem } from '../context/TagContext';
import { useDependencyConsumer } from '../hooks/useDependencyHooks';
import { DependencyDataTypes, DependencySyncStrategy } from '../lib/dependency/DependencyInterfaces';
import { useEmailDetailPanel } from '../context/PanelDependencyContext';
import { useFlexibleEmailDetailPane } from '../hooks/useFlexibleEmailDependency.tsx';
import { toast } from '../hooks/use-toast';
// Import the direct bridge dynamically in the component to avoid circular dependencies
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EmailDetailPaneProps {
  tabId?: string;
  emailId?: number;
  onBack?: () => void;
  followSelection?: boolean; // New prop to control selection following behavior
  [key: string]: any;
}

export function EmailDetailPane({ 
  tabId, 
  emailId = 1, 
  onBack, 
  followSelection = false, // Default to false to make it opt-in
  ...props 
}: EmailDetailPaneProps) {
  // Component should have a panel ID from the parent
  const panelId = props.panelId || 'defaultPanel';
  
  // State to track whether this instance follows selection
  const [isFollowingSelection, setIsFollowingSelection] = useState(followSelection);
  
  // Toggle function for following selection - defined early to avoid hook order issues
  const toggleFollowSelection = useCallback(() => {
    const newValue = !isFollowingSelection;
    console.log(`[EmailDetailPane ${tabId}] Toggling followSelection from ${isFollowingSelection} to ${newValue}`);
    setIsFollowingSelection(newValue);
    
    toast({
      title: newValue ? "Following selection enabled" : "Following selection disabled",
      description: newValue 
        ? "This email viewer will update when emails are selected" 
        : "This email viewer will stay fixed on the current email",
      duration: 3000
    });
  }, [isFollowingSelection, tabId]);
  
  const [email, setEmail] = useState<EmailWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { tags: globalTags } = useTagContext();
  
  // Register with all dependency systems for maximum compatibility
  
  // 1. Legacy system
  // Add type prefix to tabId for dependency matching
  const instanceId = tabId ? `_EMAIL_DETAIL_${tabId}` : '_EMAIL_DETAIL_default';
  
  const dependencyConsumer = useDependencyConsumer<Email>(
    instanceId,
    DependencyDataTypes.EMAIL_DATA,
    {
      required: true,
      syncStrategy: DependencySyncStrategy.BOTH // Changed from PULL to BOTH for better data flow
    }
  );
  
  // 2. Panel dependency system
  const { email: panelEmail, componentId } = useEmailDetailPanel(tabId || 'default', panelId);
  
  // 3. Flexible Email Dependency system (direct bridge)
  const flexibleEmailBridge = useFlexibleEmailDetailPane(componentId);
  
  // Extract the methods and properties we need from the legacy consumer
  const dependencyEmailData = dependencyConsumer.consumerData;
  const hasProvider = dependencyConsumer.providerId !== null;
  const isConnected = dependencyConsumer.isReady;
  
  // Log dependency status for debugging
  useEffect(() => {
    console.log(`[EmailDetailPane ${tabId}] Consumer registered, status:`, dependencyConsumer.status);
    console.log(`[EmailDetailPane ${tabId}] Has provider:`, hasProvider);
    console.log(`[EmailDetailPane ${tabId}] Provider ID:`, dependencyConsumer.providerId);
    console.log(`[EmailDetailPane ${tabId}] Is connected:`, isConnected);
    console.log(`[EmailDetailPane ${tabId}] Panel component ID:`, componentId);
  }, [tabId, dependencyConsumer.status, hasProvider, dependencyConsumer.providerId, isConnected, componentId]);
  
  // Helper function to determine if this component should follow selections
  const shouldFollowSelection = useCallback(() => {
    // First check if there's an explicit dependency connection
    const hasDependency = hasProvider && isConnected;
    
    // Check if we're explicitly set to follow selections via prop or state
    const followingExplicitly = isFollowingSelection;
    
    const result = hasDependency || followingExplicitly;
    console.log(`[EmailDetailPane ${tabId}] shouldFollowSelection:`, {
      hasDependency,
      followingExplicitly,
      result
    });
    
    return result;
  }, [hasProvider, isConnected, isFollowingSelection, tabId]);
  
  // COMMUNICATION METHOD 1: Set up DirectEmailBridge listeners
  useEffect(() => {
    console.log(`[EmailDetailPane ${tabId}] Setting up DirectEmailBridge listener, following=${isFollowingSelection}`);
    
    // Skip setup if this component shouldn't follow selection
    if (!shouldFollowSelection()) {
      console.log(`[EmailDetailPane ${tabId}] Skipping DirectEmailBridge setup, not following selection`);
      return;
    }
    
    const setupDirectBridge = async () => {
      try {
        // Dynamically import the bridge to avoid circular dependencies
        const module = await import('../lib/DirectEmailBridge');
        const DirectEmailBridge = module.default;
        const bridge = DirectEmailBridge.getInstance();
        
        // Create a handler function that will load the email when a selection is made
        const handleDirectSelection = (emailId: string) => {
          console.log(`[EmailDetailPane ${tabId}] DirectEmailBridge notified of selection: ${emailId}`);
          
          // Convert to number since our API expects a number ID
          const numericId = parseInt(emailId, 10);
          
          if (!isNaN(numericId)) {
            // Fetch the email data
            const fetchEmailDetails = async () => {
              try {
                setLoading(true);
                const response = await apiRequest(`/api/emails/${numericId}`);
                
                if (response.ok) {
                  const data = await response.json();
                  console.log(`[EmailDetailPane ${tabId}] Loaded email ${numericId} via DirectEmailBridge`, data);
                  setEmail(data);
                  
                  // Display toast to indicate successful loading
                  toast({
                    title: "Email Loaded",
                    description: `Loaded email ${numericId} via direct bridge`,
                    variant: "default",
                    duration: 2000
                  });
                }
              } catch (error) {
                console.error(`[EmailDetailPane ${tabId}] Error fetching email via DirectEmailBridge:`, error);
                toast({
                  title: "Error Loading Email",
                  description: "Failed to load email details",
                  variant: "destructive",
                  duration: 3000
                });
              } finally {
                setLoading(false);
              }
            };
            
            fetchEmailDetails();
          }
        };
        
        console.log(`[EmailDetailPane ${tabId}] Registering DirectEmailBridge listener`);
        bridge.addListener(handleDirectSelection);
        
        // Handle any current selection
        const currentSelection = bridge.getSelectedEmail();
        if (currentSelection) {
          console.log(`[EmailDetailPane ${tabId}] DirectEmailBridge has current selection: ${currentSelection}`);
          handleDirectSelection(currentSelection);
        }
        
        // Clean up the listener when the component unmounts
        return () => {
          console.log(`[EmailDetailPane ${tabId}] Removing DirectEmailBridge listener`);
          bridge.removeListener(handleDirectSelection);
        };
      } catch (error) {
        console.error(`[EmailDetailPane ${tabId}] Error setting up DirectEmailBridge:`, error);
      }
    };
    
    setupDirectBridge();
  }, [tabId, shouldFollowSelection]);
  
  // COMMUNICATION METHOD 2: Set up DOM event listeners for email selection events
  useEffect(() => {
    console.log(`[EmailDetailPane ${tabId}] Setting up DOM event listeners, following=${isFollowingSelection}`);
    
    // Skip setup if this component shouldn't follow selection
    if (!shouldFollowSelection()) {
      console.log(`[EmailDetailPane ${tabId}] Skipping DOM event listeners setup, not following selection`);
      return;
    }
    
    // Handler for DOM custom events
    const handleDomEvent = (event: Event) => {
      console.log(`[EmailDetailPane ${tabId}] Received DOM event:`, event);
      
      // Check if it's a custom event with detail property
      if ('detail' in event && event.detail) {
        const detail = (event as CustomEvent).detail;
        
        if (detail.emailId) {
          console.log(`[EmailDetailPane ${tabId}] DOM event contains emailId: ${detail.emailId}`);
          
          // If we have the full email object in the event, use it directly
          if (detail.email) {
            console.log(`[EmailDetailPane ${tabId}] Setting email directly from DOM event data`);
            setEmail(detail.email);
            setLoading(false);
            
            // Show toast notification
            toast({
              title: "Email Loaded",
              description: `Loaded email data from DOM event`,
              variant: "default",
              duration: 2000
            });
          } else {
            // Otherwise fetch the email by ID
            console.log(`[EmailDetailPane ${tabId}] Fetching email from ID received via DOM event`);
            
            const fetchEmailDetails = async () => {
              try {
                setLoading(true);
                const response = await apiRequest(`/api/emails/${detail.emailId}`);
                
                if (response.ok) {
                  const data = await response.json();
                  console.log(`[EmailDetailPane ${tabId}] Loaded email ${detail.emailId} via DOM event`, data);
                  setEmail(data);
                  
                  // Display toast to indicate successful loading
                  toast({
                    title: "Email Loaded",
                    description: `Loaded email ${detail.emailId} via DOM event`,
                    variant: "default",
                    duration: 2000
                  });
                }
              } catch (error) {
                console.error(`[EmailDetailPane ${tabId}] Error fetching email via DOM event:`, error);
                toast({
                  title: "Error Loading Email",
                  description: "Failed to load email details",
                  variant: "destructive",
                  duration: 3000
                });
              } finally {
                setLoading(false);
              }
            };
            
            fetchEmailDetails();
          }
        }
      }
    };
    
    // Listen for the custom event globally
    document.addEventListener('nexus:email-selected', handleDomEvent);
    
    // Clean up the listener when the component unmounts
    return () => {
      document.removeEventListener('nexus:email-selected', handleDomEvent);
    };
  }, [tabId, shouldFollowSelection]);

  // Process dependency data when it's received - from any system
  useEffect(() => {
    // Skip processing dependencies if we're not following selection
    if (!shouldFollowSelection() && email) {
      console.log(`[EmailDetailPane ${tabId}] Not following selection, ignoring dependency updates`);
      return;
    }
    
    // Create helper for logging data structure
    const logEmailData = (source: string, data: any) => {
      if (!data) {
        console.log(`[EmailDetailPane ${tabId}] ${source} data is null/undefined`);
        return;
      }
      
      // Log a simplified view of the data structure
      console.log(`[EmailDetailPane ${tabId}] ${source} data received:`, {
        id: data.id,
        subject: data.subject,
        metadata: data.metadata || 'no metadata',
        hasContent: !!data.body
      });
    };

    // Check data from FlexibleEmailDependencyBridge first
    const flexibleEmailData = flexibleEmailBridge.selectedEmail;
    if (flexibleEmailData) {
      logEmailData('Flexible Email Bridge', flexibleEmailData);
      
      // Check if we have an enriched data structure
      const emailData = flexibleEmailData.metadata ? 
        flexibleEmailData : // It's the enriched structure
        flexibleEmailData;  // Regular email object
        
      console.log(`[EmailDetailPane ${tabId}] Setting email from flexible email bridge`);
      setEmail(emailData);
      setLoading(false);
      
      // Show toast to make dependency connection clear
      toast({
        title: "Email data received",
        description: `Loading email data from flexible email bridge`,
        duration: 2000,
      });
      return;
    }

    // Then check panel system
    if (panelEmail) {
      logEmailData('Panel dependency', panelEmail);
      
      // Check if we have an enriched data structure from the EmailListPane
      const emailData = panelEmail.metadata ? 
        panelEmail : // It's the enriched structure
        panelEmail;  // Regular email object
        
      console.log(`[EmailDetailPane ${tabId}] Setting email from panel dependency`);
      setEmail(emailData);
      setLoading(false);
      
      // Show toast to make dependency connection clear
      toast({
        title: "Email data received",
        description: `Loading email data from connected panel`,
        duration: 2000,
      });
      return;
    }
    
    // Then check legacy system
    logEmailData('Legacy dependency', dependencyEmailData);
    
    if (dependencyEmailData) {
      // If we have dependency data, use it
      // Check if it's the enriched structure created in EmailListPane
      const emailData = dependencyEmailData.metadata ? 
        dependencyEmailData : // It's the enriched structure
        dependencyEmailData;  // Regular email object
        
      console.log(`[EmailDetailPane ${tabId}] Setting email from legacy dependency`);
      setEmail(emailData);
      setLoading(false);
      
      if (hasProvider && isConnected) {
        // Show toast to make dependency connection clear
        toast({
          title: "Email data received",
          description: `Loading email from connected component`,
          duration: 2000,
        });
      }
    } else {
      console.log(`[EmailDetailPane ${tabId}] All dependency sources returned null/undefined data`);
      
      // If we have an emailId prop but no email loaded, we'll rely on the fetchEmailDetails effect
      if (emailId && !email) {
        console.log(`[EmailDetailPane ${tabId}] Will use direct fetch with emailId: ${emailId}`);
      }
    }
  }, [
    dependencyEmailData, 
    hasProvider, 
    isConnected, 
    tabId, 
    panelEmail, 
    emailId, 
    email, 
    flexibleEmailBridge.selectedEmail,
    shouldFollowSelection
  ]);

  // Fetch email details if no dependency data
  useEffect(() => {
    // Skip API fetch if we're getting data from a dependency
    if (hasProvider && isConnected) {
      return;
    }
    
    const fetchEmailDetails = async () => {
      setLoading(true);
      try {
        const response = await apiRequest(`/api/emails/${emailId}`);
        if (response.ok) {
          const data = await response.json();
          setEmail(data);
        }
      } catch (error) {
        console.error('Error fetching email details:', error);
        
        // For demo purposes, load sample data if API fails
        const sampleEmail = {
          id: 1,
          accountId: 1,
          fromContactId: 1,
          subject: "Q3 Marketing Campaign Review",
          body: `Hi Team,

I've reviewed the Q3 marketing plan and have some feedback on our digital strategy. Can we discuss the social media campaign timing? I think we should align it better with the product launch in August.

Here are my main observations:

- The content calendar needs more variety - we're relying too heavily on product features and not enough on customer stories.
- Budget allocation seems weighted toward traditional channels, but our Q2 results showed better ROI from digital.
- The influencer strategy needs refinement - let's focus on micro-influencers with higher engagement rather than reach alone.
- We should increase our A/B testing budget to optimize landing page conversions before scaling the paid campaigns.

I've attached a revised budget proposal and content calendar for your review. Could we schedule a meeting tomorrow to discuss these changes?

Also, I'd like to get everyone's thoughts on bringing forward the podcast launch. The production team says they can be ready by mid-July instead of September.

Looking forward to your feedback.

Best regards,
Sarah`,
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
          recipients: [
            {
              id: 1,
              emailId: 1,
              contactId: 4,
              type: "to",
              contact: {
                id: 4,
                name: "You",
                email: "you@example.com",
                company: "Your Company",
                avatarUrl: null,
                notes: null,
              }
            }
          ],
          attachments: [
            {
              id: 1,
              emailId: 1,
              fileName: "Q3_Budget_Proposal.pdf",
              fileType: "application/pdf",
              fileSize: 2457600,
              fileContent: "content"
            },
            {
              id: 2,
              emailId: 1,
              fileName: "Content_Calendar_Q3.xlsx",
              fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              fileSize: 1228800,
              fileContent: "content"
            }
          ],
          tags: [
            {
              id: 1,
              emailId: 1,
              tagId: 1,
              tag: {
                id: 1,
                name: "Work",
                parentId: null,
                bgColor: "#e2e8f0",
                textColor: "#1e293b",
                emoji: "💼"
              }
            },
            {
              id: 2,
              emailId: 1,
              tagId: 2,
              tag: {
                id: 2,
                name: "Projects",
                parentId: 1,
                bgColor: "#eef2ff",
                textColor: "#3730a3",
                emoji: "📊"
              }
            }
          ]
        };
        setEmail(sampleEmail as EmailWithDetails);
      } finally {
        setLoading(false);
      }
    };

    if (emailId) {
      fetchEmailDetails();
    }
  }, [emailId, hasProvider, isConnected]);

  // Toggle star color
  const handleStarClick = async (currentColor: StarColor | undefined) => {
    if (!email) return;
    
    // Colors cycle: none -> gold -> green -> blue -> orange -> red -> none
    const starColors: StarColor[] = ["none", "gold", "green", "blue", "orange", "red"];
    const currentIndex = starColors.indexOf(currentColor || "none");
    const nextIndex = (currentIndex + 1) % starColors.length;
    const newStarColor = starColors[nextIndex];
    
    try {
      await apiRequest(`/api/emails/${email.id}/star`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          starColor: newStarColor
        }),
      });
      
      // Update local state
      setEmail({
        ...email,
        starColor: newStarColor
      });
    } catch (error) {
      console.error('Error updating star color:', error);
      
      // Update local state even if API fails for demo
      setEmail({
        ...email,
        starColor: newStarColor
      });
    }
  };

  // Add or update a todo on the email
  const handleTodoToggle = async (completed: boolean) => {
    if (!email) return;
    
    try {
      if (email.todoText) {
        // Update existing todo
        await apiRequest(`/api/emails/${email.id}/todo`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            todoCompleted: completed
          }),
        });
        
        // Update local state
        setEmail({
          ...email,
          todoCompleted: completed
        });
      } else {
        // Create new todo
        const todoText = window.prompt('Enter a todo for this email:');
        if (todoText) {
          await apiRequest(`/api/emails/${email.id}/todo`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              todoText,
              todoCompleted: false
            }),
          });
          
          // Update local state
          setEmail({
            ...email,
            todoText,
            todoCompleted: false
          });
        }
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      
      // Update local state even if API fails for demo
      if (email.todoText) {
        setEmail({
          ...email,
          todoCompleted: completed
        });
      }
    }
  };

  // Get star color for rendering
  const getStarColorClass = (color: StarColor | undefined) => {
    switch(color) {
      case 'red': return 'text-red-500';
      case 'orange': return 'text-orange-500';
      case 'gold': return 'text-yellow-500';
      case 'green': return 'text-green-500';
      case 'blue': return 'text-blue-500';
      default: return 'text-neutral-500';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    return mb.toFixed(1) + ' MB';
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('document') || fileType.includes('word')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-neutral-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-neutral-950 text-white">
        <FileText size={48} className="mb-2 opacity-30" />
        <p>No email selected</p>
        {onBack && (
          <Button variant="ghost" className="mt-4" onClick={onBack}>
            <ArrowLeft size={16} className="mr-2" /> Back to Inbox
          </Button>
        )}
      </div>
    );
  }



  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white overflow-hidden">
      {/* Email header */}
      <div className="p-4 border-b border-neutral-800">
        {onBack && (
          <Button variant="ghost" className="p-1 mb-3" onClick={onBack}>
            <ArrowLeft size={16} className="mr-2" /> Inbox
          </Button>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">{email.subject}</h2>
            
            {/* Selection following badge */}
            {isFollowingSelection && (
              <Badge variant="outline" className="ml-2 text-xs bg-blue-950 text-blue-300 border-blue-800 py-0 px-2">
                Following selection
              </Badge>
            )}
            
            {hasProvider && isConnected && (
              <Badge variant="outline" className="ml-2 text-xs bg-green-950 text-green-300 border-green-800 py-0 px-2">
                Connected
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className={`${getStarColorClass(email.starColor)}`}
              onClick={() => handleStarClick(email.starColor)}
            >
              <Star size={20} fill={(email.starColor && email.starColor !== 'none') ? 'currentColor' : 'none'} />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-neutral-900 border-neutral-800 text-white">
                {/* Toggle selection following option */}
                <DropdownMenuItem onClick={toggleFollowSelection}>
                  {isFollowingSelection ? (
                    <>
                      <div className="mr-2 h-4 w-4 text-blue-400">■</div> 
                      Stop following selection
                    </>
                  ) : (
                    <>
                      <div className="mr-2 h-4 w-4 text-gray-400">□</div> 
                      Follow selection
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-neutral-800" />
                <DropdownMenuItem>
                  <Archive size={16} className="mr-2" /> Archive
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Trash size={16} className="mr-2" /> Delete
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-neutral-800" />
                <DropdownMenuItem>
                  <Tag size={16} className="mr-2" /> Manage Tags
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleTodoToggle(false)}
                  className={email.todoText ? "hidden" : ""}
                >
                  <Clock size={16} className="mr-2" /> Add Todo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Sender info */}
        <div className="mt-3 flex items-start">
          <div className="bg-blue-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center mr-3">
            {email.fromContact?.name.charAt(0).toUpperCase() || '?'}
          </div>
          
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-medium">{email.fromContact?.name}</span>
                <span className="text-neutral-400 ml-2">&lt;{email.fromContact?.email}&gt;</span>
              </div>
              <div className="text-sm text-neutral-400">
                {email.timestamp && format(new Date(email.timestamp), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
            
            <div className="text-sm text-neutral-400 mt-1">
              To: {email.recipients?.map(r => r.contact.name).join(', ')}
            </div>
          </div>
        </div>
        
        {/* Tags and todos */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {email?.tags?.map((emailTag) => {
            try {
              // Add defensive checks - ensure the tag and its ID exist
              if (!emailTag || !emailTag.tag || !emailTag.tag.id) {
                console.warn("[EmailDetailPane] Invalid tag data:", emailTag);
                return null; // Skip this tag
              }
              
              // Find the matching tag in our global context if it exists
              const tagId = emailTag.tag.id.toString();
              
              // Add defensive checks for globalTags
              const globalTag = globalTags && Array.isArray(globalTags)
                ? (globalTags.find(gt => gt && gt.id === tagId) || 
                   globalTags
                    .filter(gt => gt && gt.children && Array.isArray(gt.children))
                    .flatMap(gt => gt.children || [])
                    .find(child => child && child.id === tagId))
                : undefined;
              
              // Use global tag properties if available, otherwise use the email tag properties with defensive checks
              const displayTag = globalTag || {
                name: emailTag.tag?.name || "Unknown",
                color: emailTag.tag?.bgColor || "#e5e5e5",
                textColor: emailTag.tag?.textColor || "#000000",
                emoji: emailTag.tag?.emoji || ""
              };
              
              return (
                <Badge 
                  key={emailTag.id} 
                  variant="outline"
                  className="flex items-center gap-1 px-2 py-0.5" 
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
            } catch (error) {
              console.error("[EmailDetailPane] Error rendering tag:", error);
              return null; // Return null for this tag to prevent rendering errors
            }
          })}
          
          {email?.todoText && (
            <div className="flex items-center gap-2 bg-amber-950/30 text-amber-400 border border-amber-800 rounded-md px-2 py-0.5">
              <Checkbox 
                id="todo-checkbox" 
                checked={email?.todoCompleted || false}
                onCheckedChange={(checked) => handleTodoToggle(Boolean(checked))}
              />
              <label htmlFor="todo-checkbox" className="text-sm cursor-pointer">
                {email?.todoText}
              </label>
            </div>
          )}
        </div>
      </div>
      
      {/* Email body */}
      <div className="flex-1 p-4 overflow-y-auto whitespace-pre-line">
        {email?.body}
        
        {/* Attachments */}
        {email?.attachments && Array.isArray(email.attachments) && email.attachments.length > 0 && (
          <div className="mt-6 border-t border-neutral-800 pt-4">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Paperclip size={16} className="mr-2" />
              Attachments ({email.attachments.length})
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {email.attachments.map((attachment) => {
                try {
                  if (!attachment || !attachment.id) {
                    console.warn("[EmailDetailPane] Invalid attachment:", attachment);
                    return null;
                  }
                  
                  return (
                    <div 
                      key={attachment.id} 
                      className="flex items-center p-2 rounded-md bg-neutral-900 border border-neutral-800"
                    >
                      <div className="text-xl mr-2">
                        {getFileIcon(attachment.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {attachment.fileName || "Unknown file"}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {formatFileSize(attachment.fileSize || 0)}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-2" title="Download">
                        <Download size={16} />
                      </Button>
                    </div>
                  );
                } catch (error) {
                  console.error("[EmailDetailPane] Error rendering attachment:", error);
                  return null;
                }
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Reply area */}
      <div className="p-4 border-t border-neutral-800">
        {replyMode ? (
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full p-3 min-h-[120px] bg-neutral-900 border border-neutral-800 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setReplyMode(false)}>
                Cancel
              </Button>
              <Button>
                Send Reply
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setReplyMode(true)}>
              <Reply size={16} className="mr-2" /> Reply
            </Button>
            <Button variant="outline" className="flex-1">
              <Forward size={16} className="mr-2" /> Forward
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions for attachments
function getFileIcon(fileType: string | undefined): React.ReactNode {
  if (!fileType) return <FileText />;
  
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return <FileText />;
    case 'doc':
    case 'docx':
      return <FileText />;
    case 'xls':
    case 'xlsx':
      return <FileText />;
    case 'ppt':
    case 'pptx':
      return <FileText />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <FileText />;
    default:
      return <FileText />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default EmailDetailPane;