import { PanelConfig, PanelDirection } from '../context/PanelContext';
import { nanoid } from 'nanoid';
import { enhancedComponentRegistry, ComponentInstance } from './enhancedComponentRegistry';
import { Tab } from '../components/TabBar';

/**
 * Layout version for migration handling
 */
export const CURRENT_LAYOUT_VERSION = '1.0.0';

/**
 * Serializable representation of the application layout
 */
export interface SerializedLayout {
  version: string;
  created: string;
  modified: string;
  name: string;
  description?: string;
  thumbnail?: string; // Base64 encoded image
  isDefault?: boolean;
  isBuiltIn?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile' | 'any';
  category?: string; // For organizing templates
  tags?: string[];
  rootPanel: SerializedPanelConfig;
  componentInstances: SerializedComponentInstance[];
  metadata?: Record<string, any>;
}

/**
 * Serialized panel configuration
 */
export interface SerializedPanelConfig {
  id: string;
  type: 'panel' | 'split';
  direction?: PanelDirection;
  size?: number;
  minSize?: number;
  children?: SerializedPanelConfig[];
  tabs?: SerializedTab[];
  activeTabId?: string;
}

/**
 * Serialized tab information
 */
export interface SerializedTab {
  id: string;
  title: string;
  icon?: string; // Icon name for reconstruction
  closeable?: boolean;
  componentInstanceId?: string; // Link to component instance
  pinned?: boolean;
  color?: string;
}

/**
 * Serialized component instance
 */
export interface SerializedComponentInstance {
  instanceId: string;
  componentId: string;
  config?: Record<string, any>;
  state?: Record<string, any>;
  created?: string;
  lastActive?: string;
}

/**
 * Default layout templates
 */
export enum LayoutTemplateType {
  DEFAULT = 'default',
  EMAIL_TRIAGE = 'email-triage',
  WRITING_MODE = 'writing-mode',
  PRODUCTIVITY = 'productivity',
  COMMUNICATION = 'communication',
  RESEARCH = 'research',
  COMPACT = 'compact',
  EXPANDED = 'expanded',
  FOCUSED = 'focused',
  CUSTOM = 'custom'
}

/**
 * Create a unique ID for serialized items
 */
function createSerializedId(): string {
  return nanoid(8);
}

/**
 * Serialize an icon component to a string ID
 */
function serializeIcon(icon: any): string | undefined {
  if (!icon) return undefined;
  
  // If it's already a string, return it
  if (typeof icon === 'string') return icon;
  
  // Try to get the name from the displayName or name
  return icon.displayName || icon.name || undefined;
}

/**
 * Serialize a single tab
 */
function serializeTab(tab: Tab, componentInstanceMap: Map<string, string>): SerializedTab {
  const serializedTab: SerializedTab = {
    id: tab.id,
    title: tab.title,
    closeable: tab.closeable,
    pinned: tab.pinned,
    color: tab.color
  };
  
  // Handle icon
  if (tab.icon) {
    serializedTab.icon = serializeIcon(tab.icon);
  }
  
  // Link to component instance if available
  if (tab.componentInstance && componentInstanceMap.has(tab.componentInstance)) {
    serializedTab.componentInstanceId = componentInstanceMap.get(tab.componentInstance);
  }
  
  return serializedTab;
}

/**
 * Serialize a panel configuration
 */
function serializePanel(
  panel: PanelConfig, 
  componentInstanceMap: Map<string, string>
): SerializedPanelConfig {
  const serializedPanel: SerializedPanelConfig = {
    id: panel.id,
    type: panel.type,
    direction: panel.direction,
    size: panel.size,
    minSize: panel.minSize,
    activeTabId: panel.activeTabId
  };
  
  // Serialize children if available
  if (panel.children && panel.children.length > 0) {
    serializedPanel.children = panel.children.map(child => 
      serializePanel(child, componentInstanceMap)
    );
  }
  
  // Serialize tabs if available
  if (panel.tabs && panel.tabs.length > 0) {
    serializedPanel.tabs = panel.tabs.map(tab => 
      serializeTab(tab, componentInstanceMap)
    );
  }
  
  return serializedPanel;
}

/**
 * Serialize a component instance
 */
function serializeComponentInstance(instance: ComponentInstance): SerializedComponentInstance {
  return {
    instanceId: instance.instanceId,
    componentId: instance.componentId,
    config: instance.config ? { ...instance.config } : undefined,
    state: instance.state ? { ...instance.state } : undefined,
    created: instance.created ? instance.created.toISOString() : new Date().toISOString(),
    lastActive: instance.lastActive ? instance.lastActive.toISOString() : new Date().toISOString()
  };
}

