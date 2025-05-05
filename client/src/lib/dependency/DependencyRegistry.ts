import { 
  DependencyDefinition, 
  DependencyRegistry as IDependencyRegistry,
  Dependency,
  DependencyDataTypes,
  DependencyStatus,
  DependencyChain,
  DependencyLogEntry,
  DependencyLogLevel,
  DependencySuggestion,
  PerformanceImpact
} from './DependencyInterfaces';
import { nanoid } from 'nanoid';

/**
 * Implementation of the DependencyRegistry interface.
 * Manages dependency definitions and relationships between components.
 */
export class DependencyRegistry implements IDependencyRegistry {
  private definitions: Map<string, DependencyDefinition> = new Map();
  private dependencies: Map<string, Dependency> = new Map();
  private chains: Map<string, DependencyChain> = new Map();
  private logs: DependencyLogEntry[] = [];
  private suggestions: Map<string, DependencySuggestion> = new Map();
  private usagePatterns: Map<string, Map<string, number>> = new Map();
  private updateTimestamps: Map<string, number> = new Map();
  
  // Store lookups for quick access
  private definitionsByComponent: Map<string, Set<string>> = new Map();
  private definitionsByType: Map<DependencyDataTypes, Set<string>> = new Map();
  private dependenciesByProvider: Map<string, Set<string>> = new Map();
  private dependenciesByConsumer: Map<string, Set<string>> = new Map();
  private dependenciesByType: Map<DependencyDataTypes, Set<string>> = new Map();
  private chainsByType: Map<DependencyDataTypes, Set<string>> = new Map();
  
  constructor() {
    console.log('DependencyRegistry initialized');
    this.logEvent(
      DependencyLogLevel.INFO,
      'DependencyRegistry initialized'
    );
  }
  
  /**
   * Register a dependency definition for a component.
   */
  registerDefinition(definition: DependencyDefinition): void {
    // Ensure the definition has an ID
    if (!definition.id) {
      definition.id = `def-${nanoid(8)}`;
    }
    
    // Register the definition
    this.definitions.set(definition.id, definition);
    
    // Update lookup indexes
    this.addToSetMap(this.definitionsByComponent, definition.componentId, definition.id);
    this.addToSetMap(this.definitionsByType, definition.dataType, definition.id);
  }
  
  /**
   * Remove a dependency definition.
   */
  removeDefinition(definitionId: string): void {
    const definition = this.definitions.get(definitionId);
    
    if (definition) {
      // Remove from indexes
      this.removeFromSetMap(this.definitionsByComponent, definition.componentId, definitionId);
      this.removeFromSetMap(this.definitionsByType, definition.dataType, definitionId);
      
      // Remove related dependencies
      const dependenciesToRemove: string[] = [];
      
      for (const [id, dependency] of this.dependencies.entries()) {
        if (
          dependency.providerDefinitionId === definitionId || 
          dependency.consumerDefinitionId === definitionId
        ) {
          dependenciesToRemove.push(id);
        }
      }
      
      dependenciesToRemove.forEach(id => this.removeDependency(id));
      
      // Remove the definition
      this.definitions.delete(definitionId);
    }
  }
  
  /**
   * Get a dependency definition by ID.
   */
  getDefinition(definitionId: string): DependencyDefinition | undefined {
    return this.definitions.get(definitionId);
  }
  
  /**
   * Get all dependency definitions for a component.
   */
  getDefinitionsByComponent(componentId: string): DependencyDefinition[] {
    const definitionIds = this.definitionsByComponent.get(componentId) || new Set();
    return Array.from(definitionIds).map(id => this.definitions.get(id)!).filter(Boolean);
  }
  
  /**
   * Get all dependency definitions for a data type.
   */
  getDefinitionsByType(dataType: DependencyDataTypes): DependencyDefinition[] {
    const definitionIds = this.definitionsByType.get(dataType) || new Set();
    return Array.from(definitionIds).map(id => this.definitions.get(id)!).filter(Boolean);
  }
  
  /**
   * Get all provider definitions for a data type.
   */
  getProviderDefinitions(dataType: DependencyDataTypes): DependencyDefinition[] {
    return this.getDefinitionsByType(dataType).filter(
      def => def.role === 'provider' || def.role === 'both'
    );
  }
  
  /**
   * Get all consumer definitions for a data type.
   */
  getConsumerDefinitions(dataType: DependencyDataTypes): DependencyDefinition[] {
    return this.getDefinitionsByType(dataType).filter(
      def => def.role === 'consumer' || def.role === 'both'
    );
  }
  
