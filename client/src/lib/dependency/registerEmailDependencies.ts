import { nanoid } from 'nanoid';
import { DependencyRegistry } from './DependencyRegistry';
import { 
  DependencyDataTypes, 
  DependencyDefinition, 
  DependencyStatus,
  DependencySyncStrategy 
} from './DependencyInterfaces';

/**
 * Register email component dependencies
 * This will make the EmailList and EmailViewer components work with the dependency system
 */
export function registerEmailDependencies(registry: DependencyRegistry) {
  // Use fixed IDs for more consistent dependency connection
  // Register Email List component as provider for email data
  const emailListProvider: DependencyDefinition = {
    id: `email-list-provider-fixed`,
    componentId: 'email-list',
    dataType: DependencyDataTypes.EMAIL_DATA,
    role: 'provider',
    description: 'Provides selected email data to viewers',
    required: false,
    syncStrategy: DependencySyncStrategy.BOTH,
    priority: 1
  };
  
  // Register Email Viewer component as consumer for email data
  const emailViewerConsumer: DependencyDefinition = {
    id: `email-viewer-consumer-fixed`,
    componentId: 'email-viewer',
    dataType: DependencyDataTypes.EMAIL_DATA,
    role: 'consumer',
    description: 'Displays email content from selected email',
    required: true,
    syncStrategy: DependencySyncStrategy.BOTH,
    priority: 1
  };
  
  // Register the definitions
  registry.registerDefinition(emailListProvider);
  registry.registerDefinition(emailViewerConsumer);
  
  // Create dependency between email list and email viewer
  const dependency = registry.createDependency('email-list', 'email-viewer', DependencyDataTypes.EMAIL_DATA);
  
  // Set initial status
  if (dependency) {
    registry.updateDependencyStatus(dependency.id, DependencyStatus.CONNECTED);
    console.log('Email dependency created and connected with ID:', dependency.id);
  } else {
    console.error('Failed to create email dependency!');
  }
  
  console.log('Email dependencies registered successfully');
  
  return {
    emailListProvider,
    emailViewerConsumer,
    dependency
  };
}