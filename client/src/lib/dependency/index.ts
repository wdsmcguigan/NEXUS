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
  DependencyRegistry,
  DependencyRegistryEvent
} from './DependencyRegistry';

// Export the registry instance
import { dependencyRegistry } from './DependencyRegistry';
export { dependencyRegistry };

// Export manager
export {
  DependencyManager,
  DependencyManagerEvent
} from './DependencyManager';

// Export the manager instance
import { dependencyManager } from './DependencyManager';
export { dependencyManager };

// Default export with all main components
export default {
  registry: dependencyRegistry,
  manager: dependencyManager
};