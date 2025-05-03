import React from 'react';
import { PanelContainer } from './PanelContainer';
import { PanelProvider, usePanelContext } from '../context/PanelContext';
import { LayoutManager } from './LayoutManager';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, FolderOpen } from 'lucide-react';

function AdvancedPanelLayoutInner() {
  const { 
    layout, 
    maximizedPanelId, 
    maximizePanel, 
    restorePanel, 
    savedLayouts,
    saveLayout,
    loadLayout,
    currentLayoutName
  } = usePanelContext();
  
  // State for save layout dialog
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [layoutName, setLayoutName] = React.useState('');
  const [loadDialogOpen, setLoadDialogOpen] = React.useState(false);
  
  // Handle save layout
  const handleSaveLayout = () => {
    if (!layoutName.trim()) return;
    saveLayout(layoutName.trim());
    setSaveDialogOpen(false);
    setLayoutName('');
  };
  
  // Handle load layout
  const handleLoadLayout = (name: string) => {
    loadLayout(name);
    setLoadDialogOpen(false);
  };
  
  return (
    <div className="h-screen w-full flex flex-col">
      <div className="flex-1 overflow-hidden relative">
        <PanelContainer
          layout={layout}
          onMaximizePanel={maximizePanel}
          onRestorePanel={restorePanel}
          maximizedPanelId={maximizedPanelId}
        />
        <LayoutManager />
      </div>
      
      <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="text-sm text-neutral-500">
          {currentLayoutName ? `Current layout: ${currentLayoutName}` : 'Default layout'}
        </div>
        
        <div className="flex gap-2">
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
        </div>
      </div>
      
      {/* Save Layout Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Current Layout</DialogTitle>
            <DialogDescription>
              Give your layout a name to save it for future use.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="layout-name" className="text-right">
                Name
              </Label>
              <Input
                id="layout-name"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                className="col-span-3"
                placeholder="My Workspace"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLayout} disabled={!layoutName.trim()}>
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
          </DialogHeader>
          <div className="py-4 max-h-[300px] overflow-y-auto">
            {savedLayouts.length === 0 ? (
              <div className="text-center py-4 text-neutral-500">
                No saved layouts found
              </div>
            ) : (
              <div className="space-y-2">
                {savedLayouts.map((layout) => (
                  <div
                    key={layout.name}
                    className="flex items-center justify-between p-2 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    onClick={() => handleLoadLayout(layout.name)}
                  >
                    <span>{layout.name}</span>
                    {layout.name === currentLayoutName && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Current</span>
                    )}
                  </div>
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

export function AdvancedPanelLayout() {
  return (
    <PanelProvider>
      <AdvancedPanelLayoutInner />
    </PanelProvider>
  );
}