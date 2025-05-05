import { DependencyRegistry } from './DependencyRegistry';
import { 
  DependencyDataTypes, 
  DependencyStatus, 
  DependencyDefinition 
} from './DependencyInterfaces';

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Registers sample dependencies to show dependency indicators in various UI components
 * These are used for demonstration purposes only and should be replaced with real dependencies in production
 */
export function registerSampleDependencies(registry: DependencyRegistry) {
  // Register sample dependency definitions
  
  // Email listing provides email data
  registry.registerDefinition({
    id: generateId(),
    componentId: 'EmailList',
    dataType: DependencyDataTypes.EMAIL_DATA,
    role: 'provider',
    priority: 0,
    description: 'Provides email data to consumers',
  });
  
  // Email viewer consumes email data
  registry.registerDefinition({
    id: generateId(),
    componentId: 'EmailViewer',
    dataType: DependencyDataTypes.EMAIL_DATA,
    role: 'consumer',
    priority: 0,
    description: 'Consumes email data for display',
  });
  
  // Advanced search consumes and provides search data
  registry.registerDefinition({
    id: generateId(),
    componentId: 'AdvancedSearch',
    dataType: DependencyDataTypes.SEARCH_DATA,
    role: 'both',
    priority: 0,
    description: 'Provides search functionality and consumes search results',
  });
  
  // Create some dependencies between components
  
  // Email viewer depends on email list for email data
  const providerDef1 = registry.getDefinitionsByComponent('EmailList')
    .find(def => def.dataType === DependencyDataTypes.EMAIL_DATA);
  const consumerDef1 = registry.getDefinitionsByComponent('EmailViewer')
    .find(def => def.dataType === DependencyDataTypes.EMAIL_DATA);
    
  if (providerDef1 && consumerDef1) {
    const dep1 = registry.createDependency('EmailList', 'EmailViewer', DependencyDataTypes.EMAIL_DATA);
    if (dep1) {
      registry.updateDependencyStatus(dep1.id, DependencyStatus.CONNECTED);
    }
  }
  
  // Advanced search depends on email list for data
  const consumerDef2 = registry.getDefinitionsByComponent('AdvancedSearch')
    .find(def => def.dataType === DependencyDataTypes.EMAIL_DATA);
    
  if (providerDef1 && consumerDef2) {
    const dep2 = registry.createDependency('EmailList', 'AdvancedSearch', DependencyDataTypes.EMAIL_DATA);
    if (dep2) {
      registry.updateDependencyStatus(dep2.id, DependencyStatus.CONNECTING);
    }
  }
  
  // Create a sample dependency chain: EmailComposer -> EmailTemplate -> TagManager
  
  // Email composer provides email composition data
  registry.registerDefinition({
    id: generateId(),
    componentId: 'EmailComposer',
    dataType: DependencyDataTypes.COMPOSITION_DATA,
    role: 'provider',
    priority: 0,
    description: 'Provides email composition data',
  });
  
  // Email template both consumes and provides
  registry.registerDefinition({
    id: generateId(),
    componentId: 'EmailTemplate',
    dataType: DependencyDataTypes.COMPOSITION_DATA,
    role: 'both',
    priority: 0,
    description: 'Consumes and provides email template data',
  });
  
  // Tag manager consumes tag data
  registry.registerDefinition({
    id: generateId(),
    componentId: 'TagManager',
    dataType: DependencyDataTypes.TAG_DATA,
    role: 'consumer',
    priority: 0,
    description: 'Consumes tag data for display',
  });
  
  // Email template provides tag data
  registry.registerDefinition({
    id: generateId(),
    componentId: 'EmailTemplate',
    dataType: DependencyDataTypes.TAG_DATA,
    role: 'provider',
    priority: 0,
    description: 'Provides tag data from templates',
  });
  
  // Set up the chain
  const composerDef = registry.getDefinitionsByComponent('EmailComposer')
    .find(def => def.dataType === DependencyDataTypes.COMPOSITION_DATA);
  const templateCompDef = registry.getDefinitionsByComponent('EmailTemplate')
    .find(def => def.dataType === DependencyDataTypes.COMPOSITION_DATA);
  const templateTagDef = registry.getDefinitionsByComponent('EmailTemplate')
    .find(def => def.dataType === DependencyDataTypes.TAG_DATA);
  const tagManagerDef = registry.getDefinitionsByComponent('TagManager')
    .find(def => def.dataType === DependencyDataTypes.TAG_DATA);
    
  // Set up composer -> template dependency
  if (composerDef && templateCompDef) {
    const dep = registry.createDependency('EmailComposer', 'EmailTemplate', DependencyDataTypes.COMPOSITION_DATA);
    if (dep) {
      registry.updateDependencyStatus(dep.id, DependencyStatus.CONNECTED);
    }
  }
  
  // Set up template -> tag manager dependency with error
  if (templateTagDef && tagManagerDef) {
    const dep = registry.createDependency('EmailTemplate', 'TagManager', DependencyDataTypes.TAG_DATA);
    if (dep) {
      registry.updateDependencyStatus(dep.id, DependencyStatus.DISCONNECTED);
    }
  }
  
  // Create a sample error dependency
  registry.registerDefinition({
    id: generateId(),
    componentId: 'AttachmentManager',
    dataType: DependencyDataTypes.ATTACHMENT_DATA,
    role: 'provider',
    priority: 0,
    description: 'Provides attachment data',
  });
  
  registry.registerDefinition({
    id: generateId(),
    componentId: 'EmailViewer',
    dataType: DependencyDataTypes.ATTACHMENT_DATA,
    role: 'consumer',
    priority: 0,
    description: 'Consumes attachment data for display',
  });
  
  // Set up an error dependency
  const attachmentDef = registry.getDefinitionsByComponent('AttachmentManager')
    .find(def => def.dataType === DependencyDataTypes.ATTACHMENT_DATA);
  const viewerAttachDef = registry.getDefinitionsByComponent('EmailViewer')
    .find(def => def.dataType === DependencyDataTypes.ATTACHMENT_DATA);
    
  if (attachmentDef && viewerAttachDef) {
    const dep = registry.createDependency('AttachmentManager', 'EmailViewer', DependencyDataTypes.ATTACHMENT_DATA);
    if (dep) {
      registry.updateDependencyStatus(dep.id, DependencyStatus.ERROR);
    }
  }
}