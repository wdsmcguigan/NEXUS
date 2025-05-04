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

// Configuration for edge detection
export interface EdgeDetectionConfig {
  edgeThreshold: number; // Percentage of panel size to consider as edge zone (e.g., 20 for 20%)
}

export interface DragContextType {
  // Current drag state
  isDragging: boolean;
  dragItem: DragItem | null;
  dragOperation: DragOperation;
  dropTarget: DropTarget | null;
  mousePosition: { x: number, y: number } | null;
  
  // Methods for drag operations
  startDrag: (item: DragItem, operation?: DragOperation) => void;
  endDrag: (dropped?: boolean) => void;
  setDropTarget: (target: DropTarget | null) => void;
  updateMousePosition: (x: number, y: number) => void;
  
  // Edge detection
  edgeDetection: EdgeDetectionConfig;
  detectEdgeZone: (rect: DOMRect, x: number, y: number) => DropDirection | null;
  
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
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null);
  
  // Edge detection configuration
  const edgeDetection: EdgeDetectionConfig = {
    edgeThreshold: 20 // 20% of panel size as edge detection zone
  };
  
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
    console.log('Ending drag operation, dropped:', dropped, 'current dropTarget:', dropTarget);
    
    // If this was a successful drop and we have a drop target,
    // leave the drop target info in place briefly to allow the handler to process it
    if (dropped && dropTarget) {
      // Set drag state to inactive but preserve the drop target briefly
      setIsDragging(false);
      setDragItem(null);
      setMousePosition(null);
      
      // After a small delay, clean up the drop target
      // This ensures any effects that depend on the drop target have time to process
      setTimeout(() => {
        setDropTarget(null);
      }, 100);
    } else {
      // If not a valid drop or no target, clean up everything immediately
      setIsDragging(false);
      setDragItem(null);
      setMousePosition(null);
      setDropTarget(null);
    }
  }, [dropTarget]);
  
  // Method to update mouse position
  const updateMousePosition = useCallback((x: number, y: number) => {
    setMousePosition({ x, y });
  }, []);
  
  // Method to detect which edge zone the mouse is in
  const detectEdgeZone = useCallback((rect: DOMRect, x: number, y: number): DropDirection | null => {
    // Calculate edge thresholds based on panel dimensions
    const edgeSize = Math.min(rect.width, rect.height) * (edgeDetection.edgeThreshold / 100);
    
    // Get mouse position relative to the panel
    const relX = x - rect.left;
    const relY = y - rect.top;
    
    // Determine if the mouse is within the panel
    if (relX < 0 || relX > rect.width || relY < 0 || relY > rect.height) {
      return null;
    }
    
    // Check if mouse is in an edge zone
    if (relX < edgeSize) {
      return 'left';
    } else if (relX > rect.width - edgeSize) {
      return 'right';
    } else if (relY < edgeSize) {
      return 'top';
    } else if (relY > rect.height - edgeSize) {
      return 'bottom';
    }
    
    // Not in any edge zone
    return null;
  }, [edgeDetection.edgeThreshold]);
  
  // Method to update keyboard modifiers
  const setModifiers = useCallback((shift: boolean, alt: boolean, ctrl: boolean) => {
    setIsShiftPressed(shift);
    setIsAltPressed(alt);
    setIsCtrlPressed(ctrl);
    
    // Update drag operation based on modifiers
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
    mousePosition,
    startDrag,
    endDrag,
    setDropTarget,
    updateMousePosition,
    edgeDetection,
    detectEdgeZone,
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