  /**
   * Create a dependency between a provider and consumer.
   */
  createDependency(
    providerId: string, 
    consumerId: string, 
    dataType: DependencyDataTypes
  ): Dependency | undefined {
    const startTime = performance.now();
    
    // Find provider definition
    const providerDefs = this.getDefinitionsByComponent(providerId).filter(
      def => (def.role === 'provider' || def.role === 'both') && def.dataType === dataType
    );
    
    // Find consumer definition
    const consumerDefs = this.getDefinitionsByComponent(consumerId).filter(
      def => (def.role === 'consumer' || def.role === 'both') && def.dataType === dataType
    );
    
    if (providerDefs.length === 0 || consumerDefs.length === 0) {
      this.logEvent(
        DependencyLogLevel.WARN,
        `Cannot create dependency: no matching definitions for ${dataType} between ${providerId} and ${consumerId}`
      );
      return undefined;
    }
    
    // Use the first matching definition for each
    const providerDef = providerDefs[0];
    const consumerDef = consumerDefs[0];
    
    // Check if a dependency already exists
    for (const dependency of this.dependencies.values()) {
      if (
        dependency.providerId === providerId &&
        dependency.consumerId === consumerId &&
        dependency.dataType === dataType
      ) {
        return dependency;
      }
    }
    
    // Check for circular dependencies
    if (this.wouldCreateCycle(providerId, consumerId)) {
      this.logEvent(
        DependencyLogLevel.WARN,
        `Circular dependency detected between ${providerId} and ${consumerId}`,
        undefined,
        undefined,
        undefined,
        {
          duration: performance.now() - startTime,
          impact: PerformanceImpact.HIGH
        }
      );
      
      // Create dependency but mark it as having a cycle
      const dependency: Dependency = {
        id: `dep-${nanoid(8)}`,
        providerId,
        consumerId,
        providerDefinitionId: providerDef.id,
        consumerDefinitionId: consumerDef.id,
        dataType,
        status: DependencyStatus.CYCLE_DETECTED,
        lastUpdated: Date.now(),
        performance: {
          updateCount: 0,
          avgUpdateTime: 0,
          lastUpdateTime: 0,
          heaviestUpdate: 0
        }
      };
      
      // Store the dependency
      this.dependencies.set(dependency.id, dependency);
      
      // Update lookups
      this.addToSetMap(this.dependenciesByProvider, providerId, dependency.id);
      this.addToSetMap(this.dependenciesByConsumer, consumerId, dependency.id);
      this.addToSetMap(this.dependenciesByType, dataType, dependency.id);
      
      return dependency;
    }
    
    // Create the dependency
    const dependency: Dependency = {
      id: `dep-${nanoid(8)}`,
      providerId,
      consumerId,
      providerDefinitionId: providerDef.id,
      consumerDefinitionId: consumerDef.id,
      dataType,
      status: DependencyStatus.CONNECTED,
      lastUpdated: Date.now(),
      performance: {
        updateCount: 0,
        avgUpdateTime: 0,
        lastUpdateTime: 0,
        heaviestUpdate: 0
      }
    };
    
    // Store the dependency
    this.dependencies.set(dependency.id, dependency);
    
    // Update lookups
    this.addToSetMap(this.dependenciesByProvider, providerId, dependency.id);
    this.addToSetMap(this.dependenciesByConsumer, consumerId, dependency.id);
    this.addToSetMap(this.dependenciesByType, dataType, dependency.id);
    
    // Record usage pattern for suggestions
    this.recordUsagePattern(providerId, consumerId);
    
    // Update or create chains
    this.updateChains(dependency);
    
    this.logEvent(
      DependencyLogLevel.INFO,
      `Created dependency: ${dependency.id} from ${providerId} to ${consumerId} for ${dataType}`,
      undefined,
      dependency.id,
      undefined,
      {
        duration: performance.now() - startTime,
        impact: PerformanceImpact.LOW
      }
    );
    
    return dependency;
  }
  
  /**
   * Remove a dependency.
   */
  removeDependency(dependencyId: string): void {
    const dependency = this.dependencies.get(dependencyId);
    
    if (!dependency) {
      return;
    }
    
    const startTime = performance.now();
    
    // Check if this is part of a chain
    if (dependency.chainId) {
      this.updateChainRemoval(dependency);
    }
    
    // Remove from lookup indexes
    this.removeFromSetMap(this.dependenciesByProvider, dependency.providerId, dependencyId);
    this.removeFromSetMap(this.dependenciesByConsumer, dependency.consumerId, dependencyId);
    this.removeFromSetMap(this.dependenciesByType, dependency.dataType, dependencyId);
    
    // Remove the dependency
    this.dependencies.delete(dependencyId);
    
    this.logEvent(
      DependencyLogLevel.INFO,
      `Removed dependency: ${dependencyId} between ${dependency.providerId} and ${dependency.consumerId}`,
      undefined,
      dependencyId,
      dependency.chainId,
      {
        duration: performance.now() - startTime,
        impact: PerformanceImpact.LOW
      }
    );
  }
  
