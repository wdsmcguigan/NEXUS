import React from 'react';
import { useAppContext } from '../context/AppContext';
import { TabWidthSlider } from './TabWidthSlider';
import { TabHeightSlider } from './TabHeightSlider';
import { Settings, Monitor, Moon, Sun, Layout, Eye, Bell, Type, CheckSquare } from 'lucide-react';

export function SettingsPanel() {
  const { settings, updateSetting } = useAppContext();
  
  const themeOptions = [
    { value: 'light', label: 'Light', icon: <Sun size={16} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
    { value: 'system', label: 'Auto', icon: <Monitor size={16} /> }
  ];
  
  const sidebarOptions = [
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' }
  ];
  
  return (
    <div className="p-4 h-full overflow-auto thin-scrollbar bg-neutral-900 text-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 mr-2 text-blue-400" />
          <h2 className="text-xl font-semibold">Settings</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Appearance */}
          <div className="bg-neutral-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center mb-2">
              <Eye className="h-5 w-5 mr-2 text-blue-400" />
              <h3 className="font-medium">Appearance</h3>
            </div>
            
            {/* Theme selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Theme</label>
              <div className="flex space-x-2">
                {themeOptions.map(option => (
                  <button
                    key={option.value}
                    className={`flex items-center px-3 py-2 rounded ${
                      settings.theme === option.value 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                    }`}
                    onClick={() => updateSetting('theme', option.value as any)}
                  >
                    {option.icon}
                    <span className="ml-2">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Sidebar position */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Sidebar Position</label>
              <div className="flex space-x-2">
                {sidebarOptions.map(option => (
                  <button
                    key={option.value}
                    className={`px-3 py-2 rounded ${
                      settings.sidebarPosition === option.value 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                    }`}
                    onClick={() => updateSetting('sidebarPosition', option.value as any)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tab width */}
            <TabWidthSlider />
            
            {/* Tab height */}
            <TabHeightSlider />
            
            {/* Compact mode */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">Compact Mode</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.compactMode}
                  onChange={e => updateSetting('compactMode', e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {/* Show avatars */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">Show Avatars</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.showAvatars}
                  onChange={e => updateSetting('showAvatars', e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          {/* Email Preferences */}
          <div className="bg-neutral-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center mb-2">
              <Bell className="h-5 w-5 mr-2 text-blue-400" />
              <h3 className="font-medium">Email Preferences</h3>
            </div>
            
            {/* Notifications */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">Enable Notifications</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.enableNotifications}
                  onChange={e => updateSetting('enableNotifications', e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {/* Markdown support */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">Markdown Support</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.markdownSupport}
                  onChange={e => updateSetting('markdownSupport', e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {/* Preview pane */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">Preview Pane</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.previewPane}
                  onChange={e => updateSetting('previewPane', e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {/* Spell check */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">Spell Check</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.spellCheck}
                  onChange={e => updateSetting('spellCheck', e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {/* Email signature */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Email Signature</label>
              <textarea
                className="w-full rounded bg-neutral-700 border-none p-2 text-white"
                rows={3}
                value={settings.signature}
                onChange={e => updateSetting('signature', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}