/**
 * Dependency System Index
 * 
 * This file exports the complete dependency system to make
 * imports cleaner for consumers.
 */

// Export interfaces and types
export {
  DependencyDataType,
  DependencyDataTypes,
  DependencySyncStrategy,
  DependencyStatus,
  type DependencyDefinition,
  type DependencyConfig,
  type DependencyInstance,
  type DependencyDataRequest,
  type DependencyDataResponse
} from './DependencyInterfaces';

// Export registry and manager
export { dependencyRegistry } from './DependencyRegistry';
export { dependencyManager } from './DependencyManager';

// Re-export the context as part of the dependency system
export {
  DependencyContext,
  DependencyProvider,
  useDependencyContext
} from '../../context/DependencyContext';

// Re-export the hooks as part of the dependency system
export {
  useProvideDependency,
  useConsumeDependency,
  useFindProviders,
  useFindConsumers,
  useComponentDependencies,
  useCanProvideFor,
  usePossibleDependencies,
  useEmailSelectionDependency
} from '../../hooks/useDependencyHooks';