  /**
   * Get a dependency by ID.
   */
  getDependency(dependencyId: string): Dependency | undefined {
    return this.dependencies.get(dependencyId);
  }
  
  /**
   * Get all dependencies for a provider.
   */
  getDependenciesByProvider(providerId: string): Dependency[] {
    const dependencyIds = this.dependenciesByProvider.get(providerId) || new Set();
    return Array.from(dependencyIds).map(id => this.dependencies.get(id)!).filter(Boolean);
  }
  
  /**
   * Get all dependencies for a consumer.
   */
  getDependenciesByConsumer(consumerId: string): Dependency[] {
    const dependencyIds = this.dependenciesByConsumer.get(consumerId) || new Set();
    return Array.from(dependencyIds).map(id => this.dependencies.get(id)!).filter(Boolean);
  }
  
  /**
   * Get all dependencies for a data type.
   */
  getDependenciesByType(dataType: DependencyDataTypes): Dependency[] {
    const dependencyIds = this.dependenciesByType.get(dataType) || new Set();
    return Array.from(dependencyIds).map(id => this.dependencies.get(id)!).filter(Boolean);
  }
  
  /**
   * Update the status of a dependency.
   */
  updateDependencyStatus(dependencyId: string, status: DependencyStatus): void {
    const dependency = this.dependencies.get(dependencyId);
    
    if (!dependency) {
      return;
    }
    
    const oldStatus = dependency.status;
    dependency.status = status;
    
    // Update timestamp for any status change
    dependency.lastUpdated = Date.now();
    
    // If this is part of a chain, update the chain status
    if (dependency.chainId) {
      this.updateChainStatus(dependency.chainId);
    }
    
    this.logEvent(
      DependencyLogLevel.INFO,
      `Updated dependency status: ${dependencyId} from ${oldStatus} to ${status}`,
      undefined,
      dependencyId,
      dependency.chainId
    );
  }
  
  /**
   * Find compatible providers for a consumer definition.
   */
  findCompatibleProviders(consumerDefinitionId: string): DependencyDefinition[] {
    const consumerDef = this.definitions.get(consumerDefinitionId);
    
    if (!consumerDef) {
      return [];
    }
    
    return this.getProviderDefinitions(consumerDef.dataType);
  }
  
  /**
   * Find compatible consumers for a provider definition.
   */
  findCompatibleConsumers(providerDefinitionId: string): DependencyDefinition[] {
    const providerDef = this.definitions.get(providerDefinitionId);
    
    if (!providerDef) {
      return [];
    }
    
    return this.getConsumerDefinitions(providerDef.dataType);
  }
  
  /**
   * Helper method to add a value to a set in a map.
   */
  private addToSetMap<K, V>(map: Map<K, Set<V>>, key: K, value: V): void {
    if (!map.has(key)) {
      map.set(key, new Set());
    }
    
    map.get(key)!.add(value);
  }
  
  /**
   * Helper method to remove a value from a set in a map.
   */
  private removeFromSetMap<K, V>(map: Map<K, Set<V>>, key: K, value: V): void {
    const set = map.get(key);
    
    if (set) {
      set.delete(value);
      
      if (set.size === 0) {
        map.delete(key);
      }
    }
  }
  
  /**
   * Get a dependency chain by ID.
   */
  getChain(chainId: string): DependencyChain | undefined {
    return this.chains.get(chainId);
  }
  
  /**
   * Get all chains for a data type.
   */
  getChainsByType(dataType: DependencyDataTypes): DependencyChain[] {
    const chainIds = this.chainsByType.get(dataType) || new Set();
    return Array.from(chainIds).map(id => this.chains.get(id)!).filter(Boolean);
  }
  
  /**
   * Get all chains that include a specific component.
   */
  getChainsByComponent(componentId: string): DependencyChain[] {
    const result: DependencyChain[] = [];
    
    for (const chain of this.chains.values()) {
      // Check if any dependency in this chain involves this component
      const found = chain.dependencies.some(depId => {
        const dep = this.dependencies.get(depId);
        return dep && (dep.providerId === componentId || dep.consumerId === componentId);
      });
      
      if (found) {
        result.push(chain);
      }
    }
    
    return result;
  }
  
