/**
 * Integration example that demonstrates the inter-component communication systems.
 * This combines the EmailListExample and EmailViewerExample to show how they
 * interact via the various communication mechanisms.
 */

import React, { useEffect } from 'react';
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import EmailListExample from './EmailListExample';
import EmailViewerExample from './EmailViewerExample';

// Import communication systems to expose globally for the example
import { eventBus } from '../../lib/communication/EventBus';
import { contextProvider } from '../../lib/communication/ContextProvider';
import { commandRegistry, CommandContext } from '../../lib/communication/CommandRegistry';
import { EmailEventType } from '../../lib/communication/Events';

export default function CommunicationExample() {
  // Expose communication systems globally for easy access in the examples
  useEffect(() => {
    // Make systems available globally for the example
    window.eventBus = eventBus;
    window.contextProvider = contextProvider;
    
    // Set active command context
    commandRegistry.setActiveContext(CommandContext.EMAIL_LIST);
    
    // Subscribe to some events for demonstration
    const emailSelectedSub = eventBus.subscribe(
      EmailEventType.EMAIL_SELECTED,
      (event) => {
        console.log('Email selected event:', event);
      }
    );
    
    const emailOpenedSub = eventBus.subscribe(
      EmailEventType.EMAIL_OPENED,
      (event) => {
        console.log('Email opened event:', event);
      }
    );
    
    return () => {
      // Clean up global references
      delete window.eventBus;
      delete window.contextProvider;
      
      // Unsubscribe from events
      eventBus.unsubscribe(emailSelectedSub);
      eventBus.unsubscribe(emailOpenedSub);
    };
  }, []);
  
  return (
    <div className="container mx-auto p-4 space-y-4 max-w-7xl">
      <div className="bg-muted/40 border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <Info className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold mb-2">
              Inter-Component Communication Example
            </h1>
            <p className="text-sm text-muted-foreground mb-2">
              This example demonstrates how components can communicate using the different communication mechanisms:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <div className="space-y-1">
                <div className="flex items-center">
                  <Badge variant="outline" className="min-w-20 justify-center mr-2">Event Bus</Badge>
                  <span className="text-xs">Global pub/sub for email events</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="min-w-20 justify-center mr-2">Context</Badge>
                  <span className="text-xs">Sharing selected email data</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="min-w-20 justify-center mr-2">Direct Msgs</Badge>
                  <span className="text-xs">Opening emails in new tabs</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center">
                  <Badge variant="outline" className="min-w-20 justify-center mr-2">Commands</Badge>
                  <span className="text-xs">Email actions with shortcuts</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="min-w-20 justify-center mr-2">Drag & Drop</Badge>
                  <span className="text-xs">Dragging emails and attachments</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Try selecting emails, marking as read, archiving, and see how both components stay in sync
            </div>
          </div>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden h-[75vh]">
        <Tabs defaultValue="split-view">
          <div className="p-2 bg-muted/30 border-b">
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="split-view">Split View</TabsTrigger>
                <TabsTrigger value="email-list">Email List Only</TabsTrigger>
                <TabsTrigger value="email-viewer">Email Viewer Only</TabsTrigger>
              </TabsList>
              
              <div className="flex-1" />
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('Event Bus Subscriptions:', eventBus.getSubscriptionCount());
                  console.log('Context Types:', window.contextProvider.getAllActiveContexts());
                }}
              >
                Debug Info
              </Button>
            </div>
          </div>
          
          <TabsContent value="split-view" className="h-full mt-0">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={40} minSize={30}>
                <EmailListExample 
                  tabId="email-list-tab-main" 
                  panelId="split-left-panel" 
                />
              </ResizablePanel>
              <ResizablePanel defaultSize={60} minSize={30}>
                <EmailViewerExample 
                  tabId="email-viewer-tab-main" 
                  panelId="split-right-panel" 
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
          
          <TabsContent value="email-list" className="h-full mt-0">
            <EmailListExample 
              tabId="email-list-tab-solo" 
              panelId="solo-panel" 
            />
          </TabsContent>
          
          <TabsContent value="email-viewer" className="h-full mt-0">
            <EmailViewerExample 
              tabId="email-viewer-tab-solo" 
              panelId="solo-panel" 
              emailId={1}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p>
          <strong>Tips:</strong> Click an email to select it; double-click to view in a separate tab; 
          drag emails to try moving them; use keyboard shortcuts (r = mark as read, e = archive).
        </p>
      </div>
    </div>
  );
}