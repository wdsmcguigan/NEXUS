import React, { useRef, useCallback } from 'react';
import { useDragContext } from '../context/DragContext';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { TabContextMenu } from './TabContextMenu';
import { DependencyIndicator } from './dependency/DependencyIndicator';

interface TabProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  panelId: string;
  isActive: boolean;
  closeable?: boolean;
  index: number;
  onClick: () => void;
  onClose?: () => void;
}

export function DraggableTab({
  id,
  title,
  icon,
  panelId,
  isActive,
  closeable = true,
  index,
  onClick,
  onClose
}: TabProps) {
  const { settings } = useAppContext();
  const { startDrag } = useDragContext();
  const tabRef = useRef<HTMLDivElement>(null);
  const dragInitiatedRef = useRef(false);
  
  // Handle starting a drag operation with detailed logging
  const handleDragStart = useCallback((e: React.MouseEvent | React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // For native drag events, cancel the HTML5 drag and use our custom one
    if ('dataTransfer' in e) {
      (e as React.DragEvent).dataTransfer.effectAllowed = 'move';
    }
    
    // Prevent double initialization
    if (dragInitiatedRef.current) {
      console.log('Drag already initiated, skipping');
      return;
    }
    
    // Mark as initiated
    dragInitiatedRef.current = true;
    
    // Reset after a short delay
    setTimeout(() => {
      dragInitiatedRef.current = false;
    }, 300);
    
    // Activate the tab when starting a drag
    onClick();
    
    console.log(`🔹 Starting drag for tab '${title}' (${id}) from panel ${panelId}`);
    
    if (tabRef.current) {
      // Get the current rect for precise positioning
      const rect = tabRef.current.getBoundingClientRect();
      
      // Create a complete drag item with all necessary information
      const dragItem = {
        type: 'tab' as const,
        id,
        sourcePanelId: panelId,
        sourceIndex: index,
        data: {
          title,
          icon,
          rect,
          isActive,
          closeable
        }
      };
      
      console.log('📋 Created drag item:', dragItem);
      
      // Create a visual ghost element for the drag
      const ghost = document.createElement('div');
      ghost.classList.add('tab-ghost');
      ghost.style.position = 'fixed';
      ghost.style.width = `${rect.width}px`;
      ghost.style.height = `${rect.height}px`;
      ghost.style.backgroundColor = '#3b82f6'; // blue-500
      ghost.style.borderRadius = '4px';
      ghost.style.color = 'white';
      ghost.style.display = 'flex';
      ghost.style.alignItems = 'center';
      ghost.style.justifyContent = 'center';
      ghost.style.padding = '0 12px';
      ghost.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
      ghost.style.opacity = '0.8';
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '9999';
      ghost.textContent = title;
      
      document.body.appendChild(ghost);
      
      // Remove the ghost after a short delay
      setTimeout(() => {
        if (document.body.contains(ghost)) {
          document.body.removeChild(ghost);
        }
      }, 50);
      
      // Start the drag operation in the context
      startDrag(dragItem);
    } else {
      console.error('Cannot start drag - tabRef.current is null');
    }
  }, [id, title, icon, panelId, index, isActive, closeable, startDrag, onClick]);
  
  // Handle mouse down with improved drag detection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only process left mouse button
    if (e.button !== 0) return;
    
    // Always trigger the click handler to activate the tab
    onClick();
    
    // Don't start drag for non-closeable tabs
    if (!closeable) {
      console.log('Tab is not closeable, skipping drag initialization');
      return;
    }
    
    // If modifier key is pressed, start drag immediately
    if (e.ctrlKey || e.altKey || e.metaKey) {
      console.log('Modifier key detected, starting drag immediately');
      handleDragStart(e);
      return;
    }
    
    // Set up for delayed drag detection
    const dragStartPos = { x: e.clientX, y: e.clientY };
    let hasDragStarted = false;
    
    // Track mouse movement to detect drag intent
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (hasDragStarted) return;
      
      // Calculate distance moved
      const dx = moveEvent.clientX - dragStartPos.x;
      const dy = moveEvent.clientY - dragStartPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Lower threshold for more responsive drag (3px instead of 5px)
      if (distance > 3) {
        console.log(`Mouse moved ${distance}px, starting drag`);
        hasDragStarted = true;
        
        // Clean up listeners
        cleanup();
        
        // Start the drag operation
        handleDragStart(e);
      }
    };
    
    // Clean up function to remove event listeners
    const cleanup = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Handle mouse up - clean up without starting drag
    const handleMouseUp = () => {
      cleanup();
    };
    
    // Add listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [onClick, closeable, handleDragStart]);
  
  // Handle context menu for right-click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Context menu is handled by TabContextMenu component
    // We just need to make sure the tab is active
    onClick();
  }, [onClick]);
  
  // Render the tab with its context menu
  return (
    <TabContextMenu tabId={id} panelId={panelId}>
      <div
        ref={tabRef}
        className={cn(
          "flex items-center cursor-pointer shrink-0",
          isActive 
            ? "text-white bg-neutral-800 border-t-2 border-t-blue-500" 
            : "text-neutral-400 hover:text-white hover:bg-neutral-800/50 border-t-2 border-t-transparent",
          "select-none transition-colors"
        )}
        style={{ 
          width: `${settings.tabSize}px`,
          height: `${settings.tabHeight}px` 
        }}
        data-tab-id={id}
        data-panel-id={panelId}
        data-tab-index={index}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        draggable={closeable}
        onDragStart={handleDragStart}
      >
        <div className="flex items-center justify-between w-full px-4">
          <div className="flex items-center overflow-hidden">
            {icon && (
              <span 
                className="mr-2 flex-shrink-0 text-blue-400"
                style={{ 
                  fontSize: `${Math.max(12, Math.min(20, settings.tabHeight * 0.4))}px`,
                }}
              >
                {icon}
              </span>
            )}
            <span 
              className="truncate"
              style={{ 
                fontSize: `${Math.max(11, Math.min(16, settings.tabHeight * 0.35))}px`,
                lineHeight: `${Math.max(14, Math.min(20, settings.tabHeight * 0.45))}px`
              }}
            >
              {title}
            </span>
          </div>
          
          <div className="flex items-center ml-auto">
            {/* Dependency Indicator - will only render if there are dependencies */}
            <div className="mr-1">
              <DependencyIndicator 
                componentId={id} 
                variant="dot" 
                showEmpty={false}
              />
            </div>
            
            {closeable && onClose && (
              <div
                className="ml-1 text-neutral-500 hover:text-white p-1 rounded-sm hover:bg-neutral-700"
                style={{ 
                  transform: `scale(${Math.max(0.7, Math.min(1.2, settings.tabHeight * 0.02))})` 
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                <X size={14} />
              </div>
            )}
          </div>
        </div>
      </div>
    </TabContextMenu>
  );
}