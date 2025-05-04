import React, { useState } from 'react';
import { DragProvider, useDragContext } from '../context/DragContext';

// A component to display the current drag state
function DragStateDisplay() {
  const { dragState } = useDragContext();
  
  return (
    <div className="fixed top-4 right-4 bg-black/70 p-4 rounded shadow-lg max-w-xs text-xs">
      <h3 className="text-white font-bold mb-2">Drag State:</h3>
      <pre className="text-green-400 overflow-auto max-h-[300px]">
        {JSON.stringify(dragState, null, 2)}
      </pre>
    </div>
  );
}

// A single draggable item
function DraggableItem({ id, text, color }: { id: string; text: string; color: string }) {
  const { startDrag, moveDrag, endDrag } = useDragContext();
  
  const handleMouseDown = (e: React.MouseEvent) => {
    // Start drag operation
    startDrag(id, text, 'test-panel', e.clientX, e.clientY);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveDrag(moveEvent.clientX, moveEvent.clientY);
    };
    
    const handleMouseUp = () => {
      // Clean up
      endDrag();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div
      className="w-32 h-32 rounded-lg flex items-center justify-center cursor-grab shadow-md font-bold text-white"
      style={{ backgroundColor: color }}
      onMouseDown={handleMouseDown}
    >
      {text}
    </div>
  );
}

// Drop zone component
function DropZone({ id, onDrop }: { id: string; onDrop: (itemId: string) => void }) {
  const { dragState, setDropTarget, clearDropTarget } = useDragContext();
  
  const handleMouseEnter = () => {
    if (dragState.isDragging) {
      setDropTarget({ panelId: id, targetZone: 'after' });
    }
  };
  
  const handleMouseLeave = () => {
    if (dragState.isDragging) {
      clearDropTarget();
    }
  };
  
  const handleMouseUp = () => {
    if (dragState.isDragging && dragState.draggedTabId && dragState.dropIndicator.visible) {
      onDrop(dragState.draggedTabId);
    }
  };
  
  const isActive = dragState.dropIndicator.visible && dragState.dropIndicator.targetPanelId === id;
  
  return (
    <div
      className={`w-64 h-64 border-2 rounded-lg flex items-center justify-center transition-colors ${
        isActive ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-800/30'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
    >
      <p className="text-center">
        <span className="block text-lg font-semibold mb-2">Drop Zone: {id}</span>
        <span className="text-sm text-gray-400">
          {isActive ? 'Drop here!' : 'Drag an item here'}
        </span>
      </p>
    </div>
  );
}

// Visual indicator for dragged item
function DraggedItemOverlay() {
  const { dragState } = useDragContext();
  
  if (!dragState.isDragging) return null;
  
  return (
    <div
      className="fixed pointer-events-none bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded shadow-lg z-50 transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: dragState.lastClientX,
        top: dragState.lastClientY
      }}
    >
      {dragState.draggedTabTitle}
    </div>
  );
}

// The main test component
export function BasicDragTest() {
  const [log, setLog] = useState<string[]>([]);
  
  const addLogEntry = (message: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 9)]);
  };
  
  const handleDrop = (itemId: string, zoneId: string) => {
    addLogEntry(`Dropped item ${itemId} onto zone ${zoneId}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">Basic Drag Test</h1>
      <p className="text-gray-400 mb-8">Simple test for drag and drop functionality</p>
      
      <div className="flex flex-wrap gap-8">
        {/* Draggable items */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-2">Draggable Items</h2>
          <div className="flex gap-4">
            <DraggableItem id="red" text="Red Item" color="#e74c3c" />
            <DraggableItem id="blue" text="Blue Item" color="#3498db" />
            <DraggableItem id="green" text="Green Item" color="#2ecc71" />
          </div>
        </div>
        
        {/* Drop zones */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-2">Drop Zones</h2>
          <div className="flex gap-4">
            <DropZone id="zone1" onDrop={(itemId) => handleDrop(itemId, "zone1")} />
            <DropZone id="zone2" onDrop={(itemId) => handleDrop(itemId, "zone2")} />
          </div>
        </div>
      </div>
      
      {/* Activity log */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Activity Log</h2>
        <div className="bg-black rounded p-4 max-h-[200px] overflow-y-auto font-mono text-sm">
          {log.length === 0 ? (
            <p className="text-gray-500">No activity yet. Try dragging and dropping items.</p>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="text-green-400 mb-1">
                {entry}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Show the drag state and overlay */}
      <DragStateDisplay />
      <DraggedItemOverlay />
    </div>
  );
}

// Wrapper with context
export function BasicDragTestWithProvider() {
  return (
    <DragProvider>
      <BasicDragTest />
    </DragProvider>
  );
}