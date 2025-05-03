import React, { useState } from 'react';
import { useLayout } from '../context/LayoutContext';
import { PanelContainer } from './PanelContainer';
import { LayoutControls } from './LayoutControls';

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
      <LayoutControls />
    </div>
  );
}