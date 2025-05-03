import React, { useState } from 'react';
import { useLayout } from '../context/LayoutContext';
import { PanelContainer } from './PanelContainer';
import { AdvancedPanelManager } from './AdvancedPanelManager';

export function LayoutManager() {
  const { currentLayout } = useLayout();
  const [maximizedPanelId, setMaximizedPanelId] = useState<string | undefined>(undefined);

  const handleMaximizePanel = (panelId: string) => {
    setMaximizedPanelId(panelId);
  };

  const handleRestorePanel = () => {
    setMaximizedPanelId(undefined);
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="h-full overflow-hidden">
        <PanelContainer 
          layout={currentLayout}
          onMaximizePanel={handleMaximizePanel}
          onRestorePanel={handleRestorePanel}
          maximizedPanelId={maximizedPanelId}
        />
      </div>
      <div className="flex items-center justify-center gap-2 p-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <button className="px-3 py-1 text-sm bg-primary text-white rounded-md">Save Layout</button>
        <button className="px-3 py-1 text-sm border border-primary text-primary rounded-md">Load Layout</button>
      </div>
    </div>
  );
}