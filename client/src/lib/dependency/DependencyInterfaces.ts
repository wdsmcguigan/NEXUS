/**
 * This file defines the interfaces and types used by the dependency system.
 * The dependency system allows components to declare what data they provide
 * and what data they consume, enabling automatic data flow between components.
 */

/**
 * Status of a dependency relationship
 */
export enum DependencyStatus {
  DISCONNECTED = 'disconnected', // No connection established
  CONNECTING = 'connecting',     // Connection in progress
  CONNECTED = 'connected',       // Connection established
  ERROR = 'error',               // Connection error
  READY = 'ready',               // Connected and data is available
  CYCLE_DETECTED = 'cycle-detected', // Circular dependency detected
  OPTIMIZING = 'optimizing',     // Optimizing the data flow
  SUSPENDED = 'suspended',       // Temporarily disabled
}

/**
 * Types of data that can be shared between components
 */
export enum DependencyDataTypes {
  // Core email data types
  EMAIL = 'email',               // Single email data
  EMAIL_LIST = 'email-list',     // List of emails
  EMAIL_DATA = 'email-data',     // General email data
  CONTACT = 'contact',           // Contact information
  TAG = 'tag',                   // Tag information
  TAG_LIST = 'tag-list',         // List of tags
  TAG_DATA = 'tag-data',         // General tag data
  
  // Filter types
  FILTERS = 'filters',           // Generic filter data
  TAG_FILTER = 'tag-filter',     // Tag-specific filter
  FOLDER_FILTER = 'folder-filter', // Folder filter
  DATE_FILTER = 'date-filter',   // Date range filter
  
  // Content types
  ATTACHMENT_DATA = 'attachment-data', // Email attachment data
  COMPOSITION_DATA = 'composition-data', // Email composition data
  
  // Additional data types
  FOLDER = 'folder',             // Folder information
  FOLDER_LIST = 'folder-list',   // List of folders
  SEARCH_QUERY = 'search-query', // Search query information
  SEARCH_RESULTS = 'search-results', // Search results
  SEARCH_DATA = 'search-data',   // General search data
  TEMPLATE = 'template',         // Email template
  SETTINGS = 'settings',         // Application settings
}

/**
 * Data synchronization strategy
 */
export enum DependencySyncStrategy {
  PULL = 'pull',     // Consumer requests data from provider when needed
  PUSH = 'push',     // Provider pushes data to consumer when it changes
  BOTH = 'both',     // Both pull and push are enabled
}

/**
 * Log level for dependency events
 */
export enum DependencyLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  PERFORMANCE = 'performance'
}

/**
 * Performance impact level
 */
export enum PerformanceImpact {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Dependency definition
 */
export interface DependencyDefinition {
  id: string;                    // Unique identifier for this dependency definition
  componentId: string;           // Component that owns this definition
  dataType: DependencyDataTypes; // Type of data shared
  role: 'provider' | 'consumer' | 'both'; // Role in the dependency relationship
  description?: string;          // Human-readable description
  required?: boolean;            // Whether this dependency is required for the component to function
  syncStrategy?: DependencySyncStrategy; // How data is synchronized
  acceptsMultiple?: boolean;     // Whether multiple providers/consumers are accepted
  metadataSchema?: any;          // Schema for additional metadata
  priority?: number;             // Priority of this dependency (higher = more important)
  debounceMs?: number;           // Debounce time for updates in milliseconds
  cacheable?: boolean;           // Whether data can be cached
  transformFn?: string;          // Reference to a transform function for data
}

/**
 * Dependency relationship between a provider and consumer
 */
export interface Dependency {
  id: string;                    // Unique identifier for this dependency
  providerId: string;            // Component ID of the provider
  consumerId: string;            // Component ID of the consumer
  providerDefinitionId: string;  // ID of the provider's dependency definition
  consumerDefinitionId: string;  // ID of the consumer's dependency definition
  dataType: DependencyDataTypes; // Type of data shared
  status: DependencyStatus;      // Current status of the dependency
  lastUpdated?: number;          // Timestamp of the last data update
  metadata?: Record<string, any>; // Additional metadata
  chainPosition?: number;        // Position in a dependency chain (0 = source)
  chainId?: string;              // ID of the dependency chain this belongs to
  performance?: {                // Performance metrics
    updateCount: number;         // Number of updates
    avgUpdateTime: number;       // Average time for updates in ms
    lastUpdateTime: number;      // Time of last update in ms
    heaviestUpdate: number;      // Heaviest update time in ms
  };
}

/**
 * Dependency chain representing a multi-level dependency relationship
 */
export interface DependencyChain {
  id: string;                    // Unique ID for the chain
  dependencies: string[];        // Ordered array of dependency IDs in the chain
  dataType: DependencyDataTypes; // Type of data flowing through the chain
  status: DependencyStatus;      // Overall status of the chain
  hasCycle: boolean;             // Whether this chain has a cycle
  performance?: {                // Performance metrics for the chain
    totalPropagationTime: number; // Total time for data to flow from start to end
    bottleneckDependencyId?: string; // ID of the dependency causing bottleneck
  };
}

/**
 * Event log entry for dependency system
 */
export interface DependencyLogEntry {
  id: string;                    // Unique ID for this log entry
  timestamp: number;             // When this event occurred
  level: DependencyLogLevel;     // Log level
  message: string;               // Log message
  componentId?: string;          // Related component ID
  dependencyId?: string;         // Related dependency ID
  chainId?: string;              // Related chain ID
  dataType?: DependencyDataTypes; // Related data type
  performance?: {                // Performance data if available
    duration: number;            // Duration of the operation in ms
    impact: PerformanceImpact;   // Performance impact level
    dataSize?: number;           // Size of data involved in bytes (if applicable)
  };
  data?: any;                    // Additional data for debugging
}

/**
 * Dependency suggestion generated by the system
 */
export interface DependencySuggestion {
  id: string;                    // Unique ID for this suggestion
  suggestedProviderId: string;   // Suggested provider component
  suggestedConsumerId: string;   // Suggested consumer component
  dataType: DependencyDataTypes; // Type of data to share
  confidence: number;            // Confidence level (0-1)
  reason: string;                // Human-readable reason for suggestion
  usagePattern?: {               // Usage pattern that led to suggestion
    frequency: number;           // How frequently these components are used together
    timeSpan: number;            // Time span over which pattern was observed (ms)
    userActions: number;         // Number of user actions involved
  };
}

/**
 * Dependency registry that tracks definitions and relationships
 */
export interface DependencyRegistry {
  // Definition management
  registerDefinition(definition: DependencyDefinition): void;
  removeDefinition(definitionId: string): void;
  getDefinition(definitionId: string): DependencyDefinition | undefined;
  getDefinitionsByComponent(componentId: string): DependencyDefinition[];
  getDefinitionsByType(dataType: DependencyDataTypes): DependencyDefinition[];
  getProviderDefinitions(dataType: DependencyDataTypes): DependencyDefinition[];
  getConsumerDefinitions(dataType: DependencyDataTypes): DependencyDefinition[];
  
