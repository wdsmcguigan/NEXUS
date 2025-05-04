import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTabContext } from '../context/TabContext';
import useTabTemplates, { SaveTemplateOptions } from '../hooks/useTabTemplates';
import { Layers, Plus, Save, Trash2 } from 'lucide-react';

interface TemplateManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateManager({ open, onOpenChange }: TemplateManagerProps) {
  const tabContext = useTabContext();
  const { templates, saveAsTemplate, applyTemplate, deleteTemplate } = useTabTemplates();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState<SaveTemplateOptions>({
    name: '',
    description: '',
  });
  const [selectedPanels, setSelectedPanels] = useState<Record<string, boolean>>({});

  // Handle saving a new template
  const handleSaveTemplate = () => {
    const panelIds = Object.entries(selectedPanels)
      .filter(([_, isSelected]) => isSelected)
      .map(([panelId]) => panelId);
    
    saveAsTemplate({
      ...newTemplate,
      panelIds: panelIds.length > 0 ? panelIds : undefined
    });
    
    setNewTemplate({ name: '', description: '' });
    setSelectedPanels({});
    setShowSaveDialog(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Layout Templates
          </DialogTitle>
          <DialogDescription>
            Save and manage panel layouts as reusable templates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <Tabs defaultValue="use">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="use">Use Templates</TabsTrigger>
              <TabsTrigger value="manage">Manage Templates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="use" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Layers size={16} />
                        <CardTitle>{template.name}</CardTitle>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {template.tabs.length} tab{template.tabs.length !== 1 ? 's' : ''}
                      </p>
                    </CardContent>
                    <CardFooter className="bg-muted/50 pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          applyTemplate(template.id);
                          onOpenChange(false);
                        }}
                        className="w-full"
                      >
                        Apply Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

                {templates.length === 0 && (
                  <div className="col-span-full p-8 text-center">
                    <p className="text-muted-foreground">No templates saved yet.</p>
                    <Button
                      variant="outline"
                      className="mt-4 flex items-center gap-2"
                      onClick={() => setShowSaveDialog(true)}
                    >
                      <Plus size={16} />
                      <span>Create Your First Template</span>
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={() => setShowSaveDialog(true)} 
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  <span>Save Current Layout</span>
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="manage" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers size={16} />
                          <CardTitle>{template.name}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTemplate(template.id)}
                          title="Delete template"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <strong>Tabs:</strong>
                        <ul className="mt-1 pl-4">
                          {template.tabs.map((tab, index) => (
                            <li key={index} className="text-xs">
                              {tab.title || tab.componentId} 
                              {tab.panelId && <span className="text-muted-foreground"> ({tab.panelId})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {templates.length === 0 && (
                  <div className="col-span-full p-8 text-center">
                    <p className="text-muted-foreground">No templates to manage.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
      
      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Layout as Template</DialogTitle>
            <DialogDescription>
              Create a reusable template from your current panel layout.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="My Workspace"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Describe your template layout"
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Include Panels</Label>
              <ScrollArea className="h-[150px] rounded-md border p-2">
                {Object.entries(tabContext.state.panels).map(([panelId, panel]) => (
                  <div key={panelId} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`panel-${panelId}`}
                      checked={selectedPanels[panelId] || false}
                      onCheckedChange={(checked) => {
                        setSelectedPanels({
                          ...selectedPanels,
                          [panelId]: !!checked
                        });
                      }}
                    />
                    <Label htmlFor={`panel-${panelId}`} className="text-sm font-normal">
                      {panelId} ({panel.tabs.length} tab{panel.tabs.length !== 1 ? 's' : ''})
                    </Label>
                  </div>
                ))}
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-1">
                If no panels are selected, all panels will be included.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!newTemplate.name.trim()}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export default TemplateManager;