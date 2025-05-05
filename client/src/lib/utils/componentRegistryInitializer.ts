import { registerComponents } from '../componentRegistry.setup';
import { registerEnhancedComponents } from '../enhancedComponentRegistry.setup';
import { enhancedComponentRegistry } from '../enhancedComponentRegistry';
import { componentRegistry } from '../componentRegistry';

/**
 * Initialize the component registry system
 * - By default uses the original component registry for backward compatibility
 * - Can optionally use the enhanced registry instead
 */
export function initializeComponentRegistry(useEnhanced: boolean = false) {
  // Register the components using the appropriate registry
  if (useEnhanced) {
    console.log('Initializing enhanced component registry...');
    return registerEnhancedComponents();
  } else {
    console.log('Initializing standard component registry...');
    return registerComponents();
  }
}

/**
 * Get the active component registry
 */
export function getActiveRegistry() {
  // For now, we'll return the original registry for backward compatibility
  // This can be changed when we're ready to fully switch to the enhanced registry
  return componentRegistry;
}

/**
 * Convert between registry types (for migration purposes)
 */
export function migrateToEnhancedRegistry() {
  const standardComponents = componentRegistry.getAllComponents();
  
  // Convert and register each standard component to the enhanced registry
  standardComponents.forEach(comp => {
    // Only migrate if the component doesn't already exist in the enhanced registry
    if (!enhancedComponentRegistry.hasComponent(comp.id)) {
      enhancedComponentRegistry.register({
        id: comp.id,
        displayName: comp.displayName,
        description: `Migrated from standard registry: ${comp.displayName}`,
        category: comp.category as any,
        icon: comp.icon,
        component: comp.component,
        supportedPanelTypes: comp.supportedPanelTypes,
        singleton: comp.singleton
      });
    }
  });
  
  console.log(`Migrated ${standardComponents.length} components to enhanced registry`);
  return enhancedComponentRegistry;
}

export default initializeComponentRegistry;