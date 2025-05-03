import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { Label } from '@/components/ui/label';
import { Save, FolderOpen, Trash2 } from 'lucide-react';

export interface Layout {
  name: string;
  data: any;
}

interface LayoutSelectorProps {
  onSave: (name: string) => void;
  onLoad: (layout: Layout) => void;
  loadedLayout?: string;
}

export function LayoutSelector({ onSave, onLoad, loadedLayout }: LayoutSelectorProps) {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  const [saveConfirmation, setSaveConfirmation] = useState(false);
  
  // Load saved layouts from localStorage
  useEffect(() => {
    const savedLayouts = localStorage.getItem('nexus-email-layouts');
    if (savedLayouts) {
      try {
        setLayouts(JSON.parse(savedLayouts));
      } catch (e) {
        console.error('Failed to parse saved layouts', e);
      }
    }
  }, []);
  
  const handleSave = () => {
    if (!layoutName.trim()) return;
    
    onSave(layoutName.trim());
    setSaveDialogOpen(false);
    setLayoutName('');
    
    // Show confirmation toast
    setSaveConfirmation(true);
    setTimeout(() => setSaveConfirmation(false), 3000);
  };
  
  const handleLoad = (layout: Layout) => {
    onLoad(layout);
    setLoadDialogOpen(false);
  };
  
  const handleDelete = (layoutName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const newLayouts = layouts.filter(l => l.name !== layoutName);
    setLayouts(newLayouts);
    localStorage.setItem('nexus-email-layouts', JSON.stringify(newLayouts));
  };
  
  return (
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
        disabled={layouts.length === 0}
      >
        <FolderOpen className="h-4 w-4" />
        <span>Load Layout</span>
      </Button>
      
      {loadedLayout && (
        <span className="text-sm text-gray-500 self-center ml-2">
          Current: {loadedLayout}
        </span>
      )}
      
      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Current Layout</DialogTitle>
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
            <Button onClick={handleSave} disabled={!layoutName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Load Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Load Saved Layout</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[300px] overflow-y-auto">
            {layouts.length === 0 ? (
              <div className="text-center py-4 text-neutral-500">
                No saved layouts found
              </div>
            ) : (
              <div className="space-y-2">
                {layouts.map((layout) => (
                  <div
                    key={layout.name}
                    className="flex items-center justify-between p-2 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    onClick={() => handleLoad(layout)}
                  >
                    <span>{layout.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(layout.name, e)}
                      className="h-6 w-6 text-neutral-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {saveConfirmation && (
        <Toast>
          <div className="text-sm font-medium">Layout saved successfully</div>
        </Toast>
      )}
    </div>
  );
}