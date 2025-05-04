import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types for dragged items
export interface DragItem {
  type: 'tab' | 'component' | 'panel';
  id: string;
  sourcePanelId?: string;
  sourceIndex?: number;
  data?: any;
}

// Types for drag states
export type DragOperation = 'move' | 'copy' | 'link';
export type DropTargetType = 'panel' | 'edge' | 'tabbar' | 'position';
export type DropDirection = 'top' | 'right' | 'bottom' | 'left' | 'before' | 'after';

export interface DropPosition {
  index: number;
  panelId: string;
}

export interface DropTarget {
  type: DropTargetType;
  id: string;
  direction?: DropDirection;
  position?: DropPosition;
  rect?: DOMRect;
}

export interface DragContextType {
  // Current drag state
  isDragging: boolean;
  dragItem: DragItem | null;
  dragOperation: DragOperation;
  dropTarget: DropTarget | null;
  
  // Methods for drag operations
  startDrag: (item: DragItem, operation?: DragOperation) => void;
  endDrag: (dropped?: boolean) => void;
  setDropTarget: (target: DropTarget | null) => void;
  
  // Keyboard modifiers
  isShiftPressed: boolean;
  isAltPressed: boolean;
  isCtrlPressed: boolean;
  setModifiers: (shift: boolean, alt: boolean, ctrl: boolean) => void;
}

// Create the context
const DragContext = createContext<DragContextType | undefined>(undefined);

// Provider component
export function DragProvider({ children }: { children: ReactNode }) {
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dragOperation, setDragOperation] = useState<DragOperation>('move');
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  
  // Keyboard modifiers
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  
  // Method to start a drag operation
  const startDrag = useCallback((item: DragItem, operation: DragOperation = 'move') => {
    console.log('Starting drag operation:', item);
    setIsDragging(true);
    setDragItem(item);
    setDragOperation(operation);
    setDropTarget(null);
  }, []);
  
  // Method to end a drag operation
  const endDrag = useCallback((dropped: boolean = false) => {
    const source = dragItem?.sourcePanelId;
    const target = dropTarget?.id;
    console.log(`DragContext: Ending drag operation from ${source} to ${target}, successful: ${dropped}`);
    
    // Log more details if we have them
    if (dragItem) {
      console.log('DragContext: Drag item details:', {
        id: dragItem.id,
        type: dragItem.type,
        sourcePanel: dragItem.sourcePanelId,
        sourceIndex: dragItem.sourceIndex
      });
    }
    
    if (dropTarget) {
      console.log('DragContext: Drop target details:', {
        id: dropTarget.id,
        type: dropTarget.type,
        direction: dropTarget.direction,
        position: dropTarget.position
      });
    }
    
    // Reset state
    setIsDragging(false);
    setDragItem(null);
    
    // Only keep dropTarget if it was a successful drop (for visual feedback)
    if (!dropped) {
      setDropTarget(null);
    } else {
      // If it was a successful drop, clear drop target after a short delay
      // to allow for visual feedback
      setTimeout(() => {
        setDropTarget(null);
      }, 300);
    }
  }, [dragItem, dropTarget]);
  
  // Method to update keyboard modifiers
  // Modified to not require modifiers for normal operations
  const setModifiers = useCallback((shift: boolean, alt: boolean, ctrl: boolean) => {
    setIsShiftPressed(shift);
    setIsAltPressed(alt);
    setIsCtrlPressed(ctrl);
    
    // Update drag operation based on modifiers
    // Always use 'move' as default - no modifiers required for normal operations
    let operation: DragOperation = 'move';
    if (ctrl) operation = 'copy';
    if (alt) operation = 'link';
    setDragOperation(operation);
  }, []);
  
  // Register global keyboard event listeners
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setModifiers(e.shiftKey, e.altKey, e.ctrlKey || e.metaKey);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setModifiers(e.shiftKey, e.altKey, e.ctrlKey || e.metaKey);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setModifiers]);
  
  // Context value
  const value: DragContextType = {
    isDragging,
    dragItem,
    dragOperation,
    dropTarget,
    startDrag,
    endDrag,
    setDropTarget,
    isShiftPressed,
    isAltPressed,
    isCtrlPressed,
    setModifiers
  };
  
  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
}

// Custom hook to use the context
export function useDragContext() {
  const context = useContext(DragContext);
  if (context === undefined) {
    throw new Error('useDragContext must be used within a DragProvider');
  }
  return context;
}