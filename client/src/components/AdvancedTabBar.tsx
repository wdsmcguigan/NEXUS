import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, Maximize2, Minimize2, ArrowUpCircle } from 'lucide-react';
import { DraggableTab } from './DraggableTab';
import { useDragContext } from '../context/DragContext';
import { useTabContext, DropTarget } from '../context/TabContext';
import { cn } from '@/lib/utils';

// Define the Tab interface
interface Tab {
  id: string;
  title: string;
  icon?: React.ReactNode;
  closeable?: boolean;
  pinned?: boolean;
}

interface AdvancedTabBarProps {
  tabs: Tab[];
  activeTabId: string | undefined;
  panelId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAddTab: () => void;
  onViewToggle: () => void;
  isMaximized: boolean;
}

export function AdvancedTabBar({
  tabs,
  activeTabId,
  panelId,
  onTabClick,
  onTabClose,
  onAddTab,
  onViewToggle,
  isMaximized
}: AdvancedTabBarProps) {
  const { dragState, setDropTarget, clearDropTarget } = useDragContext();
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [dropZones, setDropZones] = useState<Array<{ index: number; rect: DOMRect }>>([]);
  const [dropIndicator, setDropIndicator] = useState<{ show: boolean; index: number }>({
    show: false,
    index: -1
  });

  // Separate pinned tabs from regular tabs
  const pinnedTabs = tabs.filter(tab => tab.pinned);
  const regularTabs = tabs.filter(tab => !tab.pinned);

  // Calculate drop zones when tabs change or on resize
  useEffect(() => {
    const calculateDropZones = () => {
      const tabElements = tabsContainerRef.current?.querySelectorAll('[data-tab-id]');
      if (!tabElements) return;

      const newDropZones: Array<{ index: number; rect: DOMRect }> = [];

      tabElements.forEach((tabElement, index) => {
        const rect = tabElement.getBoundingClientRect();
        newDropZones.push({ index, rect });
      });

      setDropZones(newDropZones);
      console.log(`Calculated ${newDropZones.length} drop zones in panel ${panelId}`);
    };

    calculateDropZones();

    // Also recalculate on window resize
    window.addEventListener('resize', calculateDropZones);
    return () => {
      window.removeEventListener('resize', calculateDropZones);
    };
  }, [tabs, panelId]);

  // Handle mouse move over the tab bar
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState.isDragging || dragState.sourcePanelId === panelId) return;

      const tabBarRect = tabsContainerRef.current?.getBoundingClientRect();
      if (!tabBarRect) return;

      // Check if mouse is within the tab bar area
      if (
        e.clientX >= tabBarRect.left &&
        e.clientX <= tabBarRect.right &&
        e.clientY >= tabBarRect.top &&
        e.clientY <= tabBarRect.bottom
      ) {
        // Find the closest drop zone
        let closestZoneIndex = -1;
        let minDistance = Number.MAX_VALUE;

        dropZones.forEach(({ index, rect }) => {
          const centerX = rect.left + rect.width / 2;
          const distance = Math.abs(e.clientX - centerX);

          if (distance < minDistance) {
            minDistance = distance;
            closestZoneIndex = index;
          }
        });

        if (closestZoneIndex !== -1) {
          // Determine if we should drop before or after this tab
          const zone = dropZones[closestZoneIndex];
          const centerX = zone.rect.left + zone.rect.width / 2;
          const position = e.clientX < centerX ? 'before' : 'after';

          // Convert to DragContext's DropTarget type
          const target = {
            panelId,
            targetZone: position as 'before' | 'after',
            tabId: tabs[closestZoneIndex]?.id
          };

          setDropTarget(target);
          setDropIndicator({ show: true, index: closestZoneIndex + (position === 'after' ? 1 : 0) });
        }
      } else {
        clearDropTarget();
        setDropIndicator({ show: false, index: -1 });
      }
    },
    [dropZones, dragState.isDragging, dragState.sourcePanelId, panelId, setDropTarget, clearDropTarget, tabs]
  );

  // Handle mouse leave from the tab bar
  const handleMouseLeave = useCallback(() => {
    clearDropTarget();
    setDropIndicator({ show: false, index: -1 });
  }, [clearDropTarget]);

  return (
    <div
      className="flex items-center bg-gray-900 border-b border-gray-800 overflow-x-auto hide-scrollbar"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-panel-id={panelId}
    >
      <div ref={tabsContainerRef} className="flex flex-1 overflow-x-auto hide-scrollbar">
        {/* Pinned tabs */}
        {pinnedTabs.map((tab, index) => (
          <DraggableTab
            key={tab.id}
            id={tab.id}
            title={tab.title}
            icon={tab.icon}
            panelId={panelId}
            isActive={tab.id === activeTabId}
            closeable={tab.closeable}
            pinned={true}
            index={index}
            onClick={() => onTabClick(tab.id)}
            onClose={tab.closeable ? () => onTabClose(tab.id) : undefined}
          />
        ))}

        {/* Regular tabs */}
        {regularTabs.map((tab, index) => (
          <React.Fragment key={tab.id}>
            {/* Drop indicator before tab */}
            {dropIndicator.show && dropIndicator.index === index + pinnedTabs.length && (
              <div className="w-1 h-full bg-blue-500 animate-pulse absolute" style={{ left: `${index * 100}px` }} />
            )}
            <DraggableTab
              id={tab.id}
              title={tab.title}
              icon={tab.icon}
              panelId={panelId}
              isActive={tab.id === activeTabId}
              closeable={tab.closeable}
              pinned={false}
              index={index + pinnedTabs.length}
              onClick={() => onTabClick(tab.id)}
              onClose={tab.closeable ? () => onTabClose(tab.id) : undefined}
            />
            {/* Drop indicator after the last tab */}
            {dropIndicator.show && dropIndicator.index === index + pinnedTabs.length + 1 && index === regularTabs.length - 1 && (
              <div className="w-1 h-full bg-blue-500 animate-pulse absolute" style={{ right: 0 }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Tab bar actions */}
      <div className="flex items-center px-2 space-x-1">
        <button
          className="p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
          onClick={onAddTab}
          title="Add new tab"
        >
          <Plus size={16} />
        </button>
        <button
          className="p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
          onClick={onViewToggle}
          title={isMaximized ? "Restore panel" : "Maximize panel"}
        >
          {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </div>
  );
}

export default AdvancedTabBar;