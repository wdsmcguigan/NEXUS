import React from 'react';
import { DependencyStatus } from '../../lib/dependency/DependencyInterfaces';
import { 
  Link, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface DependencyStatusIndicatorProps {
  status: DependencyStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const DependencyStatusIndicator: React.FC<DependencyStatusIndicatorProps> = ({
  status,
  size = 'sm',
  showLabel = false,
  className
}) => {
  // Define styles based on status
  const getStatusConfig = () => {
    switch (status) {
      case DependencyStatus.DISCONNECTED:
        return {
          icon: <XCircle className={sizeClasses.icon} />,
          label: 'Disconnected',
          color: 'text-muted-foreground'
        };
      case DependencyStatus.CONNECTING:
        return {
          icon: <Clock className={sizeClasses.icon} />,
          label: 'Connecting',
          color: 'text-yellow-500 animate-pulse'
        };
      case DependencyStatus.CONNECTED:
        return {
          icon: <Link className={sizeClasses.icon} />,
          label: 'Connected',
          color: 'text-blue-500'
        };
      case DependencyStatus.ERROR:
        return {
          icon: <AlertTriangle className={sizeClasses.icon} />,
          label: 'Error',
          color: 'text-red-500'
        };
      case DependencyStatus.READY:
        return {
          icon: <CheckCircle2 className={sizeClasses.icon} />,
          label: 'Ready',
          color: 'text-green-500'
        };
      default:
        return {
          icon: <XCircle className={sizeClasses.icon} />,
          label: 'Unknown',
          color: 'text-muted-foreground'
        };
    }
  };

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-4 gap-1',
          icon: 'h-3.5 w-3.5',
          text: 'text-xs'
        };
      case 'md':
        return {
          container: 'h-5 gap-1.5',
          icon: 'h-4 w-4',
          text: 'text-sm'
        };
      case 'lg':
        return {
          container: 'h-6 gap-2',
          icon: 'h-5 w-5',
          text: 'text-sm font-medium'
        };
      default:
        return {
          container: 'h-4 gap-1',
          icon: 'h-3.5 w-3.5',
          text: 'text-xs'
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const statusConfig = getStatusConfig();

  return (
    <div 
      className={cn(
        'flex items-center', 
        sizeClasses.container, 
        statusConfig.color,
        className
      )}
    >
      {statusConfig.icon}
      {showLabel && (
        <span className={sizeClasses.text}>{statusConfig.label}</span>
      )}
    </div>
  );
};

export default DependencyStatusIndicator;