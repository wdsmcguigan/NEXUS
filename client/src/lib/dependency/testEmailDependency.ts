/**
 * Test suite for email dependency system
 * This contains helper functions to verify that the dependency system is working correctly
 * with the email components.
 */

import { Email } from '../../../shared/schema';
import { DependencyManager } from './DependencyManager';
import { DependencyRegistry } from './DependencyRegistry';
import { DependencyDataTypes, DependencyStatus } from './DependencyInterfaces';

/**
 * Creates a test email object with sample data
 * The function generates a complete email with all fields that might be needed
 * by the UI component, making it easier to verify data flow is working
 */
export function createTestEmail(id: number = 1): any {
  // Create a timestamp within the last hour for realistic recency
  const timestamp = new Date();
  timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 60));
  
  // Create a test email with full details needed by the UI
  return {
    id,
    accountId: 1,
    fromContactId: 1,
    subject: `[TEST] Dependency System Demo Email #${id}`,
    body: `This is a test email sent by the dependency testing system.\n\nThis email is specially formatted to verify that data is flowing correctly between email list and email detail components.\n\nHere are some things you should see:\n- The subject line should start with [TEST]\n- The email should be marked as unread\n- The email should have a gold star\n- The timestamp should be within the last hour\n\nIf you can see all these details in the email detail pane, then the dependency system is working correctly!\n\nTimestamp: ${timestamp.toISOString()}\nID: ${id}`,
    timestamp: timestamp.toISOString(),
    category: 'primary',
    isRead: false,
    isArchived: false,
    isTrashed: false,
    starColor: 'gold',
    todoText: null,
    todoCompleted: false,
    
    // Add extra fields needed for full email detail display
    fromContact: {
      id: 1,
      name: "Dependency System",
      email: "test@dependency.nexus",
      company: "NEXUS Email",
      avatarUrl: null,
      notes: "Test System"
    },
    
    // Add recipients
    recipients: [
      {
        id: 1,
        emailId: id,
        contactId: 2,
        type: "to",
        contact: {
          id: 2,
          name: "Current User",
          email: "user@example.com", 
          company: "User Company",
          avatarUrl: null,
          notes: null
        }
      }
    ],
    
    // Add a few attachments
    attachments: [
      {
        id: 1,
        emailId: id,
        fileName: "test-document.pdf",
        fileType: "application/pdf",
        fileSize: 1024 * 1024, // 1MB
        fileContent: null
      },
      {
        id: 2,
        emailId: id,
        fileName: "dependency-diagram.png",
        fileType: "image/png",
        fileSize: 512 * 1024, // 512KB
        fileContent: null
      }
    ],
    
    // Add tags
    tags: [
      {
        id: 1,
        emailId: id,
        tagId: 1,
        tag: {
          id: 1,
          name: "Test",
          parentId: null,
          bgColor: "#4b5563",
          textColor: "#f9fafb",
          emoji: "🔄"
        }
      },
      {
        id: 2,
        emailId: id, 
        tagId: 2,
        tag: {
          id: 2,
          name: "Dependency",
          parentId: 1,
          bgColor: "#60a5fa",
          textColor: "#1e3a8a",
          emoji: "🔗"
        }
      }
    ]
  };
}

/**
 * Test the email dependency connection from EmailListPane to EmailDetailPane
 * 
 * @param listPaneId The ID of the EmailListPane component
 * @param detailPaneId The ID of the EmailDetailPane component
 * @param registry The dependency registry instance
 * @param manager The dependency manager instance
 */
export function testEmailDependencyConnection(
  listPaneId: string,
  detailPaneId: string,
  registry: DependencyRegistry,
  manager: DependencyManager
): { success: boolean; message: string } {
  console.log('=== STARTING EMAIL DEPENDENCY TEST ===');
  console.log(`Testing connection from ${listPaneId} to ${detailPaneId}`);
  
  // Step 1: Verify components are registered
  const listComponent = registry.getComponent(listPaneId);
  const detailComponent = registry.getComponent(detailPaneId);
  
  if (!listComponent) {
    return { 
      success: false, 
      message: `EmailListPane component ${listPaneId} is not registered` 
    };
  }
  
  if (!detailComponent) {
    return { 
      success: false, 
      message: `EmailDetailPane component ${detailPaneId} is not registered` 
    };
  }
  
  console.log('✓ Both components are registered');
  
  // Step 2: Verify provider and consumer definitions
  const listProvider = registry.getDefinitionsByComponentAndRole(
    listPaneId, 'provider', DependencyDataTypes.EMAIL_DATA
  );
  
  const detailConsumer = registry.getDefinitionsByComponentAndRole(
    detailPaneId, 'consumer', DependencyDataTypes.EMAIL_DATA
  );
  
  if (listProvider.length === 0) {
    return { 
      success: false, 
      message: `EmailListPane component ${listPaneId} does not have a provider definition for ${DependencyDataTypes.EMAIL_DATA}` 
    };
  }
  
  if (detailConsumer.length === 0) {
    return { 
      success: false, 
      message: `EmailDetailPane component ${detailPaneId} does not have a consumer definition for ${DependencyDataTypes.EMAIL_DATA}` 
    };
  }
  
  console.log('✓ Provider and consumer definitions found');
  
  // Step 3: Create dependency if it doesn't exist
  const existingDependency = registry.getDependenciesByProviderAndDataType(
    listPaneId, DependencyDataTypes.EMAIL_DATA
  ).find(dep => dep.consumerId === detailPaneId);
  
  let dependency = existingDependency;
  
  if (!dependency) {
    dependency = registry.createDependency(
      listPaneId, 
      detailPaneId, 
      DependencyDataTypes.EMAIL_DATA
    );
    
    if (!dependency) {
      return { 
        success: false, 
        message: `Failed to create dependency between ${listPaneId} and ${detailPaneId}` 
      };
    }
    
    console.log(`✓ Created new dependency: ${dependency.id}`);
  } else {
    console.log(`✓ Found existing dependency: ${dependency.id}, status: ${dependency.status}`);
  }
  
  // Step 4: Set dependency status to READY
  registry.updateDependencyStatus(dependency.id, DependencyStatus.READY);
  console.log(`✓ Updated dependency status to READY`);
  
  // Step 5: Send test data through the dependency
  const testEmail = createTestEmail();
  console.log('✓ Created test email:', testEmail);
  
  manager.updateData(listPaneId, DependencyDataTypes.EMAIL_DATA, testEmail);
  console.log('✓ Sent test email data through dependency');
  
  // Step 6: Verify data was received
  const dependencyData = manager.getData(dependency.id);
  
  if (!dependencyData) {
    return { 
      success: false, 
      message: `Data was not stored in dependency ${dependency.id}` 
    };
  }
  
  console.log('✓ Data was successfully stored in dependency:', dependencyData);
  
  // Test passed
  return { 
    success: true, 
    message: `Email dependency test passed! Data flows correctly from ${listPaneId} to ${detailPaneId}` 
  };
}

