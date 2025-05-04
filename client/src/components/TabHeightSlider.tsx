import React from 'react';
import { useAppContext } from '../context/AppContext';

export function TabHeightSlider() {
  const { settings, updateSetting } = useAppContext();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    updateSetting('tabHeight', value);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor="tab-height-slider" className="text-sm font-medium text-neutral-300">
          Tab Height
        </label>
        <span className="text-xs text-neutral-400">{settings.tabHeight}px</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-xs text-neutral-400">30</span>
        <input
          id="tab-height-slider"
          type="range"
          min="30"
          max="60"
          step="2"
          value={settings.tabHeight}
          onChange={handleChange}
          className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-xs text-neutral-400">60</span>
      </div>
      
      <div className="text-xs text-neutral-500 mt-1">
        Adjust the height of tabs in the tab bar
      </div>
    </div>
  );
}