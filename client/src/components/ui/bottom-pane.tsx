import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { 
  SiSlack, 
  SiDiscord, 
  SiAsana, 
  SiMicrosoftteams, 
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
    icon: <SiMicrosoftteams className="w-10 h-10" />,
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

export function BottomPane({
  visible,
  onClose,
  onIntegrationClick,
}: BottomPaneProps) {
  return (
    <div 
      className={`border-t border-neutral-200 bg-white transition-all duration-300 overflow-hidden ${
        visible ? 'h-60' : 'h-0'
      }`}
    >
      {visible && (
        <>
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-700">Integrations</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
            >
              <X className="h-5 w-5 text-neutral-500" />
            </Button>
          </div>
          
          <div className="p-4 flex flex-wrap gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex flex-col items-center justify-center w-24 h-24 border border-neutral-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors cursor-pointer p-2"
                onClick={() => onIntegrationClick && onIntegrationClick(integration)}
              >
                <div className="text-[color:var(--color)]" style={{ "--color": integration.color } as React.CSSProperties}>
                  {integration.icon}
                </div>
                <span className="mt-2 text-xs text-center font-medium text-neutral-700">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
