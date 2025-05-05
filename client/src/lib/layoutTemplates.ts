import { 
  SerializedLayout, 
  SerializedPanelConfig,
  CURRENT_LAYOUT_VERSION,
  LayoutTemplateType
} from './layoutSerialization';
import { nanoid } from 'nanoid';

/**
 * Default layout template IDs
 */
export enum DefaultTemplateId {
  DEFAULT = 'default-layout',
  EMAIL_TRIAGE = 'email-triage',
  WRITING_MODE = 'writing-mode',
  PRODUCTIVITY = 'productivity',
  COMMUNICATION = 'communication',
  RESEARCH = 'research',
  COMPACT = 'compact',
  EXPANDED = 'expanded',
  FOCUSED = 'focused'
}

/**
 * Base panel configurations for different layouts
 */
const baseConfigurations: Record<string, SerializedPanelConfig> = {
  // Default single panel layout
  singlePanel: {
    id: 'mainPanel',
    type: 'panel',
    tabs: [
      {
        id: `tab-${nanoid(8)}`,
        title: 'Email List',
        componentInstanceId: 'email-list-instance'
      }
    ],
    activeTabId: ''  // Will be set later
  },
  
  // Split horizontal layout (side by side)
  horizontalSplit: {
    id: 'rootSplit',
    type: 'split',
    direction: 'horizontal',
    children: [
      {
        id: 'leftPanel',
        type: 'panel',
        size: 30,
        tabs: [],
        activeTabId: ''
      },
      {
        id: 'rightPanel',
        type: 'panel',
        size: 70,
        tabs: [],
        activeTabId: ''
      }
    ]
  },
  
  // Split vertical layout (top and bottom)
  verticalSplit: {
    id: 'rootSplit',
    type: 'split',
    direction: 'vertical',
    children: [
      {
        id: 'topPanel',
        type: 'panel',
        size: 70,
        tabs: [],
        activeTabId: ''
      },
      {
        id: 'bottomPanel',
        type: 'panel',
        size: 30,
        tabs: [],
        activeTabId: ''
      }
    ]
  },
  
  // Complex layout with sidebar and main area
  sidebarLayout: {
    id: 'rootSplit',
    type: 'split',
    direction: 'horizontal',
    children: [
      {
        id: 'sidebarPanel',
        type: 'panel',
        size: 20,
        tabs: [],
        activeTabId: ''
      },
      {
        id: 'mainAreaSplit',
        type: 'split',
        direction: 'vertical',
        size: 80,
        children: [
          {
            id: 'mainPanel',
            type: 'panel',
            size: 70,
            tabs: [],
            activeTabId: ''
          },
          {
            id: 'bottomPanel',
            type: 'panel',
            size: 30,
            tabs: [],
            activeTabId: ''
          }
        ]
      }
    ]
  },
  
  // Triple column layout
  tripleColumnLayout: {
    id: 'rootSplit',
    type: 'split',
    direction: 'horizontal',
    children: [
      {
        id: 'leftPanel',
        type: 'panel',
        size: 25,
        tabs: [],
        activeTabId: ''
      },
      {
        id: 'centerPanel',
        type: 'panel',
        size: 50,
        tabs: [],
        activeTabId: ''
      },
      {
        id: 'rightPanel',
        type: 'panel',
        size: 25,
        tabs: [],
        activeTabId: ''
      }
    ]
  },
  
  // Quad layout (4 panels in a grid)
  quadLayout: {
    id: 'rootSplit',
    type: 'split',
    direction: 'vertical',
    children: [
      {
        id: 'topSplit',
        type: 'split',
        direction: 'horizontal',
        size: 50,
        children: [
          {
            id: 'topLeftPanel',
            type: 'panel',
            size: 50,
            tabs: [],
            activeTabId: ''
          },
          {
            id: 'topRightPanel',
            type: 'panel',
            size: 50,
            tabs: [],
            activeTabId: ''
          }
        ]
      },
      {
        id: 'bottomSplit',
        type: 'split',
        direction: 'horizontal',
        size: 50,
        children: [
          {
            id: 'bottomLeftPanel',
            type: 'panel',
            size: 50,
            tabs: [],
            activeTabId: ''
          },
          {
            id: 'bottomRightPanel',
            type: 'panel',
            size: 50,
            tabs: [],
            activeTabId: ''
          }
        ]
      }
    ]
  }
};

/**
 * Default component instances for templates
 */
