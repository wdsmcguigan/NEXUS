import React, { useState, useEffect } from 'react';
import { useDependencyContext } from '../../context/DependencyContext';
import { 
  DependencyStatus,
  DependencyDataTypes 
} from '../../lib/dependency/DependencyInterfaces';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../ui/popover';
import { Button } from '../ui/button';
import {
  Link,
  Link2,
  Info,
  Link2Off as LinkOff,
  ArrowLeftRight
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../ui/tooltip';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import DependencyManager from './DependencyManager';

interface DependencyIndicatorProps {
  componentId: string;
  variant?: 'icon' | 'badge' | 'dot' | 'minimal';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
  className?: string;
}

const DependencyIndicator: React.FC<DependencyIndicatorProps> = ({
  componentId,
  variant = 'icon',
  position = 'top-right',
  className
}) => {
  const { registry, manager } = useDependencyContext();
  const [dependencyCount, setDependencyCount] = useState({
    asProvider: 0,
    asConsumer: 0,
    totalActive: 0
  });
  const [open, setOpen] = useState(false);

  // Count dependencies and update periodically
  useEffect(() => {
    const countDependencies = () => {
      // Get dependencies where this component is a provider
      const asProvider = registry.getDependenciesByProvider(componentId);
      
      // Get dependencies where this component is a consumer
      const asConsumer = registry.getDependenciesByConsumer(componentId);
      
      // Count active connections (status is CONNECTED or READY)
      const totalActive = [...asProvider, ...asConsumer].filter(
        dep => dep.status === DependencyStatus.CONNECTED || dep.status === DependencyStatus.READY
      ).length;
      
      setDependencyCount({
        asProvider: asProvider.length,
        asConsumer: asConsumer.length,
        totalActive
      });
    };
    
    countDependencies();
    
    // Set up an interval to refresh dependencies periodically
    const interval = setInterval(countDependencies, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [componentId, registry]);

  // Check if there are any dependencies at all
  const hasDependencies = dependencyCount.asProvider > 0 || dependencyCount.asConsumer > 0;
  
  // Determine the status color
  const getStatusColor = () => {
    if (dependencyCount.totalActive === 0 && hasDependencies) {
      return 'text-red-500 bg-red-500/10 border-red-500/20'; // Error state
    } else if (dependencyCount.totalActive > 0 && dependencyCount.totalActive < dependencyCount.asProvider + dependencyCount.asConsumer) {
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'; // Partial connections
    } else if (dependencyCount.totalActive > 0) {
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20'; // Active connections
    } else {
      return 'text-muted-foreground bg-muted border-muted-foreground/20'; // No dependencies
    }
  };

  // Get indicator content based on variant
  const getIndicatorContent = () => {
    switch (variant) {
      case 'icon':
        if (dependencyCount.asProvider > 0 && dependencyCount.asConsumer > 0) {
          return <ArrowLeftRight className="h-3.5 w-3.5" />;
        } else if (dependencyCount.asProvider > 0) {
          return <Link2 className="h-3.5 w-3.5" />;
        } else if (dependencyCount.asConsumer > 0) {
          return <Link className="h-3.5 w-3.5" />;
        } else {
          return <LinkOff className="h-3.5 w-3.5" />;
        }
      
      case 'badge':
        return (
          <Badge variant="outline" className={cn("text-xs py-0 px-1.5 gap-1", getStatusColor())}>
            {hasDependencies ? (
              <>
                {dependencyCount.asProvider > 0 && dependencyCount.asConsumer > 0 ? (
                  <ArrowLeftRight className="h-3 w-3" />
                ) : dependencyCount.asProvider > 0 ? (
                  <Link2 className="h-3 w-3" />
                ) : (
                  <Link className="h-3 w-3" />
                )}
                <span>{dependencyCount.asProvider + dependencyCount.asConsumer}</span>
              </>
            ) : (
              <>
                <LinkOff className="h-3 w-3" />
                <span>0</span>
              </>
            )}
          </Badge>
        );
      
      case 'dot':
        return (
          <div className={cn("h-2 w-2 rounded-full", getStatusColor().split(' ')[0])} />
        );
        
      case 'minimal':
        if (!hasDependencies) return null;
        return (
          <div className={cn("h-1.5 w-1.5 rounded-full", getStatusColor().split(' ')[0])} />
        );
        
      default:
        return (
          <Badge variant="outline" className={cn("text-xs py-0 px-1.5", getStatusColor())}>
            <Link className="h-3 w-3 mr-1" />
            {dependencyCount.asProvider + dependencyCount.asConsumer}
          </Badge>
        );
    }
  };

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'absolute top-1 right-1';
      case 'top-left':
        return 'absolute top-1 left-1';
      case 'bottom-right':
        return 'absolute bottom-1 right-1';
      case 'bottom-left':
        return 'absolute bottom-1 left-1';
      case 'inline':
        return 'inline-flex';
      default:
        return 'absolute top-1 right-1';
    }
  };

  const indicatorContent = getIndicatorContent();
  
  // If variant is minimal and there are no dependencies, return null
  if (variant === 'minimal' && !hasDependencies) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <div 
                className={cn(
                  getPositionClasses(),
                  'z-10 cursor-pointer',
                  className
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(true);
                }}
              >
                {indicatorContent}
              </div>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="font-medium">Component Dependencies</div>
              <div>Provides data: {dependencyCount.asProvider}</div>
              <div>Consumes data: {dependencyCount.asConsumer}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <PopoverContent side="bottom" align="end" className="w-[350px] p-0">
        <DependencyManager 
          componentId={componentId}
          title={componentId}
          description={`Manage dependencies for this component`}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DependencyIndicator;