/**
 * Drag and Drop Manager for NEXUS.email
 * 
 * Provides a system for cross-component drag and drop operations,
 * supporting rich data transfer between components.
 */

import { nanoid } from 'nanoid';
import { eventBus } from './EventBus';
import { DragDropEventType, DragDropEvent } from './Events';
import { debugLog, errorLog } from '../utils/debug';

/**
 * Types of draggable items
 */
export enum DragItemType {
  EMAIL = 'email',
  EMAIL_ATTACHMENT = 'email-attachment',
  FOLDER = 'folder',
  CONTACT = 'contact',
  EVENT = 'calendar-event',
  TASK = 'task',
  TAG = 'tag',
  FILE = 'file',
  IMAGE = 'image',
  TEXT = 'text',
  LINK = 'link',
  TAB = 'tab',
  COMPONENT = 'component',
  CUSTOM = 'custom'
}

/**
 * Drag operation types
 */
export enum DragOperation {
  MOVE = 'move',
  COPY = 'copy',
  LINK = 'link'
}

/**
 * Drop target types
 */
export enum DropTargetType {
  EMAIL_LIST = 'email-list',
  EMAIL_COMPOSER = 'email-composer',
  FOLDER = 'folder',
  CALENDAR = 'calendar',
  TASK_LIST = 'task-list',
  TAG_LIST = 'tag-list',
  FILE_EXPLORER = 'file-explorer',
  TEXT_EDITOR = 'text-editor',
  IMAGE_EDITOR = 'image-editor',
  PANEL = 'panel',
  TAB_BAR = 'tab-bar',
  CUSTOM = 'custom'
}

/**
 * Drag source interface
 */
export interface DragSource {
  id: string;
  componentId: string;
  itemType: DragItemType | string;
  itemId: string | number;
  data: any;
  allowedOperations: DragOperation[];
}

/**
 * Drop target interface
 */
export interface DropTarget {
  id: string;
  componentId: string;
  targetType: DropTargetType | string;
  acceptedTypes: (DragItemType | string)[];
  canAccept?: (item: DragItem) => boolean;
  position?: { x: number, y: number };
}

/**
 * Drag item interface
 */
export interface DragItem {
  id: string;
  sourceId: string;
  itemType: DragItemType | string;
  itemId: string | number;
  data: any;
  operation: DragOperation;
  preview?: {
    element?: HTMLElement;
    html?: string;
    offsetX?: number;
    offsetY?: number;
  };
  metadata?: Record<string, any>;
  created: number;
}

/**
 * Drop result interface
 */
export interface DropResult {
  success: boolean;
  operation: DragOperation;
  sourceId: string;
  targetId: string;
  itemType: DragItemType | string;
  itemId: string | number;
  resultData?: any;
  error?: string;
}

/**
 * Drag event handler
 */
export type DragEventHandler = (item: DragItem) => void;

/**
 * Drop event handler
 */
export type DropEventHandler = (item: DragItem, target: DropTarget) => Promise<DropResult | boolean> | DropResult | boolean;

/**
 * Drag and Drop Manager
 */
export class DragDropManager {
  private static instance: DragDropManager;
  private sources: Map<string, DragSource> = new Map();
  private targets: Map<string, DropTarget> = new Map();
  private activeItem: DragItem | null = null;
  private dropHandlers: Map<string, DropEventHandler> = new Map();
  private dragStartHandlers: Map<string, DragEventHandler> = new Map();
  private dragEndHandlers: Map<string, DragEventHandler> = new Map();
  private lastDropTarget: DropTarget | null = null;
  private hoverTarget: DropTarget | null = null;

  /**
   * Get singleton instance
   */
  static getInstance(): DragDropManager {
    if (!DragDropManager.instance) {
      DragDropManager.instance = new DragDropManager();
    }
    return DragDropManager.instance;
  }

  /**
   * Private constructor for singleton
   */
  private constructor() {
    debugLog('DragDropManager', 'DragDropManager initialized');
  }