const defaultComponentInstances = [
  {
    instanceId: 'email-list-instance',
    componentId: 'email-list',
    config: { showUnreadOnly: false },
    state: {},
    created: new Date().toISOString(),
    lastActive: new Date().toISOString()
  },
  {
    instanceId: 'email-content-instance',
    componentId: 'email-content-viewer',
    config: {},
    state: {},
    created: new Date().toISOString(),
    lastActive: new Date().toISOString()
  },
  {
    instanceId: 'folder-explorer-instance',
    componentId: 'folder-explorer',
    config: {},
    state: {},
    created: new Date().toISOString(),
    lastActive: new Date().toISOString()
  },
  {
    instanceId: 'tag-manager-instance',
    componentId: 'tag-manager',
    config: {},
    state: {},
    created: new Date().toISOString(),
    lastActive: new Date().toISOString()
  },
  {
    instanceId: 'calendar-instance',
    componentId: 'calendar',
    config: {},
    state: {},
    created: new Date().toISOString(),
    lastActive: new Date().toISOString()
  },
  {
    instanceId: 'task-manager-instance',
    componentId: 'task-manager',
    config: {},
    state: {},
    created: new Date().toISOString(),
    lastActive: new Date().toISOString()
  },
  {
    instanceId: 'advanced-search-instance',
    componentId: 'advanced-search',
    config: {},
    state: {},
    created: new Date().toISOString(),
    lastActive: new Date().toISOString()
  }
];

/**
 * Generate common component tab
 */
function generateComponentTab(title: string, instanceId: string): any {
  return {
    id: `tab-${nanoid(8)}`,
    title,
    componentInstanceId: instanceId
  };
}

/**
 * Create default template layouts
 */
