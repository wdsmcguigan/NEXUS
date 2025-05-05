// Export interfaces
export * from './DependencyInterfaces';

// Export classes
export { DependencyManager } from './DependencyManager';
export { DependencyRegistry, dependencyRegistry } from './DependencyRegistry';

// Export context and hooks
export { DependencyProvider, useDependencyContext } from '../../context/DependencyContext';
export * from '../../hooks/useDependencyHooks';

// Export example components
export { default as EmailDependencyExample } from '../../examples/dependency/EmailDependencyExample';