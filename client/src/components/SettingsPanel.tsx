import React, { useState } from 'react';
import { Settings, Moon, Sun, Monitor, Save, Mail, Bell, Shield, PanelLeft, Users, Palette } from 'lucide-react';

// Define our main settings interface
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  sidebarPosition: 'left' | 'right';
  tabSize: 'small' | 'medium' | 'large';
  showAvatars: boolean;
  compactMode: boolean;
  enableNotifications: boolean;
  markdownSupport: boolean;
  previewPane: boolean;
  spellCheck: boolean;
  signature: string;
  accountName: string;
  emailAddress: string;
}

// Define mock accounts
interface Account {
  id: string;
  name: string;
  email: string;
  type: 'personal' | 'work' | 'other';
}

export function SettingsPanel() {
  // Initialize with some default settings
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    sidebarPosition: 'left',
    tabSize: 'medium',
    showAvatars: true,
    compactMode: false,
    enableNotifications: true,
    markdownSupport: true,
    previewPane: true,
    spellCheck: true,
    signature: 'Sent from NEXUS.email',
    accountName: 'John Doe',
    emailAddress: 'john@example.com',
  });

  const [activeTab, setActiveTab] = useState('general');
  
  const [accounts, setAccounts] = useState<Account[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', type: 'personal' },
    { id: '2', name: 'John Doe', email: 'john.doe@work.com', type: 'work' },
  ]);
  
  const [activeAccount, setActiveAccount] = useState<string>('1');

  // Handle settings changes
  const handleSettingChange = (
    settingName: keyof AppSettings, 
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [settingName]: value
    }));
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    handleSettingChange('theme', theme);
  };
  
  const handleToggle = (settingName: keyof AppSettings) => {
    handleSettingChange(settingName, !settings[settingName]);
  };

  const saveSettings = () => {
    console.log('Saving settings:', settings);
    // In a real app, this would call an API to save the settings
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-white">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <h2 className="font-semibold flex items-center">
          <Settings className="mr-2" size={18} /> 
          <span>Settings</span>
        </h2>
        <button
          onClick={saveSettings}
          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded-sm flex items-center"
        >
          <Save size={14} className="mr-1" />
          Save
        </button>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Settings navigation */}
        <div className="w-40 border-r border-neutral-800 overflow-y-auto">
          <nav className="p-2">
            <button
              className={`w-full text-left px-3 py-2 rounded-sm mb-1 flex items-center ${activeTab === 'general' ? 'bg-blue-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'}`}
              onClick={() => setActiveTab('general')}
            >
              <Settings size={16} className="mr-2" />
              General
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-sm mb-1 flex items-center ${activeTab === 'accounts' ? 'bg-blue-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'}`}
              onClick={() => setActiveTab('accounts')}
            >
              <Users size={16} className="mr-2" />
              Accounts
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-sm mb-1 flex items-center ${activeTab === 'appearance' ? 'bg-blue-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'}`}
              onClick={() => setActiveTab('appearance')}
            >
              <Palette size={16} className="mr-2" />
              Appearance
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-sm mb-1 flex items-center ${activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={16} className="mr-2" />
              Notifications
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-sm mb-1 flex items-center ${activeTab === 'privacy' ? 'bg-blue-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'}`}
              onClick={() => setActiveTab('privacy')}
            >
              <Shield size={16} className="mr-2" />
              Privacy
            </button>
          </nav>
        </div>
        
        {/* Settings content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-neutral-800 pb-2">General Settings</h3>
              
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span>Markdown support:</span>
                  <input
                    type="checkbox"
                    checked={settings.markdownSupport}
                    onChange={() => handleToggle('markdownSupport')}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span>Show preview pane:</span>
                  <input
                    type="checkbox"
                    checked={settings.previewPane}
                    onChange={() => handleToggle('previewPane')}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span>Spell check:</span>
                  <input
                    type="checkbox"
                    checked={settings.spellCheck}
                    onChange={() => handleToggle('spellCheck')}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <span>Compact mode:</span>
                  <input
                    type="checkbox"
                    checked={settings.compactMode}
                    onChange={() => handleToggle('compactMode')}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="block">
                  <span className="block mb-1">Signature:</span>
                  <textarea
                    value={settings.signature}
                    onChange={(e) => handleSettingChange('signature', e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-sm p-2 text-sm"
                    rows={3}
                  />
                </label>
              </div>
            </div>
          )}
          
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-neutral-800 pb-2">Appearance</h3>
              
              <div className="space-y-2">
                <div>
                  <span className="block mb-2">Theme:</span>
                  <div className="flex space-x-2">
                    <button
                      className={`flex-1 p-3 flex flex-col items-center rounded-sm border ${settings.theme === 'light' ? 'border-blue-500 bg-blue-900/20' : 'border-neutral-700 hover:bg-neutral-800'}`}
                      onClick={() => handleThemeChange('light')}
                    >
                      <Sun size={24} className="mb-2" />
                      <span>Light</span>
                    </button>
                    
                    <button
                      className={`flex-1 p-3 flex flex-col items-center rounded-sm border ${settings.theme === 'dark' ? 'border-blue-500 bg-blue-900/20' : 'border-neutral-700 hover:bg-neutral-800'}`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <Moon size={24} className="mb-2" />
                      <span>Dark</span>
                    </button>
                    
                    <button
                      className={`flex-1 p-3 flex flex-col items-center rounded-sm border ${settings.theme === 'system' ? 'border-blue-500 bg-blue-900/20' : 'border-neutral-700 hover:bg-neutral-800'}`}
                      onClick={() => handleThemeChange('system')}
                    >
                      <Monitor size={24} className="mb-2" />
                      <span>System</span>
                    </button>
                  </div>
                </div>
                
                <div className="pt-2">
                  <span className="block mb-2">Sidebar position:</span>
                  <div className="flex space-x-2">
                    <button
                      className={`flex-1 p-3 flex items-center justify-center rounded-sm border ${settings.sidebarPosition === 'left' ? 'border-blue-500 bg-blue-900/20' : 'border-neutral-700 hover:bg-neutral-800'}`}
                      onClick={() => handleSettingChange('sidebarPosition', 'left')}
                    >
                      <PanelLeft size={20} className="mr-2" />
                      <span>Left</span>
                    </button>
                    
                    <button
                      className={`flex-1 p-3 flex items-center justify-center rounded-sm border ${settings.sidebarPosition === 'right' ? 'border-blue-500 bg-blue-900/20' : 'border-neutral-700 hover:bg-neutral-800'}`}
                      onClick={() => handleSettingChange('sidebarPosition', 'right')}
                    >
                      <span>Right</span>
                      <PanelLeft size={20} className="ml-2 transform rotate-180" />
                    </button>
                  </div>
                </div>
                
                <div className="pt-2">
                  <span className="block mb-2">Tab size:</span>
                  <div className="flex space-x-2">
                    <button
                      className={`flex-1 p-3 flex items-center justify-center rounded-sm border ${settings.tabSize === 'small' ? 'border-blue-500 bg-blue-900/20' : 'border-neutral-700 hover:bg-neutral-800'}`}
                      onClick={() => handleSettingChange('tabSize', 'small')}
                    >
                      <span>Small</span>
                    </button>
                    
                    <button
                      className={`flex-1 p-3 flex items-center justify-center rounded-sm border ${settings.tabSize === 'medium' ? 'border-blue-500 bg-blue-900/20' : 'border-neutral-700 hover:bg-neutral-800'}`}
                      onClick={() => handleSettingChange('tabSize', 'medium')}
                    >
                      <span>Medium</span>
                    </button>
                    
                    <button
                      className={`flex-1 p-3 flex items-center justify-center rounded-sm border ${settings.tabSize === 'large' ? 'border-blue-500 bg-blue-900/20' : 'border-neutral-700 hover:bg-neutral-800'}`}
                      onClick={() => handleSettingChange('tabSize', 'large')}
                    >
                      <span>Large</span>
                    </button>
                  </div>
                </div>
                
                <label className="flex items-center justify-between pt-2">
                  <span>Show avatars:</span>
                  <input
                    type="checkbox"
                    checked={settings.showAvatars}
                    onChange={() => handleToggle('showAvatars')}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
              </div>
            </div>
          )}
          
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-neutral-800 pb-2">Email Accounts</h3>
              
              <div className="space-y-2">
                {accounts.map(account => (
                  <div
                    key={account.id}
                    className={`p-3 rounded-sm border ${activeAccount === account.id ? 'border-blue-500 bg-blue-900/20' : 'border-neutral-700'}`}
                    onClick={() => setActiveAccount(account.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{account.name}</h4>
                        <div className="flex items-center text-sm text-neutral-400">
                          <Mail size={14} className="mr-1" />
                          {account.email}
                        </div>
                        <div className="mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            account.type === 'work' ? 'bg-blue-900/50 text-blue-300' :
                            account.type === 'personal' ? 'bg-green-900/50 text-green-300' :
                            'bg-neutral-800 text-neutral-300'
                          }`}>
                            {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <button className="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-sm">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button className="w-full p-2 mt-2 bg-blue-600 hover:bg-blue-700 rounded-sm">
                  Add Account
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-neutral-800 pb-2">Notifications</h3>
              
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span>Enable desktop notifications:</span>
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={() => handleToggle('enableNotifications')}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
                
                <div className="p-3 bg-neutral-800 rounded-sm">
                  <p className="text-sm text-neutral-300">
                    Note: You may need to allow notifications in your browser settings for this feature to work properly.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-neutral-800 pb-2">Privacy & Security</h3>
              
              <div className="space-y-2">
                <div className="p-3 bg-neutral-800 rounded-sm">
                  <h4 className="font-medium mb-2">Data Privacy</h4>
                  <p className="text-sm text-neutral-300 mb-3">
                    NEXUS.email prioritizes your data privacy. Your emails and personal information are encrypted and securely stored.
                  </p>
                  <button className="text-xs px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-sm">
                    Privacy Policy
                  </button>
                </div>
                
                <div className="p-3 bg-neutral-800 rounded-sm">
                  <h4 className="font-medium mb-2">Security Settings</h4>
                  <div className="space-y-2">
                    <button className="w-full text-sm p-2 bg-neutral-700 hover:bg-neutral-600 rounded-sm text-left">
                      Change Password
                    </button>
                    <button className="w-full text-sm p-2 bg-neutral-700 hover:bg-neutral-600 rounded-sm text-left">
                      Two-Factor Authentication
                    </button>
                    <button className="w-full text-sm p-2 bg-neutral-700 hover:bg-neutral-600 rounded-sm text-left">
                      Session Management
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;