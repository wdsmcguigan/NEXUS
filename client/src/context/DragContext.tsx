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
    setIsDragging(true);
    setDragItem(item);
    setDragOperation(operation);
    setDropTarget(null);
  }, []);
  
  // Method to end a drag operation
  const endDrag = useCallback((dropped: boolean = false) => {
    setIsDragging(false);
    setDragItem(null);
    if (!dropped) {
      setDropTarget(null);
    }
  }, []);
  
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