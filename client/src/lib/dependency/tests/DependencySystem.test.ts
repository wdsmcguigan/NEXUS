/**
 * Tests for the Component Dependency System
 * 
 * This file contains tests that verify the functionality of the dependency system,
 * including the DependencyRegistry and DependencyManager classes.
 */

import { ComponentType } from '../../communication/ComponentCommunication';
import { 
  DependencyDataType, 
  DependencySyncStrategy,
  DependencyStatus
} from '../DependencyInterfaces';
import { dependencyRegistry, DependencyRegistryEvent } from '../DependencyRegistry';
import { dependencyManager, DependencyManagerEvent } from '../DependencyManager';
import { eventBus } from '../../communication/EventBus';

// Mock the componentCommunication module
jest.mock('../../communication/ComponentCommunication', () => ({
  ComponentType: {
    EMAIL_LIST: 'email-list',
    EMAIL_VIEWER: 'email-viewer',
    EMAIL_COMPOSER: 'email-composer',
    FOLDER_TREE: 'folder-tree',
    CALENDAR: 'calendar',
    CONTACTS: 'contacts',
    SETTINGS: 'settings',
    SEARCH: 'search',
    TAG_MANAGER: 'tag-manager',
    ANALYTICS: 'analytics'
  },
  componentCommunication: {
    getComponent: jest.fn(),
    registerComponent: jest.fn(),
    unregisterComponent: jest.fn(),
    addEventListener: jest.fn(),
    sendNotification: jest.fn(),
    sendRequest: jest.fn()
  }
}));

// Mock the eventBus module
jest.mock('../../communication/EventBus', () => ({
  eventBus: {
    publish: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn()
  }
}));

// Import the mocked modules for type checking
import { componentCommunication } from '../../communication/ComponentCommunication';

