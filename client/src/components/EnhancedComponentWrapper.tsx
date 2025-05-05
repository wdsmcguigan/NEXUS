import React, { useState, useEffect, useRef, useContext, createContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSessionStorage } from '../hooks/useSessionStorage';
import { ComponentConfig, ComponentInstance, StatePersistence, enhancedComponentRegistry } from '../lib/enhancedComponentRegistry';
import { useSearch, SearchProvider } from '../context/SearchContext';
import { Search, X, Maximize2, Minimize2, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UniversalSearch } from './UniversalSearch';
import { cn } from '@/lib/utils';

// Context for component instance data
interface ComponentContextType {
  instanceId: string;
  componentId: string;
  config: ComponentConfig;
  updateConfig: (newConfig: Partial<ComponentConfig>) => void;
  state: Record<string, any>;
  updateState: (newState: Record<string, any>) => void;
  isMaximized: boolean;
  setIsMaximized: (maximized: boolean) => void;
  isSearchVisible: boolean;
  setIsSearchVisible: (visible: boolean) => void;
  isToolbarVisible: boolean;
  setIsToolbarVisible: (visible: boolean) => void;
}

const ComponentContext = createContext<ComponentContextType | undefined>(undefined);

export function useComponentContext() {
  const context = useContext(ComponentContext);
  if (!context) {
    throw new Error('useComponentContext must be used within a ComponentProvider');
  }
  return context;
}

interface EnhancedComponentWrapperProps {
  instanceId: string;
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  searchAdapter?: any;
  onMaximize?: () => void;
  onMinimize?: () => void;
  hideToolbar?: boolean;
  toolbarButtons?: React.ReactNode;
}