/**
 * Manually connect EmailListPane to EmailDetailPane
 * 
 * This is a simplified version that works with the actual DependencyRegistry interface
 */
export function connectEmailComponents(
  listPaneId: string,
  detailPaneId: string,
  registry: DependencyRegistry,
  manager: DependencyManager
): { success: boolean; message: string } {
  console.log(`[EmailDependencyTest] Connecting ${listPaneId} to ${detailPaneId}`);
  
  // Check if the provider has any definitions
  const providerDefinitions = registry.getDefinitionsByComponent(listPaneId)
    .filter(def => def.role === 'provider' && def.dataType === DependencyDataTypes.EMAIL_DATA);
    
  if (providerDefinitions.length === 0) {
    return { 
      success: false, 
      message: `Provider ${listPaneId} has no EMAIL_DATA provider definitions` 
    };
  }
  
  // Check if the consumer has any definitions
  const consumerDefinitions = registry.getDefinitionsByComponent(detailPaneId)
    .filter(def => def.role === 'consumer' && def.dataType === DependencyDataTypes.EMAIL_DATA);
    
  if (consumerDefinitions.length === 0) {
    return { 
      success: false, 
      message: `Consumer ${detailPaneId} has no EMAIL_DATA consumer definitions` 
    };
  }
  
  console.log(`[EmailDependencyTest] Found provider and consumer definitions`);
  
  // Check for existing dependencies
  const existingDeps = registry.getDependenciesByProvider(listPaneId)
    .filter(dep => dep.consumerId === detailPaneId && dep.dataType === DependencyDataTypes.EMAIL_DATA);
  
  if (existingDeps.length > 0) {
    const existingDep = existingDeps[0];
    console.log(`[EmailDependencyTest] Found existing dependency: ${existingDep.id}`);
    
    // Ensure it's in READY status
    registry.updateDependencyStatus(existingDep.id, DependencyStatus.READY);
    
    // Try to activate it via the manager
    manager.requestData(detailPaneId, listPaneId, DependencyDataTypes.EMAIL_DATA);
    
    // Send test data through it
    try {
      const testEmail = createTestEmail();
      manager.updateData(listPaneId, DependencyDataTypes.EMAIL_DATA, testEmail);
      
      return { 
        success: true, 
        message: `Activated existing dependency ${existingDep.id} and sent test data` 
      };
    } catch (err) {
      console.error('[EmailDependencyTest] Error sending test data:', err);
      return { 
        success: false, 
        message: `Error sending test data through existing dependency: ${err.message}` 
      };
    }
  }
  
  // Create a new dependency
  try {
    console.log(`[EmailDependencyTest] Creating new dependency`);
    const newDep = registry.createDependency(
      listPaneId, 
      detailPaneId, 
      DependencyDataTypes.EMAIL_DATA
    );
    
    if (!newDep) {
      return { 
        success: false, 
        message: `Failed to create dependency between ${listPaneId} and ${detailPaneId}` 
      };
    }
    
    console.log(`[EmailDependencyTest] Created new dependency: ${newDep.id}`);
    
    // Set to READY status
    registry.updateDependencyStatus(newDep.id, DependencyStatus.READY);
    
    // Try to activate it via the manager
    manager.requestData(detailPaneId, listPaneId, DependencyDataTypes.EMAIL_DATA);
    
    // Send test data through it
    const testEmail = createTestEmail();
    manager.updateData(listPaneId, DependencyDataTypes.EMAIL_DATA, testEmail);
    
    return { 
      success: true, 
      message: `Created and activated new dependency ${newDep.id} and sent test data` 
    };
  } catch (err) {
    console.error('[EmailDependencyTest] Error in dependency creation:', err);
    return { 
      success: false, 
      message: `Error in dependency creation: ${err.message}` 
    };
  }
}