/**
 * Collect all component instances referenced in the layout
 */
function collectComponentInstances(
  panel: PanelConfig, 
  instances: ComponentInstance[] = [],
  instanceMap: Map<string, string> = new Map()
): { instances: ComponentInstance[], instanceMap: Map<string, string> } {
  // Check tabs for component instances
  if (panel.tabs) {
    for (const tab of panel.tabs) {
      if (tab.componentInstance) {
        // Find the component instance
        const instance = enhancedComponentRegistry.getInstance(tab.componentInstance);
        if (instance) {
          instances.push(instance);
          instanceMap.set(tab.componentInstance, instance.instanceId);
        }
      }
    }
  }
  
  // Recursively check children
  if (panel.children) {
    for (const child of panel.children) {
      const { instances: childInstances, instanceMap: childMap } = 
        collectComponentInstances(child, instances, instanceMap);
      
      // Merge the results
      instances.push(...childInstances.filter(i => 
        !instances.some(existing => existing.instanceId === i.instanceId)
      ));
      
      // Merge the maps
      for (const [key, value] of childMap.entries()) {
        instanceMap.set(key, value);
      }
    }
  }
  
  return { instances, instanceMap };
}

/**
 * Serialize the entire layout
 * @param layout Root panel configuration
 * @param name Layout name
 * @param options Additional options for serialization
 */
export function serializeLayout(
  layout: PanelConfig,
  name: string,
  options: {
    description?: string;
    thumbnail?: string;
    isDefault?: boolean;
    isBuiltIn?: boolean;
    deviceType?: 'desktop' | 'tablet' | 'mobile' | 'any';
    category?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  } = {}
): SerializedLayout {
  // Collect component instances
  const { instances, instanceMap } = collectComponentInstances(layout);
  
  // Serialize the panel configuration
  const rootPanel = serializePanel(layout, instanceMap);
  
  // Serialize component instances
  const componentInstances = instances.map(serializeComponentInstance);
  
  // Create the final serialized layout
  return {
    version: CURRENT_LAYOUT_VERSION,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    name,
    description: options.description,
    thumbnail: options.thumbnail,
    isDefault: options.isDefault,
    isBuiltIn: options.isBuiltIn,
    deviceType: options.deviceType || 'any',
    category: options.category,
    tags: options.tags,
    rootPanel,
    componentInstances,
    metadata: options.metadata
  };
}

/**
 * Deserialize a tab
 */
function deserializeTab(
  serializedTab: SerializedTab, 
  componentInstanceMap: Map<string, ComponentInstance>
): Tab {
  const tab: Tab = {
    id: serializedTab.id,
    title: serializedTab.title,
    closeable: serializedTab.closeable,
    pinned: serializedTab.pinned,
    color: serializedTab.color
  };
  
  // Handle component instance if available
  if (serializedTab.componentInstanceId && 
      componentInstanceMap.has(serializedTab.componentInstanceId)) {
    tab.componentInstance = serializedTab.componentInstanceId;
  }
  
  // We'll handle icon reconstruction later when integrating with the UI
  
  return tab;
}

/**
 * Deserialize a panel configuration
 */
function deserializePanel(
  serializedPanel: SerializedPanelConfig,
  componentInstanceMap: Map<string, ComponentInstance>
): PanelConfig {
  const panel: PanelConfig = {
    id: serializedPanel.id,
    type: serializedPanel.type,
    direction: serializedPanel.direction,
    size: serializedPanel.size,
    minSize: serializedPanel.minSize,
    activeTabId: serializedPanel.activeTabId
  };
  
  // Deserialize children if available
  if (serializedPanel.children && serializedPanel.children.length > 0) {
    panel.children = serializedPanel.children.map(child => 
      deserializePanel(child, componentInstanceMap)
    );
  }
  
  // Deserialize tabs if available
  if (serializedPanel.tabs && serializedPanel.tabs.length > 0) {
    panel.tabs = serializedPanel.tabs.map(tab => 
      deserializeTab(tab, componentInstanceMap)
    );
  }
  
  return panel;
}

/**
 * Deserialize a component instance
 */
