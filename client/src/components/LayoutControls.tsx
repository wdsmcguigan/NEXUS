import React, { useState } from 'react';
import { Save, FolderOpen, Layout } from 'lucide-react';
import { useLayout } from '../context/LayoutContext';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LayoutControls() {
  const { savedLayouts, saveLayout, loadLayout } = useLayout();
  const [newLayoutName, setNewLayoutName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  
  const handleSaveLayout = () => {
    if (newLayoutName.trim()) {
      saveLayout(newLayoutName.trim());
      setNewLayoutName('');
      setSaveDialogOpen(false);
    }
  };
  
  const handleLoadLayout = (name: string) => {
    loadLayout(name);
    setLoadDialogOpen(false);
  };
  
  return (
    <div className="flex items-center justify-center gap-2 p-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setSaveDialogOpen(true)}
        className="flex items-center gap-1"
      >
        <Save className="h-4 w-4" />
        <span>Save Layout</span>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setLoadDialogOpen(true)}
        className="flex items-center gap-1"
        disabled={savedLayouts.length === 0}
      >
        <FolderOpen className="h-4 w-4" />
        <span>Load Layout</span>
      </Button>
      
      {/* Save Layout Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Current Layout</DialogTitle>
            <DialogDescription>
              Enter a name for this layout configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                className="col-span-3"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="My Workspace Layout"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLayout} disabled={!newLayoutName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Load Layout Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Load Saved Layout</DialogTitle>
            <DialogDescription>
              Choose a saved layout configuration to load.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {savedLayouts.length === 0 ? (
              <div className="text-center text-neutral-500 py-4">
                <Layout className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No saved layouts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedLayouts.map(layout => (
                  <Button 
                    key={layout.name} 
                    variant="outline" 
                    className="w-full justify-start text-left"
                    onClick={() => handleLoadLayout(layout.name)}
                  >
                    <Layout className="h-4 w-4 mr-2" />
                    {layout.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}