export function createDefaultTemplates(): Record<string, SerializedLayout> {
  const templates: Record<string, SerializedLayout> = {};
  const timestamp = new Date().toISOString();
  
  // Default basic layout
  const defaultLayout: SerializedLayout = {
    version: CURRENT_LAYOUT_VERSION,
    created: timestamp,
    modified: timestamp,
    name: DefaultTemplateId.DEFAULT,
    description: 'Default layout with inbox and email viewer',
    isDefault: true,
    isBuiltIn: true,
    deviceType: 'any',
    category: LayoutTemplateType.DEFAULT,
    tags: ['default', 'basic', 'starter'],
    rootPanel: {
      ...baseConfigurations.horizontalSplit
    },
    componentInstances: [...defaultComponentInstances]
  };
  
  // Add tabs to the default layout
  const leftPanel = defaultLayout.rootPanel.children?.[0];
  const rightPanel = defaultLayout.rootPanel.children?.[1];
  
  if (leftPanel && rightPanel) {
    leftPanel.tabs = [
      generateComponentTab('Folders', 'folder-explorer-instance'),
      generateComponentTab('Tags', 'tag-manager-instance')
    ];
    leftPanel.activeTabId = leftPanel.tabs[0].id;
    
    rightPanel.tabs = [
      generateComponentTab('Inbox', 'email-list-instance'),
      generateComponentTab('Email', 'email-content-instance')
    ];
    rightPanel.activeTabId = rightPanel.tabs[0].id;
  }
  
  templates[DefaultTemplateId.DEFAULT] = defaultLayout;
  
  // Email Triage layout
  const emailTriageLayout: SerializedLayout = {
    version: CURRENT_LAYOUT_VERSION,
    created: timestamp,
    modified: timestamp,
    name: DefaultTemplateId.EMAIL_TRIAGE,
    description: 'Optimized for processing emails quickly',
    isDefault: false,
    isBuiltIn: true,
    deviceType: 'any',
    category: LayoutTemplateType.EMAIL_TRIAGE,
    tags: ['email', 'triage', 'productivity'],
    rootPanel: {
      ...baseConfigurations.tripleColumnLayout
    },
    componentInstances: [...defaultComponentInstances]
  };
  
  // Add tabs to the email triage layout
  const leftTriagePanel = emailTriageLayout.rootPanel.children?.[0];
  const centerTriagePanel = emailTriageLayout.rootPanel.children?.[1];
  const rightTriagePanel = emailTriageLayout.rootPanel.children?.[2];
  
  if (leftTriagePanel && centerTriagePanel && rightTriagePanel) {
    leftTriagePanel.tabs = [
      generateComponentTab('Folders', 'folder-explorer-instance'),
      generateComponentTab('Tags', 'tag-manager-instance')
    ];
    leftTriagePanel.activeTabId = leftTriagePanel.tabs[0].id;
    
    centerTriagePanel.tabs = [
      generateComponentTab('Inbox', 'email-list-instance')
    ];
    centerTriagePanel.activeTabId = centerTriagePanel.tabs[0].id;
    
    rightTriagePanel.tabs = [
      generateComponentTab('Email', 'email-content-instance')
    ];
    rightTriagePanel.activeTabId = rightTriagePanel.tabs[0].id;
  }
  
  templates[DefaultTemplateId.EMAIL_TRIAGE] = emailTriageLayout;
  
  // Writing Mode layout
  const writingModeLayout: SerializedLayout = {
    version: CURRENT_LAYOUT_VERSION,
    created: timestamp,
    modified: timestamp,
    name: DefaultTemplateId.WRITING_MODE,
    description: 'Focused layout for writing emails',
    isDefault: false,
    isBuiltIn: true,
    deviceType: 'any',
    category: LayoutTemplateType.WRITING_MODE,
    tags: ['writing', 'focus', 'composition'],
    rootPanel: {
      ...baseConfigurations.singlePanel
    },
    componentInstances: [...defaultComponentInstances]
  };
  
  // Customize the writing mode layout
  writingModeLayout.rootPanel.tabs = [
    generateComponentTab('Compose', 'email-content-instance')
  ];
  writingModeLayout.rootPanel.activeTabId = writingModeLayout.rootPanel.tabs[0].id;
  
  templates[DefaultTemplateId.WRITING_MODE] = writingModeLayout;
  
  // Productivity layout
  const productivityLayout: SerializedLayout = {
    version: CURRENT_LAYOUT_VERSION,
    created: timestamp,
    modified: timestamp,
    name: DefaultTemplateId.PRODUCTIVITY,
    description: 'Layout focused on tasks and calendar',
    isDefault: false,
    isBuiltIn: true,
    deviceType: 'any',
    category: LayoutTemplateType.PRODUCTIVITY,
    tags: ['productivity', 'tasks', 'calendar'],
    rootPanel: {
      ...baseConfigurations.sidebarLayout
    },
    componentInstances: [...defaultComponentInstances]
  };
  
  // Customize the productivity layout
  const sidebarPanel = productivityLayout.rootPanel.children?.[0];
  const mainAreaSplit = productivityLayout.rootPanel.children?.[1];
  
  if (sidebarPanel && mainAreaSplit && mainAreaSplit.children) {
    const mainPanel = mainAreaSplit.children[0];
    const bottomPanel = mainAreaSplit.children[1];
    
    sidebarPanel.tabs = [
      generateComponentTab('Folders', 'folder-explorer-instance'),
      generateComponentTab('Tags', 'tag-manager-instance')
    ];
    sidebarPanel.activeTabId = sidebarPanel.tabs[0].id;
    
    mainPanel.tabs = [
      generateComponentTab('Tasks', 'task-manager-instance'),
      generateComponentTab('Inbox', 'email-list-instance')
    ];
    mainPanel.activeTabId = mainPanel.tabs[0].id;
    
    bottomPanel.tabs = [
      generateComponentTab('Calendar', 'calendar-instance')
    ];
    bottomPanel.activeTabId = bottomPanel.tabs[0].id;
  }
  
  templates[DefaultTemplateId.PRODUCTIVITY] = productivityLayout;
  
  // Research layout
  const researchLayout: SerializedLayout = {
    version: CURRENT_LAYOUT_VERSION,
    created: timestamp,
    modified: timestamp,
    name: DefaultTemplateId.RESEARCH,
    description: 'Layout for research and organization',
    isDefault: false,
    isBuiltIn: true,
    deviceType: 'any',
    category: LayoutTemplateType.RESEARCH,
    tags: ['research', 'organization'],
    rootPanel: {
      ...baseConfigurations.quadLayout
    },
    componentInstances: [...defaultComponentInstances]
  };
  
  // Customize the research layout
  const topSplit = researchLayout.rootPanel.children?.[0];
  const bottomSplit = researchLayout.rootPanel.children?.[1];
  
  if (topSplit && bottomSplit && topSplit.children && bottomSplit.children) {
    const topLeftPanel = topSplit.children[0];
    const topRightPanel = topSplit.children[1];
    const bottomLeftPanel = bottomSplit.children[0];
    const bottomRightPanel = bottomSplit.children[1];
    
    topLeftPanel.tabs = [
      generateComponentTab('Folders', 'folder-explorer-instance')
    ];
    topLeftPanel.activeTabId = topLeftPanel.tabs[0].id;
    
    topRightPanel.tabs = [
      generateComponentTab('Inbox', 'email-list-instance')
    ];
    topRightPanel.activeTabId = topRightPanel.tabs[0].id;
    
    bottomLeftPanel.tabs = [
      generateComponentTab('Email', 'email-content-instance')
    ];
    bottomLeftPanel.activeTabId = bottomLeftPanel.tabs[0].id;
    
    bottomRightPanel.tabs = [
      generateComponentTab('Search', 'advanced-search-instance')
    ];
    bottomRightPanel.activeTabId = bottomRightPanel.tabs[0].id;
  }
  
  templates[DefaultTemplateId.RESEARCH] = researchLayout;
  
  // Compact layout
  const compactLayout: SerializedLayout = {
    version: CURRENT_LAYOUT_VERSION,
    created: timestamp,
    modified: timestamp,
    name: DefaultTemplateId.COMPACT,
    description: 'Compact layout for smaller screens',
    isDefault: false,
    isBuiltIn: true,
    deviceType: 'tablet',
    category: LayoutTemplateType.COMPACT,
    tags: ['compact', 'small screen', 'efficient'],
    rootPanel: {
      ...baseConfigurations.verticalSplit
    },
    componentInstances: [...defaultComponentInstances]
  };
  
  // Customize the compact layout
  const topPanel = compactLayout.rootPanel.children?.[0];
  const bottomPanel = compactLayout.rootPanel.children?.[1];
  
  if (topPanel && bottomPanel) {
    topPanel.tabs = [
      generateComponentTab('Inbox', 'email-list-instance')
    ];
    topPanel.activeTabId = topPanel.tabs[0].id;
    
    bottomPanel.tabs = [
      generateComponentTab('Email', 'email-content-instance'),
      generateComponentTab('Folders', 'folder-explorer-instance')
    ];
    bottomPanel.activeTabId = bottomPanel.tabs[0].id;
  }
  
  templates[DefaultTemplateId.COMPACT] = compactLayout;
  
  // Focused layout
  const focusedLayout: SerializedLayout = {
    version: CURRENT_LAYOUT_VERSION,
    created: timestamp,
    modified: timestamp,
    name: DefaultTemplateId.FOCUSED,
    description: 'Focus on one task at a time',
    isDefault: false,
    isBuiltIn: true,
    deviceType: 'any',
    category: LayoutTemplateType.FOCUSED,
    tags: ['focus', 'minimalist', 'distraction-free'],
    rootPanel: {
      ...baseConfigurations.singlePanel
    },
    componentInstances: [...defaultComponentInstances]
  };
  
  // Customize the focused layout
  focusedLayout.rootPanel.tabs = [
    generateComponentTab('Inbox', 'email-list-instance'),
    generateComponentTab('Email', 'email-content-instance'),
    generateComponentTab('Tasks', 'task-manager-instance'),
    generateComponentTab('Calendar', 'calendar-instance')
  ];
  focusedLayout.rootPanel.activeTabId = focusedLayout.rootPanel.tabs[0].id;
  
  templates[DefaultTemplateId.FOCUSED] = focusedLayout;
  
  return templates;
}

/**
 * Get a specific template by ID
 */
export function getTemplateById(id: string): SerializedLayout | null {
  const templates = createDefaultTemplates();
  return templates[id] || null;
}

/**
 * Get all available templates
 */
export function getAllTemplates(): SerializedLayout[] {
  const templates = createDefaultTemplates();
  return Object.values(templates);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: LayoutTemplateType): SerializedLayout[] {
  const templates = createDefaultTemplates();
  return Object.values(templates).filter(
    template => template.category === category
  );
}

/**
 * Create a new component instance with a unique ID
 */
export function createComponentInstance(
  componentId: string, 
  config: Record<string, any> = {}
): any {
  return {
    instanceId: `${componentId}-${nanoid(8)}`,
    componentId,
    config,
    state: {},
    created: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };
}

/**
 * Create a tab for a component
 */
export function createComponentTab(
  title: string,
  componentInstanceId: string
): any {
  return {
    id: `tab-${nanoid(8)}`,
    title,
    componentInstanceId
  };
}