describe('DependencyRegistry', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Clear any existing definitions
    // @ts-ignore - Accessing private property for testing
    dependencyRegistry.definitions.clear();
    // @ts-ignore - Accessing private property for testing
    dependencyRegistry.providerToDependencyMap.clear();
    // @ts-ignore - Accessing private property for testing
    dependencyRegistry.consumerToDependencyMap.clear();
    // @ts-ignore - Accessing private property for testing
    dependencyRegistry.dataTypeToDependencyMap.clear();
  });
  
  test('should register a dependency definition', () => {
    // Create a dependency definition
    const definition = {
      name: 'Email Selection',
      description: 'Email list provides selected email to email viewer',
      providerType: ComponentType.EMAIL_LIST,
      consumerType: ComponentType.EMAIL_VIEWER,
      dataType: DependencyDataType.EMAIL,
      syncStrategy: DependencySyncStrategy.BOTH,
      isRequired: false,
      isOneToMany: true,
      isManyToOne: false
    };
    
    // Register the definition
    const id = dependencyRegistry.registerDependency(definition);
    
    // Verify the definition was registered
    expect(id).toBeDefined();
    expect(dependencyRegistry.getDependency(id)).toEqual({
      ...definition,
      id
    });
    
    // Verify the event was published
    expect(eventBus.publish).toHaveBeenCalledWith(
      DependencyRegistryEvent.DEPENDENCY_REGISTERED,
      expect.objectContaining({
        definition: expect.objectContaining({
          id,
          name: definition.name
        })
      })
    );
  });
  
  test('should retrieve dependencies by component type', () => {
    // Create and register dependency definitions
    const emailListToViewerDef = {
      name: 'Email Selection',
      providerType: ComponentType.EMAIL_LIST,
      consumerType: ComponentType.EMAIL_VIEWER,
      dataType: DependencyDataType.EMAIL,
      syncStrategy: DependencySyncStrategy.BOTH,
      isRequired: false,
      isOneToMany: true,
      isManyToOne: false
    };
    
    const folderTreeToEmailListDef = {
      name: 'Folder Selection',
      providerType: ComponentType.FOLDER_TREE,
      consumerType: ComponentType.EMAIL_LIST,
      dataType: DependencyDataType.FOLDER,
      syncStrategy: DependencySyncStrategy.PUSH,
      isRequired: false,
      isOneToMany: true,
      isManyToOne: false
    };
    
    const emailListId = dependencyRegistry.registerDependency(emailListToViewerDef);
    const folderTreeId = dependencyRegistry.registerDependency(folderTreeToEmailListDef);
    
    // Get dependencies for provider
    const emailListDeps = dependencyRegistry.getDependenciesForProvider(ComponentType.EMAIL_LIST);
    expect(emailListDeps).toHaveLength(1);
    expect(emailListDeps[0].id).toBe(emailListId);
    
    // Get dependencies for consumer
    const emailListConsumerDeps = dependencyRegistry.getDependenciesForConsumer(ComponentType.EMAIL_LIST);
    expect(emailListConsumerDeps).toHaveLength(1);
    expect(emailListConsumerDeps[0].id).toBe(folderTreeId);
    
    // Get dependencies by data type
    const emailDeps = dependencyRegistry.getDependenciesByDataType(DependencyDataType.EMAIL);
    expect(emailDeps).toHaveLength(1);
    expect(emailDeps[0].id).toBe(emailListId);
  });
  
  test('should check dependency compatibility between components', () => {
    // Create and register dependency definitions
    dependencyRegistry.registerDependency({
      name: 'Email Selection',
      providerType: ComponentType.EMAIL_LIST,
      consumerType: ComponentType.EMAIL_VIEWER,
      dataType: DependencyDataType.EMAIL,
      syncStrategy: DependencySyncStrategy.BOTH,
      isRequired: false,
      isOneToMany: true,
      isManyToOne: false
    });
    
    // Check compatibility
    expect(dependencyRegistry.canProvideFor(ComponentType.EMAIL_LIST, ComponentType.EMAIL_VIEWER)).toBe(true);
    expect(dependencyRegistry.canProvideFor(ComponentType.EMAIL_VIEWER, ComponentType.EMAIL_LIST)).toBe(false);
    
    expect(dependencyRegistry.canConsumeFrom(ComponentType.EMAIL_VIEWER, ComponentType.EMAIL_LIST)).toBe(true);
    expect(dependencyRegistry.canConsumeFrom(ComponentType.EMAIL_LIST, ComponentType.EMAIL_VIEWER)).toBe(false);
    
    // Find possible dependencies
    const possibilities = dependencyRegistry.findPossibleDependencies(
      ComponentType.EMAIL_LIST,
      ComponentType.EMAIL_VIEWER
    );
    expect(possibilities).toHaveLength(1);
    expect(possibilities[0].name).toBe('Email Selection');
  });
  
  test('should update and remove dependency definitions', () => {
    // Create and register a dependency definition
    const id = dependencyRegistry.registerDependency({
      name: 'Email Selection',
      providerType: ComponentType.EMAIL_LIST,
      consumerType: ComponentType.EMAIL_VIEWER,
      dataType: DependencyDataType.EMAIL,
      syncStrategy: DependencySyncStrategy.BOTH,
      isRequired: false,
      isOneToMany: true,
      isManyToOne: false
    });
    
    // Update the definition
    const updateSuccess = dependencyRegistry.updateDependency(id, {
      name: 'Updated Email Selection',
      description: 'Updated description',
      isRequired: true
    });
    
    expect(updateSuccess).toBe(true);
    expect(dependencyRegistry.getDependency(id)?.name).toBe('Updated Email Selection');
    expect(dependencyRegistry.getDependency(id)?.isRequired).toBe(true);
    
    // Verify update event was published
    expect(eventBus.publish).toHaveBeenCalledWith(
      DependencyRegistryEvent.DEPENDENCY_UPDATED,
      expect.objectContaining({
        definition: expect.objectContaining({
          id,
          name: 'Updated Email Selection'
        })
      })
    );
    
    // Remove the definition
    const removeSuccess = dependencyRegistry.removeDependency(id);
    
    expect(removeSuccess).toBe(true);
    expect(dependencyRegistry.getDependency(id)).toBeUndefined();
    
    // Verify removal event was published
    expect(eventBus.publish).toHaveBeenCalledWith(
      DependencyRegistryEvent.DEPENDENCY_REMOVED,
      expect.objectContaining({
        definition: expect.objectContaining({
          id
        })
      })
    );
  });
});

