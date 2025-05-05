/**
 * Email Dependency Demo Component
 * 
 * This component demonstrates the Component Dependency System with a simple
 * email selection example. It shows how email list components can provide
 * selected email data to email viewer components through dependencies.
 */

import React, { useEffect, useState } from 'react';
import { useDependencyContext } from '../context/DependencyContext';
import { 
  DependencyDataType, 
  DependencyStatus,
  DependencySyncStrategy
} from '../lib/dependency/DependencyInterfaces';
import { ComponentType } from '../lib/communication/ComponentCommunication';
import { v4 as uuidv4 } from 'uuid';

// Simple email interface for the demo
interface Email {
  id: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  date: Date;
  isRead: boolean;
}

// Demo data
const SAMPLE_EMAILS: Email[] = [
  {
    id: '1',
    subject: 'Welcome to the Dependency Demo',
    from: 'system@nexus.email',
    to: 'user@example.com',
    body: 'This email demonstrates how the Component Dependency System works.',
    date: new Date('2025-04-30T10:00:00'),
    isRead: false
  },
  {
    id: '2',
    subject: 'Component Communication Made Easy',
    from: 'developer@nexus.email',
    to: 'user@example.com',
    body: 'The Component Dependency System provides a structured approach to component communication.',
    date: new Date('2025-05-01T09:15:00'),
    isRead: true
  },
  {
    id: '3',
    subject: 'Advanced Features',
    from: 'product@nexus.email',
    to: 'user@example.com',
    body: 'The system includes features like data transformation, validation, and flexible synchronization strategies.',
    date: new Date('2025-05-02T14:30:00'),
    isRead: false
  }
];

// Email List Component (Provider)
const EmailListComponent: React.FC<{
  updateSelectedEmail: (email: Email) => void;
  componentId: string;
}> = ({ updateSelectedEmail, componentId }) => {
  const [emails] = useState<Email[]>(SAMPLE_EMAILS);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  
  const handleSelectEmail = (email: Email) => {
    setSelectedEmailId(email.id);
    updateSelectedEmail(email);
  };
  
  return (
    <div className="border rounded-md p-4 mb-4">
      <h2 className="text-lg font-bold mb-2">Email List (Provider - ID: {componentId.substring(0, 6)}...)</h2>
      <ul className="divide-y">
        {emails.map(email => (
          <li 
            key={email.id}
            className={`py-2 px-2 cursor-pointer hover:bg-gray-100 ${selectedEmailId === email.id ? 'bg-blue-100' : ''}`}
            onClick={() => handleSelectEmail(email)}
          >
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${email.isRead ? 'bg-gray-300' : 'bg-blue-500'}`}></span>
              <div>
                <p className="font-medium">{email.subject}</p>
                <p className="text-sm text-gray-600">{email.from}</p>
                <p className="text-xs text-gray-500">{email.date.toLocaleString()}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Email Viewer Component (Consumer)
const EmailViewerComponent: React.FC<{
  selectedEmail: Email | null;
  componentId: string;
}> = ({ selectedEmail, componentId }) => {
  return (
    <div className="border rounded-md p-4">
      <h2 className="text-lg font-bold mb-2">Email Viewer (Consumer - ID: {componentId.substring(0, 6)}...)</h2>
      
      {selectedEmail ? (
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold">{selectedEmail.subject}</h3>
            <p className="text-sm">
              <span className="font-medium">From:</span> {selectedEmail.from}
            </p>
            <p className="text-sm">
              <span className="font-medium">To:</span> {selectedEmail.to}
            </p>
            <p className="text-sm">
              <span className="font-medium">Date:</span> {selectedEmail.date.toLocaleString()}
            </p>
          </div>
          <div className="border-t pt-2">
            <p>{selectedEmail.body}</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>Select an email to view its content</p>
        </div>
      )}
    </div>
  );
};

// Main Demo Component
const EmailDependencyDemo: React.FC = () => {
  const dependency = useDependencyContext();
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [dependencyId, setDependencyId] = useState<string | null>(null);
  const [providerId] = useState<string>(uuidv4());
  const [consumerId] = useState<string>(uuidv4());
  
  // Register dependency definition if needed
  useEffect(() => {
    // Check if the dependency definition already exists
    const existingDefinition = dependency.getDependencyDefinitionsByProvider(ComponentType.EMAIL_LIST)
      .find(def => 
        def.consumerType === ComponentType.EMAIL_VIEWER && 
        def.dataType === DependencyDataType.EMAIL
      );
    
    let definitionId: string;
    
    if (!existingDefinition) {
      // Register a new dependency definition
      definitionId = dependency.registerDependencyDefinition({
        name: 'Email Selection',
        description: 'Email list provides selected email to email viewer',
        providerType: ComponentType.EMAIL_LIST,
        consumerType: ComponentType.EMAIL_VIEWER,
        dataType: DependencyDataType.EMAIL,
        syncStrategy: DependencySyncStrategy.PUSH,
        isRequired: false,
        isOneToMany: true,
        isManyToOne: false
      });
      console.log(`Registered new dependency definition: ${definitionId}`);
    } else {
      definitionId = existingDefinition.id;
      console.log(`Using existing dependency definition: ${definitionId}`);
    }
    
    // Create a new dependency instance
    const newDependencyId = dependency.createDependency(
      definitionId,
      providerId,
      consumerId
    );
    
    setDependencyId(newDependencyId);
    console.log(`Created dependency instance: ${newDependencyId}`);
    
    // Clean up
    return () => {
      if (dependencyId) {
        dependency.removeDependency(dependencyId);
        console.log(`Removed dependency instance: ${dependencyId}`);
      }
    };
  }, [dependency, providerId, consumerId]);
  
  // Update the dependency with the selected email
  const updateSelectedEmail = (email: Email) => {
    setSelectedEmail(email);
    
    if (dependencyId) {
      // Update the dependency data
      const success = dependency.updateDependencyData(dependencyId, email);
      
      if (success) {
        console.log(`Successfully updated dependency data for ${dependencyId}`);
        
        // Set the dependency as active and ready
        dependency.setDependencyStatus(dependencyId, DependencyStatus.ACTIVE);
      } else {
        console.error(`Failed to update dependency data for ${dependencyId}`);
      }
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Component Dependency System Demo</h1>
      
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">About This Demo</h2>
        <p className="mb-2">
          This demo illustrates the Component Dependency System in action with a simple email application example:
        </p>
        <ul className="list-disc pl-5 mb-2">
          <li>The <strong>Email List</strong> component is a <em>provider</em> that supplies selected email data</li>
          <li>The <strong>Email Viewer</strong> component is a <em>consumer</em> that displays the selected email</li>
          <li>The Dependency System manages the data flow between these components</li>
        </ul>
        <p>
          When you select an email in the list, the dependency system automatically updates the email viewer with the selected data.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EmailListComponent 
          updateSelectedEmail={updateSelectedEmail}
          componentId={providerId}
        />
        <EmailViewerComponent 
          selectedEmail={selectedEmail}
          componentId={consumerId}
        />
      </div>
      
      {dependencyId && (
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h2 className="text-lg font-bold mb-2">Dependency Information</h2>
          <p><strong>Dependency ID:</strong> {dependencyId}</p>
          <p><strong>Provider ID:</strong> {providerId}</p>
          <p><strong>Consumer ID:</strong> {consumerId}</p>
          <p><strong>Status:</strong> {dependency.getDependency(dependencyId)?.isActive ? 'Active' : 'Inactive'}</p>
          <p><strong>Data Type:</strong> Email</p>
        </div>
      )}
    </div>
  );
};

export default EmailDependencyDemo;