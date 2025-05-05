import React from 'react';
import { DependencyStatus } from '../../lib/dependency/DependencyInterfaces';
import { cn } from '../../lib/utils';
import { CircleSlash, AlertCircle, CheckCircle, AlertTriangle, HelpCircle, Clock, Repeat } from 'lucide-react';

type DependencyStatusIndicatorProps = {
  status: DependencyStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function DependencyStatusIndicator({ 
  status,
  size = 'sm',
  className
}: DependencyStatusIndicatorProps) {
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size];
  
  const getIconForStatus = () => {
    switch (status) {
      case DependencyStatus.CONNECTED:
        return <CheckCircle className={cn(iconSize, "text-green-500", className)} />;
      case DependencyStatus.DISCONNECTED:
        return <CircleSlash className={cn(iconSize, "text-gray-400", className)} />;
      case DependencyStatus.ERROR:
        return <AlertCircle className={cn(iconSize, "text-red-500", className)} />;
      case DependencyStatus.CONNECTING:
        return <Clock className={cn(iconSize, "text-amber-400", className)} />;
      case DependencyStatus.READY:
        return <CheckCircle className={cn(iconSize, "text-blue-500", className)} />;
      case DependencyStatus.CYCLE_DETECTED:
        return <Repeat className={cn(iconSize, "text-purple-500", className)} />;
      case DependencyStatus.OPTIMIZING:
        return <AlertTriangle className={cn(iconSize, "text-yellow-500", className)} />;
      default:
        return <HelpCircle className={cn(iconSize, "text-blue-400", className)} />;
    }
  };

  return getIconForStatus();
}

export default DependencyStatusIndicator;