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
}

/**
 * Types of data that can be shared between components
 */
export enum DependencyDataTypes {
  // Core email data types
  EMAIL = 'email',               // Single email data
  EMAIL_LIST = 'email-list',     // List of emails
  CONTACT = 'contact',           // Contact information
  TAG = 'tag',                   // Tag information
  TAG_LIST = 'tag-list',         // List of tags
  
  // Filter types
  FILTERS = 'filters',           // Generic filter data
  TAG_FILTER = 'tag-filter',     // Tag-specific filter
  FOLDER_FILTER = 'folder-filter', // Folder filter
  DATE_FILTER = 'date-filter',   // Date range filter
  
  // Additional data types
  FOLDER = 'folder',             // Folder information
  FOLDER_LIST = 'folder-list',   // List of folders
  SEARCH_QUERY = 'search-query', // Search query information
  SEARCH_RESULTS = 'search-results', // Search results
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
}