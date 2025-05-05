/**
 * Main export file for the Component Dependency System
 * 
 * This file exports all the components, classes, and interfaces related to
 * the Component Dependency System for easy importing.
 */

// Export interfaces
export {
  DependencyDataType,
  DependencySyncStrategy,
  DependencyStatus
} from './DependencyInterfaces';

export type {
  DependencyDefinition,
  DependencyConfig,
  DependencyConfigOption,
  DependencyInstance,
  DependencyDataUpdateEvent,
  DependencyDataRequest
} from './DependencyInterfaces';

// Export registry
export {
  dependencyRegistry,
  DependencyRegistryEvent
} from './DependencyRegistry';

export type {
  DependencyRegistry
} from './DependencyRegistry';

// Export manager
export {
  dependencyManager,
  DependencyManagerEvent
} from './DependencyManager';

export type {
  DependencyManager
} from './DependencyManager';

// Default export with all main components
export default {
  registry: dependencyRegistry,
  manager: dependencyManager
};