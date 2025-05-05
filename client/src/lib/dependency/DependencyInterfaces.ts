/**
 * Interfaces for the Component Dependency System
 * 
 * This file contains the interfaces and types for the Component Dependency System.
 * It defines the structure of dependency definitions, instances, and related types.
 */

import { ComponentType } from '../communication/ComponentCommunication';

/**
 * Types of data that can be shared between components
 */
export enum DependencyDataType {
  // Basic data types
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  
  // Application-specific data types
  EMAIL = 'email',
  EMAIL_LIST = 'email-list',
  FOLDER = 'folder',
  TAG = 'tag',
  CONTACT = 'contact',
  SEARCH_RESULT = 'search-result',
  ATTACHMENT = 'attachment',
  SELECTION = 'selection',
  FILTER = 'filter',
  
  // Complex data types
  ACTION = 'action',
  EVENT = 'event',
  COMMAND = 'command',
  STATE = 'state',
  CONFIG = 'config'
}

/**
 * Synchronization strategies for dependency data
 */
export enum DependencySyncStrategy {
  // One-way sync from provider to consumer
  PUSH = 'push',
  
  // One-way sync but consumer requests data
  PULL = 'pull',
  
  // Two-way sync between components
  BOTH = 'both',
  
  // Sync based on events rather than direct data access
  EVENT = 'event'
}

/**
 * Status values for dependencies
 */
export enum DependencyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending'
}

/**
 * A dependency definition describes the relationship between component types
 */
export interface DependencyDefinition {
  // Unique identifier
  id: string;
  
  // Basic information
  name: string;
  description: string;
  
  // Component types involved
  providerType: ComponentType;
  consumerType: ComponentType;
  
  // Data characteristics
  dataType: DependencyDataType;
  syncStrategy: DependencySyncStrategy;
  
  // Relationship characteristics
  isRequired: boolean;
  isOneToMany: boolean;
  isManyToOne: boolean;
  
  // Data handling
  validateData?: (data: any) => boolean;
  transformData?: (data: any) => any;
  
  // Metadata
  createdAt: number;
  tags?: string[];
}

/**
 * Configuration for a dependency instance
 */
export interface DependencyConfig {
  // Activation state
  isActive: boolean;
  
  // Data synchronization
  autoUpdate: boolean;
  notifyOnChange: boolean;
  
  // Data customization
  customTransform?: (data: any) => any;
  filter?: (data: any) => boolean;
  
  // Custom options
  options: Record<string, any>;
}

/**
 * Configuration option for a dependency
 */
export interface DependencyConfigOption {
  id: string;
  name: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'object';
  defaultValue: any;
  options?: any[];
  description?: string;
}

/**
 * A runtime dependency instance between components
 */
export interface DependencyInstance {
  // Identifiers
  id: string;
  definitionId: string;
  
  // Components involved
  providerId: string;
  providerType: ComponentType;
  consumerId: string;
  consumerType: ComponentType;
  
  // Data type
  dataType: DependencyDataType;
  
  // Status
  isActive: boolean;
  isReady: boolean;
  error?: string;
  
  // Data
  currentData?: any;
  lastUpdated?: number;
  
  // Configuration
  config: DependencyConfig;
  
  // Metadata
  createdAt: number;
}

/**
 * Data update event for dependencies
 */
export interface DependencyDataUpdateEvent {
  dependencyId: string;
  providerId: string;
  consumerId: string;
  data: any;
  timestamp: number;
}

/**
 * Data request event for dependencies
 */
export interface DependencyDataRequest {
  requestId: string;
  dependencyId: string;
  providerId: string;
  consumerId: string;
  params?: any;
  timestamp: number;
}