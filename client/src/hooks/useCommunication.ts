/**
 * React hooks for the NEXUS.email communication systems
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { eventBus, BaseEvent, SubscriptionOptions } from '../lib/communication/EventBus';
import { contextProvider, ContextType, ContextChangeCallback, ContextSubscriberOptions } from '../lib/communication/ContextProvider';
import { componentCommunication, ComponentType, MessageType, ComponentMessage, RequestMessage } from '../lib/communication/ComponentCommunication';
import { commandRegistry, CommandCategory, CommandContext, CommandDefinition } from '../lib/communication/CommandRegistry';
import { dragDropManager, DragItemType, DropTargetType, DragOperation } from '../lib/communication/DragDropManager';

/**
 * Hook for subscribing to events via the EventBus
 */
export function useEvent<T extends BaseEvent>(
  eventType: string,
  callback: (event: T) => void,
  options: SubscriptionOptions = {},
  deps: any[] = []
): void {
  useEffect(() => {
    const subscriptionId = eventBus.subscribe<T>(eventType, callback, options);
    
    return () => {
      eventBus.unsubscribe(subscriptionId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, ...deps]);
}

/**
 * Hook for publishing events via the EventBus
 */
export function useEventPublisher<T extends BaseEvent>(
  eventType: string
): (eventData: Partial<T>, options?: any) => Promise<T> {
  return useCallback(
    (eventData: Partial<T>, options?: any) => eventBus.publish<T>(eventType, eventData, options),
    [eventType]
  );
}

/**
 * Hook for subscribing to context changes
 */
export function useContextSubscription<T>(
  contextType: ContextType | string,
  callback: ContextChangeCallback<T>,
  options: ContextSubscriberOptions = {},
  deps: any[] = []
): void {
  useEffect(() => {
    const subscriptionId = contextProvider.subscribe<T>(contextType, callback, options);
    
    return () => {
      contextProvider.unsubscribe(subscriptionId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextType, ...deps]);
}

/**
 * Hook for tracking and updating a specific context value
 */
export function useContext<T>(
  contextType: ContextType | string,
  contextId: string,
  initialValue?: T
): [T | undefined, (value: T) => void] {
  const componentId = useRef(crypto.randomUUID());
  const [value, setValue] = useState<T | undefined>(
    () => contextProvider.getContext<T>(contextType, contextId) || initialValue
  );
  
  // Subscribe to context changes
  useContextSubscription<T>(
    contextType,
    (newValue, updatedContextType, updatedContextId) => {
      if (updatedContextType === contextType && updatedContextId === contextId) {
        setValue(newValue);
      }
    },
    { excludeSources: [componentId.current] }
  );
  
  // Function to update the context
  const updateContext = useCallback(
    (newValue: T) => {
      contextProvider.setContext<T>(contextType, contextId, newValue, componentId.current);
      setValue(newValue);
    },
    [contextType, contextId]
  );
  
  return [value, updateContext];
}

/**
 * Hook for tracking and updating the active context of a specific type
 */
export function useActiveContext<T>(
  contextType: ContextType | string,
  initialValue?: T
): [T | undefined, string | undefined, (value: T, contextId: string) => void] {
  const componentId = useRef(crypto.randomUUID());
  const [value, setValue] = useState<T | undefined>(
    () => contextProvider.getActiveContext<T>(contextType) || initialValue
  );
  const [contextId, setContextId] = useState<string | undefined>(
    () => contextProvider.getActiveContextId(contextType)
  );
  
  // Subscribe to context changes
  useContextSubscription<T>(
    contextType,
    (newValue, updatedContextType, updatedContextId, source) => {
      // Only update if this is the active context
      if (updatedContextType === contextType && 
          updatedContextId === contextProvider.getActiveContextId(contextType)) {
        setValue(newValue);
        setContextId(updatedContextId);
      }
    },
    { excludeSources: [componentId.current] }
  );
  
  // Function to update the active context
  const updateActiveContext = useCallback(
    (newValue: T, newContextId: string) => {
      contextProvider.setContext<T>(contextType, newContextId, newValue, componentId.current);
      setValue(newValue);
      setContextId(newContextId);
    },
    [contextType]
  );
  
  return [value, contextId, updateActiveContext];
}

/**
 * Hook for component registration
 */
export function useComponentRegistration(
  type: ComponentType | string,
  options: {
    tabId?: string;
    panelId?: string;
    title?: string;
    supportsRequests?: string[];
  } = {}
): {
  componentId: string;
  sendRequest: <T>(targetId: string, action: string, data?: any, timeout?: number) => Promise<T>;
  sendNotification: (targetId: string | undefined, action: string, data?: any) => void;
  broadcastNotification: (action: string, data?: any, targetType?: ComponentType | string) => void;
} {
  const [componentId, setComponentId] = useState<string>('');
  
  // Register the component
  useEffect(() => {
    const id = componentCommunication.registerComponent({
      type,
      tabId: options.tabId,
      panelId: options.panelId,
      title: options.title,
      supportsRequests: options.supportsRequests
    });
    
    setComponentId(id);
    
    return () => {
      componentCommunication.unregisterComponent(id);
    };
  }, [type, options.tabId, options.panelId, options.title, options.supportsRequests]);
  
  // Create request and notification functions
  const sendRequest = useCallback(
    <T>(targetId: string, action: string, data?: any, timeout?: number): Promise<T> => {
      if (!componentId) {
        return Promise.reject(new Error('Component not registered'));
      }
      
      return componentCommunication.sendRequest(componentId, targetId, action, data, timeout);
    },
    [componentId]
  );
  
  const sendNotification = useCallback(
    (targetId: string | undefined, action: string, data?: any): void => {
      if (!componentId) {
        return;
      }
      
      componentCommunication.sendNotification(componentId, targetId, action, data);
    },
    [componentId]
  );
  
  const broadcastNotification = useCallback(
    (action: string, data?: any, targetType?: ComponentType | string): void => {
      if (!componentId) {
        return;
      }
      
      componentCommunication.broadcastNotification(componentId, action, data, targetType);
    },
    [componentId]
  );
  
  return {
    componentId,
    sendRequest,
    sendNotification,
    broadcastNotification
  };
}

/**
 * Hook for registering request handlers
 */
export function useRequestHandler(
  componentId: string,
  action: string,
  handler: (request: RequestMessage, sourceMetadata: any) => Promise<any> | any,
  deps: any[] = []
): void {
  useEffect(() => {
    if (!componentId) {
      return;
    }
    
    const wrappedHandler = async (request: RequestMessage, source: any) => {
      return await handler(request, source);
    };
    
    componentCommunication.registerRequestHandler(componentId, action, wrappedHandler);
    
    return () => {
      componentCommunication.unregisterRequestHandler(componentId, action);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, action, ...deps]);
}

/**
 * Hook for listening to component messages
 */
export function useComponentMessages(
  componentId: string,
  onRequest?: (message: RequestMessage) => void,
  onNotification?: (message: ComponentMessage) => void,
  deps: any[] = []
): void {
  useEffect(() => {
    if (!componentId) {
      return;
    }
    
    const handleComponentMessage = (event: BaseEvent & { message: ComponentMessage }) => {
      const message = event.message;
      
      // Skip messages not intended for this component
      if (message.targetId && message.targetId !== componentId) {
        return;
      }
      
      // Handle different message types
      switch (message.type) {
        case MessageType.REQUEST:
          if (onRequest) {
            onRequest(message as RequestMessage);
          }
          break;
          
        case MessageType.NOTIFICATION:
          if (onNotification) {
            onNotification(message);
          }
          break;
      }
    };
    
    const subscriptionId = eventBus.subscribe(
      'component:message',
      handleComponentMessage
    );
    
    return () => {
      eventBus.unsubscribe(subscriptionId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, ...deps]);
}

/**
 * Hook for command registration and execution
 */
export function useCommand(
  title: string,
  category: CommandCategory,
  contexts: CommandContext[],
  handler: (commandId: string, parameters?: any) => Promise<any> | any,
  options: {
    description?: string;
    shortcut?: string | string[];
    icon?: string;
    enabled?: boolean;
    visible?: boolean;
    order?: number;
  } = {}
): {
  commandId: string;
  execute: (parameters?: any) => Promise<any>;
  setEnabled: (enabled: boolean) => void;
  setVisible: (visible: boolean) => void;
} {
  const [commandId, setCommandId] = useState<string>('');
  
  // Register the command
  useEffect(() => {
    const id = commandRegistry.registerCommand(
      {
        title,
        category,
        contexts,
        description: options.description,
        shortcut: options.shortcut,
        icon: options.icon,
        enabled: options.enabled,
        visible: options.visible,
        order: options.order
      },
      handler
    );
    
    setCommandId(id);
    
    return () => {
      commandRegistry.unregisterCommand(id);
    };
  }, [
    title, 
    category, 
    contexts, 
    handler, 
    options.description, 
    options.shortcut, 
    options.icon, 
    options.enabled, 
    options.visible, 
    options.order
  ]);
  
  // Execute function
  const execute = useCallback(
    (parameters?: any) => {
      if (!commandId) {
        return Promise.reject(new Error('Command not registered'));
      }
      
      return commandRegistry.executeCommand(commandId, { parameters });
    },
    [commandId]
  );
  
  // Enable/disable function
  const setEnabled = useCallback(
    (enabled: boolean) => {
      if (!commandId) {
        return;
      }
      
      commandRegistry.setCommandEnabled(commandId, enabled);
    },
    [commandId]
  );
  
  // Show/hide function
  const setVisible = useCallback(
    (visible: boolean) => {
      if (!commandId) {
        return;
      }
      
      commandRegistry.setCommandVisible(commandId, visible);
    },
    [commandId]
  );
  
  return {
    commandId,
    execute,
    setEnabled,
    setVisible
  };
}

/**
 * Hook for getting a list of commands by category or context
 */
export function useCommandList(
  filter?: {
    category?: CommandCategory;
    context?: CommandContext;
    visibleOnly?: boolean;
    enabledOnly?: boolean;
  }
): CommandDefinition[] {
  const [commands, setCommands] = useState<CommandDefinition[]>([]);
  
  useEffect(() => {
    let filteredCommands: CommandDefinition[];
    
    if (filter?.category) {
      filteredCommands = commandRegistry.getCommandsByCategory(filter.category);
    } else if (filter?.context) {
      filteredCommands = commandRegistry.getCommandsByContext(filter.context);
    } else {
      filteredCommands = commandRegistry.getAllCommands();
    }
    
    // Apply additional filters
    if (filter?.visibleOnly) {
      filteredCommands = filteredCommands.filter(cmd => cmd.visible !== false);
    }
    
    if (filter?.enabledOnly) {
      filteredCommands = filteredCommands.filter(cmd => cmd.enabled !== false);
    }
    
    setCommands(filteredCommands);
    
    // Subscribe to command registration/unregistration events
    const registeredHandler = () => {
      // Update the list when commands change
      setCommands(commandRegistry.getAllCommands().filter(cmd => {
        if (filter?.category && cmd.category !== filter.category) {
          return false;
        }
        
        if (filter?.context && 
            !cmd.contexts.includes(filter.context) && 
            !cmd.contexts.includes(CommandContext.GLOBAL)) {
          return false;
        }
        
        if (filter?.visibleOnly && cmd.visible === false) {
          return false;
        }
        
        if (filter?.enabledOnly && cmd.enabled === false) {
          return false;
        }
        
        return true;
      }));
    };
    
    const regSubscriptionId = eventBus.subscribe('command:registered', registeredHandler);
    const unregSubscriptionId = eventBus.subscribe('command:unregistered', registeredHandler);
    
    return () => {
      eventBus.unsubscribe(regSubscriptionId);
      eventBus.unsubscribe(unregSubscriptionId);
    };
  }, [
    filter?.category, 
    filter?.context, 
    filter?.visibleOnly, 
    filter?.enabledOnly
  ]);
  
  return commands;
}

/**
 * Hook for registering a drag source
 */
export function useDragSource(
  itemType: DragItemType | string,
  itemId: string | number,
  data: any,
  componentId: string,
  allowedOperations: DragOperation[] = [DragOperation.MOVE, DragOperation.COPY]
): {
  sourceId: string;
  startDrag: (
    operation?: DragOperation,
    preview?: { element?: HTMLElement; html?: string; offsetX?: number; offsetY?: number },
    metadata?: Record<string, any>
  ) => void;
} {
  const [sourceId, setSourceId] = useState<string>('');
  
  // Register the drag source
  useEffect(() => {
    if (!componentId) {
      return;
    }
    
    const id = dragDropManager.registerSource(
      componentId,
      itemType,
      itemId,
      data,
      allowedOperations
    );
    
    setSourceId(id);
    
    return () => {
      dragDropManager.unregisterSource(id);
    };
  }, [componentId, itemType, itemId, data, allowedOperations]);
  
  // Start drag function
  const startDrag = useCallback(
    (
      operation?: DragOperation,
      preview?: { element?: HTMLElement; html?: string; offsetX?: number; offsetY?: number },
      metadata?: Record<string, any>
    ) => {
      if (!sourceId) {
        return;
      }
      
      dragDropManager.startDrag(sourceId, operation, preview, metadata);
    },
    [sourceId]
  );
  
  return {
    sourceId,
    startDrag
  };
}

/**
 * Hook for registering a drop target
 */
export function useDropTarget(
  targetType: DropTargetType | string,
  acceptedTypes: (DragItemType | string)[],
  componentId: string,
  onDrop: (item: any, position?: { x: number, y: number }) => Promise<any> | any,
  canAccept?: (item: any) => boolean,
  deps: any[] = []
): {
  targetId: string;
  isOver: boolean;
} {
  const [targetId, setTargetId] = useState<string>('');
  const [isOver, setIsOver] = useState<boolean>(false);
  
  // Register the drop target
  useEffect(() => {
    if (!componentId) {
      return;
    }
    
    const id = dragDropManager.registerTarget(
      componentId,
      targetType,
      acceptedTypes,
      canAccept
    );
    
    setTargetId(id);
    
    // Register drop handler
    dragDropManager.registerDropHandler(id, async (item, target) => {
      try {
        const result = await onDrop(item, target.position);
        return result;
      } catch (error) {
        console.error('Error in drop handler:', error);
        return false;
      }
    });
    
    return () => {
      dragDropManager.unregisterDropHandler(id);
      dragDropManager.unregisterTarget(id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, targetType, ...acceptedTypes, canAccept, ...deps]);
  
  // Subscribe to hover changes
  useEffect(() => {
    if (!targetId) {
      return;
    }
    
    const interval = setInterval(() => {
      const hoverTarget = dragDropManager.getHoverTarget();
      setIsOver(hoverTarget?.id === targetId);
    }, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [targetId]);
  
  return {
    targetId,
    isOver
  };
}

/**
 * Hook for working with all communication systems in a component
 */
export function useCommunication(
  componentType: ComponentType | string,
  options: {
    tabId?: string;
    panelId?: string;
    title?: string;
    commands?: Array<{
      title: string;
      category: CommandCategory;
      contexts: CommandContext[];
      handler: (commandId: string, parameters?: any) => Promise<any> | any;
      options?: {
        description?: string;
        shortcut?: string | string[];
        icon?: string;
      };
    }>;
    supportedRequests?: string[];
    requestHandlers?: Record<string, (request: RequestMessage, source: any) => Promise<any> | any>;
    dragSources?: Array<{
      itemType: DragItemType | string;
      itemId: string | number;
      data: any;
      allowedOperations?: DragOperation[];
    }>;
    dropTargets?: Array<{
      targetType: DropTargetType | string;
      acceptedTypes: (DragItemType | string)[];
      canAccept?: (item: any) => boolean;
      onDrop: (item: any, position?: { x: number, y: number }) => Promise<any> | any;
    }>;
  } = {}
): {
  componentId: string;
  commands: Record<string, {
    commandId: string;
    execute: (parameters?: any) => Promise<any>;
  }>;
  dragSources: Record<string, {
    sourceId: string;
    startDrag: (
      operation?: DragOperation,
      preview?: any,
      metadata?: Record<string, any>
    ) => void;
  }>;
  dropTargets: Record<string, {
    targetId: string;
    isOver: boolean;
  }>;
  sendRequest: <T>(targetId: string, action: string, data?: any, timeout?: number) => Promise<T>;
  sendNotification: (targetId: string | undefined, action: string, data?: any) => void;
  broadcastNotification: (action: string, data?: any, targetType?: ComponentType | string) => void;
} {
  // Register component
  const { 
    componentId, 
    sendRequest, 
    sendNotification, 
    broadcastNotification 
  } = useComponentRegistration(componentType, {
    tabId: options.tabId,
    panelId: options.panelId,
    title: options.title,
    supportsRequests: options.supportedRequests
  });
  
  // Register request handlers
  useEffect(() => {
    if (!componentId || !options.requestHandlers) {
      return;
    }
    
    // Register all handlers
    Object.entries(options.requestHandlers).forEach(([action, handler]) => {
      componentCommunication.registerRequestHandler(componentId, action, handler);
    });
    
    return () => {
      // Unregister all handlers
      if (options.requestHandlers) {
        Object.keys(options.requestHandlers).forEach(action => {
          componentCommunication.unregisterRequestHandler(componentId, action);
        });
      }
    };
  }, [componentId, options.requestHandlers]);
  
  // Register commands
  const commands = useRef<Record<string, {
    commandId: string;
    execute: (parameters?: any) => Promise<any>;
  }>>({});
  
  useEffect(() => {
    if (!options.commands) {
      return;
    }
    
    const registeredCommands: string[] = [];
    
    // Register all commands
    options.commands.forEach(command => {
      const commandId = commandRegistry.registerCommand(
        {
          title: command.title,
          category: command.category,
          contexts: command.contexts,
          description: command.options?.description,
          shortcut: command.options?.shortcut,
          icon: command.options?.icon
        },
        command.handler
      );
      
      registeredCommands.push(commandId);
      
      // Add to the commands object
      const key = command.title.toLowerCase().replace(/\s+/g, '_');
      commands.current[key] = {
        commandId,
        execute: (parameters?: any) => commandRegistry.executeCommand(commandId, { parameters })
      };
    });
    
    return () => {
      // Unregister all commands
      registeredCommands.forEach(commandId => {
        commandRegistry.unregisterCommand(commandId);
      });
    };
  }, [options.commands]);
  
  // Register drag sources
  const dragSources = useRef<Record<string, {
    sourceId: string;
    startDrag: (
      operation?: DragOperation,
      preview?: any,
      metadata?: Record<string, any>
    ) => void;
  }>>({});
  
  useEffect(() => {
    if (!componentId || !options.dragSources) {
      return;
    }
    
    const registeredSources: string[] = [];
    
    // Register all drag sources
    options.dragSources.forEach((source, index) => {
      const sourceId = dragDropManager.registerSource(
        componentId,
        source.itemType,
        source.itemId,
        source.data,
        source.allowedOperations
      );
      
      registeredSources.push(sourceId);
      
      // Add to the dragSources object
      const key = `${source.itemType}_${index}`;
      dragSources.current[key] = {
        sourceId,
        startDrag: (
          operation?: DragOperation,
          preview?: any,
          metadata?: Record<string, any>
        ) => dragDropManager.startDrag(sourceId, operation, preview, metadata)
      };
    });
    
    return () => {
      // Unregister all drag sources
      registeredSources.forEach(sourceId => {
        dragDropManager.unregisterSource(sourceId);
      });
    };
  }, [componentId, options.dragSources]);
  
  // Register drop targets
  const dropTargets = useRef<Record<string, {
    targetId: string;
    isOver: boolean;
  }>>({});
  
  const [isOverStates, setIsOverStates] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (!componentId || !options.dropTargets) {
      return;
    }
    
    const registeredTargets: string[] = [];
    const newIsOverStates: Record<string, boolean> = {};
    
    // Register all drop targets
    options.dropTargets.forEach((target, index) => {
      const targetId = dragDropManager.registerTarget(
        componentId,
        target.targetType,
        target.acceptedTypes,
        target.canAccept
      );
      
      // Register drop handler
      dragDropManager.registerDropHandler(targetId, async (item, targetInfo) => {
        try {
          const result = await target.onDrop(item, targetInfo.position);
          return result;
        } catch (error) {
          console.error('Error in drop handler:', error);
          return false;
        }
      });
      
      registeredTargets.push(targetId);
      
      // Add to the dropTargets object
      const key = `${target.targetType}_${index}`;
      newIsOverStates[key] = false;
      dropTargets.current[key] = {
        targetId,
        isOver: false
      };
    });
    
    setIsOverStates(newIsOverStates);
    
    // Set up interval to check hover states
    const interval = setInterval(() => {
      const hoverTarget = dragDropManager.getHoverTarget();
      let changed = false;
      
      Object.entries(dropTargets.current).forEach(([key, target]) => {
        const newIsOver = hoverTarget?.id === target.targetId;
        if (target.isOver !== newIsOver) {
          target.isOver = newIsOver;
          changed = true;
        }
      });
      
      if (changed) {
        setIsOverStates(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(dropTargets.current).map(([key, target]) => [key, target.isOver])
          )
        }));
      }
    }, 100);
    
    return () => {
      clearInterval(interval);
      
      // Unregister all drop targets
      registeredTargets.forEach(targetId => {
        dragDropManager.unregisterDropHandler(targetId);
        dragDropManager.unregisterTarget(targetId);
      });
    };
  }, [componentId, options.dropTargets]);
  
  // Update isOver states in dropTargets
  useEffect(() => {
    Object.entries(isOverStates).forEach(([key, isOver]) => {
      if (dropTargets.current[key]) {
        dropTargets.current[key].isOver = isOver;
      }
    });
  }, [isOverStates]);
  
  return {
    componentId,
    commands: commands.current,
    dragSources: dragSources.current,
    dropTargets: dropTargets.current,
    sendRequest,
    sendNotification,
    broadcastNotification
  };
}

export default {
  useEvent,
  useEventPublisher,
  useContextSubscription,
  useContext,
  useActiveContext,
  useComponentRegistration,
  useRequestHandler,
  useComponentMessages,
  useCommand,
  useCommandList,
  useDragSource,
  useDropTarget,
  useCommunication
};