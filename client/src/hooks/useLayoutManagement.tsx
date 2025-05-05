import { useState, useEffect, useCallback } from 'react';
import { usePanelContext } from '../context/PanelContext';
import { PanelConfig } from '../context/PanelContext';
import { layoutPersistenceService } from '../services/LayoutPersistenceService';
import { layoutSyncService } from '../services/LayoutSyncService';
import { SerializedLayout, deserializeLayout, serializeLayout } from '../lib/layoutSerialization';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook that integrates the panel system with layout persistence
 */
export function useLayoutManagement() {
  const panelContext = usePanelContext();
  const { layout, updateLayout } = panelContext;
  const { toast } = useToast();
  
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Initialize persistence and sync
  useEffect(() => {
    const initAsync = async () => {
      // Initialize layout persistence
      await layoutPersistenceService.init({ autoSave: true });
      
      // Initialize layout sync
      layoutSyncService.init({ autoSync: true });
      
      // Load the current or default layout
      loadDefaultLayout();
      
      setIsInitialized(true);
    };
    
    initAsync();
    
    // Subscribe to panel layout changes for auto-save
    const autoSaveLayout = () => {
      if (isInitialized && currentLayoutId) {
        layoutPersistenceService.triggerAutoSave();
      }
    };
    
    // This would ideally be a subscription to panel changes
    // For now, we'll use an interval as a fallback
    const intervalId = setInterval(autoSaveLayout, 10000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isInitialized, currentLayoutId]);
  
  // Load the default or current layout on initialization
  const loadDefaultLayout = useCallback(() => {
    try {
      // Try to load the current layout
      const currentLayout = layoutPersistenceService.getCurrentLayout();
      if (currentLayout) {
        applySerializedLayout(currentLayout);
        setCurrentLayoutId(currentLayout.name);
        return;
      }
      
      // Fall back to default layout
      const defaultLayout = layoutPersistenceService.getDefaultLayout();
      if (defaultLayout) {
        applySerializedLayout(defaultLayout);
        setCurrentLayoutId(defaultLayout.name);
      }
    } catch (error) {
      console.error('Error loading default layout:', error);
      toast({
        title: 'Error Loading Layout',
        description: 'Could not load the saved layout. Using default layout instead.',
        variant: 'destructive'
      });
    }
  }, [toast]);
  
  // Save the current layout
  const saveCurrentLayout = useCallback((name?: string) => {
    try {
      const layoutId = name || currentLayoutId;
      if (!layoutId) {
        console.warn('No layout ID provided for save');
        return false;
      }
      
      // Create serialized layout from current panel state
      const serializedLayout = serializeLayout(
        layout,
        layoutId,
        {
          description: 'Saved layout',
          isDefault: layoutPersistenceService.getDefaultLayout()?.name === layoutId
        }
      );
      
      // Save the layout
      const success = layoutPersistenceService.saveLayout(serializedLayout);
      
      if (success) {
        setCurrentLayoutId(layoutId);
        toast({
          title: 'Layout Saved',
          description: `Layout "${layoutId}" has been saved successfully.`
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error saving layout:', error);
      toast({
        title: 'Error Saving Layout',
        description: 'Could not save the current layout.',
        variant: 'destructive'
      });
      return false;
    }
  }, [layout, currentLayoutId, toast]);
  
  // Load a layout by ID
  const loadLayout = useCallback((layoutId: string) => {
    try {
      const layout = layoutPersistenceService.getLayout(layoutId);
      if (!layout) {
        console.warn(`Layout ${layoutId} not found`);
        return false;
      }
      
      const success = applySerializedLayout(layout);
      
      if (success) {
        setCurrentLayoutId(layoutId);
        toast({
          title: 'Layout Loaded',
          description: `Layout "${layout.name}" has been loaded successfully.`
        });
      }
      
      return success;
    } catch (error) {
      console.error(`Error loading layout ${layoutId}:`, error);
      toast({
        title: 'Error Loading Layout',
        description: `Could not load layout "${layoutId}".`,
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);
  
  // Reset to the default layout
  const resetToDefault = useCallback(() => {
    try {
      const success = layoutPersistenceService.resetToDefault();
      
      if (success) {
        const defaultLayout = layoutPersistenceService.getDefaultLayout();
        if (defaultLayout) {
          setCurrentLayoutId(defaultLayout.name);
        }
        
        toast({
          title: 'Reset to Default',
          description: 'The layout has been reset to the default.'
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error resetting to default layout:', error);
      toast({
        title: 'Error Resetting Layout',
        description: 'Could not reset to the default layout.',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);
  
  // Create a new layout from the current state
  const createLayout = useCallback((name: string, description?: string) => {
    try {
      const layoutId = layoutPersistenceService.createLayoutFromCurrent(
        name,
        { description }
      );
      
      if (layoutId) {
        setCurrentLayoutId(layoutId);
        toast({
          title: 'Layout Created',
          description: `Layout "${name}" has been created successfully.`
        });
      }
      
      return layoutId;
    } catch (error) {
      console.error('Error creating layout:', error);
      toast({
        title: 'Error Creating Layout',
        description: 'Could not create the new layout.',
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);
  
  // Helper to apply a serialized layout to the panel system
  const applySerializedLayout = useCallback((serializedLayout: SerializedLayout): boolean => {
    try {
      const { layout: panelLayout, componentInstances } = deserializeLayout(serializedLayout);
      
      // Register component instances with enhancedComponentRegistry if needed
      
      // Update the panel layout
      updateLayout(panelLayout);
      
      return true;
    } catch (error) {
      console.error('Error applying serialized layout:', error);
      return false;
    }
  }, [updateLayout]);
  
  // Sync the current layout with other devices
  const syncCurrentLayout = useCallback(async () => {
    if (!currentLayoutId) {
      console.warn('No current layout to sync');
      return false;
    }
    
    try {
      // First, save the current layout to ensure it's up to date
      saveCurrentLayout();
      
      // Sync the layout
      const success = await layoutSyncService.syncLayout(currentLayoutId);
      
      if (success) {
        toast({
          title: 'Layout Synced',
          description: 'Your layout has been synchronized successfully.'
        });
      } else {
        toast({
          title: 'Sync Failed',
          description: 'Could not sync your layout to other devices.',
          variant: 'destructive'
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error syncing layout:', error);
      toast({
        title: 'Sync Error',
        description: 'An error occurred while syncing your layout.',
        variant: 'destructive'
      });
      return false;
    }
  }, [currentLayoutId, saveCurrentLayout, toast]);
  
  return {
    currentLayoutId,
    isInitialized,
    saveCurrentLayout,
    loadLayout,
    resetToDefault,
    createLayout,
    syncCurrentLayout
  };
}