  /**
   * Register a drag source
   */
  registerSource(
    componentId: string,
    itemType: DragItemType | string,
    itemId: string | number,
    data: any,
    allowedOperations: DragOperation[] = [DragOperation.MOVE, DragOperation.COPY]
  ): string {
    const sourceId = nanoid();
    
    const source: DragSource = {
      id: sourceId,
      componentId,
      itemType,
      itemId,
      data,
      allowedOperations
    };
    
    this.sources.set(sourceId, source);
    
    debugLog('DragDropManager', `Source registered: ${sourceId} (${itemType})`);
    
    return sourceId;
  }

  /**
   * Unregister a drag source
   */
  unregisterSource(sourceId: string): boolean {
    const result = this.sources.delete(sourceId);
    
    if (result) {
      debugLog('DragDropManager', `Source unregistered: ${sourceId}`);
    }
    
    return result;
  }

  /**
   * Register a drop target
   */
  registerTarget(
    componentId: string,
    targetType: DropTargetType | string,
    acceptedTypes: (DragItemType | string)[],
    canAccept?: (item: DragItem) => boolean
  ): string {
    const targetId = nanoid();
    
    const target: DropTarget = {
      id: targetId,
      componentId,
      targetType,
      acceptedTypes,
      canAccept
    };
    
    this.targets.set(targetId, target);
    
    debugLog('DragDropManager', `Target registered: ${targetId} (${targetType})`);
    
    return targetId;
  }

  /**
   * Unregister a drop target
   */
  unregisterTarget(targetId: string): boolean {
    const result = this.targets.delete(targetId);
    
    if (result) {
      debugLog('DragDropManager', `Target unregistered: ${targetId}`);
    }
    
    return result;
  }

  /**
   * Start a drag operation
   */
  startDrag(
    sourceId: string,
    operation: DragOperation = DragOperation.MOVE,
    preview?: DragItem['preview'],
    metadata?: Record<string, any>
  ): DragItem | null {
    const source = this.sources.get(sourceId);
    if (!source) {
      errorLog('DragDropManager', `Cannot start drag: Source ${sourceId} not found`);
      return null;
    }
    
    // Check if the operation is allowed
    if (!source.allowedOperations.includes(operation)) {
      errorLog('DragDropManager', `Operation ${operation} not allowed for source ${sourceId}`);
      return null;
    }
    
    // Create the drag item
    const item: DragItem = {
      id: nanoid(),
      sourceId,
      itemType: source.itemType,
      itemId: source.itemId,
      data: source.data,
      operation,
      preview,
      metadata,
      created: Date.now()
    };
    
    // Set as active item
    this.activeItem = item;
    
    debugLog('DragDropManager', `Drag started: ${item.id} (${item.itemType})`);
    
    // Notify drag start handlers
    this.notifyDragStartHandlers(item);
    
    // Publish drag started event
    this.publishDragStarted(item);
    
    return item;
  }

  /**
   * End the current drag operation
   */
  endDrag(cancelled: boolean = false): void {
    if (!this.activeItem) {
      return;
    }
    
    const item = this.activeItem;
    this.activeItem = null;
    this.hoverTarget = null;
    
    debugLog('DragDropManager', `Drag ended: ${item.id} (${cancelled ? 'cancelled' : 'completed'})`);
    
    // Notify drag end handlers
    this.notifyDragEndHandlers(item);
    
    // Publish drag ended event
    this.publishDragEnded(item, cancelled);
  }