  /**
   * Get all logs.
   */
  getLogs(): DependencyLogEntry[] {
    return [...this.logs];
  }
  
  /**
   * Get filtered logs by various criteria.
   */
  getFilteredLogs(
    level?: DependencyLogLevel,
    componentId?: string,
    dependencyId?: string,
    chainId?: string,
    dataType?: DependencyDataTypes,
    startTime?: number,
    endTime?: number
  ): DependencyLogEntry[] {
    return this.logs.filter(log => {
      if (level !== undefined && log.level !== level) return false;
      if (componentId !== undefined && log.componentId !== componentId) return false;
      if (dependencyId !== undefined && log.dependencyId !== dependencyId) return false;
      if (chainId !== undefined && log.chainId !== chainId) return false;
      if (dataType !== undefined && log.dataType !== dataType) return false;
      if (startTime !== undefined && log.timestamp < startTime) return false;
      if (endTime !== undefined && log.timestamp > endTime) return false;
      
      return true;
    });
  }
  
  /**
   * Clear all logs.
   */
  clearLogs(): void {
    this.logs = [];
    this.logEvent(
      DependencyLogLevel.INFO,
      'Cleared all logs'
    );
  }
  
  /**
   * Get all dependency suggestions.
   */
  getSuggestions(): DependencySuggestion[] {
    return Array.from(this.suggestions.values());
  }
  
  /**
   * Record an update to a dependency for performance tracking.
   */
  recordUpdate(dependencyId: string, updateTime: number): void {
    const dependency = this.dependencies.get(dependencyId);
    
    if (!dependency) {
      return;
    }
    
    if (!dependency.performance) {
      dependency.performance = {
        updateCount: 0,
        avgUpdateTime: 0,
        lastUpdateTime: 0,
        heaviestUpdate: 0
      };
    }
    
    // Update performance metrics
    dependency.performance.updateCount++;
    dependency.performance.lastUpdateTime = updateTime;
    dependency.performance.avgUpdateTime = (
      (dependency.performance.avgUpdateTime * (dependency.performance.updateCount - 1)) + updateTime
    ) / dependency.performance.updateCount;
    
    if (updateTime > dependency.performance.heaviestUpdate) {
      dependency.performance.heaviestUpdate = updateTime;
    }
    
    // If this is part of a chain, update chain performance
    if (dependency.chainId) {
      this.updateChainPerformance(dependency.chainId);
    }
    
    // Record timestamp for debouncing
    this.updateTimestamps.set(dependencyId, Date.now());
    
    this.logEvent(
      DependencyLogLevel.PERFORMANCE,
      `Recorded update for dependency ${dependencyId}, time: ${updateTime}ms`,
      undefined,
      dependencyId,
      dependency.chainId,
      {
        duration: updateTime,
        impact: updateTime > 50 ? PerformanceImpact.HIGH : PerformanceImpact.LOW
      }
    );
  }
  
  /**
   * Check if an update should be debounced based on the dependency's configuration.
   */
  shouldDebounce(dependencyId: string): boolean {
    const dependency = this.dependencies.get(dependencyId);
    
    if (!dependency) {
      return false;
    }
    
    // Get provider definition to check debounce settings
    const providerDef = this.definitions.get(dependency.providerDefinitionId);
    
    if (!providerDef || !providerDef.debounceMs) {
      return false;
    }
    
    // Check last update timestamp
    const lastUpdate = this.updateTimestamps.get(dependencyId) || 0;
    const now = Date.now();
    
    return (now - lastUpdate) < providerDef.debounceMs;
  }
  
  /**
   * Check if creating a dependency would create a cycle.
   */
  private wouldCreateCycle(providerId: string, consumerId: string): boolean {
    // If provider and consumer are the same, it's a cycle
    if (providerId === consumerId) {
      return true;
    }
    
    // Check if this consumer is already a provider (directly or indirectly) for this provider
    return this.isIndirectProvider(consumerId, providerId, new Set<string>());
  }
  