export const EnhancedComponentWrapper: React.FC<EnhancedComponentWrapperProps> = ({
  instanceId,
  children,
  toolbar,
  searchAdapter,
  onMaximize,
  onMinimize,
  hideToolbar = false,
  toolbarButtons,
}) => {
  // Get instance from registry
  const instance = enhancedComponentRegistry.getInstance(instanceId);
  if (!instance) {
    return (
      <div className="flex items-center justify-center h-full bg-neutral-900 text-red-500 p-4">
        Component instance not found: {instanceId}
      </div>
    );
  }

  const componentDef = enhancedComponentRegistry.getComponent(instance.componentId);
  if (!componentDef) {
    return (
      <div className="flex items-center justify-center h-full bg-neutral-900 text-red-500 p-4">
        Component definition not found: {instance.componentId}
      </div>
    );
  }

  // State management based on persistence type
  const [localState, setLocalState] = useLocalStorage<Record<string, any>>(
    `component-state-${instanceId}`,
    instance.state || {}
  );
  
  const [sessionState, setSessionState] = useSessionStorage<Record<string, any>>(
    `component-state-${instanceId}`,
    instance.state || {}
  );
  
  const [memoryState, setMemoryState] = useState<Record<string, any>>(
    instance.state || {}
  );

  // UI state
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(!hideToolbar);
  const [config, setConfig] = useState<ComponentConfig>(instance.config || {});

  // Get state and update function based on persistence type
  const getStateAndUpdater = () => {
    const persistenceType = componentDef.statePersistence || StatePersistence.NONE;
    
    switch (persistenceType) {
      case StatePersistence.LOCAL:
        return { state: localState, setState: setLocalState };
      case StatePersistence.SESSION:
        return { state: sessionState, setState: setSessionState };
      case StatePersistence.NONE:
      default:
        return { state: memoryState, setState: setMemoryState };
    }
  };

  const { state, setState } = getStateAndUpdater();

  // Update instance in registry when state changes
  useEffect(() => {
    enhancedComponentRegistry.updateInstanceState(instanceId, state);
  }, [instanceId, state]);

  // Update instance in registry when config changes
  useEffect(() => {
    enhancedComponentRegistry.updateInstanceConfig(instanceId, config);
  }, [instanceId, config]);

  // Update internal config
  const updateConfig = useCallback((newConfig: Partial<ComponentConfig>) => {
    setConfig(current => ({
      ...current,
      ...newConfig
    }));
  }, []);

  // Update internal state
  const updateState = useCallback((newState: Record<string, any>) => {
    setState(current => ({
      ...current,
      ...newState
    }));
  }, [setState]);

  // Handle maximize/minimize
  const handleToggleMaximize = () => {
    setIsMaximized(prev => {
      const newValue = !prev;
      if (newValue && onMaximize) {
        onMaximize();
      } else if (!newValue && onMinimize) {
        onMinimize();
      }
      return newValue;
    });
  };

  // Focus and blur handling
  useEffect(() => {
    enhancedComponentRegistry.focusInstance(instanceId);
    
    return () => {
      enhancedComponentRegistry.blurInstance(instanceId);
    };
  }, [instanceId]);

  // Create context value
  const contextValue: ComponentContextType = {
    instanceId,
    componentId: instance.componentId,
    config,
    updateConfig,
    state,
    updateState,
    isMaximized,
    setIsMaximized,
    isSearchVisible,
    setIsSearchVisible,
    isToolbarVisible,
    setIsToolbarVisible,
  };

  return (
    <ComponentContext.Provider value={contextValue}>
      <div className="h-full flex flex-col overflow-hidden bg-neutral-950">
        {/* Toolbar */}
        {isToolbarVisible && (
          <div className="flex items-center px-2 py-1 border-b border-neutral-800 bg-neutral-900">
            {/* Left side - custom toolbar or title */}
            <div className="flex-1 flex items-center">
              {toolbar || (
                <span className="text-sm font-medium ml-1">
                  {componentDef.displayName}
                </span>
              )}
            </div>
            
            {/* Right side - actions */}
            <div className="flex items-center space-x-1">
              {/* Custom toolbar buttons */}
              {toolbarButtons}
              
              {/* Search button (if supported) */}
              {searchAdapter && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setIsSearchVisible(!isSearchVisible)}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Search</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* Settings button */}
              <Popover>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                        >
                          <SettingsIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <PopoverContent side="bottom" align="end" className="w-60 p-2">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Component Settings</h3>
                    
                    {/* Generic settings here */}
                    <div className="space-y-1">
                      <button 
                        onClick={() => setIsToolbarVisible(false)}
                        className="w-full text-left px-2 py-1 text-sm rounded hover:bg-neutral-800"
                      >
                        Hide Toolbar
                      </button>
                      
                      <button 
                        onClick={handleToggleMaximize}
                        className="w-full text-left px-2 py-1 text-sm rounded hover:bg-neutral-800"
                      >
                        {isMaximized ? 'Restore Size' : 'Maximize'}
                      </button>
                    </div>
                    
                    {/* Component-specific settings could be inserted here */}
                    {/* For now just show some info about the component */}
                    <div className="mt-2 pt-2 border-t border-neutral-800">
                      <div className="px-2 py-1 text-xs text-neutral-500">
                        <div>ID: {instance.componentId}</div>
                        <div>Instance: {instanceId}</div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Maximize/minimize button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={handleToggleMaximize}
                    >
                      {isMaximized ? 
                        <Minimize2 className="h-4 w-4" /> : 
                        <Maximize2 className="h-4 w-4" />
                      }
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isMaximized ? 'Restore' : 'Maximize'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
        
        {/* Search bar */}
        {isSearchVisible && searchAdapter && (
          <div className="px-2 py-1 border-b border-neutral-800 bg-neutral-900/50">
            <SearchProvider>
              <UniversalSearch 
                placeholder={`Search in ${componentDef.displayName}...`}
                adapter={searchAdapter}
                onClose={() => setIsSearchVisible(false)}
              />
            </SearchProvider>
          </div>
        )}
        
        {/* Hidden toolbar indicator */}
        {!isToolbarVisible && (
          <div 
            className="absolute top-0 left-0 right-0 h-1 bg-blue-500/20 cursor-pointer z-10 opacity-0 hover:opacity-100 transition-opacity"
            onClick={() => setIsToolbarVisible(true)}
          />
        )}
        
        {/* Main content */}
        <div className={cn(
          "flex-1 overflow-auto", 
          isMaximized && "absolute inset-0 z-50 bg-neutral-950"
        )}>
          {children}
        </div>
      </div>
    </ComponentContext.Provider>
  );
};

/**
 * HOC to wrap a component with the enhanced component wrapper
 */
export function withEnhancedComponent<P extends { instanceId: string }>(
  Component: React.ComponentType<P>,
  options: {
    toolbar?: React.ReactNode;
    searchAdapter?: any;
    hideToolbar?: boolean;
  } = {}
) {
  return function WrappedComponent(props: P) {
    return (
      <EnhancedComponentWrapper
        instanceId={props.instanceId}
        toolbar={options.toolbar}
        searchAdapter={options.searchAdapter}
        hideToolbar={options.hideToolbar}
      >
        <Component {...props} />
      </EnhancedComponentWrapper>
    );
  };
}

/**
 * Provider component that makes localStorage available as state storage
 */
export function useLocalStorageState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useLocalStorage<T>(key, initialValue);
  
  return [storedValue, setStoredValue];
}

/**
 * Provider component that makes sessionStorage available as state storage
 */
export function useSessionStorageState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useSessionStorage<T>(key, initialValue);
  
  return [storedValue, setStoredValue];
}