import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';

// Type definitions for drag operations
export interface Point {
  x: number;
  y: number;
}

export type DropTargetType = 'panel' | 'tabbar' | 'tab' | 'edge' | 'position';
export type DropDirection = 'top' | 'right' | 'bottom' | 'left';

export interface TabPosition {
  panelId: string;
  index: number;
}

// Combined drop target type that satisfies all consumers
export interface DropTarget {
  type: DropTargetType;
  id: string;
  direction?: DropDirection;
  position?: TabPosition;
  
  // Legacy properties for backward compatibility
  panelId?: string;
  targetZone?: 'before' | 'after' | 'inside' | 'edge';
  tabId?: string;
  edge?: DropDirection;
}

export interface DropIndicator {
  visible: boolean;
  targetPanelId?: string;
  position?: 'before' | 'after';
  tabId?: string;
}

export interface DragItem {
  type: 'tab' | 'panel' | 'component';
  id: string;
  data?: any;
  sourcePanelId?: string;
  title?: string;
  icon?: React.ReactNode;
}

export interface DragState {
  isDragging: boolean;
  draggedTabId?: string;
  draggedTabTitle?: string;
  draggedTabIcon?: React.ReactNode;
  sourcePanelId?: string;
  lastClientX: number;
  lastClientY: number;
  dropIndicator: DropIndicator;
  dragItem?: DragItem;
  dropTarget?: DropTarget;
  mousePosition: Point;
  dragOperation?: string;
}

// Actions
type DragAction =
  | { type: 'START_DRAG'; payload: { tabId: string; title: string; icon?: React.ReactNode; panelId: string; x: number; y: number } }
  | { type: 'MOVE_DRAG'; payload: { x: number; y: number } }
  | { type: 'SET_DROP_TARGET'; payload: DropTarget }
  | { type: 'CLEAR_DROP_TARGET' }
  | { type: 'END_DRAG'; payload?: { success: boolean } }
  | { type: 'SET_DRAG_ITEM'; payload: DragItem }
  | { type: 'UPDATE_MOUSE_POSITION'; payload: Point }
  | { type: 'SET_DRAG_OPERATION'; payload: string };

// Reducer
const dragReducer = (state: DragState, action: DragAction): DragState => {
  switch (action.type) {
    case 'START_DRAG':
      return {
        ...state,
        isDragging: true,
        draggedTabId: action.payload.tabId,
        draggedTabTitle: action.payload.title,
        draggedTabIcon: action.payload.icon,
        sourcePanelId: action.payload.panelId,
        lastClientX: action.payload.x,
        lastClientY: action.payload.y,
        mousePosition: { x: action.payload.x, y: action.payload.y },
        dropIndicator: { visible: false },
        // Create a drag item based on the tab info
        dragItem: {
          type: 'tab',
          id: action.payload.tabId,
          sourcePanelId: action.payload.panelId,
          title: action.payload.title,
          icon: action.payload.icon
        }
      };

    case 'MOVE_DRAG':
      return {
        ...state,
        lastClientX: action.payload.x,
        lastClientY: action.payload.y,
        mousePosition: { x: action.payload.x, y: action.payload.y }
      };

    case 'SET_DROP_TARGET':
      return {
        ...state,
        dropTarget: action.payload,
        dropIndicator: {
          visible: true,
          targetPanelId: action.payload.panelId,
          position: action.payload.targetZone as 'before' | 'after' | undefined,
          tabId: action.payload.tabId
        }
      };

    case 'CLEAR_DROP_TARGET':
      return {
        ...state,
        dropTarget: undefined,
        dropIndicator: { visible: false }
      };

    case 'END_DRAG':
      // Keep the drop target if success is true (for post-processing)
      const keepDropTarget = action.payload?.success === true;
      return {
        ...state,
        isDragging: false,
        draggedTabId: undefined,
        draggedTabTitle: undefined,
        draggedTabIcon: undefined,
        sourcePanelId: undefined,
        dropIndicator: { visible: false },
        dropTarget: keepDropTarget ? state.dropTarget : undefined,
        dragItem: keepDropTarget ? state.dragItem : undefined,
      };
      
    case 'SET_DRAG_ITEM':
      return {
        ...state,
        dragItem: action.payload,
        isDragging: true
      };
      
    case 'UPDATE_MOUSE_POSITION':
      return {
        ...state,
        mousePosition: action.payload
      };
      
    case 'SET_DRAG_OPERATION':
      return {
        ...state,
        dragOperation: action.payload
      };

    default:
      return state;
  }
};

