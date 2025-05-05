import { v4 as uuidv4 } from 'uuid';
import {
  DependencyDefinition,
  DependencyInstance,
  DependencyOptions,
  DependencyStatus,
  DependencyDataType,
  DependencySyncStrategy
} from './DependencyInterfaces';

/**
 * Registry for component dependency definitions and instances
 * Manages the relationships between component providers and consumers
 */
export class DependencyRegistry {
  private definitions: Map<string, DependencyDefinition> = new Map();
  private dependencies: Map<string, DependencyInstance> = new Map();
  private providerMap: Map<string, string[]> = new Map(); // dataType -> providerIds
  private consumerMap: Map<string, string[]> = new Map(); // dataType -> consumerIds
  private providerConsumers: Map<string, string[]> = new Map(); // providerId -> consumerIds
  private consumerProviders: Map<string, string[]> = new Map(); // consumerId -> providerIds
  private dataStore: Map<string, any> = new Map(); // providerId:dataType -> data

  constructor() {
    console.log('DependencyRegistry initialized');
  }

  /**
   * Register a new dependency definition
   */
  defineComponentDependency(def: Omit<DependencyDefinition, 'id' | 'createdAt'> & { id?: string, createdAt?: number }): DependencyDefinition {
    const id = def.id || `dep_${uuidv4()}`;
    const createdAt = def.createdAt || Date.now();
    
    const definition: DependencyDefinition = {
      ...def as any,
      id,
      createdAt
    };
    
    this.definitions.set(id, definition);
    return definition;
  }

  /**
   * Get a dependency definition by ID
   */
  getDependencyDefinition(id: string): DependencyDefinition | undefined {
    return this.definitions.get(id);
  }

  /**
   * Get all dependency definitions
   */
  getAllDependencyDefinitions(): DependencyDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Get dependency definitions by provider type
   */
  getDependencyDefinitionsByProvider(providerType: string): DependencyDefinition[] {
    return this.getAllDependencyDefinitions().filter(
      def => def.providerType === providerType || def.providerType === '*'
    );
  }

  /**
   * Get dependency definitions by consumer type
   */
  getDependencyDefinitionsByConsumer(consumerType: string): DependencyDefinition[] {
    return this.getAllDependencyDefinitions().filter(
      def => def.consumerType === consumerType || def.consumerType === '*'
    );
  }

  /**
   * Get dependency definitions for a data type
   */
  getDependencyDefinitionsByDataType(dataType: DependencyDataType): DependencyDefinition[] {
    return this.getAllDependencyDefinitions().filter(
      def => def.dataType === dataType
    );
  }

  /**
   * Find matching dependency definitions between provider and consumer
   */
  findCompatibleDependencies(
    providerType: string,
    consumerType: string
  ): DependencyDefinition[] {
    return this.getAllDependencyDefinitions().filter(
      def =>
        (def.providerType === providerType || def.providerType === '*') &&
        (def.consumerType === consumerType || def.consumerType === '*')
    );
  }

  /**
   * Create a new dependency instance between provider and consumer
   */
  createDependency(
    providerId: string,
    consumerId: string,
    dataType: DependencyDataType,
    options?: Partial<DependencyOptions>
  ): DependencyInstance | null {
    // Find a compatible dependency definition
    const compatibleDefinitions = this.getAllDependencyDefinitions().filter(
      def => def.dataType === dataType
    );

    if (compatibleDefinitions.length === 0) {
      console.error(`No dependency definition found for data type: ${dataType}`);
      return null;
    }

    // Use the first compatible definition (in a more complete implementation,
    // we might want to add priority or specificity to definitions)
    const definition = compatibleDefinitions[0];

    // Create a unique ID for this dependency instance
    const id = `dep_inst_${uuidv4()}`;

    // Default options
    const defaultOptions: DependencyOptions = {
      isActive: true,
      autoUpdate: true,
      notifyOnChange: true,
      options: {}
    };

    // Create a new dependency instance
    const dependency: DependencyInstance = {
      id,
      definitionId: definition.id,
      providerId,
      consumerId,
      dataType,
      syncStrategy: definition.syncStrategy,
      status: DependencyStatus.INACTIVE,
      options: {
        ...defaultOptions,
        ...options
      }
    };

    // Register the dependency
    this.dependencies.set(id, dependency);

    // Update the provider and consumer maps
    this.addProviderForDataType(dataType, providerId);
    this.addConsumerForDataType(dataType, consumerId);

    // Update the relationship maps
    this.addConsumerForProvider(providerId, consumerId);
    this.addProviderForConsumer(consumerId, providerId);

    return dependency;
  }

  /**
   * Get a dependency instance by ID
   */
  getDependency(id: string): DependencyInstance | undefined {
    return this.dependencies.get(id);
  }

  /**
   * Get all dependency instances
   */
  getAllDependencies(): DependencyInstance[] {
    return Array.from(this.dependencies.values());
  }

  /**
   * Get dependencies involving a specific provider
   */
  getDependenciesByProvider(providerId: string): DependencyInstance[] {
    return this.getAllDependencies().filter(
      dep => dep.providerId === providerId
    );
  }