function deserializeComponentInstance(
  serializedInstance: SerializedComponentInstance
): ComponentInstance | null {
  // Check if the component still exists
  if (!enhancedComponentRegistry.hasComponent(serializedInstance.componentId)) {
    console.warn(`Component ${serializedInstance.componentId} not found, cannot deserialize instance`);
    return null;
  }
  
  // Create a new instance with the serialized data
  return {
    instanceId: serializedInstance.instanceId,
    componentId: serializedInstance.componentId,
    panelId: '', // Will be set during layout reconstruction
    tabId: '',   // Will be set during layout reconstruction
    config: serializedInstance.config ? { ...serializedInstance.config } : undefined,
    state: serializedInstance.state ? { ...serializedInstance.state } : undefined,
    created: serializedInstance.created ? new Date(serializedInstance.created) : new Date(),
    lastActive: serializedInstance.lastActive ? new Date(serializedInstance.lastActive) : new Date()
  };
}

/**
 * Deserialize the entire layout
 * @param serializedLayout Serialized layout data
 */
export function deserializeLayout(serializedLayout: SerializedLayout): {
  layout: PanelConfig;
  componentInstances: ComponentInstance[];
} {
  // Deserialize component instances and create a map
  const instanceMap = new Map<string, ComponentInstance>();
  const componentInstances: ComponentInstance[] = [];
  
  for (const serializedInstance of serializedLayout.componentInstances) {
    const instance = deserializeComponentInstance(serializedInstance);
    if (instance) {
      instanceMap.set(instance.instanceId, instance);
      componentInstances.push(instance);
    }
  }
  
  // Deserialize the panel configuration
  const layout = deserializePanel(serializedLayout.rootPanel, instanceMap);
  
  // Update panel and tab IDs in component instances
  const updateInstancePanelAndTabIds = (panel: PanelConfig) => {
    if (panel.tabs) {
      for (const tab of panel.tabs) {
        if (tab.componentInstance && instanceMap.has(tab.componentInstance)) {
          const instance = instanceMap.get(tab.componentInstance)!;
          instance.panelId = panel.id;
          instance.tabId = tab.id;
        }
      }
    }
    
    if (panel.children) {
      for (const child of panel.children) {
        updateInstancePanelAndTabIds(child);
      }
    }
  };
  
  updateInstancePanelAndTabIds(layout);
  
  return { layout, componentInstances };
}

/**
 * Create a layout screenshot as a base64-encoded image
 */
export async function createLayoutScreenshot(): Promise<string | null> {
  try {
    // Use html2canvas or similar library to capture the layout
    // This is just a placeholder implementation
    return null;
  } catch (error) {
    console.error('Error creating layout screenshot:', error);
    return null;
  }
}

/**
 * Validate a serialized layout
 * @returns True if valid, false otherwise
 */
export function validateSerializedLayout(layout: any): boolean {
  if (!layout) return false;
  
  // Check required fields
  if (!layout.version || 
      !layout.created || 
      !layout.modified || 
      !layout.name || 
      !layout.rootPanel ||
      !Array.isArray(layout.componentInstances)) {
    return false;
  }
  
  // Simple version check
  if (layout.version !== CURRENT_LAYOUT_VERSION) {
    console.warn(`Layout version mismatch: ${layout.version} vs ${CURRENT_LAYOUT_VERSION}`);
    // We could implement more sophisticated version migration here
  }
  
  return true;
}

/**
 * Migrate a layout from an older version to the current version
 */
export function migrateLayout(oldLayout: any): SerializedLayout | null {
  // This would handle migrating between different layout versions
  // For now, we just validate and return the layout if it's valid
  if (!validateSerializedLayout(oldLayout)) {
    return null;
  }
  
  return oldLayout as SerializedLayout;
}

/**
 * Generate a simple migration plan for layouts between versions
 */
export function generateMigrationPlan(
  sourceVersion: string, 
  targetVersion: string
): string[] {
  // This would return the steps needed to migrate between versions
  if (sourceVersion === targetVersion) {
    return ['No migration needed - versions match'];
  }
  
  return [
    `Migrate from ${sourceVersion} to ${targetVersion}`,
    'Update layout structure',
    'Convert component references',
    'Update panel configurations'
  ];
}

/**
 * Merge two layouts (useful for preserving parts of layouts during updates)
 */
export function mergeLayouts(
  baseLayout: SerializedLayout,
  overlayLayout: SerializedLayout
): SerializedLayout {
  // For now, we just return the overlay layout
  // In a real implementation, this would intelligently merge the two layouts
  return {
    ...baseLayout,
    ...overlayLayout,
    modified: new Date().toISOString()
  };
}