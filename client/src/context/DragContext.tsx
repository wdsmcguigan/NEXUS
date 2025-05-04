import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';

// Type definitions
export interface DropTarget {
  panelId: string;
  targetZone?: 'before' | 'after';
  tabId?: string;
}

export interface DropIndicator {
  visible: boolean;
  targetPanelId?: string;
  position?: 'before' | 'after';
  tabId?: string;
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
}

// Actions
type DragAction =
  | { type: 'START_DRAG'; payload: { tabId: string; title: string; icon?: React.ReactNode; panelId: string; x: number; y: number } }
  | { type: 'MOVE_DRAG'; payload: { x: number; y: number } }
  | { type: 'SET_DROP_TARGET'; payload: DropTarget }
  | { type: 'CLEAR_DROP_TARGET' }
  | { type: 'END_DRAG' };

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
        dropIndicator: { visible: false }
      };

    case 'MOVE_DRAG':
      return {
        ...state,
        lastClientX: action.payload.x,
        lastClientY: action.payload.y
      };

    case 'SET_DROP_TARGET':
      return {
        ...state,
        dropIndicator: {
          visible: true,
          targetPanelId: action.payload.panelId,
          position: action.payload.targetZone,
          tabId: action.payload.tabId
        }
      };

    case 'CLEAR_DROP_TARGET':
      return {
        ...state,
        dropIndicator: { visible: false }
      };

    case 'END_DRAG':
      return {
        ...state,
        isDragging: false,
        draggedTabId: undefined,
        draggedTabTitle: undefined,
        draggedTabIcon: undefined,
        sourcePanelId: undefined,
        dropIndicator: { visible: false }
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
  endDrag: () => void;
  setDropTarget: (target: DropTarget) => void;
  clearDropTarget: () => void;
}

const initialDragState: DragState = {
  isDragging: false,
  lastClientX: 0,
  lastClientY: 0,
  dropIndicator: { visible: false }
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

  const endDrag = useCallback(() => {
    dispatch({ type: 'END_DRAG' });
  }, []);

  const setDropTarget = useCallback((target: DropTarget) => {
    dispatch({ type: 'SET_DROP_TARGET', payload: target });
  }, []);

  const clearDropTarget = useCallback(() => {
    dispatch({ type: 'CLEAR_DROP_TARGET' });
  }, []);

  const value = {
    dragState,
    startDrag,
    moveDrag,
    endDrag,
    setDropTarget,
    clearDropTarget
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