// Context
export interface DragContextType {
  dragState: DragState;
  startDrag: (tabId: string, title: string, panelId: string, x: number, y: number, icon?: React.ReactNode) => void;
  moveDrag: (x: number, y: number) => void;
  endDrag: (success?: boolean) => void;
  setDropTarget: (target: DropTarget) => void;
  clearDropTarget: () => void;
  
  // Direct access to commonly used properties for convenience
  isDragging: boolean;
  dragItem?: DragItem;
  dropTarget?: DropTarget;
  mousePosition: Point;
  dragOperation?: string;
  updateMousePosition: (x: number, y: number) => void;
}

const initialDragState: DragState = {
  isDragging: false,
  lastClientX: 0,
  lastClientY: 0,
  dropIndicator: { visible: false },
  mousePosition: { x: 0, y: 0 }
};

const DragContext = createContext<DragContextType | undefined>(undefined);

// Provider
interface DragProviderProps {
  children: ReactNode;
}

export function DragProvider({ children }: DragProviderProps) {
  const [dragState, dispatch] = useReducer(dragReducer, initialDragState);

  const startDrag = useCallback(
    (tabId: string, title: string, panelId: string, x: number, y: number, icon?: React.ReactNode) => {
      dispatch({
        type: 'START_DRAG',
        payload: { tabId, title, icon, panelId, x, y }
      });
    },
    []
  );

  const moveDrag = useCallback((x: number, y: number) => {
    dispatch({ type: 'MOVE_DRAG', payload: { x, y } });
  }, []);

  const endDrag = useCallback((success?: boolean) => {
    dispatch({ 
      type: 'END_DRAG',
      payload: success !== undefined ? { success } : undefined
    });
  }, []);

  const setDropTarget = useCallback((target: DropTarget) => {
    dispatch({ type: 'SET_DROP_TARGET', payload: target });
  }, []);

  const clearDropTarget = useCallback(() => {
    dispatch({ type: 'CLEAR_DROP_TARGET' });
  }, []);
  
  // New action handlers
  const updateMousePosition = useCallback((x: number, y: number) => {
    dispatch({ type: 'UPDATE_MOUSE_POSITION', payload: { x, y } });
  }, []);
  
  const setDragItem = useCallback((item: DragItem) => {
    dispatch({ type: 'SET_DRAG_ITEM', payload: item });
  }, []);
  
  const setDragOperation = useCallback((operation: string) => {
    dispatch({ type: 'SET_DRAG_OPERATION', payload: operation });
  }, []);

  // Create the value object with direct access to frequently used state properties
  const value: DragContextType = {
    dragState,
    startDrag,
    moveDrag,
    endDrag,
    setDropTarget,
    clearDropTarget,
    updateMousePosition,
    
    // Direct access to state properties
    isDragging: dragState.isDragging,
    dragItem: dragState.dragItem,
    dropTarget: dragState.dropTarget,
    mousePosition: dragState.mousePosition || { x: 0, y: 0 },
    dragOperation: dragState.dragOperation
  };

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
}

// Hook
export function useDragContext() {
  const context = useContext(DragContext);
  if (context === undefined) {
    throw new Error('useDragContext must be used within a DragProvider');
  }
  return context;
}