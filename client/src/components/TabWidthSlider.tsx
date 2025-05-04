import React from 'react';
import { useAppContext } from '../context/AppContext';

export function TabWidthSlider() {
  const { settings, updateSetting } = useAppContext();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    updateSetting('tabSize', value);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor="tab-width-slider" className="text-sm font-medium text-neutral-300">
          Tab Width
        </label>
        <span className="text-xs text-neutral-400">{settings.tabSize}px</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-xs text-neutral-400">100</span>
        <input
          id="tab-width-slider"
          type="range"
          min="100"
          max="300"
          step="10"
          value={settings.tabSize}
          onChange={handleChange}
          className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-xs text-neutral-400">300</span>
      </div>
      
      <div className="text-xs text-neutral-500 mt-1">
        Adjust the width of tabs in the tab bar
      </div>
    </div>
  );
}