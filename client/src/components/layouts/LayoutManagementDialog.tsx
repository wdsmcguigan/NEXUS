import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Plus, 
  Copy, 
  Trash2, 
  Download, 
  Upload, 
  Save, 
  CheckCircle2, 
  Search, 
  Tag, 
  Bookmark,
  LayoutGrid, 
  FileText, 
  Search as SearchIcon
} from 'lucide-react';
import { layoutPersistenceService, LayoutSummary, StorageType } from '../../services/LayoutPersistenceService';
import { 
  getAllTemplates, 
  getTemplatesByCategory, 
  getTemplateById 
} from '../../lib/layoutTemplates';
import { LayoutTemplateType } from '../../lib/layoutSerialization';

/**
 * Props for the LayoutManagementDialog component
 */
interface LayoutManagementDialogProps {
  trigger?: React.ReactNode;
  onLayoutSelected?: (layoutId: string) => void;
  onTemplateSelected?: (templateId: string) => void;
  onResetToDefault?: () => void;
}

/**
 * Dialog for managing layout templates and saved layouts
 */
export function LayoutManagementDialog({
  trigger,
  onLayoutSelected,
  onTemplateSelected,
  onResetToDefault
}: LayoutManagementDialogProps) {
  // State for the dialog
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('saved');
  
  // Layout management state
  const [layouts, setLayouts] = useState<LayoutSummary[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [currentLayout, setCurrentLayout] = useState<string | null>(null);
  const [defaultLayout, setDefaultLayout] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // New layout form state
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutDescription, setNewLayoutDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Import/export state
  const [importJson, setImportJson] = useState('');
  const [exportJson, setExportJson] = useState('');
  const [importError, setImportError] = useState('');
  
  // Initialize data
  useEffect(() => {
    if (isOpen) {
      // Load layouts
      const loadedLayouts = layoutPersistenceService.getLayoutSummaries();
      setLayouts(loadedLayouts);
      
      // Load templates
      const loadedTemplates = getAllTemplates();
      setTemplates(loadedTemplates);
      
      // Get current and default layouts
      const current = layoutPersistenceService.getCurrentLayout();
      if (current) {
        setCurrentLayout(current.name);
      }
      
      const defaultLayout = layoutPersistenceService.getDefaultLayout();
      if (defaultLayout) {
        setDefaultLayout(defaultLayout.name);
      }
    }
  }, [isOpen]);
  
  // Filter layouts based on search query and category
  const filteredLayouts = layouts.filter(layout => {
    // Filter by search query
    const matchesSearch = 
      searchQuery === '' || 
      layout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (layout.description && layout.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (layout.tags && layout.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    // Filter by category
    const matchesCategory = 
      categoryFilter === 'all' || 
      layout.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Filter templates based on search query and category
  const filteredTemplates = templates.filter(template => {
    // Filter by search query
    const matchesSearch = 
      searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (template.tags && template.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    // Filter by category
    const matchesCategory = 
      categoryFilter === 'all' || 
      template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Get available categories
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: LayoutTemplateType.DEFAULT, name: 'Default' },
    { id: LayoutTemplateType.EMAIL_TRIAGE, name: 'Email Triage' },
    { id: LayoutTemplateType.WRITING_MODE, name: 'Writing Mode' },
    { id: LayoutTemplateType.PRODUCTIVITY, name: 'Productivity' },
    { id: LayoutTemplateType.COMMUNICATION, name: 'Communication' },
    { id: LayoutTemplateType.RESEARCH, name: 'Research' },
    { id: LayoutTemplateType.COMPACT, name: 'Compact' },
    { id: LayoutTemplateType.EXPANDED, name: 'Expanded' },
    { id: LayoutTemplateType.FOCUSED, name: 'Focused' },
    { id: LayoutTemplateType.CUSTOM, name: 'Custom' }
  ];
  
  // Handle selecting a layout
  const handleSelectLayout = (layoutId: string) => {
    if (onLayoutSelected) {
      onLayoutSelected(layoutId);
    }
    setIsOpen(false);
  };
  
  // Handle selecting a template
  const handleSelectTemplate = (templateId: string) => {
    if (onTemplateSelected) {
      onTemplateSelected(templateId);
    }
    setIsOpen(false);
  };
  
  // Handle creating a new layout from a template
  const handleCreateFromTemplate = () => {
    if (!newLayoutName || !selectedTemplate) return;
    
    const layoutId = layoutPersistenceService.createLayoutFromTemplate(
      selectedTemplate as LayoutTemplateType,
      newLayoutName,
      {
        description: newLayoutDescription,
        category: LayoutTemplateType.CUSTOM
      }
    );
    
    if (layoutId && onLayoutSelected) {
      onLayoutSelected(layoutId);
      setIsOpen(false);
    }
  };
  
  // Handle duplicating a layout
  const handleDuplicateLayout = (layoutId: string) => {
    const newLayoutId = layoutPersistenceService.duplicateLayout(layoutId);
    if (newLayoutId) {
      // Refresh the layouts list
      setLayouts(layoutPersistenceService.getLayoutSummaries());
    }
  };
  
  // Handle deleting a layout
  const handleDeleteLayout = (layoutId: string) => {
    const success = layoutPersistenceService.deleteLayout(layoutId);
    if (success) {
      // Refresh the layouts list
      setLayouts(layoutPersistenceService.getLayoutSummaries());
    }
  };
  
  // Handle setting a layout as default
  const handleSetDefaultLayout = (layoutId: string) => {
    const success = layoutPersistenceService.setDefaultLayout(layoutId);
    if (success) {
      setDefaultLayout(layoutId);
    }
  };
  
  // Handle importing a layout
  const handleImportLayout = () => {
    setImportError('');
    if (!importJson) {
      setImportError('Please paste a valid layout JSON');
      return;
    }
    
    try {
      const layoutId = layoutPersistenceService.importLayout(importJson);
      if (layoutId) {
        // Refresh the layouts list
        setLayouts(layoutPersistenceService.getLayoutSummaries());
        setImportJson('');
        setActiveTab('saved');
      } else {
        setImportError('Failed to import layout. Invalid format.');
      }
    } catch (error) {
      setImportError(`Error importing layout: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Handle exporting a layout
  const handleExportLayout = (layoutId: string) => {
    const json = layoutPersistenceService.exportLayout(layoutId);
    if (json) {
      setExportJson(json);
      setActiveTab('import-export');
    }
  };
  
  // Handle resetting to default layout
  const handleResetToDefault = () => {
    if (onResetToDefault) {
      onResetToDefault();
      setIsOpen(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Layout Management</DialogTitle>
          <DialogDescription>
            Customize your workspace by saving, loading, and managing layouts.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 my-2">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search layouts and templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              <span>Saved Layouts</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Create New</span>
            </TabsTrigger>
            <TabsTrigger value="import-export" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Import/Export</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Saved Layouts Tab */}
          <TabsContent value="saved" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {filteredLayouts.length === 0 ? (
                  <div className="col-span-full text-center p-4 text-muted-foreground">
                    No saved layouts found. Create a new layout or import one.
                  </div>
                ) : (
                  filteredLayouts.map(layout => (
                    <Card key={layout.id} className={`overflow-hidden ${layout.id === currentLayout ? 'border-primary' : ''}`}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base truncate">
                            {layout.name}
                            {layout.isDefault && (
                              <Badge variant="outline" className="ml-2 text-xs">Default</Badge>
                            )}
                          </CardTitle>
                          {layout.id === currentLayout && (
                            <Badge variant="secondary" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs truncate">
                          {layout.description || 'No description'}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="p-4 pt-2 pb-2">
                        {layout.thumbnail ? (
                          <div className="w-full h-24 bg-muted rounded-md overflow-hidden relative">
                            <img 
                              src={layout.thumbnail} 
                              alt={layout.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-24 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                            No Preview
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {layout.tags?.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-4 pt-2 flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSelectLayout(layout.id)}
                          disabled={layout.id === currentLayout}
                        >
                          Load
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSetDefaultLayout(layout.id)}
                          disabled={layout.id === defaultLayout}
                        >
                          Set Default
                        </Button>
                        <div className="flex-1" />
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleExportLayout(layout.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDuplicateLayout(layout.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteLayout(layout.id)}
                          disabled={layout.isDefault || layout.id === currentLayout}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Templates Tab */}
          <TabsContent value="templates" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {filteredTemplates.length === 0 ? (
                  <div className="col-span-full text-center p-4 text-muted-foreground">
                    No templates found. Try clearing your search filters.
                  </div>
                ) : (
                  filteredTemplates.map(template => (
                    <Card key={template.name} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base truncate">{template.name}</CardTitle>
                        <CardDescription className="text-xs truncate">
                          {template.description || 'No description'}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="p-4 pt-2 pb-2">
                        {template.thumbnail ? (
                          <div className="w-full h-24 bg-muted rounded-md overflow-hidden relative">
                            <img 
                              src={template.thumbnail} 
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-24 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                            No Preview
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.tags?.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-4 pt-2 flex justify-between">
                        <Button 
                          size="sm" 
                          onClick={() => handleSelectTemplate(template.name)}
                        >
                          Use Template
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplate(template.name);
                            setNewLayoutName(`My ${template.name}`);
                            setNewLayoutDescription(template.description || '');
                            setActiveTab('create');
                          }}
                        >
                          Customize
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Create New Tab */}
          <TabsContent value="create" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="layout-name">Layout Name</Label>
                  <Input
                    id="layout-name"
                    value={newLayoutName}
                    onChange={(e) => setNewLayoutName(e.target.value)}
                    placeholder="My Custom Layout"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="layout-description">Description</Label>
                  <Input
                    id="layout-description"
                    value={newLayoutDescription}
                    onChange={(e) => setNewLayoutDescription(e.target.value)}
                    placeholder="Describe your layout..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="layout-template">Base Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.name} value={template.name}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    onClick={handleCreateFromTemplate}
                    disabled={!newLayoutName || !selectedTemplate}
                  >
                    Create New Layout
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">Create from Current</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Save your current workspace layout as a new layout.
                  </p>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => {
                      const layoutId = layoutPersistenceService.createLayoutFromCurrent(
                        newLayoutName || 'My Custom Layout',
                        {
                          description: newLayoutDescription || 'Custom layout created from current workspace',
                          category: LayoutTemplateType.CUSTOM
                        }
                      );
                      
                      if (layoutId) {
                        setLayouts(layoutPersistenceService.getLayoutSummaries());
                        setActiveTab('saved');
                      }
                    }}
                    disabled={!newLayoutName}
                  >
                    Save Current Layout
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Import/Export Tab */}
          <TabsContent value="import-export" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="space-y-6 p-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Import Layout</h3>
                  <div className="space-y-2">
                    <Label htmlFor="import-json">Paste Layout JSON</Label>
                    <textarea
                      id="import-json"
                      className="w-full h-32 p-2 border rounded-md resize-none"
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      placeholder="Paste layout JSON here..."
                    />
                    {importError && (
                      <p className="text-sm text-destructive">{importError}</p>
                    )}
                  </div>
                  <Button onClick={handleImportLayout} disabled={!importJson}>
                    Import Layout
                  </Button>
                </div>
                
                <div className="pt-6 border-t space-y-4">
                  <h3 className="text-lg font-semibold">Export Layout</h3>
                  {exportJson ? (
                    <div className="space-y-2">
                      <Label htmlFor="export-json">Layout JSON</Label>
                      <textarea
                        id="export-json"
                        className="w-full h-32 p-2 border rounded-md resize-none"
                        value={exportJson}
                        readOnly
                      />
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(exportJson);
                          }}
                        >
                          Copy to Clipboard
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const blob = new Blob([exportJson], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `nexus-layout-${Date.now()}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Download JSON
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select a layout to export from the Saved Layouts tab, or choose from the list below.
                      </p>
                      <Select onValueChange={(layoutId) => handleExportLayout(layoutId)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a layout to export" />
                        </SelectTrigger>
                        <SelectContent>
                          {layouts.map(layout => (
                            <SelectItem key={layout.id} value={layout.id}>
                              {layout.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleResetToDefault}
            disabled={!defaultLayout}
          >
            Reset to Default
          </Button>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}