import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define our main settings interface
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  sidebarPosition: 'left' | 'right';
  tabSize: number; // Width in pixels for tabs
  tabHeight: number; // Height in pixels for tabs
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

interface AppContextType {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  sidebarPosition: 'left',
  tabSize: 160, // Default pixel width
  tabHeight: 40, // Default pixel height
  showAvatars: true,
  compactMode: false,
  enableNotifications: true,
  markdownSupport: true,
  previewPane: true,
  spellCheck: true,
  signature: 'Sent from NEXUS.email',
  accountName: 'John Doe',
  emailAddress: 'john@example.com',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Try to load settings from localStorage
    try {
      const savedSettings = localStorage.getItem('nexus-app-settings');
      if (savedSettings) {
        return { ...defaultSettings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
    return defaultSettings;
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('nexus-app-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(current => ({ ...current, ...newSettings }));
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(current => ({ ...current, [key]: value }));
  };

  return (
    <AppContext.Provider value={{ settings, updateSettings, updateSetting }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}