  /**
   * Check if component A is an indirect provider for component B.
   */
  private isIndirectProvider(
    componentA: string,
    componentB: string,
    visited: Set<string>
  ): boolean {
    // Mark this component as visited to avoid infinite recursion
    visited.add(componentA);
    
    // Get all dependencies where componentA is the provider
    const dependencies = this.getDependenciesByProvider(componentA);
    
    for (const dependency of dependencies) {
      // If this dependency is directly to componentB, we found a cycle
      if (dependency.consumerId === componentB) {
        return true;
      }
      
      // If we've already visited this consumer, skip it
      if (visited.has(dependency.consumerId)) {
        continue;
      }
      
      // Recursively check if this consumer is an indirect provider to componentB
      if (this.isIndirectProvider(dependency.consumerId, componentB, visited)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Update or create chains when a new dependency is added.
   */
  private updateChains(dependency: Dependency): void {
    const startTime = performance.now();
    
    // First, check if either the provider or consumer is already part of a chain
    const providerChains = this.getChainsByComponent(dependency.providerId);
    const consumerChains = this.getChainsByComponent(dependency.consumerId);
    
    if (providerChains.length === 0 && consumerChains.length === 0) {
      // Neither component is part of a chain, create a new one
      this.createNewChain(dependency);
    } else if (providerChains.length > 0 && consumerChains.length === 0) {
      // Provider is part of a chain, extend it
      this.extendChain(providerChains[0], dependency, 'end');
    } else if (providerChains.length === 0 && consumerChains.length > 0) {
      // Consumer is part of a chain, extend it
      this.extendChain(consumerChains[0], dependency, 'start');
    } else {
      // Both are part of chains, merge them
      this.mergeChains(providerChains[0], consumerChains[0], dependency);
    }
    
    this.logEvent(
      DependencyLogLevel.DEBUG,
      `Updated chains for dependency ${dependency.id}`,
      undefined,
      dependency.id,
      dependency.chainId,
      {
        duration: performance.now() - startTime,
        impact: PerformanceImpact.MEDIUM
      }
    );
  }
  
  /**
   * Create a new chain with a single dependency.
   */
  private createNewChain(dependency: Dependency): void {
    const chainId = `chain-${nanoid(8)}`;
    
    const chain: DependencyChain = {
      id: chainId,
      dependencies: [dependency.id],
      dataType: dependency.dataType,
      status: dependency.status,
      hasCycle: false,
      performance: {
        totalPropagationTime: 0
      }
    };
    
    this.chains.set(chainId, chain);
    this.addToSetMap(this.chainsByType, dependency.dataType, chainId);
    
    // Update the dependency with its chain info
    dependency.chainId = chainId;
    dependency.chainPosition = 0;
    
    this.logEvent(
      DependencyLogLevel.INFO,
      `Created new chain: ${chainId} with dependency ${dependency.id}`,
      undefined,
      dependency.id,
      chainId
    );
  }
  
  /**
   * Extend an existing chain with a new dependency.
   */
  private extendChain(
    chain: DependencyChain,
    dependency: Dependency,
    position: 'start' | 'end'
  ): void {
    // Update the dependency with its chain info
    dependency.chainId = chain.id;
    
    // Add to the chain
    if (position === 'start') {
      chain.dependencies.unshift(dependency.id);
      dependency.chainPosition = 0;
      
      // Update positions of other dependencies in the chain
      for (let i = 1; i < chain.dependencies.length; i++) {
        const dep = this.dependencies.get(chain.dependencies[i]);
        if (dep) {
          dep.chainPosition = i;
        }
      }
    } else {
      dependency.chainPosition = chain.dependencies.length;
      chain.dependencies.push(dependency.id);
    }
    
    // Update chain status
    this.updateChainStatus(chain.id);
    
    this.logEvent(
      DependencyLogLevel.INFO,
      `Extended chain: ${chain.id} with dependency ${dependency.id} at position ${position}`,
      undefined,
      dependency.id,
      chain.id
    );
  }
  
  /**
   * Merge two chains using a connecting dependency.
   */
  private mergeChains(
    providerChain: DependencyChain,
    consumerChain: DependencyChain,
    connectingDependency: Dependency
  ): void {
    // If they're already the same chain, just add the dependency
    if (providerChain.id === consumerChain.id) {
      this.addDependencyToChain(providerChain, connectingDependency);
      return;
    }
    
    const mergedChainId = `chain-${nanoid(8)}`;
    
    // Create a new merged chain
    const mergedChain: DependencyChain = {
      id: mergedChainId,
      dependencies: [...providerChain.dependencies, connectingDependency.id, ...consumerChain.dependencies],
      dataType: connectingDependency.dataType,
      status: DependencyStatus.CONNECTED,
      hasCycle: false,
      performance: {
        totalPropagationTime: 0
      }
    };
    
    // Update all dependencies in both chains to reference the new merged chain
    for (let i = 0; i < mergedChain.dependencies.length; i++) {
      const dep = this.dependencies.get(mergedChain.dependencies[i]);
      if (dep) {
        dep.chainId = mergedChainId;
        dep.chainPosition = i;
      }
    }
    
    // Check for cycles in the merged chain
    mergedChain.hasCycle = this.detectCycleInChain(mergedChain);
    if (mergedChain.hasCycle) {
      mergedChain.status = DependencyStatus.CYCLE_DETECTED;
    }
    
    // Add the new chain
    this.chains.set(mergedChainId, mergedChain);
    this.addToSetMap(this.chainsByType, connectingDependency.dataType, mergedChainId);
    
    // Remove the old chains
    this.chains.delete(providerChain.id);
    this.chains.delete(consumerChain.id);
    this.removeFromSetMap(this.chainsByType, providerChain.dataType, providerChain.id);
    this.removeFromSetMap(this.chainsByType, consumerChain.dataType, consumerChain.id);
    
    this.logEvent(
      DependencyLogLevel.INFO,
      `Merged chains: ${providerChain.id} and ${consumerChain.id} into ${mergedChainId}`,
      undefined,
      connectingDependency.id,
      mergedChainId
    );
  }
  
  /**
   * Add a dependency to an existing chain.
   */
  private addDependencyToChain(chain: DependencyChain, dependency: Dependency): void {
    // Find the correct position to insert this dependency
    for (let i = 0; i < chain.dependencies.length - 1; i++) {
      const currentDep = this.dependencies.get(chain.dependencies[i]);
      const nextDep = this.dependencies.get(chain.dependencies[i + 1]);
      
      if (
        currentDep && 
        nextDep && 
        currentDep.consumerId === dependency.providerId && 
        dependency.consumerId === nextDep.providerId
      ) {
        // Insert between these two dependencies
        chain.dependencies.splice(i + 1, 0, dependency.id);
        dependency.chainId = chain.id;
        dependency.chainPosition = i + 1;
        
        // Update positions of later dependencies
        for (let j = i + 2; j < chain.dependencies.length; j++) {
          const dep = this.dependencies.get(chain.dependencies[j]);
          if (dep) {
            dep.chainPosition = j;
          }
        }
        
        this.updateChainStatus(chain.id);
        
        this.logEvent(
          DependencyLogLevel.INFO,
          `Added dependency ${dependency.id} to chain ${chain.id} at position ${i + 1}`,
          undefined,
          dependency.id,
          chain.id
        );
        
        return;
      }
    }
    
    // If we didn't find a position, add to the end
    dependency.chainPosition = chain.dependencies.length;
    chain.dependencies.push(dependency.id);
    dependency.chainId = chain.id;
    
    this.updateChainStatus(chain.id);
    
    this.logEvent(
      DependencyLogLevel.INFO,
      `Added dependency ${dependency.id} to chain ${chain.id} at the end`,
      undefined,
      dependency.id,
      chain.id
    );
  }
  
  /**
   * Update chain status based on the status of its dependencies.
   */
  private updateChainStatus(chainId: string): void {
    const chain = this.chains.get(chainId);
    
    if (!chain) {
      return;
    }
    
    // If the chain has a cycle, it stays in CYCLE_DETECTED status
    if (chain.hasCycle) {
      chain.status = DependencyStatus.CYCLE_DETECTED;
      return;
    }
    
    // Get the status of all dependencies in the chain
    const statuses = chain.dependencies
      .map(depId => this.dependencies.get(depId))
      .filter(Boolean)
      .map(dep => dep!.status);
    
    // Determine the overall status
    if (statuses.includes(DependencyStatus.ERROR)) {
      chain.status = DependencyStatus.ERROR;
    } else if (statuses.includes(DependencyStatus.DISCONNECTED)) {
      chain.status = DependencyStatus.DISCONNECTED;
    } else if (statuses.includes(DependencyStatus.CONNECTING)) {
      chain.status = DependencyStatus.CONNECTING;
    } else if (statuses.every(status => status === DependencyStatus.READY)) {
      chain.status = DependencyStatus.READY;
    } else {
      chain.status = DependencyStatus.CONNECTED;
    }
  }
  
  /**
   * Update chain when a dependency is removed.
   */
  private updateChainRemoval(dependency: Dependency): void {
    const chainId = dependency.chainId;
    if (!chainId) return;
    
    const chain = this.chains.get(chainId);
    if (!chain) return;
    
    // Remove this dependency from the chain
    const index = chain.dependencies.indexOf(dependency.id);
    if (index === -1) return;
    
    chain.dependencies.splice(index, 1);
    
    // If the chain is now empty, remove it
    if (chain.dependencies.length === 0) {
      this.chains.delete(chainId);
      this.removeFromSetMap(this.chainsByType, chain.dataType, chainId);
      return;
    }
    
    // If removing this dependency splits the chain, create two new chains
    if (index > 0 && index < chain.dependencies.length) {
      const leftChainDeps = chain.dependencies.slice(0, index);
      const rightChainDeps = chain.dependencies.slice(index);
      
      // Create left chain
      const leftChainId = `chain-${nanoid(8)}`;
      const leftChain: DependencyChain = {
        id: leftChainId,
        dependencies: leftChainDeps,
        dataType: chain.dataType,
        status: DependencyStatus.CONNECTED,
        hasCycle: false,
        performance: {
          totalPropagationTime: 0
        }
      };
      
      // Update dependencies in left chain
      for (let i = 0; i < leftChainDeps.length; i++) {
        const dep = this.dependencies.get(leftChainDeps[i]);
        if (dep) {
          dep.chainId = leftChainId;
          dep.chainPosition = i;
        }
      }
      
      // Create right chain
      const rightChainId = `chain-${nanoid(8)}`;
      const rightChain: DependencyChain = {
        id: rightChainId,
        dependencies: rightChainDeps,
        dataType: chain.dataType,
        status: DependencyStatus.CONNECTED,
        hasCycle: false,
        performance: {
          totalPropagationTime: 0
        }
      };
      
      // Update dependencies in right chain
      for (let i = 0; i < rightChainDeps.length; i++) {
        const dep = this.dependencies.get(rightChainDeps[i]);
        if (dep) {
          dep.chainId = rightChainId;
          dep.chainPosition = i;
        }
      }
      
      // Store the new chains
      this.chains.set(leftChainId, leftChain);
      this.chains.set(rightChainId, rightChain);
      this.addToSetMap(this.chainsByType, chain.dataType, leftChainId);
      this.addToSetMap(this.chainsByType, chain.dataType, rightChainId);
      
      // Remove the old chain
      this.chains.delete(chainId);
      this.removeFromSetMap(this.chainsByType, chain.dataType, chainId);
      
      // Update statuses
      this.updateChainStatus(leftChainId);
      this.updateChainStatus(rightChainId);
      
      this.logEvent(
        DependencyLogLevel.INFO,
        `Split chain ${chainId} into ${leftChainId} and ${rightChainId} after removing dependency ${dependency.id}`,
        undefined,
        dependency.id,
        chainId
      );
    } else {
      // Update positions of remaining dependencies
      for (let i = 0; i < chain.dependencies.length; i++) {
        const dep = this.dependencies.get(chain.dependencies[i]);
        if (dep) {
          dep.chainPosition = i;
        }
      }
      
      // Update chain status
      this.updateChainStatus(chainId);
      
      this.logEvent(
        DependencyLogLevel.INFO,
        `Removed dependency ${dependency.id} from chain ${chainId}`,
        undefined,
        dependency.id,
        chainId
      );
    }
  }
  
  /**
   * Update chain performance metrics.
   */
  private updateChainPerformance(chainId: string): void {
    const chain = this.chains.get(chainId);
    
    if (!chain) {
      return;
    }
    
    // Calculate total propagation time
    let totalTime = 0;
    let bottleneckDepId: string | undefined;
    let bottleneckTime = 0;
    
    for (const depId of chain.dependencies) {
      const dep = this.dependencies.get(depId);
      
      if (dep && dep.performance) {
        totalTime += dep.performance.avgUpdateTime;
        
        // Check if this is the bottleneck
        if (dep.performance.avgUpdateTime > bottleneckTime) {
          bottleneckTime = dep.performance.avgUpdateTime;
          bottleneckDepId = depId;
        }
      }
    }
    
    if (!chain.performance) {
      chain.performance = {
        totalPropagationTime: 0
      };
    }
    
    chain.performance.totalPropagationTime = totalTime;
    chain.performance.bottleneckDependencyId = bottleneckDepId;
    
    this.logEvent(
      DependencyLogLevel.PERFORMANCE,
      `Updated chain performance: ${chainId}, total time: ${totalTime}ms, bottleneck: ${bottleneckDepId || 'none'}`,
      undefined,
      undefined,
      chainId,
      {
        duration: totalTime,
        impact: totalTime > 100 ? PerformanceImpact.HIGH : PerformanceImpact.LOW
      }
    );
  }
  
  /**
   * Detect if a chain contains a cycle.
   */
  private detectCycleInChain(chain: DependencyChain): boolean {
    const componentsSeen = new Set<string>();
    
    for (const depId of chain.dependencies) {
      const dep = this.dependencies.get(depId);
      
      if (!dep) continue;
      
      // Check provider
      if (componentsSeen.has(dep.providerId)) {
        return true;
      }
      componentsSeen.add(dep.providerId);
      
      // Check consumer
      if (componentsSeen.has(dep.consumerId)) {
        return true;
      }
      componentsSeen.add(dep.consumerId);
    }
    
    return false;
  }
  
  /**
   * Record a usage pattern between components for suggestions.
   */
  private recordUsagePattern(providerId: string, consumerId: string): void {
    // Increment the connection count
    if (!this.usagePatterns.has(providerId)) {
      this.usagePatterns.set(providerId, new Map<string, number>());
    }
    
    const patterns = this.usagePatterns.get(providerId)!;
    patterns.set(consumerId, (patterns.get(consumerId) || 0) + 1);
    
    // Generate suggestions based on usage patterns
    this.generateSuggestions();
  }
  
  /**
   * Generate suggestions based on usage patterns.
   */
  private generateSuggestions(): void {
    // Clear old suggestions
    this.suggestions.clear();
    
    // Analyze usage patterns
    for (const [providerId, patterns] of this.usagePatterns.entries()) {
      for (const [consumerId, count] of patterns.entries()) {
        // Only suggest strong patterns (count > 1)
        if (count <= 1) continue;
        
        // Find common data types
        const providerDefs = this.getDefinitionsByComponent(providerId);
        const consumerDefs = this.getDefinitionsByComponent(consumerId);
        
        // For each data type, check if this could be a useful dependency
        for (const providerDef of providerDefs) {
          if (providerDef.role !== 'provider' && providerDef.role !== 'both') continue;
          
          for (const consumerDef of consumerDefs) {
            if (consumerDef.role !== 'consumer' && consumerDef.role !== 'both') continue;
            
            // If they match on data type, create a suggestion
            if (providerDef.dataType === consumerDef.dataType) {
              // Check if this dependency already exists
              const exists = Array.from(this.dependencies.values()).some(
                dep => dep.providerId === providerId && 
                       dep.consumerId === consumerId && 
                       dep.dataType === providerDef.dataType
              );
              
              if (!exists) {
                const suggestion: DependencySuggestion = {
                  id: `sug-${nanoid(8)}`,
                  suggestedProviderId: providerId,
                  suggestedConsumerId: consumerId,
                  dataType: providerDef.dataType,
                  confidence: Math.min(0.1 * count, 0.9), // Scale confidence by usage count, max 0.9
                  reason: `These components are frequently used together (${count} times)`,
                  usagePattern: {
                    frequency: count,
                    timeSpan: Date.now() - (this.logs[0]?.timestamp || Date.now()),
                    userActions: this.logs.filter(log => 
                      log.componentId === providerId || log.componentId === consumerId
                    ).length
                  }
                };
                
                this.suggestions.set(suggestion.id, suggestion);
                
                this.logEvent(
                  DependencyLogLevel.INFO,
                  `Generated suggestion: ${suggestion.id} to connect ${providerId} to ${consumerId} for ${providerDef.dataType}`,
                  undefined,
                  undefined,
                  undefined
                );
              }
            }
          }
        }
      }
    }
  }
  
  /**
   * Log an event in the dependency system.
   */
  private logEvent(
    level: DependencyLogLevel,
    message: string,
    componentId?: string,
    dependencyId?: string,
    chainId?: string,
    performance?: { duration: number, impact: PerformanceImpact, dataSize?: number }
  ): void {
    // Create a log entry
    const logEntry: DependencyLogEntry = {
      id: `log-${nanoid(8)}`,
      timestamp: Date.now(),
      level,
      message,
      componentId,
      dependencyId,
      chainId,
      performance
    };
    
    // If this relates to a dependency, get its data type
    if (dependencyId) {
      const dependency = this.dependencies.get(dependencyId);
      if (dependency) {
        logEntry.dataType = dependency.dataType;
      }
    } else if (chainId) {
      // If this relates to a chain, get its data type
      const chain = this.chains.get(chainId);
      if (chain) {
        logEntry.dataType = chain.dataType;
      }
    }
    
    // Add to logs, maintaining max size (keep last 1000 logs)
    this.logs.push(logEntry);
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }
}