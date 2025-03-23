import * as React from "react";
import { X, Settings, MessageSquare, Grid3X3, Plus } from "lucide-react";
import { Button } from "./button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { 
  SiSlack, 
  SiDiscord, 
  SiAsana, 
  SiMicrosoft, 
  SiGoogledrive, 
  SiGooglemeet,
  SiTrello,
  SiJira,
  SiNotion
} from "react-icons/si";

export interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

export interface BottomPaneProps {
  visible: boolean;
  onClose: () => void;
  onIntegrationClick?: (integration: Integration) => void;
}

const integrations: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    icon: <SiSlack className="w-10 h-10" />,
    color: "#4A154B",
  },
  {
    id: "discord",
    name: "Discord",
    icon: <SiDiscord className="w-10 h-10" />,
    color: "#5865F2",
  },
  {
    id: "asana",
    name: "Asana",
    icon: <SiAsana className="w-10 h-10" />,
    color: "#F06A6A",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    icon: <SiMsTeams className="w-10 h-10" />,
    color: "#6264A7",
  },
  {
    id: "drive",
    name: "Google Drive",
    icon: <SiGoogledrive className="w-10 h-10" />,
    color: "#4285F4",
  },
  {
    id: "meet",
    name: "Google Meet",
    icon: <SiGooglemeet className="w-10 h-10" />,
    color: "#00AC47",
  },
  {
    id: "trello",
    name: "Trello",
    icon: <SiTrello className="w-10 h-10" />,
    color: "#0079BF",
  },
  {
    id: "jira",
    name: "Jira",
    icon: <SiJira className="w-10 h-10" />,
    color: "#0052CC",
  },
  {
    id: "notion",
    name: "Notion",
    icon: <SiNotion className="w-10 h-10" />,
    color: "#000000",
  },
];

// Sample template responses
const templateResponses = [
  {
    id: "thanks",
    title: "Thank You",
    content: "Thank you for your email. I appreciate your time and will respond as soon as possible."
  },
  {
    id: "busy",
    title: "Currently Busy",
    content: "I'm currently busy with other tasks, but I'll address your email as soon as I'm available."
  },
  {
    id: "meeting",
    title: "Meeting Request",
    content: "I'd be happy to meet. Please let me know your availability for the next week, and I'll check my calendar."
  },
  {
    id: "more-info",
    title: "Need More Information",
    content: "Thank you for your message. Could you please provide more details about your request so I can better assist you?"
  },
  {
    id: "delayed",
    title: "Delayed Response",
    content: "I appreciate your email. I'm currently out of the office and will respond to your message when I return."
  },
];

// Settings for the Settings tab
const settingsSections = [
  {
    title: "Display",
    settings: [
      { id: "dark-mode", label: "Dark Mode", type: "toggle", value: false },
      { id: "compact-view", label: "Compact View", type: "toggle", value: true },
      { id: "reading-pane", label: "Reading Pane", type: "select", value: "right", options: ["right", "bottom", "off"] }
    ]
  },
  {
    title: "Notifications",
    settings: [
      { id: "new-mail", label: "New Mail Notifications", type: "toggle", value: true },
      { id: "sound", label: "Notification Sound", type: "toggle", value: false },
      { id: "priority", label: "Only for Priority Mail", type: "toggle", value: true }
    ]
  }
];

export function BottomPane({
  visible,
  onClose,
  onIntegrationClick,
}: BottomPaneProps) {
  const [activeTab, setActiveTab] = React.useState("integrations");

  return (
    <div 
      className={`border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all duration-300 overflow-hidden ${
        visible ? 'h-72' : 'h-0'
      }`}
    >
      {visible && (
        <Tabs defaultValue="integrations" value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
            <TabsList className="bg-neutral-100 dark:bg-neutral-800">
              <TabsTrigger 
                value="integrations" 
                className="flex items-center gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900"
              >
                <Grid3X3 className="h-4 w-4" />
                <span>Integrations</span>
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="flex items-center gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Templates</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
            >
              <X className="h-5 w-5 text-neutral-500" />
            </Button>
          </div>
          
          <div className="h-[calc(100%-52px)] overflow-y-auto">
            <TabsContent value="integrations" className="p-4 m-0 border-none">
              <div className="flex flex-wrap gap-4">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex flex-col items-center justify-center w-24 h-24 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer p-2"
                    onClick={() => onIntegrationClick && onIntegrationClick(integration)}
                  >
                    <div className="text-[color:var(--color)]" style={{ "--color": integration.color } as React.CSSProperties}>
                      {integration.icon}
                    </div>
                    <span className="mt-2 text-xs text-center font-medium text-neutral-700 dark:text-neutral-300">
                      {integration.name}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="templates" className="p-4 m-0 border-none">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templateResponses.map((template) => (
                  <div
                    key={template.id}
                    className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                      {template.title}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3">
                      {template.content}
                    </p>
                  </div>
                ))}
                
                <div className="border border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-3 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-primary cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <div className="flex flex-col items-center">
                    <Plus className="h-6 w-6 mb-1" />
                    <span className="text-xs">Create New Template</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="p-4 m-0 border-none">
              <div className="space-y-6">
                {settingsSections.map((section) => (
                  <div key={section.title} className="space-y-3">
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {section.title}
                    </h3>
                    <div className="space-y-2">
                      {section.settings.map((setting) => (
                        <div key={setting.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">
                            {setting.label}
                          </span>
                          <div>
                            {setting.type === 'toggle' && (
                              <div className={`w-9 h-5 rounded-full ${setting.value ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-700'} relative transition-colors cursor-pointer`}>
                                <span className={`block w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${setting.value ? 'transform translate-x-4' : 'translate-x-0.5'}`} />
                              </div>
                            )}
                            {setting.type === 'select' && (
                              <select className="text-xs border border-neutral-200 dark:border-neutral-700 rounded bg-transparent py-1 px-2">
                                {setting.options.map((option) => (
                                  <option key={option} value={option} selected={option === setting.value}>
                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}
