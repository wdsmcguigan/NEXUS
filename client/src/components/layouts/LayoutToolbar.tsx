import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Layout, 
  Save, 
  Plus, 
  Copy, 
  RotateCcw, 
  Check, 
  Settings,
  LayoutGrid,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LayoutManagementDialog } from './LayoutManagementDialog';
import { layoutPersistenceService, LayoutSummary } from '../../services/LayoutPersistenceService';
import { layoutSyncService } from '../../services/LayoutSyncService';
import { getAllTemplates } from '../../lib/layoutTemplates';
import { nanoid } from 'nanoid';

/**
 * Props for LayoutToolbar component
 */
interface LayoutToolbarProps {
  onLayoutSelected?: (layoutId: string) => void;
  onLayoutCreated?: (layoutId: string) => void;
  onResetToDefault?: () => void;
  className?: string;
}

/**
 * Toolbar for quick layout management actions
 */
export function LayoutToolbar({ 
  onLayoutSelected, 
  onLayoutCreated, 
  onResetToDefault,
  className = '' 
}: LayoutToolbarProps) {
  // State variables
  const [layouts, setLayouts] = useState<LayoutSummary[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [currentLayout, setCurrentLayout] = useState<string | null>(null);
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);
  
  // Load layouts and templates
  useEffect(() => {
    const loadedLayouts = layoutPersistenceService.getLayoutSummaries();
    setLayouts(loadedLayouts);
    
    const loadedTemplates = getAllTemplates();
    setTemplates(loadedTemplates);
    
    // Get current layout
    const current = layoutPersistenceService.getCurrentLayout();
    if (current) {
      setCurrentLayout(current.name);
    }
  }, []);
  
  // Handle saving the current layout
  const handleSaveLayout = () => {
    const success = layoutPersistenceService.saveCurrentLayout();
    if (success) {
      // Refresh layouts list
      setLayouts(layoutPersistenceService.getLayoutSummaries());
    }
  };
  
  // Handle creating a new layout from current
  const handleCreateFromCurrent = () => {
    const newLayoutId = `My Layout ${nanoid(4)}`;
    const layoutId = layoutPersistenceService.createLayoutFromCurrent(
      newLayoutId,
      {
        description: 'Custom layout created from current workspace'
      }
    );
    
    if (layoutId) {
      setLayouts(layoutPersistenceService.getLayoutSummaries());
      setCurrentLayout(layoutId);
      
      if (onLayoutCreated) {
        onLayoutCreated(layoutId);
      }
    }
  };
  
  // Handle selecting a layout
  const handleSelectLayout = (layoutId: string) => {
    const success = layoutPersistenceService.loadLayout(layoutId);
    if (success) {
      setCurrentLayout(layoutId);
      
      if (onLayoutSelected) {
        onLayoutSelected(layoutId);
      }
    }
  };
  
  // Handle selecting a template
  const handleSelectTemplate = (templateId: string) => {
    const newLayoutId = `${templateId} ${nanoid(4)}`;
    const layoutId = layoutPersistenceService.createLayoutFromTemplate(
      templateId as any,
      newLayoutId
    );
    
    if (layoutId) {
      const success = layoutPersistenceService.loadLayout(layoutId);
      if (success && onLayoutSelected) {
        onLayoutSelected(layoutId);
      }
    }
  };
  
  // Handle resetting to default layout
  const handleResetToDefault = () => {
    const success = layoutPersistenceService.resetToDefault();
    if (success && onResetToDefault) {
      onResetToDefault();
    }
  };
  
  // Filter layouts by device type
  const getDeviceLayouts = (deviceType: 'desktop' | 'tablet' | 'mobile' | 'any') => {
    return layouts.filter(
      layout => !layout.deviceType || layout.deviceType === deviceType || layout.deviceType === 'any'
    );
  };
  
  // Get icon for device type
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'tablet':
        return <Tablet className="h-4 w-4 mr-2" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4 mr-2" />;
      case 'desktop':
      default:
        return <Monitor className="h-4 w-4 mr-2" />;
    }
  };
  
  // Current device type
  const currentDeviceType = layoutSyncService.getDeviceType();
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            <span className="max-w-[150px] truncate">
              {currentLayout ? 
                layouts.find(l => l.id === currentLayout)?.name || 'Current Layout' : 
                'Layout'
              }
            </span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-[220px]">
          <DropdownMenuLabel>Manage Layouts</DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onSelect={handleSaveLayout}>
            <Save className="h-4 w-4 mr-2" />
            <span>Save Current Layout</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onSelect={handleCreateFromCurrent}>
            <Plus className="h-4 w-4 mr-2" />
            <span>Save as New Layout</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onSelect={handleResetToDefault}>
            <RotateCcw className="h-4 w-4 mr-2" />
            <span>Reset to Default</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="flex items-center text-xs">
            {getDeviceIcon(currentDeviceType)}
            <span>{currentDeviceType === 'other' ? 'Device' : currentDeviceType} Layouts</span>
          </DropdownMenuLabel>
          
          {getDeviceLayouts(currentDeviceType as any).length === 0 ? (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">No layouts found</span>
            </DropdownMenuItem>
          ) : (
            getDeviceLayouts(currentDeviceType as any).map(layout => (
              <DropdownMenuItem 
                key={layout.id} 
                onSelect={() => handleSelectLayout(layout.id)}
                disabled={layout.id === currentLayout}
              >
                <div className="flex items-center gap-2 truncate w-full">
                  <span className="truncate flex-1">{layout.name}</span>
                  {layout.id === currentLayout && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                  {layout.isDefault && (
                    <Badge variant="outline" className="text-xs">Default</Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs">Templates</DropdownMenuLabel>
          
          {templates.slice(0, 5).map(template => (
            <DropdownMenuItem 
              key={template.name} 
              onSelect={() => handleSelectTemplate(template.name)}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              <span className="truncate">{template.name}</span>
            </DropdownMenuItem>
          ))}
          
          {templates.length > 5 && (
            <DropdownMenuItem onSelect={() => setShowLayoutDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              <span>More templates...</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onSelect={() => setShowLayoutDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            <span>Layout Manager</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Layout Management Dialog */}
      <LayoutManagementDialog 
        trigger={<div className="hidden" />} // Hidden trigger, shown via dropdown
        onLayoutSelected={handleSelectLayout}
        onTemplateSelected={handleSelectTemplate}
        onResetToDefault={handleResetToDefault}
      />
    </div>
  );
}