  /**
   * Process a drop operation
   */
  async processDrop(targetId: string, position?: { x: number, y: number }): Promise<DropResult | null> {
    const target = this.targets.get(targetId);
    if (!target || !this.activeItem) {
      return null;
    }
    
    const item = this.activeItem;
    
    // Update target position
    if (position) {
      target.position = position;
    }
    
    // Check if the target accepts this item type
    if (!target.acceptedTypes.includes(item.itemType)) {
      this.publishDropRejected(item, target, 'Item type not accepted');
      return {
        success: false,
        operation: item.operation,
        sourceId: item.sourceId,
        targetId: target.id,
        itemType: item.itemType,
        itemId: item.itemId,
        error: 'Item type not accepted'
      };
    }
    
    // Check if the target's custom acceptance function allows this item
    if (target.canAccept && !target.canAccept(item)) {
      this.publishDropRejected(item, target, 'Item rejected by custom check');
      return {
        success: false,
        operation: item.operation,
        sourceId: item.sourceId,
        targetId: target.id,
        itemType: item.itemType,
        itemId: item.itemId,
        error: 'Item rejected by custom check'
      };
    }
    
    // Cache the last drop target
    this.lastDropTarget = target;
    
    // Get the handler for this target
    const handler = this.dropHandlers.get(target.id);
    if (!handler) {
      this.publishDropRejected(item, target, 'No handler registered for target');
      return {
        success: false,
        operation: item.operation,
        sourceId: item.sourceId,
        targetId: target.id,
        itemType: item.itemType,
        itemId: item.itemId,
        error: 'No handler registered for target'
      };
    }
    
    try {
      // Call the handler
      const result = await handler(item, target);
      
      // Handle boolean results
      if (typeof result === 'boolean') {
        const dropResult: DropResult = {
          success: result,
          operation: item.operation,
          sourceId: item.sourceId,
          targetId: target.id,
          itemType: item.itemType,
          itemId: item.itemId,
          error: result ? undefined : 'Drop rejected by handler'
        };
        
        // Publish drop events
        if (result) {
          this.publishDropReceived(item, target, dropResult);
        } else {
          this.publishDropRejected(item, target, 'Drop rejected by handler');
        }
        
        // End the drag operation
        this.endDrag(!result);
        
        return dropResult;
      }
      
      // Handle DropResult
      if (result.success) {
        this.publishDropReceived(item, target, result);
      } else {
        this.publishDropRejected(item, target, result.error);
      }
      
      // End the drag operation
      this.endDrag(!result.success);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const dropResult: DropResult = {
        success: false,
        operation: item.operation,
        sourceId: item.sourceId,
        targetId: target.id,
        itemType: item.itemType,
        itemId: item.itemId,
        error: errorMessage
      };
      
      this.publishDropRejected(item, target, errorMessage);
      
      // End the drag operation
      this.endDrag(true);
      
      return dropResult;
    }
  }

  /**
   * Register a drop event handler
   */
  registerDropHandler(targetId: string, handler: DropEventHandler): boolean {
    if (!this.targets.has(targetId)) {
      errorLog('DragDropManager', `Cannot register handler: Target ${targetId} not found`);
      return false;
    }
    
    this.dropHandlers.set(targetId, handler);
    
    debugLog('DragDropManager', `Drop handler registered for target ${targetId}`);
    
    return true;
  }

  /**
   * Unregister a drop event handler
   */
  unregisterDropHandler(targetId: string): boolean {
    return this.dropHandlers.delete(targetId);
  }

  /**
   * Register a drag start handler
   */
  registerDragStartHandler(sourceId: string, handler: DragEventHandler): boolean {
    if (!this.sources.has(sourceId)) {
      errorLog('DragDropManager', `Cannot register handler: Source ${sourceId} not found`);
      return false;
    }
    
    this.dragStartHandlers.set(sourceId, handler);
    
    return true;
  }

  /**
   * Unregister a drag start handler
   */
  unregisterDragStartHandler(sourceId: string): boolean {
    return this.dragStartHandlers.delete(sourceId);
  }

  /**
   * Register a drag end handler
   */
  registerDragEndHandler(sourceId: string, handler: DragEventHandler): boolean {
    if (!this.sources.has(sourceId)) {
      errorLog('DragDropManager', `Cannot register handler: Source ${sourceId} not found`);
      return false;
    }
    
    this.dragEndHandlers.set(sourceId, handler);
    
    return true;
  }

  /**
   * Unregister a drag end handler
   */
  unregisterDragEndHandler(sourceId: string): boolean {
    return this.dragEndHandlers.delete(sourceId);
  }

  /**
   * Update target position during drag
   */
  updateTargetPosition(targetId: string, position: { x: number, y: number }): boolean {
    const target = this.targets.get(targetId);
    if (!target) {
      return false;
    }
    
    target.position = position;
    return true;
  }

  /**
   * Get a source by ID
   */
  getSource(sourceId: string): DragSource | undefined {
    return this.sources.get(sourceId);
  }

  /**
   * Get a target by ID
   */
  getTarget(targetId: string): DropTarget | undefined {
    return this.targets.get(targetId);
  }

  /**
   * Get the active drag item
   */
  getActiveItem(): DragItem | null {
    return this.activeItem;
  }

