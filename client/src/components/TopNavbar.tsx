import React, { useState } from 'react';
import { 
  ChevronDown, 
  Layout, 
  Save, 
  FolderOpen, 
  Trash2, 
  Cog, 
  Keyboard,
  PanelTop,
  PanelBottomClose,
  PanelLeft,
  PanelRight,
  Maximize2,
  Copy,
  LayoutTemplate,
  Monitor,
  Star
} from 'lucide-react';
import { useTabContext } from '../context/TabContext';
import { useTabTemplates } from '../hooks/useTabTemplates';
import TemplateManager from './TemplateManager';
import ShortcutManager from './ShortcutManager';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TopNavbar() {
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showShortcutManager, setShowShortcutManager] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  
  const tabContext = useTabContext();
  const { saveAsTemplate, templates, applyTemplate } = useTabTemplates();

  const handleSaveTemplate = () => {
    if (templateName.trim()) {
      saveAsTemplate({
        name: templateName,
        description: templateDescription
      });
      setTemplateName('');
      setTemplateDescription('');
      setShowSaveDialog(false);
    }
  };

  const maximizeCurrentPanel = () => {
    if (tabContext.state.activePanelId) {
      tabContext.maximizePanel(tabContext.state.activePanelId);
    }
  };

  const restoreLayout = () => {
    tabContext.restoreMaximizedPanel();
  };

  const splitPanelHorizontally = () => {
    if (tabContext.state.activePanelId) {
      tabContext.splitPanel(tabContext.state.activePanelId, 'horizontal');
    }
  };

  const splitPanelVertically = () => {
    if (tabContext.state.activePanelId) {
      tabContext.splitPanel(tabContext.state.activePanelId, 'vertical');
    }
  };

  const closeCurrentPanel = () => {
    if (tabContext.state.activePanelId) {
      tabContext.closePanel(tabContext.state.activePanelId);
    }
  };

  return (
    <>
      <div className="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center px-2 gap-2">
        <div className="flex items-center space-x-1">
          {/* File Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-neutral-300 hover:text-white">
                File <ChevronDown size={14} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem>
                New Email <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                New Message <DropdownMenuShortcut>⌘M</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Print <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Settings <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Edit Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-neutral-300 hover:text-white">
                Edit <ChevronDown size={14} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem>
                Undo <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Redo <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Cut <DropdownMenuShortcut>⌘X</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Copy <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Paste <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Find <DropdownMenuShortcut>⌘F</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-neutral-300 hover:text-white">
                View <ChevronDown size={14} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Layouts</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
                  <Save className="mr-2 h-4 w-4" />
                  <span>Save Current Layout</span>
                  <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    <span>Load Layout</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-56">
                      {templates.length === 0 ? (
                        <DropdownMenuItem disabled>
                          No saved layouts
                        </DropdownMenuItem>
                      ) : (
                        templates.map(template => (
                          <DropdownMenuItem 
                            key={template.id}
                            onClick={() => applyTemplate(template.id)}
                          >
                            <LayoutTemplate className="mr-2 h-4 w-4" />
                            <span>{template.name}</span>
                          </DropdownMenuItem>
                        ))
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowTemplateManager(true)}>
                        <Cog className="mr-2 h-4 w-4" />
                        <span>Manage Templates</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                
                <DropdownMenuItem onClick={() => setShowTemplateManager(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Manage Layouts</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuGroup>
                <DropdownMenuLabel>Panels</DropdownMenuLabel>
                <DropdownMenuItem onClick={splitPanelHorizontally}>
                  <PanelTop className="mr-2 h-4 w-4" />
                  <span>Split Horizontally</span>
                  <DropdownMenuShortcut>⇧⌘H</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={splitPanelVertically}>
                  <PanelLeft className="mr-2 h-4 w-4" />
                  <span>Split Vertically</span>
                  <DropdownMenuShortcut>⇧⌘V</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={closeCurrentPanel}>
                  <PanelBottomClose className="mr-2 h-4 w-4" />
                  <span>Close Panel</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={maximizeCurrentPanel}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  <span>Maximize Panel</span>
                  <DropdownMenuShortcut>F11</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={restoreLayout}>
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>Restore Layout</span>
                  <DropdownMenuShortcut>Esc</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setShowShortcutManager(true)}>
                  <Keyboard className="mr-2 h-4 w-4" />
                  <span>Keyboard Shortcuts</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8">
            <Star size={16} className="text-yellow-500 mr-1" />
            <span className="text-neutral-300">Upgrade</span>
          </Button>
          
          <Button variant="outline" size="sm" className="h-8">
            <Cog size={16} className="mr-1" />
            <span>Settings</span>
          </Button>
        </div>
      </div>

      {/* Template Manager Dialog */}
      <TemplateManager 
        open={showTemplateManager} 
        onOpenChange={setShowTemplateManager} 
      />

      {/* Shortcut Manager Dialog */}
      <ShortcutManager
        open={showShortcutManager}
        onOpenChange={setShowShortcutManager}
      />

      {/* Save Layout Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Current Layout</DialogTitle>
            <DialogDescription>
              Create a reusable template from your current panel layout.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="My Workspace"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe your template layout"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName.trim()} className="flex items-center gap-2">
              <Save size={16} />
              <span>Save Layout</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TopNavbar;