import React, { useState, useCallback } from 'react';
import { PanelConfig, PanelDirection, usePanelContext } from '../context/PanelContext';
import { DragOverlay } from './DragOverlay';
import { EdgeIndicator } from './EdgeIndicator';
import { nanoid } from 'nanoid';

export function LayoutManager() {
  const { 
    layout, 
    splitPanel, 
    maximizedPanelId, 
    maximizePanel, 
    restorePanel 
  } = usePanelContext();
  
  // State for tracking drag operation
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTab, setDraggedTab] = useState<{ id: string; panelId: string } | null>(null);
  
  // Handle the start of dragging a tab
  const handleDragStart = useCallback((tabId: string, panelId: string, e: React.DragEvent) => {
    setIsDragging(true);
    setDraggedTab({ id: tabId, panelId });
    
    // Custom drag image
    const dragImage = document.createElement('div');
    dragImage.textContent = 'Moving Tab';
    dragImage.className = 'border border-primary bg-primary/10 px-3 py-1 rounded-md';
    document.body.appendChild(dragImage);
    
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Need to set timeout because the drag operation throws away the element right after
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  }, []);
  
  // Handle the end of dragging
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedTab(null);
  }, []);
  
  // Handle dropping a tab into a new location
  const handleDrop = useCallback((targetId: string, type: 'panel' | 'edge', direction?: 'top' | 'right' | 'bottom' | 'left') => {
    setIsDragging(false);
    
    if (!draggedTab) return;
    
    if (type === 'panel') {
      // Move tab to another panel
      // This is handled by the PanelContainer directly
    } else if (type === 'edge' && direction) {
      // Create a new panel and split the target panel
      // Find the panel in the layout
      const findPanel = (layout: PanelConfig, id: string): PanelConfig | null => {
        if (layout.id === id) return layout;
        
        if (layout.children) {
          for (const child of layout.children) {
            const found = findPanel(child, id);
            if (found) return found;
          }
        }
        
        return null;
      };
      
      const targetPanel = findPanel(layout, targetId);
      if (!targetPanel) return;
      
      // Determine the split direction based on the edge
      let splitDir: PanelDirection = 'horizontal';
      if (direction === 'top' || direction === 'bottom') {
        splitDir = 'vertical';
      } else {
        splitDir = 'horizontal';
      }
      
      // Create a new empty panel
      const newPanelId = `panel-${nanoid(6)}`;
      const newTabId = `tab-${nanoid(8)}`;
      
      const newPanel: PanelConfig = {
        id: newPanelId,
        type: 'panel',
        size: 50,
        tabs: [
          { id: newTabId, title: 'New Tab', closeable: true }
        ],
        activeTabId: newTabId,
        contents: [
          { id: newTabId, type: 'emailList', props: { view: 'new' } }
        ]
      };
      
      // Execute the split
      splitPanel(targetId, splitDir, newPanel);
    }
    
    setDraggedTab(null);
  }, [draggedTab, layout, splitPanel]);
  
  // Function to recursively render edge indicators for each panel
  const renderEdgeIndicators = (panelConfig: PanelConfig): React.ReactNode => {
    const edgeIndicators = (
      <div className="absolute inset-0 z-20 pointer-events-none">
        <EdgeIndicator direction="top" panelId={panelConfig.id} className="pointer-events-auto" />
        <EdgeIndicator direction="right" panelId={panelConfig.id} className="pointer-events-auto" />
        <EdgeIndicator direction="bottom" panelId={panelConfig.id} className="pointer-events-auto" />
        <EdgeIndicator direction="left" panelId={panelConfig.id} className="pointer-events-auto" />
      </div>
    );
    
    // If this panel has children, also render edge indicators for each child
    const childEdgeIndicators = panelConfig.children?.map(child => renderEdgeIndicators(child)) || null;
    
    return (
      <React.Fragment key={panelConfig.id}>
        {edgeIndicators}
        {childEdgeIndicators}
      </React.Fragment>
    );
  };
  
  return (
    <>
      {/* Edge indicators for all panels (only shown during drag) */}
      {isDragging && renderEdgeIndicators(layout)}
      
      {/* Drag overlay for visual feedback */}
      <DragOverlay active={isDragging} onDrop={handleDrop} />
    </>
  );
}