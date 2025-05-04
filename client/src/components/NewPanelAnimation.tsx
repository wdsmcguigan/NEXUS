import React, { useEffect, useState } from 'react';

interface NewPanelAnimationProps {
  isVisible: boolean;
  duration?: number; // in milliseconds
}

/**
 * This component provides a brief highlight animation when a new panel is created
 * to provide visual feedback to the user that a panel split operation has occurred.
 */
export function NewPanelAnimation({ isVisible, duration = 1500 }: NewPanelAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Show the animation
      setShowAnimation(true);
      
      // Hide it after duration
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);
  
  if (!showAnimation) {
    return null;
  }
  
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Gradient border animation */}
      <div className="absolute inset-0 opacity-0 animate-fadeIn" 
           style={{ animationDuration: '300ms', animationFillMode: 'forwards' }}>
        {/* Border effect */}
        <div className="absolute inset-0 border-2 border-blue-500 animate-pulse"></div>
        
        {/* Corner highlights */}
        <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-blue-400 rounded-tl"></div>
        <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-blue-400 rounded-tr"></div>
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-blue-400 rounded-bl"></div>
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-blue-400 rounded-br"></div>
      </div>
      
      {/* Central flash animation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 bg-blue-500 rounded-full opacity-0 animate-ping" 
             style={{ animationDuration: '800ms', animationIterationCount: 2 }}></div>
      </div>
      
      {/* Fade out animation */}
      <div className="absolute inset-0 opacity-0 animate-fadeIn animate-fadeOut bg-blue-500 bg-opacity-5"
           style={{ animationDuration: '300ms', animationDelay: `${duration - 300}ms` }}></div>
    </div>
  );
}