import React, { useState, useEffect } from 'react';
import { useDependencyContext } from '../../context/DependencyContext';
import { DependencyStatus, DependencyDataTypes } from '../../lib/dependency/DependencyInterfaces';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle, Link, Unlink } from 'lucide-react';

export type DependencyIndicatorProps = {
  componentId: string;
  dataType?: DependencyDataTypes;
  variant?: 'dot' | 'badge' | 'icon';
  position?: 'top-right' | 'bottom-right' | 'inline';
  className?: string;
  showTooltip?: boolean;
  showEmpty?: boolean;
};

export function DependencyIndicator({
  componentId,
  dataType,
  variant = 'dot',
  position = 'top-right',
  className,
  showTooltip = true,
  showEmpty = false
}: DependencyIndicatorProps) {
  const { registry } = useDependencyContext();
  const [statuses, setStatuses] = useState<Record<string, DependencyStatus>>({});
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    // Check if this component has any dependency definitions
    const definitions = registry.getDefinitionsByComponent(componentId);
    setIsActive(definitions.length > 0);
    
    // Get status for each data type
    const statusMap: Record<string, DependencyStatus> = {};
    
    // For each definition, get related dependencies and their statuses
    definitions.forEach(def => {
      if (def.role === 'provider' || def.role === 'both') {
        const deps = registry.getDependenciesByProvider(componentId);
        deps.forEach(dep => {
          if (!statusMap[dep.dataType] || getStatusPriority(dep.status) > getStatusPriority(statusMap[dep.dataType])) {
            statusMap[dep.dataType] = dep.status;
          }
        });
      }
      
      if (def.role === 'consumer' || def.role === 'both') {
        const deps = registry.getDependenciesByConsumer(componentId);
        deps.forEach(dep => {
          if (!statusMap[dep.dataType] || getStatusPriority(dep.status) > getStatusPriority(statusMap[dep.dataType])) {
            statusMap[dep.dataType] = dep.status;
          }
        });
      }
    });
    
    setStatuses(statusMap);
  }, [componentId, registry]);
  
  // Status priority for displaying the most important status
  const getStatusPriority = (status: DependencyStatus): number => {
    switch (status) {
      case DependencyStatus.ERROR:
        return 5;
      case DependencyStatus.CYCLE_DETECTED:
        return 4;
      case DependencyStatus.DISCONNECTED:
        return 3;
      case DependencyStatus.CONNECTING:
        return 2;
      case DependencyStatus.CONNECTED:
        return 1;
      case DependencyStatus.READY:
        return 0;
      default:
        return -1;
    }
  };
  
  // Get the most important status
  const getHighestPriorityStatus = (): DependencyStatus | null => {
    if (Object.keys(statuses).length === 0) {
      return null;
    }
    
    let highestPriority = -1;
    let highestStatus: DependencyStatus | null = null;
    
    Object.entries(statuses).forEach(([type, status]) => {
      if (!dataType || type === dataType) {
        const priority = getStatusPriority(status);
        if (priority > highestPriority) {
          highestPriority = priority;
          highestStatus = status;
        }
      }
    });
    
    return highestStatus;
  };
  
  const getStatusColor = (status: DependencyStatus | null): string => {
    if (!status) return 'bg-gray-300';
    
    switch (status) {
      case DependencyStatus.CONNECTED:
      case DependencyStatus.READY:
        return 'bg-green-500';
      case DependencyStatus.CONNECTING:
        return 'bg-blue-500';
      case DependencyStatus.DISCONNECTED:
        return 'bg-gray-400';
      case DependencyStatus.ERROR:
        return 'bg-red-500';
      case DependencyStatus.CYCLE_DETECTED:
        return 'bg-purple-500';
      case DependencyStatus.OPTIMIZING:
        return 'bg-amber-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getPositionClass = (): string => {
    switch (position) {
      case 'top-right':
        return 'absolute -top-1 -right-1';
      case 'bottom-right':
        return 'absolute -bottom-1 -right-1';
      case 'inline':
        return 'relative inline-flex';
      default:
        return '';
    }
  };
  
  const getStatusTooltip = (): string => {
    const highestStatus = getHighestPriorityStatus();
    const definitionCount = registry.getDefinitionsByComponent(componentId).length;
    
    if (!isActive || !highestStatus) {
      return `Component: ${componentId}\nNo dependencies`;
    }
    
    let tooltip = `Component: ${componentId}\n`;
    tooltip += `Status: ${highestStatus}\n`;
    tooltip += `Definitions: ${definitionCount}`;
    
    if (Object.keys(statuses).length > 0) {
      tooltip += '\n\nData Types:';
      Object.entries(statuses).forEach(([type, status]) => {
        tooltip += `\n• ${type}: ${status}`;
      });
    }
    
    return tooltip;
  };
  
  const statusColor = getStatusColor(getHighestPriorityStatus());
  
  // Only hide the indicator if we're not showing empty state and there are no dependencies
  if (!isActive && !showEmpty) return null;
  
  const renderIndicator = () => {
    const highestStatus = getHighestPriorityStatus();
    
    switch (variant) {
      case 'dot':
        return (
          <div 
            className={cn(
              'h-2 w-2 rounded-full',
              statusColor,
              getPositionClass(),
              'border border-background',
              className
            )} 
          />
        );
        
      case 'badge':
        return (
          <Badge 
            variant="outline" 
            className={cn(
              'text-xs py-0 h-5 font-normal',
              highestStatus === DependencyStatus.ERROR ? 'border-red-500 text-red-600' :
              highestStatus === DependencyStatus.DISCONNECTED ? 'border-gray-400 text-gray-500' :
              'border-green-500 text-green-600',
              className
            )}
          >
            <div className={cn('h-1.5 w-1.5 rounded-full mr-1', statusColor)} />
            {Object.keys(statuses).length}
          </Badge>
        );
        
      case 'icon':
        return (
          <div className={cn('relative', className)}>
            {highestStatus === DependencyStatus.ERROR && <AlertCircle className="h-4 w-4 text-red-500" />}
            {highestStatus === DependencyStatus.DISCONNECTED && <Unlink className="h-4 w-4 text-gray-400" />}
            {(highestStatus === DependencyStatus.CONNECTED || highestStatus === DependencyStatus.READY) && 
              <CheckCircle className="h-4 w-4 text-green-500" />}
            {!highestStatus && <Link className="h-4 w-4 text-gray-400" />}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (!showTooltip) {
    return renderIndicator();
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {renderIndicator()}
        </TooltipTrigger>
        <TooltipContent className="whitespace-pre-wrap text-xs p-2">
          {getStatusTooltip()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default DependencyIndicator;