describe('DependencyManager', () => {
  const MOCK_PROVIDER_ID = 'provider-123';
  const MOCK_CONSUMER_ID = 'consumer-456';
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Clear any existing instances
    // @ts-ignore - Accessing private property for testing
    dependencyManager.instances.clear();
    // @ts-ignore - Accessing private property for testing
    dependencyManager.providerToDependencyMap.clear();
    // @ts-ignore - Accessing private property for testing
    dependencyManager.consumerToDependencyMap.clear();
    
    // Mock componentCommunication.getComponent to return test components
    (componentCommunication.getComponent as jest.Mock).mockImplementation((id) => {
      if (id === MOCK_PROVIDER_ID) {
        return {
          instanceId: MOCK_PROVIDER_ID,
          componentType: ComponentType.EMAIL_LIST,
          title: 'Email List'
        };
      }
      if (id === MOCK_CONSUMER_ID) {
        return {
          instanceId: MOCK_CONSUMER_ID,
          componentType: ComponentType.EMAIL_VIEWER,
          title: 'Email Viewer'
        };
      }
      return undefined;
    });
    
    // Register a test dependency definition
    dependencyRegistry.registerDependency({
      name: 'Email Selection',
      providerType: ComponentType.EMAIL_LIST,
      consumerType: ComponentType.EMAIL_VIEWER,
      dataType: DependencyDataType.EMAIL,
      syncStrategy: DependencySyncStrategy.BOTH,
      isRequired: false,
      isOneToMany: true,
      isManyToOne: false,
      configOptions: [
        {
          key: 'autoUpdate',
          name: 'Auto Update',
          type: 'boolean',
          defaultValue: true
        },
        {
          key: 'selectionMode',
          name: 'Selection Mode',
          type: 'select',
          options: [
            { value: 'single', label: 'Single' },
            { value: 'multiple', label: 'Multiple' }
          ],
          defaultValue: 'single'
        }
      ]
    });
  });
  
  test('should create a dependency instance', () => {
    // Get the registered dependency definition
    const definitions = dependencyRegistry.getAllDependencies();
    expect(definitions.length).toBeGreaterThan(0);
    
    const definitionId = definitions[0].id;
    
    // Create a dependency instance
    const instanceId = dependencyManager.createDependency(
      definitionId,
      MOCK_PROVIDER_ID,
      MOCK_CONSUMER_ID,
      {
        options: {
          selectionMode: 'multiple'
        }
      }
    );
    
    // Verify the instance was created
    expect(instanceId).toBeDefined();
    
    const instance = dependencyManager.getDependency(instanceId);
    expect(instance).toBeDefined();
    expect(instance?.definitionId).toBe(definitionId);
    expect(instance?.providerId).toBe(MOCK_PROVIDER_ID);
    expect(instance?.consumerId).toBe(MOCK_CONSUMER_ID);
    expect(instance?.config.options.selectionMode).toBe('multiple');
    expect(instance?.config.options.autoUpdate).toBe(true); // Default value
    
    // Verify creation event was published
    expect(eventBus.publish).toHaveBeenCalledWith(
      DependencyManagerEvent.DEPENDENCY_CREATED,
      expect.objectContaining({
        instance: expect.objectContaining({
          id: instanceId,
          definitionId
        })
      })
    );
  });
  
  test('should retrieve dependencies for components', () => {
    // Get the registered dependency definition
    const definitions = dependencyRegistry.getAllDependencies();
    const definitionId = definitions[0].id;
    
    // Create a dependency instance
    const instanceId = dependencyManager.createDependency(
      definitionId,
      MOCK_PROVIDER_ID,
      MOCK_CONSUMER_ID
    );
    
    // Get dependencies for provider
    const providerDeps = dependencyManager.getDependenciesForProvider(MOCK_PROVIDER_ID);
    expect(providerDeps).toHaveLength(1);
    expect(providerDeps[0].id).toBe(instanceId);
    
    // Get dependencies for consumer
    const consumerDeps = dependencyManager.getDependenciesForConsumer(MOCK_CONSUMER_ID);
    expect(consumerDeps).toHaveLength(1);
    expect(consumerDeps[0].id).toBe(instanceId);
    
    // Find a dependency between provider and consumer
    const foundDep = dependencyManager.findDependency(MOCK_PROVIDER_ID, MOCK_CONSUMER_ID);
    expect(foundDep).toBeDefined();
    expect(foundDep?.id).toBe(instanceId);
  });
  
  test('should update dependency data', () => {
    // Get the registered dependency definition
    const definitions = dependencyRegistry.getAllDependencies();
    const definitionId = definitions[0].id;
    
    // Create a dependency instance
    const instanceId = dependencyManager.createDependency(
      definitionId,
      MOCK_PROVIDER_ID,
      MOCK_CONSUMER_ID
    );
    
    // Mock data to update
    const mockEmailData = {
      id: 123,
      subject: 'Test Email',
      from: 'sender@example.com',
      body: 'Email body'
    };
    
    // Update dependency data
    const updateSuccess = dependencyManager.updateDependencyData(instanceId, mockEmailData);
    
    expect(updateSuccess).toBe(true);
    
    // Verify data was updated
    const instance = dependencyManager.getDependency(instanceId);
    expect(instance?.currentData).toEqual(mockEmailData);
    
    // Verify data update event was published
    expect(eventBus.publish).toHaveBeenCalledWith(
      DependencyManagerEvent.DEPENDENCY_DATA_UPDATED,
      expect.objectContaining({
        dependencyId: instanceId,
        data: mockEmailData
      })
    );
    
    // Verify notification was sent to consumer
    expect(componentCommunication.sendNotification).toHaveBeenCalledWith(
      MOCK_PROVIDER_ID,
      MOCK_CONSUMER_ID,
      'dependencyDataUpdated',
      expect.objectContaining({
        dependencyId: instanceId,
        data: mockEmailData
      })
    );
  });
  
  test('should update dependency configuration', () => {
    // Get the registered dependency definition
    const definitions = dependencyRegistry.getAllDependencies();
    const definitionId = definitions[0].id;
    
    // Create a dependency instance
    const instanceId = dependencyManager.createDependency(
      definitionId,
      MOCK_PROVIDER_ID,
      MOCK_CONSUMER_ID
    );
    
    // Update dependency configuration
    const updateSuccess = dependencyManager.updateDependencyConfig(instanceId, {
      autoUpdate: false,
      options: {
        selectionMode: 'multiple'
      }
    });
    
    expect(updateSuccess).toBe(true);
    
    // Verify configuration was updated
    const instance = dependencyManager.getDependency(instanceId);
    expect(instance?.config.autoUpdate).toBe(false);
    expect(instance?.config.options.selectionMode).toBe('multiple');
    
    // Verify update event was published
    expect(eventBus.publish).toHaveBeenCalledWith(
      DependencyManagerEvent.DEPENDENCY_UPDATED,
      expect.objectContaining({
        instance: expect.objectContaining({
          id: instanceId,
          config: expect.objectContaining({
            autoUpdate: false,
            options: expect.objectContaining({
              selectionMode: 'multiple'
            })
          })
        }),
        configChanged: true
      })
    );
  });
  
  test('should set dependency status', () => {
    // Get the registered dependency definition
    const definitions = dependencyRegistry.getAllDependencies();
    const definitionId = definitions[0].id;
    
    // Create a dependency instance
    const instanceId = dependencyManager.createDependency(
      definitionId,
      MOCK_PROVIDER_ID,
      MOCK_CONSUMER_ID
    );
    
    // Set dependency status to inactive
    const setInactiveSuccess = dependencyManager.setDependencyStatus(
      instanceId,
      DependencyStatus.INACTIVE
    );
    
    expect(setInactiveSuccess).toBe(true);
    
    // Verify status was updated
    let instance = dependencyManager.getDependency(instanceId);
    expect(instance?.isActive).toBe(false);
    
    // Verify status change event was published
    expect(eventBus.publish).toHaveBeenCalledWith(
      DependencyManagerEvent.DEPENDENCY_STATUS_CHANGED,
      expect.objectContaining({
        instance: expect.objectContaining({
          id: instanceId,
          isActive: false
        }),
        newStatus: DependencyStatus.INACTIVE
      })
    );
    
    // Set dependency status to error
    const errorMessage = 'Test error message';
    const setErrorSuccess = dependencyManager.setDependencyStatus(
      instanceId,
      DependencyStatus.ERROR,
      errorMessage
    );
    
    expect(setErrorSuccess).toBe(true);
    
    // Verify status and error were updated
    instance = dependencyManager.getDependency(instanceId);
    expect(instance?.isActive).toBe(false);
    expect(instance?.error).toBe(errorMessage);
  });
  
  test('should remove a dependency instance', () => {
    // Get the registered dependency definition
    const definitions = dependencyRegistry.getAllDependencies();
    const definitionId = definitions[0].id;
    
    // Create a dependency instance
    const instanceId = dependencyManager.createDependency(
      definitionId,
      MOCK_PROVIDER_ID,
      MOCK_CONSUMER_ID
    );
    
    // Remove the dependency instance
    const removeSuccess = dependencyManager.removeDependency(instanceId);
    
    expect(removeSuccess).toBe(true);
    expect(dependencyManager.getDependency(instanceId)).toBeUndefined();
    
    // Verify removal event was published
    expect(eventBus.publish).toHaveBeenCalledWith(
      DependencyManagerEvent.DEPENDENCY_REMOVED,
      expect.objectContaining({
        instance: expect.objectContaining({
          id: instanceId
        })
      })
    );
    
    // Verify lookup maps were updated
    expect(dependencyManager.getDependenciesForProvider(MOCK_PROVIDER_ID)).toHaveLength(0);
    expect(dependencyManager.getDependenciesForConsumer(MOCK_CONSUMER_ID)).toHaveLength(0);
  });
});