import { nanoid } from 'nanoid';
import React from 'react';
import componentRegistry, { ComponentDefinition } from '../lib/componentRegistry';

// Define types needed for the TabFactory
export interface TabConfig {
  componentId: string;
  props?: Record<string, any>;
  title?: string;
  icon?: React.ReactNode;
  closeable?: boolean;
  panelId?: string;
}

export interface TabFactoryResult {
  tabId: string;
  success: boolean;
  error?: string;
}

export interface TabTemplate {
  id: string;
  name: string;
  description: string;
  tabs: TabConfig[];
}

/**
 * TabFactory service is responsible for creating new tabs
 * It acts as a mediator between component registry and tab context
 */
class TabFactory {
  private templates: Map<string, TabTemplate> = new Map();
  
  constructor() {
    this.registerDefaultTemplates();
  }

  /**
   * Create a new tab with the given configuration
   * This is the main entry point for tab creation
   */
  createTab(
    tabContext: any,
    config: TabConfig,
    destination: {
      targetPanelId?: string;
      newPanel?: {
        parentId: string;
        direction: 'horizontal' | 'vertical';
      }
    } = {}
  ): TabFactoryResult {
    // Validate the component exists
    const component = componentRegistry.getComponent(config.componentId);
    if (!component) {
      return {
        tabId: '',
        success: false,
        error: `Component with ID ${config.componentId} not found in registry`
      };
    }

    // Determine target panel
    let targetPanelId = destination.targetPanelId || config.panelId;
    
    // If no target panel specified, use currently active panel or main panel
    if (!targetPanelId) {
      targetPanelId = tabContext.state.activePanelId || 'mainPanel';
    }

    // If requesting a new panel, create it first
    if (destination.newPanel) {
      const { parentId, direction } = destination.newPanel;
      const newPanelId = tabContext.addPanel('main', parentId, { direction });
      targetPanelId = newPanelId;
    }

    // Create the tab
    const tabId = tabContext.addTab(
      config.componentId,
      targetPanelId,
      config.props || {},
      {
        title: config.title,
        icon: config.icon,
        closeable: config.closeable !== undefined ? config.closeable : true
      }
    );

    return {
      tabId,
      success: true
    };
  }

  /**
   * Duplicate an existing tab
   */
  duplicateTab(
    tabContext: any,
    tabId: string,
    destination: {
      targetPanelId?: string;
      newPanel?: {
        parentId: string;
        direction: 'horizontal' | 'vertical';
      }
    } = {}
  ): TabFactoryResult {
    // Get the source tab
    const sourceTab = tabContext.state.tabs[tabId];
    if (!sourceTab) {
      return {
        tabId: '',
        success: false,
        error: `Tab with ID ${tabId} not found`
      };
    }

    // Create a new tab with the same configuration
    return this.createTab(
      tabContext,
      {
        componentId: sourceTab.componentId,
        props: { ...sourceTab.props }, // Deep copy the props
        title: `${sourceTab.title} (Copy)`,
        icon: sourceTab.icon,
        closeable: sourceTab.closeable
      },
      destination
    );
  }

  /**
   * Register a template for later use
   */
  registerTemplate(template: TabTemplate): void {
    if (this.templates.has(template.id)) {
      console.warn(`Template with ID ${template.id} is already registered. It will be overwritten.`);
    }
    this.templates.set(template.id, template);
  }

  /**
   * Get a template by its ID
   */
  getTemplate(id: string): TabTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all registered templates
   */
  getAllTemplates(): TabTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Create tabs from a template
   */
  createFromTemplate(
    tabContext: any,
    templateId: string,
    destination: {
      targetPanelId?: string;
      newPanel?: {
        parentId: string;
        direction: 'horizontal' | 'vertical';
      }
    } = {}
  ): TabFactoryResult[] {
    const template = this.templates.get(templateId);
    if (!template) {
      return [{
        tabId: '',
        success: false,
        error: `Template with ID ${templateId} not found`
      }];
    }

    // Create tabs from the template
    return template.tabs.map(tabConfig => 
      this.createTab(tabContext, tabConfig, destination)
    );
  }

  /**
   * Save the current set of tabs as a template
   */
  saveCurrentAsTemplate(
    tabContext: any,
    name: string, 
    description: string, 
    panelIds: string[] = []
  ): TabTemplate {
    const tabsToSave: TabConfig[] = [];
    
    // If no panel IDs specified, use all panels
    const targetPanelIds = panelIds.length > 0 
      ? panelIds 
      : Object.keys(tabContext.state.panels);
    
    // Collect tabs from each panel
    targetPanelIds.forEach(panelId => {
      const panel = tabContext.state.panels[panelId];
      if (!panel) return;
      
      panel.tabs.forEach(tabId => {
        const tab = tabContext.state.tabs[tabId];
        if (!tab) return;
        
        tabsToSave.push({
          componentId: tab.componentId,
          props: { ...tab.props },
          title: tab.title,
          closeable: tab.closeable,
          panelId: tab.panelId
        });
      });
    });
    
    // Create and register the template
    const templateId = `template_${nanoid()}`;
    const template: TabTemplate = {
      id: templateId,
      name,
      description,
      tabs: tabsToSave
    };
    
    this.registerTemplate(template);
    return template;
  }

  /**
   * Register default templates
   */
  private registerDefaultTemplates(): void {
    // Email workspace template
    this.registerTemplate({
      id: 'email_workspace',
      name: 'Email Workspace',
      description: 'Standard email workspace with folder explorer, email list, and email detail',
      tabs: [
        {
          componentId: 'folder-explorer',
          panelId: 'leftSidebar'
        },
        {
          componentId: 'email-list',
          panelId: 'leftMainPanel'
        },
        {
          componentId: 'email-detail',
          panelId: 'rightMainPanel'
        }
      ]
    });
    
    // Email with contacts template
    this.registerTemplate({
      id: 'email_with_contacts',
      name: 'Email with Contacts',
      description: 'Email workspace with contact details panel',
      tabs: [
        {
          componentId: 'folder-explorer',
          panelId: 'leftSidebar'
        },
        {
          componentId: 'email-list',
          panelId: 'leftMainPanel'
        },
        {
          componentId: 'email-detail',
          panelId: 'rightMainPanel'
        },
        {
          componentId: 'contact-details',
          panelId: 'rightSidebar'
        }
      ]
    });

    // Productivity setup
    this.registerTemplate({
      id: 'productivity_setup',
      name: 'Productivity Setup',
      description: 'Workspace focused on productivity tools',
      tabs: [
        {
          componentId: 'folder-explorer',
          panelId: 'leftSidebar'
        },
        {
          componentId: 'email-list',
          panelId: 'mainPanel'
        },
        {
          componentId: 'integrations',
          panelId: 'bottomPanel'
        },
        {
          componentId: 'templates',
          panelId: 'bottomPanel'
        }
      ]
    });
  }
}

// Export a singleton instance
export const tabFactory = new TabFactory();
export default tabFactory;