  /**
   * Check if a drag operation is in progress
   */
  isDragging(): boolean {
    return this.activeItem !== null;
  }

  /**
   * Find targets that can accept the current drag item
   */
  findAcceptingTargets(): DropTarget[] {
    if (!this.activeItem) {
      return [];
    }
    
    const item = this.activeItem;
    
    return Array.from(this.targets.values()).filter(target => {
      // Check if the target accepts this item type
      if (!target.acceptedTypes.includes(item.itemType)) {
        return false;
      }
      
      // Check if the target's custom acceptance function allows this item
      if (target.canAccept && !target.canAccept(item)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get the last drop target
   */
  getLastDropTarget(): DropTarget | null {
    return this.lastDropTarget;
  }

  /**
   * Set hover target
   */
  setHoverTarget(targetId: string | null): void {
    if (targetId === null) {
      this.hoverTarget = null;
      return;
    }
    
    const target = this.targets.get(targetId);
    if (target) {
      this.hoverTarget = target;
    }
  }

  /**
   * Get hover target
   */
  getHoverTarget(): DropTarget | null {
    return this.hoverTarget;
  }

  /**
   * Notify drag start handlers
   */
  private notifyDragStartHandlers(item: DragItem): void {
    const handler = this.dragStartHandlers.get(item.sourceId);
    if (handler) {
      try {
        handler(item);
      } catch (error) {
        errorLog('DragDropManager', `Error in drag start handler: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Notify drag end handlers
   */
  private notifyDragEndHandlers(item: DragItem): void {
    const handler = this.dragEndHandlers.get(item.sourceId);
    if (handler) {
      try {
        handler(item);
      } catch (error) {
        errorLog('DragDropManager', `Error in drag end handler: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Publish drag started event
   */
  private publishDragStarted(item: DragItem): void {
    eventBus.publish<DragDropEvent>(
      DragDropEventType.DRAG_STARTED,
      {
        itemType: item.itemType,
        itemId: item.itemId,
        sourceId: item.sourceId,
        data: item.data,
        metadata: {
          operation: item.operation,
          dragId: item.id
        }
      }
    );
  }

  /**
   * Publish drag ended event
   */
  private publishDragEnded(item: DragItem, cancelled: boolean): void {
    eventBus.publish<DragDropEvent>(
      DragDropEventType.DRAG_ENDED,
      {
        itemType: item.itemType,
        itemId: item.itemId,
        sourceId: item.sourceId,
        data: item.data,
        metadata: {
          operation: item.operation,
          dragId: item.id,
          cancelled
        }
      }
    );
  }

  /**
   * Publish drop received event
   */
  private publishDropReceived(item: DragItem, target: DropTarget, result: DropResult): void {
    eventBus.publish<DragDropEvent>(
      DragDropEventType.DROP_RECEIVED,
      {
        itemType: item.itemType,
        itemId: item.itemId,
        sourceId: item.sourceId,
        targetId: target.id,
        data: item.data,
        position: target.position,
        metadata: {
          operation: item.operation,
          dragId: item.id,
          targetType: target.targetType,
          result: result.resultData
        }
      }
    );
  }

  /**
   * Publish drop rejected event
   */
  private publishDropRejected(item: DragItem, target: DropTarget, reason: string): void {
    eventBus.publish<DragDropEvent>(
      DragDropEventType.DROP_REJECTED,
      {
        itemType: item.itemType,
        itemId: item.itemId,
        sourceId: item.sourceId,
        targetId: target.id,
        data: item.data,
        position: target.position,
        metadata: {
          operation: item.operation,
          dragId: item.id,
          targetType: target.targetType,
          reason
        }
      }
    );
  }

  /**
   * Clear all sources, targets, and handlers (for testing or resets)
   */
  clear(): void {
    this.sources.clear();
    this.targets.clear();
    this.dropHandlers.clear();
    this.dragStartHandlers.clear();
    this.dragEndHandlers.clear();
    this.activeItem = null;
    this.lastDropTarget = null;
    this.hoverTarget = null;
    
    debugLog('DragDropManager', 'DragDropManager cleared');
  }
}

// Export singleton instance
export const dragDropManager = DragDropManager.getInstance();

export default dragDropManager;