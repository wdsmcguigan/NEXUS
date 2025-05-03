import React, { useState, useEffect } from 'react';

interface DropZone {
  id: string;
  rect: DOMRect;
  type: 'panel' | 'edge';
  direction?: 'top' | 'right' | 'bottom' | 'left';
}

interface DragOverlayProps {
  active: boolean;
  onDrop: (zoneId: string, type: 'panel' | 'edge', direction?: 'top' | 'right' | 'bottom' | 'left') => void;
}

export function DragOverlay({ active, onDrop }: DragOverlayProps) {
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [hoveredZone, setHoveredZone] = useState<DropZone | null>(null);
  
  // Calculate drop zones when active
  useEffect(() => {
    if (active) {
      // Find all panels
      const panels = document.querySelectorAll('[data-panel-id]');
      
      const zones: DropZone[] = [];
      
      panels.forEach(panel => {
        const id = panel.getAttribute('data-panel-id') || '';
        const rect = panel.getBoundingClientRect();
        
        // Center zone (for dropping tabs into panels)
        zones.push({
          id,
          rect,
          type: 'panel'
        });
        
        // Edge zones (for creating new panels)
        const edgeSize = 20; // Size of edge detection zone
        
        // Top edge
        zones.push({
          id,
          rect: new DOMRect(rect.left, rect.top, rect.width, edgeSize),
          type: 'edge',
          direction: 'top'
        });
        
        // Right edge
        zones.push({
          id,
          rect: new DOMRect(rect.right - edgeSize, rect.top, edgeSize, rect.height),
          type: 'edge',
          direction: 'right'
        });
        
        // Bottom edge
        zones.push({
          id,
          rect: new DOMRect(rect.left, rect.bottom - edgeSize, rect.width, edgeSize),
          type: 'edge',
          direction: 'bottom'
        });
        
        // Left edge
        zones.push({
          id,
          rect: new DOMRect(rect.left, rect.top, edgeSize, rect.height),
          type: 'edge',
          direction: 'left'
        });
      });
      
      setDropZones(zones);
    } else {
      setDropZones([]);
      setHoveredZone(null);
    }
  }, [active]);
  
  // Track mouse position and update hovered zone
  useEffect(() => {
    if (!active) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      
      // Find which zone the mouse is over
      const zone = dropZones.find(zone => {
        const { rect } = zone;
        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        );
      }) || null;
      
      setHoveredZone(zone);
    };
    
    const handleMouseUp = () => {
      if (hoveredZone) {
        onDrop(hoveredZone.id, hoveredZone.type, hoveredZone.direction);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [active, dropZones, hoveredZone, onDrop]);
  
  if (!active) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {hoveredZone && (
        <div 
          className={`absolute ${
            hoveredZone.type === 'panel' ? 'bg-primary/10' : 'bg-primary/30'
          }`}
          style={{
            left: hoveredZone.rect.left,
            top: hoveredZone.rect.top,
            width: hoveredZone.rect.width,
            height: hoveredZone.rect.height,
            border: hoveredZone.type === 'edge' ? '2px solid var(--primary)' : 'none'
          }}
        />
      )}
    </div>
  );
}