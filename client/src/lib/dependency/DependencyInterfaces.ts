/**
 * Dependency System Interfaces
 * 
 * This file contains the interfaces and types for the Component Dependency System.
 * It defines the core data structures used throughout the system.
 */

import { ComponentType } from '../communication/ComponentCommunication';

// Enum for dependency data types
export type DependencyDataType = string;

// Common dependency data types
export const DependencyDataTypes = {
  EMAIL: 'email',
  FOLDER: 'folder',
  CONTACT: 'contact',
  TAG: 'tag',
  SELECTION: 'selection',
  SEARCH: 'search',
  FILTER: 'filter',
  SORT: 'sort'
} as const;

// Enum for dependency synchronization strategies
export enum DependencySyncStrategy {
  PUSH = 'push',    // Provider pushes data to consumer
  PULL = 'pull',    // Consumer pulls data from provider
  BOTH = 'both'     // Bidirectional synchronization
}

// Enum for dependency status
export enum DependencyStatus {
  INACTIVE = 'inactive',    // Dependency exists but is not active
  ACTIVE = 'active',        // Dependency is active and ready
  ERROR = 'error',          // Dependency has an error
  LOADING = 'loading'       // Dependency is loading data
}

// Interface for dependency definition
export interface DependencyDefinition {
  id: string;
  name: string;
  description: string;
  providerType: ComponentType;
  consumerType: ComponentType;
  dataType: DependencyDataType;
  syncStrategy: DependencySyncStrategy;
  isRequired: boolean;
  isOneToMany: boolean;     // One provider can provide for many consumers
  isManyToOne: boolean;     // Many providers can provide for one consumer
  validateData?: (data: any) => boolean;
  transformData?: (data: any) => any;
  createdAt: number;
}

// Interface for dependency configuration
export interface DependencyConfig {
  isActive: boolean;
  autoUpdate: boolean;
  notifyOnChange: boolean;
  customTransform?: (data: any) => any;
  options: Record<string, any>;
}

// Interface for dependency instance
export interface DependencyInstance {
  id: string;
  definitionId: string;
  providerId: string;
  providerType: ComponentType;
  consumerId: string;
  consumerType: ComponentType;
  dataType: DependencyDataType;
  isActive: boolean;
  isReady: boolean;
  currentData?: any;
  lastUpdated?: number;
  error?: string;
  config: DependencyConfig;
  createdAt: number;
}

// Interface for dependency data request
export interface DependencyDataRequest {
  requestId: string;
  dependencyId: string;
  providerId: string;
  consumerId: string;
  params?: any;
  timestamp: number;
}

// Interface for dependency data response
export interface DependencyDataResponse {
  requestId: string;
  dependencyId: string;
  providerId: string;
  consumerId: string;
  data: any;
  success: boolean;
  error?: string;
  timestamp: number;
}