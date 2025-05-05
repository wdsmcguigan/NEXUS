/**
 * Dependency Registry
 * 
 * This file provides a registry for dependency definitions.
 * It allows components to register and discover dependencies.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  DependencyDefinition,
  DependencySyncStrategy
} from './DependencyInterfaces';
import { ComponentType } from '../communication/ComponentCommunication';

/**
 * The DependencyRegistry manages dependency definitions
 * and provides methods for registering and retrieving them.
 */
class DependencyRegistry {
  private dependencies: Map<string, DependencyDefinition> = new Map();
  private providerMap: Map<ComponentType, Set<string>> = new Map();
  private consumerMap: Map<ComponentType, Set<string>> = new Map();

  /**
   * Register a new dependency definition
   * @param dependency The dependency definition to register
   * @returns The ID of the registered dependency
   */
  registerDependency(dependency: Omit<DependencyDefinition, 'id'>): string {
    const id = uuidv4();
    const newDependency: DependencyDefinition = {
      ...dependency,
      id
    };

    this.dependencies.set(id, newDependency);
    
    // Update provider and consumer maps
    this.addToComponentMap(this.providerMap, newDependency.providerType, id);
    this.addToComponentMap(this.consumerMap, newDependency.consumerType, id);
    
    return id;
  }

  /**
   * Add a dependency ID to a component map
   * @param map The map to update
   * @param componentType The component type
   * @param dependencyId The dependency ID
   */
  private addToComponentMap(
    map: Map<ComponentType, Set<string>>, 
    componentType: ComponentType, 
    dependencyId: string
  ): void {
    if (!map.has(componentType)) {
      map.set(componentType, new Set());
    }
    
    map.get(componentType)?.add(dependencyId);
  }

  /**
   * Get a dependency definition by ID
   * @param id The dependency ID
   * @returns The dependency definition or undefined if not found
   */
  getDependency(id: string): DependencyDefinition | undefined {
    return this.dependencies.get(id);
  }

  /**
   * Get all dependency definitions
   * @returns Array of all dependency definitions
   */
  getAllDependencies(): DependencyDefinition[] {
    return Array.from(this.dependencies.values());
  }

  /**
   * Get all dependency definitions for a provider component type
   * @param providerType The provider component type
   * @returns Array of dependency definitions
   */
  getDependenciesForProvider(providerType: ComponentType): DependencyDefinition[] {
    const dependencyIds = this.providerMap.get(providerType) || new Set();
    return Array.from(dependencyIds)
      .map(id => this.dependencies.get(id))
      .filter(Boolean) as DependencyDefinition[];
  }

  /**
   * Get all dependency definitions for a consumer component type
   * @param consumerType The consumer component type
   * @returns Array of dependency definitions
   */
  getDependenciesForConsumer(consumerType: ComponentType): DependencyDefinition[] {
    const dependencyIds = this.consumerMap.get(consumerType) || new Set();
    return Array.from(dependencyIds)
      .map(id => this.dependencies.get(id))
      .filter(Boolean) as DependencyDefinition[];
  }

  /**
   * Check if a provider component type can provide data to a consumer component type
   * @param providerType The provider component type
   * @param consumerType The consumer component type
   * @returns True if a dependency exists between the component types
   */
  canProvideFor(providerType: ComponentType, consumerType: ComponentType): boolean {
    return this.findPossibleDependencies(providerType, consumerType).length > 0;
  }

  /**
   * Find all possible dependencies between two component types
   * @param providerType The provider component type
   * @param consumerType The consumer component type
   * @returns Array of dependency definitions
   */
  findPossibleDependencies(
    providerType: ComponentType, 
    consumerType: ComponentType
  ): DependencyDefinition[] {
    return this.getAllDependencies().filter(dep => 
      dep.providerType === providerType && 
      dep.consumerType === consumerType
    );
  }

  /**
   * Remove a dependency definition
   * @param id The dependency ID
   * @returns True if the dependency was removed
   */
  removeDependency(id: string): boolean {
    const dependency = this.dependencies.get(id);
    
    if (!dependency) {
      return false;
    }
    
    // Remove from provider and consumer maps
    this.removeFromComponentMap(this.providerMap, dependency.providerType, id);
    this.removeFromComponentMap(this.consumerMap, dependency.consumerType, id);
    
    // Remove from dependencies map
    return this.dependencies.delete(id);
  }

  /**
   * Remove a dependency ID from a component map
   * @param map The map to update
   * @param componentType The component type
   * @param dependencyId The dependency ID
   */
  private removeFromComponentMap(
    map: Map<ComponentType, Set<string>>, 
    componentType: ComponentType, 
    dependencyId: string
  ): void {
    const dependencyIds = map.get(componentType);
    
    if (dependencyIds) {
      dependencyIds.delete(dependencyId);
      
      if (dependencyIds.size === 0) {
        map.delete(componentType);
      }
    }
  }
}

// Create singleton instance
export const dependencyRegistry = new DependencyRegistry();