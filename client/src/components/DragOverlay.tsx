import React, { useEffect, useState } from 'react';

// Define types for drop zones
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
  const [highlightedZone, setHighlightedZone] = useState<DropZone | null>(null);
  
  // Find all drop zones in the application when the overlay becomes active
  useEffect(() => {
    if (!active) {
      setDropZones([]);
      setHighlightedZone(null);
      return;
    }
    
    // Find panel drop zones (all panel elements)
    const panelEls = document.querySelectorAll('[data-panel-drop-zone]');
    const panelZones: DropZone[] = Array.from(panelEls).map(el => ({
      id: el.getAttribute('data-panel-id') || '',
      rect: el.getBoundingClientRect(),
      type: 'panel'
    }));
    
    // Find edge drop zones
    const edgeEls = document.querySelectorAll('[data-edge-drop-zone]');
    const edgeZones: DropZone[] = Array.from(edgeEls).map(el => ({
      id: el.getAttribute('data-panel-id') || '',
      rect: el.getBoundingClientRect(),
      type: 'edge',
      direction: el.getAttribute('data-edge-direction') as 'top' | 'right' | 'bottom' | 'left'
    }));
    
    setDropZones([...panelZones, ...edgeZones]);
  }, [active]);
  
  // Handle mouse movement to highlight appropriate zone
  const handleMouseMove = (e: MouseEvent) => {
    if (!active || dropZones.length === 0) return;
    
    const { clientX, clientY } = e;
    let closestZone: DropZone | null = null;
    let closestDistance = Infinity;
    
    dropZones.forEach(zone => {
      const { rect } = zone;
      
      // Check if mouse is inside the zone
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        // For panel zones, calculate distance from center
        if (zone.type === 'panel') {
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const distance = Math.sqrt(
            Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
          );
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestZone = zone;
          }
        } 
        // For edge zones, just use the first one found (they shouldn't overlap)
        else if (zone.type === 'edge') {
          closestZone = zone;
          closestDistance = 0; // Edge zones take precedence
        }
      }
    });
    
    setHighlightedZone(closestZone);
  };
  
  // Handle mouse up to trigger drop
  const handleMouseUp = () => {
    if (!active || !highlightedZone) return;
    
    onDrop(
      highlightedZone.id,
      highlightedZone.type,
      highlightedZone.direction
    );
    
    setHighlightedZone(null);
  };
  
  // Add and remove event listeners
  useEffect(() => {
    if (active) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [active, dropZones, highlightedZone]);
  
  if (!active) return null;
  
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Render overlay for the highlighted drop zone */}
      {highlightedZone && (
        <div
          className={
            highlightedZone.type === 'panel'
              ? 'absolute bg-primary/20 border-2 border-primary rounded-md'
              : 'absolute bg-primary/40 border-2 border-primary'
          }
          style={{
            left: highlightedZone.rect.left,
            top: highlightedZone.rect.top,
            width: highlightedZone.rect.width,
            height: highlightedZone.rect.height,
            transition: 'all 0.1s ease-in-out'
          }}
        />
      )}
    </div>
  );
}