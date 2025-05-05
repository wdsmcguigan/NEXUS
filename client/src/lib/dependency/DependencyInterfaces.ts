/**
 * Data types that can be shared between components through the dependency system
 */
export enum DependencyDataTypes {
  EMAIL = 'email',
  EMAIL_LIST = 'email-list',
  EMAIL_ACCOUNT = 'email-account',
  EMAIL_ACCOUNT_LIST = 'email-account-list',
  CONTACT = 'contact',
  CONTACT_LIST = 'contact-list',
  TAG = 'tag',
  TAG_LIST = 'tag-list',
  SEARCH_QUERY = 'search-query',
  SEARCH_RESULTS = 'search-results',
  FILTERS = 'filters',
  SORT_OPTIONS = 'sort-options',
  SELECTION = 'selection',
  SETTINGS = 'settings'
}

// Type for compatibility with existing code and generic types
export type DependencyDataType = DependencyDataTypes | string;

/**
 * Synchronization strategies for data dependencies
 */
export enum DependencySyncStrategy {
  // Provider pushes updates to consumers automatically
  PUSH = 'push',
  
  // Consumer pulls data from provider when needed
  PULL = 'pull',
  
  // Both push and pull mechanisms are allowed
  HYBRID = 'hybrid'
}

/**
 * Dependency relationship status
 */
export enum DependencyStatus {
  // Not connected to any dependency
  INACTIVE = 'inactive',
  
  // Currently fetching data from provider
  LOADING = 'loading',
  
  // Successfully connected and synced with provider
  ACTIVE = 'active',
  
  // Error in dependency connection or data retrieval
  ERROR = 'error'
}

/**
 * Definition of a dependency relationship type between components
 */
export interface DependencyDefinition {
  // Unique identifier for this dependency relationship
  id: string;
  
  // Display name for this dependency relationship
  name: string;
  
  // Description of this dependency relationship
  description?: string;
  
  // Component type that can act as a provider
  providerType: string;
  
  // Component type that can act as a consumer
  consumerType: string;
  
  // Type of data being shared
  dataType: DependencyDataType;
  
  // How data is synchronized between provider and consumer
  syncStrategy: DependencySyncStrategy;
  
  // Whether this dependency is required for the consumer to function
  isRequired: boolean;
  
  // Whether one provider can serve multiple consumers
  isOneToMany: boolean;
  
  // Whether multiple providers can serve one consumer
  isManyToOne: boolean;
  
  // Optional function to transform data when passed between components
  transformData?: (data: any) => any;
  
  // Optional function to validate data compatibility
  validateData?: (data: any) => boolean;
  
  // When this dependency definition was created
  createdAt: number;
}

/**
 * Options for a specific dependency instance
 */
export interface DependencyOptions {
  // Whether this dependency is currently active
  isActive: boolean;
  
  // Whether data should be updated automatically when changed
  autoUpdate: boolean;
  
  // Whether to notify when data changes
  notifyOnChange: boolean;
  
  // Additional custom options specific to this dependency
  options: Record<string, any>;
}

/**
 * Instance of a dependency relationship between specific component instances
 */
export interface DependencyInstance {
  // Unique identifier for this dependency instance
  id: string;
  
  // ID of the dependency definition this instance is based on
  definitionId: string;
  
  // ID of the provider component instance
  providerId: string;
  
  // ID of the consumer component instance
  consumerId: string;
  
  // Type of data being shared
  dataType: DependencyDataType;
  
  // How data is synchronized between provider and consumer
  syncStrategy: DependencySyncStrategy;
  
  // Current data shared through this dependency
  currentData?: any;
  
  // Last time the data was updated
  lastUpdated?: number;
  
  // Status of this dependency
  status: DependencyStatus;
  
  // Configuration options for this dependency instance
  options: DependencyOptions;
}

/**
 * Response from the dependency manager when requesting data
 */
export interface DataRequestResponse<T = any> {
  success: boolean;
  providerId: string | null;
  data: T | null;
  timestamp: number;
  errorMessage?: string;
}

/**
 * State information for a dependency relationship
 */
export interface DependencyState {
  isReady: boolean;
  providerId: string | null;
  currentData: any | null;
  lastUpdated: number | null; 
  status: DependencyStatus;
}

/**
 * Information about a data provider
 */
export interface ProviderInfo {
  instanceId: string;
  componentId: string;
  dataType: DependencyDataType;
  hasData: boolean;
  lastUpdated?: number;
}