  // Dependency management
  createDependency(providerId: string, consumerId: string, dataType: DependencyDataTypes): Dependency | undefined;
  removeDependency(dependencyId: string): void;
  getDependency(dependencyId: string): Dependency | undefined;
  getDependenciesByProvider(providerId: string): Dependency[];
  getDependenciesByConsumer(consumerId: string): Dependency[];
  getDependenciesByType(dataType: DependencyDataTypes): Dependency[];
  
  // Status management
  updateDependencyStatus(dependencyId: string, status: DependencyStatus): void;
  
  // Utility methods
  findCompatibleProviders(consumerDefinitionId: string): DependencyDefinition[];
  findCompatibleConsumers(providerDefinitionId: string): DependencyDefinition[];
  
  // Helper methods for testing
  getAllDefinitions(): DependencyDefinition[];
  getAllComponents(): string[];
  getComponent(componentId: string): any;
  getDefinitionsByComponentAndRole(
    componentId: string, 
    role: 'provider' | 'consumer' | 'both',
    dataType?: DependencyDataTypes
  ): DependencyDefinition[];
  getDependenciesByProviderAndDataType(
    providerId: string,
    dataType: DependencyDataTypes
  ): Dependency[];
}

/**
 * Dependency manager that handles runtime data exchange
 */
export interface DependencyManager {
  // Data management
  updateData(providerId: string, dataType: DependencyDataTypes, data: any): void;
  getData(dependencyId: string): any;
  requestData(consumerId: string, providerId: string, dataType: DependencyDataTypes): void;
  
  // Notification callbacks
  onDataUpdated(callback: (dependencyId: string, data: any) => void): () => void;
  onStatusChanged(callback: (dependencyId: string, status: DependencyStatus) => void): () => void;
  
  // Utility methods
  hasDependents(providerId: string, dataType: DependencyDataTypes): boolean;
  getDependents(providerId: string, dataType: DependencyDataTypes): string[];
  hasProviders(consumerId: string, dataType: DependencyDataTypes): boolean;
  getProviders(consumerId: string, dataType: DependencyDataTypes): string[];
}

/**
 * Context for dependency management in React applications
 */
export interface DependencyContextType {
  // Registry access
  registry: DependencyRegistry;
  
  // Manager access
  manager: DependencyManager;
  
  // Convenience methods for components
  registerComponent(componentId: string, definitions: DependencyDefinition[]): void;
  unregisterComponent(componentId: string): void;
  updateComponentData(componentId: string, dataType: DependencyDataTypes, data: any): void;
  getComponentData(componentId: string, dataType: DependencyDataTypes): any;
  
  // Status methods
  getDependencyStatus(providerId: string, consumerId: string, dataType: DependencyDataTypes): DependencyStatus;
  
  // Dependency management methods
  suspendDependency(dependencyId: string): void;
  suspendAllDependencies(componentId: string): void;
  suspendAllDependenciesForComponent(componentId: string): void;
  resumeDependency(dependencyId: string): void;
  resumeAllDependencies(componentId: string): void;
  removeDependency(dependencyId: string): void;
}