  /**
   * Get dependencies involving a specific consumer
   */
  getDependenciesByConsumer(consumerId: string): DependencyInstance[] {
    return this.getAllDependencies().filter(
      dep => dep.consumerId === consumerId
    );
  }

  /**
   * Get dependencies for a specific data type
   */
  getDependenciesByDataType(dataType: DependencyDataType): DependencyInstance[] {
    return this.getAllDependencies().filter(
      dep => dep.dataType === dataType
    );
  }

  /**
   * Find a dependency between a provider and consumer for a data type
   */
  findDependency(
    providerId: string,
    consumerId: string,
    dataType: DependencyDataType
  ): DependencyInstance | undefined {
    return this.getAllDependencies().find(
      dep =>
        dep.providerId === providerId &&
        dep.consumerId === consumerId &&
        dep.dataType === dataType
    );
  }

  /**
   * Update dependency data
   */
  updateDependencyData<T>(
    providerId: string,
    dataType: DependencyDataType,
    data: T
  ): void {
    const key = `${providerId}:${dataType}`;
    this.dataStore.set(key, data);

    // Update all related dependencies
    const dependencies = this.getDependenciesByProvider(providerId).filter(
      dep => dep.dataType === dataType
    );

    for (const dependency of dependencies) {
      // Update dependency data
      dependency.currentData = data;
      dependency.lastUpdated = Date.now();
      dependency.status = DependencyStatus.ACTIVE;

      this.dependencies.set(dependency.id, dependency);
    }
  }

  /**
   * Get data for a specific provider and data type
   */
  getProviderData<T>(
    providerId: string,
    dataType: DependencyDataType
  ): T | null {
    const key = `${providerId}:${dataType}`;
    return this.dataStore.get(key) || null;
  }

  /**
   * Get all providers for a specific data type
   */
  getProvidersForDataType(dataType: DependencyDataType): string[] {
    return this.providerMap.get(dataType) || [];
  }

  /**
   * Get all consumers for a specific data type
   */
  getConsumersForDataType(dataType: DependencyDataType): string[] {
    return this.consumerMap.get(dataType) || [];
  }

  /**
   * Get all consumers for a specific provider
   */
  getConsumersForProvider(providerId: string): string[] {
    return this.providerConsumers.get(providerId) || [];
  }

  /**
   * Get all providers for a specific consumer
   */
  getProvidersForConsumer(consumerId: string): string[] {
    return this.consumerProviders.get(consumerId) || [];
  }

  /**
   * Add a provider for a data type
   */
  private addProviderForDataType(
    dataType: DependencyDataType,
    providerId: string
  ): void {
    const providers = this.providerMap.get(dataType) || [];
    if (!providers.includes(providerId)) {
      providers.push(providerId);
      this.providerMap.set(dataType, providers);
    }
  }

  /**
   * Add a consumer for a data type
   */
  private addConsumerForDataType(
    dataType: DependencyDataType,
    consumerId: string
  ): void {
    const consumers = this.consumerMap.get(dataType) || [];
    if (!consumers.includes(consumerId)) {
      consumers.push(consumerId);
      this.consumerMap.set(dataType, consumers);
    }
  }

  /**
   * Add a consumer for a provider
   */
  private addConsumerForProvider(
    providerId: string,
    consumerId: string
  ): void {
    const consumers = this.providerConsumers.get(providerId) || [];
    if (!consumers.includes(consumerId)) {
      consumers.push(consumerId);
      this.providerConsumers.set(providerId, consumers);
    }
  }

  /**
   * Add a provider for a consumer
   */
  private addProviderForConsumer(
    consumerId: string,
    providerId: string
  ): void {
    const providers = this.consumerProviders.get(consumerId) || [];
    if (!providers.includes(providerId)) {
      providers.push(providerId);
      this.consumerProviders.set(consumerId, providers);
    }
  }

  /**
   * Remove a dependency instance
   */
  removeDependency(id: string): boolean {
    const dependency = this.dependencies.get(id);
    if (!dependency) {
      return false;
    }

    const { providerId, consumerId, dataType } = dependency;

    // Remove from relationship maps
    this.removeConsumerForProvider(providerId, consumerId);
    this.removeProviderForConsumer(consumerId, providerId);

    // Remove the dependency
    this.dependencies.delete(id);

    return true;
  }

  /**
   * Remove a consumer for a provider
   */
  private removeConsumerForProvider(
    providerId: string,
    consumerId: string
  ): void {
    const consumers = this.providerConsumers.get(providerId) || [];
    const index = consumers.indexOf(consumerId);
    if (index !== -1) {
      consumers.splice(index, 1);
      if (consumers.length === 0) {
        this.providerConsumers.delete(providerId);
      } else {
        this.providerConsumers.set(providerId, consumers);
      }
    }
  }

  /**
   * Remove a provider for a consumer
   */
  private removeProviderForConsumer(
    consumerId: string,
    providerId: string
  ): void {
    const providers = this.consumerProviders.get(consumerId) || [];
    const index = providers.indexOf(providerId);
    if (index !== -1) {
      providers.splice(index, 1);
      if (providers.length === 0) {
        this.consumerProviders.delete(consumerId);
      } else {
        this.consumerProviders.set(consumerId, providers);
      }
    }
  }
}

// Create and export a singleton instance
export const dependencyRegistry = new DependencyRegistry();