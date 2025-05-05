/**
 * Core interfaces for the Component Dependency System
 * 
 * This system allows components to define dependencies on other components,
 * enabling data flow and coordination between different parts of the application.
 */

import { ComponentType } from '../communication/ComponentCommunication';

/**
 * Types of data that can be shared between components
 */
export enum DependencyDataType {
  EMAIL = 'email',
  EMAIL_LIST = 'email-list',
  CONTACT = 'contact',
  CONTACT_LIST = 'contact-list',
  FOLDER = 'folder',
  FOLDER_LIST = 'folder-list',
  TAG = 'tag',
  TAG_LIST = 'tag-list',
  CALENDAR_EVENT = 'calendar-event',
  CALENDAR_EVENTS = 'calendar-events',
  SEARCH_QUERY = 'search-query',
  SEARCH_RESULTS = 'search-results',
  CUSTOM = 'custom'
}

/**
 * Synchronization strategy for dependencies
 */
export enum DependencySyncStrategy {
  /**
   * Consumer actively pulls data from provider when needed
   */
  PULL = 'pull',
  
  /**
   * Provider actively pushes data to consumer when it changes
   */
  PUSH = 'push',
  
  /**
   * Both push and pull are supported
   */
  BOTH = 'both'
}

/**
 * Defines a possible dependency between component types
 */
export interface DependencyDefinition {
  /**
   * Unique identifier for this dependency definition
   */
  id: string;
  
  /**
   * Name for display in the UI
   */
  name: string;
  
  /**
   * Optional description
   */
  description?: string;
  
  /**
   * Component type that provides data
   */
  providerType: ComponentType;
  
  /**
   * Component type that consumes data
   */
  consumerType: ComponentType;
  
  /**
   * Type of data shared in this dependency
   */
  dataType: DependencyDataType;
  
  /**
   * Synchronization strategy
   */
  syncStrategy: DependencySyncStrategy;
  
  /**
   * Whether this dependency is required for the consumer
   */
  isRequired: boolean;
  
  /**
   * Whether the provider can have multiple consumers
   */
  isOneToMany: boolean;
  
  /**
   * Whether the consumer can have multiple providers
   */
  isManyToOne: boolean;
  
  /**
   * Additional configuration options specific to this dependency type
   */
  configOptions?: DependencyConfigOption[];
  
  /**
   * Function to validate dependency data
   */
  validateData?: (data: any) => boolean;
  
  /**
   * Default data transformation function
   */
  transformData?: (data: any) => any;
}

/**
 * Configuration option for a dependency
 */
export interface DependencyConfigOption {
  /**
   * Option key
   */
  key: string;
  
  /**
   * Human-readable name
   */
  name: string;
  
  /**
   * Option description
   */
  description?: string;
  
  /**
   * Option type
   */
  type: 'boolean' | 'string' | 'number' | 'select' | 'custom';
  
  /**
   * Default value
   */
  defaultValue?: any;
  
  /**
   * Available options for 'select' type
   */
  options?: Array<{ value: string; label: string }>;
  
  /**
   * Whether this option is required
   */
  required?: boolean;
  
  /**
   * Function to validate option value
   */
  validate?: (value: any) => boolean;
}

/**
 * Configuration for a dependency instance
 */
export interface DependencyConfig {
  /**
   * Reference to the dependency definition
   */
  definitionId: string;
  
  /**
   * Additional configuration values
   */
  options: Record<string, any>;
  
  /**
   * Custom data transformation function
   */
  customTransform?: (data: any) => any;
  
  /**
   * Whether dependency updates trigger automatic UI updates
   */
  autoUpdate?: boolean;
  
  /**
   * Custom filter function to determine if data should be processed
   */
  filter?: (data: any) => boolean;
}

/**
 * Represents an active dependency between component instances
 */
export interface DependencyInstance {
  /**
   * Unique identifier for this dependency instance
   */
  id: string;
  
  /**
   * Reference to the dependency definition
   */
  definitionId: string;
  
  /**
   * ID of the provider component instance
   */
  providerId: string;
  
  /**
   * ID of the consumer component instance
   */
  consumerId: string;
  
  /**
   * Component type of the provider
   */
  providerType: ComponentType;
  
  /**
   * Component type of the consumer
   */
  consumerType: ComponentType;
  
  /**
   * Configuration for this dependency instance
   */
  config: DependencyConfig;
  
  /**
   * Last update timestamp
   */
  lastUpdated?: number;
  
  /**
   * Current data state
   */
  currentData?: any;
  
  /**
   * Whether this dependency is active
   */
  isActive: boolean;
  
  /**
   * Whether this dependency is ready (provider and consumer are available)
   */
  isReady: boolean;
  
  /**
   * Error message if dependency is in error state
   */
  error?: string;
}

/**
 * Event emitted when dependency data is updated
 */
export interface DependencyDataUpdateEvent {
  /**
   * Dependency instance ID
   */
  dependencyId: string;
  
  /**
   * Provider component ID
   */
  providerId: string;
  
  /**
   * Consumer component ID
   */
  consumerId: string;
  
  /**
   * Type of data being shared
   */
  dataType: DependencyDataType;
  
  /**
   * The data being shared
   */
  data: any;
  
  /**
   * Timestamp of the update
   */
  timestamp: number;
}

/**
 * Status of a dependency instance
 */
export enum DependencyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending'
}

/**
 * Data request from a consumer to a provider
 */
export interface DependencyDataRequest {
  /**
   * Dependency instance ID
   */
  dependencyId: string;
  
  /**
   * Consumer component ID
   */
  consumerId: string;
  
  /**
   * Provider component ID
   */
  providerId: string;
  
  /**
   * Type of data being requested
   */
  dataType: DependencyDataType;
  
  /**
   * Timestamp of the request
   */
  timestamp: number;
  
  /**
   * Additional parameters for the request
   */
  params?: any;
}