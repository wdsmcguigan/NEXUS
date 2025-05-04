import React, { useState } from 'react';
import { Settings as SettingsIcon, Monitor as DisplayIcon, Bell as NotificationIcon, User as UserIcon, Shield as SecurityIcon } from 'lucide-react';

interface SettingsPanelProps {
  tabId?: string;
  [key: string]: any;
}

type SettingsSection = 'display' | 'account' | 'notifications' | 'security' | 'integrations';

export function SettingsPanel({ tabId, ...props }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('display');

  const renderSection = () => {
    switch (activeSection) {
      case 'display':
        return (
          <div className="space-y-5">
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-4">
              <div className="font-medium text-sm mb-2">Theme</div>
              <div className="text-xs text-neutral-400 mb-3">Choose your preferred color scheme.</div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs rounded bg-neutral-700 hover:bg-neutral-600 text-white">Dark</button>
                <button className="px-3 py-1.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300">Light</button>
                <button className="px-3 py-1.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300">System</button>
              </div>
            </div>
            
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-4">
              <div className="font-medium text-sm mb-2">Layout</div>
              <div className="text-xs text-neutral-400 mb-3">Configure your panel layout.</div>
              <div className="grid grid-cols-2 gap-2">
                <button className="px-3 py-1.5 text-xs rounded bg-neutral-700 hover:bg-neutral-600 text-white">Default</button>
                <button className="px-3 py-1.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300">Compact</button>
                <button className="px-3 py-1.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300">Wide</button>
                <button className="px-3 py-1.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300">Custom</button>
              </div>
            </div>
            
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-4">
              <div className="font-medium text-sm mb-2">Font Size</div>
              <div className="text-xs text-neutral-400 mb-3">Adjust the text size.</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">A</span>
                <input type="range" min="1" max="5" defaultValue="3" className="w-full" />
                <span className="text-base text-neutral-400">A</span>
              </div>
            </div>
          </div>
        );
      
      case 'account':
        return (
          <div className="space-y-5">
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-4">
              <div className="font-medium text-sm mb-2">Email Accounts</div>
              <div className="text-xs text-neutral-400 mb-3">Manage your connected email accounts.</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>work@example.com</span>
                  </div>
                  <button className="text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600">Edit</button>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>personal@example.com</span>
                  </div>
                  <button className="text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600">Edit</button>
                </div>
              </div>
              <button className="mt-3 w-full text-xs px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200">
                Add Email Account
              </button>
            </div>
            
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-4">
              <div className="font-medium text-sm mb-2">Signatures</div>
              <div className="text-xs text-neutral-400 mb-3">Manage your email signatures.</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Work Signature</span>
                  <button className="text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600">Edit</button>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Personal Signature</span>
                  <button className="text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600">Edit</button>
                </div>
              </div>
              <button className="mt-3 w-full text-xs px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200">
                Add Signature
              </button>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="space-y-5">
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-4">
              <div className="font-medium text-sm mb-2">Email Notifications</div>
              <div className="text-xs text-neutral-400 mb-3">Configure when to receive notifications.</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">All emails</span>
                  <div className="w-8 h-4 bg-blue-600 rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Important emails only</span>
                  <div className="w-8 h-4 bg-neutral-700 rounded-full relative">
                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sound alerts</span>
                  <div className="w-8 h-4 bg-blue-600 rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-4">
              <div className="font-medium text-sm mb-2">Do Not Disturb</div>
              <div className="text-xs text-neutral-400 mb-3">Set quiet hours.</div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-400 mb-1">From</label>
                  <select className="w-full bg-neutral-700 rounded px-2 py-1 text-sm">
                    <option>10:00 PM</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-neutral-400 mb-1">To</label>
                  <select className="w-full bg-neutral-700 rounded px-2 py-1 text-sm">
                    <option>7:00 AM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="space-y-5">
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-4">
              <div className="font-medium text-sm mb-2">Password</div>
              <div className="text-xs text-neutral-400 mb-3">Change your account password.</div>
              <button className="w-full text-xs px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200">
                Change Password
              </button>
            </div>
            
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-4">
              <div className="font-medium text-sm mb-2">Two-Factor Authentication</div>
              <div className="text-xs text-neutral-400 mb-3">Secure your account with 2FA.</div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Enable 2FA</span>
                <div className="w-8 h-4 bg-neutral-700 rounded-full relative">
                  <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <button className="w-full text-xs px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200 opacity-50" disabled>
                Configure 2FA
              </button>
            </div>
            
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-4">
              <div className="font-medium text-sm mb-2">Login History</div>
              <div className="text-xs text-neutral-400 mb-3">View your recent login activity.</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Today, 10:30 AM</span>
                  <span className="text-neutral-400">Current session</span>
                </div>
                <div className="flex justify-between">
                  <span>Yesterday, 4:15 PM</span>
                  <span className="text-neutral-400">Chrome on Mac</span>
                </div>
                <div className="flex justify-between">
                  <span>May 1, 9:20 AM</span>
                  <span className="text-neutral-400">Safari on iPhone</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'integrations':
        return (
          <div className="space-y-5">
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-4">
              <div className="font-medium text-sm mb-2">Connected Services</div>
              <div className="text-xs text-neutral-400 mb-3">Manage your third-party integrations.</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs">S</div>
                    <span>Slack</span>
                  </div>
                  <button className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50">Disconnect</button>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs">A</div>
                    <span>Asana</span>
                  </div>
                  <button className="text-xs px-2 py-1 rounded bg-blue-900/30 text-blue-400 hover:bg-blue-900/50">Connect</button>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center text-green-400 text-xs">C</div>
                    <span>Calendar</span>
                  </div>
                  <button className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50">Disconnect</button>
                </div>
              </div>
              <button className="mt-3 w-full text-xs px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200">
                Browse More Integrations
              </button>
            </div>
            
            <div className="border border-neutral-800 bg-neutral-800/50 rounded p-4">
              <div className="font-medium text-sm mb-2">API Access</div>
              <div className="text-xs text-neutral-400 mb-3">Manage access tokens for your account.</div>
              <button className="w-full text-xs px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200">
                Generate API Token
              </button>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-64 text-neutral-400">
            Select a settings category
          </div>
        );
    }
  };

  return (
    <div className="h-full overflow-auto bg-neutral-900 text-neutral-200">
      <div className="px-4 py-3 border-b border-neutral-800">
        <h2 className="text-base font-medium">Settings</h2>
      </div>
      
      <div className="flex h-[calc(100%-48px)]">
        {/* Sidebar navigation */}
        <div className="w-48 border-r border-neutral-800 p-2">
          <nav className="space-y-1">
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors ${
                activeSection === 'display' 
                  ? 'bg-neutral-800 text-white' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
              onClick={() => setActiveSection('display')}
            >
              <DisplayIcon size={16} />
              <span>Display</span>
            </button>
            
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors ${
                activeSection === 'account' 
                  ? 'bg-neutral-800 text-white' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
              onClick={() => setActiveSection('account')}
            >
              <UserIcon size={16} />
              <span>Account</span>
            </button>
            
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors ${
                activeSection === 'notifications' 
                  ? 'bg-neutral-800 text-white' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
              onClick={() => setActiveSection('notifications')}
            >
              <NotificationIcon size={16} />
              <span>Notifications</span>
            </button>
            
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors ${
                activeSection === 'security' 
                  ? 'bg-neutral-800 text-white' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
              onClick={() => setActiveSection('security')}
            >
              <SecurityIcon size={16} />
              <span>Security</span>
            </button>
            
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 transition-colors ${
                activeSection === 'integrations' 
                  ? 'bg-neutral-800 text-white' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
              onClick={() => setActiveSection('integrations')}
            >
              <SettingsIcon size={16} />
              <span>Integrations</span>
            </button>
          </nav>
        </div>
        
        {/* Settings content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;