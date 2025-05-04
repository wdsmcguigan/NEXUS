import React, { useState } from 'react';
import { Mail, FileText, User, Settings } from 'lucide-react';
import { useDragContext } from '../context/DragContext';
import { DragOverlay } from './DragOverlay';

// Simple component for testing tab drag and drop
export function TabDragTest() {
  const [tabs] = useState([
    { id: 'tab1', title: 'Email', icon: <Mail size={16} /> },
    { id: 'tab2', title: 'Documents', icon: <FileText size={16} /> },
    { id: 'tab3', title: 'Contacts', icon: <User size={16} /> },
    { id: 'tab4', title: 'Settings', icon: <Settings size={16} /> }
  ]);
  
  const [activeTab, setActiveTab] = useState('tab1');
  const { dragState, startDrag, moveDrag, endDrag } = useDragContext();
  
  // Log drag state for debugging
  const logDragState = () => {
    console.log('Current drag state:', dragState);
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-4 text-center">
        <h1 className="text-xl font-bold">Tab Drag System Test</h1>
        <p className="text-sm text-gray-400">Simple test harness for the tab drag system</p>
      </div>
      
      <div className="flex p-4">
        <div className="flex bg-gray-800 rounded-md overflow-hidden">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`
                flex items-center px-4 py-2 cursor-pointer
                ${activeTab === tab.id ? 'bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}
              `}
              onClick={() => setActiveTab(tab.id)}
              onMouseDown={(e) => {
                // Start drag on mouse down
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  // Move the drag state with mouse
                  moveDrag(moveEvent.clientX, moveEvent.clientY);
                };
                
                const handleMouseUp = () => {
                  // End drag on mouse up
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                  endDrag();
                };
                
                // Start drag with tab info
                startDrag(tab.id, tab.title, 'main-panel', e.clientX, e.clientY, tab.icon);
                
                // Add listeners for drag tracking
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <span className="mr-2">{tab.icon}</span>
              <span>{tab.title}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <div className="bg-gray-800 p-4 rounded-md h-full flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Active Tab: {activeTab}</h2>
          
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Drag State:</h3>
            <pre className="bg-gray-700 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(dragState, null, 2)}
            </pre>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8 border border-dashed border-gray-600 rounded-lg">
              <p>Try dragging tabs from above</p>
              <p className="text-xs text-gray-500 mt-2">
                {dragState.isDragging 
                  ? 'Currently dragging: ' + dragState.draggedTabTitle
                  : 'No drag in progress'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex justify-center">
          <button 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            onClick={logDragState}
          >
            Log Drag State
          </button>
        </div>
      </div>
      
      {/* Render the drag overlay */}
      <DragOverlay />
    </div>
  );
}