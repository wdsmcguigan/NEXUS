import React, { useRef, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Search, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Settings, 
  Save,
  Clock,
  Check,
  CaseSensitive,
  Text,
  RefreshCw,
  History
} from 'lucide-react';
import { useSearch, SearchAdapter } from '../context/SearchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { cn } from '../lib/utils';

interface UniversalSearchProps {
  componentId: string;
  tabId: string;
  searchAdapter: SearchAdapter;
  className?: string;
}

export function UniversalSearch({
  componentId,
  tabId,
  searchAdapter,
  className
}: UniversalSearchProps) {
  const { 
    state, 
    performSearch, 
    nextResult, 
    previousResult, 
    deactivateSearch,
    updateSearchOptions,
    saveSearch
  } = useSearch();
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Focus the input when search is activated
  useEffect(() => {
    if (state.isSearchActive && state.currentComponentId === componentId) {
      searchInputRef.current?.focus();
    }
  }, [state.isSearchActive, state.currentComponentId, componentId]);

  // Only render if search is active for this component
  if (!state.isSearchActive || state.currentComponentId !== componentId) {
    return null;
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    performSearch(e.target.value, searchAdapter);
  };

  const handleSaveSearch = () => {
    if (saveName.trim()) {
      saveSearch(saveName.trim());
      setSaveDialogOpen(false);
      setSaveName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        previousResult();
      } else {
        nextResult();
      }
    }
  };

  const handleApplySavedSearch = (term: string, options: any) => {
    // Apply the saved search options
    updateSearchOptions(options);
    // Then perform the search
    performSearch(term, searchAdapter);
    setIsHistoryOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "absolute top-0 right-0 z-10 bg-neutral-900 border border-neutral-700 rounded-bl-md overflow-hidden shadow-lg",
        className
      )}
      style={{ maxWidth: '100%', width: '420px' }}
    >
      <div className="flex items-center p-2 border-b border-neutral-800">
        <Search className="text-blue-400 mr-2 h-4 w-4" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search..."
          className="flex-1 bg-neutral-800 border-neutral-700 focus:border-blue-500"
          value={state.searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
        />
        
        {/* Results count indicator */}
        <div className="px-2 text-sm text-neutral-400">
          {state.isSearching ? (
            <RefreshCw className="animate-spin h-4 w-4" />
          ) : state.results.length > 0 ? (
            <span>{state.currentResultIndex + 1} of {state.results.length}</span>
          ) : state.searchTerm ? (
            <span>No results</span>
          ) : null}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-400 hover:text-white"
                  onClick={previousResult}
                  disabled={state.results.length === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Previous match (Shift+F3)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-400 hover:text-white"
                  onClick={nextResult}
                  disabled={state.results.length === 0}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Next match (F3)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Search options button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-400 hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-neutral-900 border-neutral-700 p-3">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-neutral-300">Search Options</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CaseSensitive className="h-4 w-4 text-neutral-400" />
                        <Label htmlFor="case-sensitive" className="text-sm">
                          Case sensitive
                        </Label>
                      </div>
                      <Switch
                        id="case-sensitive"
                        checked={state.options.caseSensitive}
                        onCheckedChange={(checked) =>
                          updateSearchOptions({ caseSensitive: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Text className="h-4 w-4 text-neutral-400" />
                        <Label htmlFor="whole-word" className="text-sm">
                          Match whole word
                        </Label>
                      </div>
                      <Switch
                        id="whole-word"
                        checked={state.options.wholeWord}
                        onCheckedChange={(checked) =>
                          updateSearchOptions({ wholeWord: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-neutral-400 font-mono text-xs">.*</span>
                        <Label htmlFor="use-regex" className="text-sm">
                          Use regular expression
                        </Label>
                      </div>
                      <Switch
                        id="use-regex"
                        checked={state.options.useRegex}
                        onCheckedChange={(checked) =>
                          updateSearchOptions({ useRegex: checked })
                        }
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search options</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Search history button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-400 hover:text-white"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-neutral-900 border-neutral-700 p-3">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-neutral-300">Recent Searches</h4>
                    
                    {state.history.length === 0 ? (
                      <div className="text-sm text-neutral-500 py-2">No recent searches</div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        {state.history.map((item, index) => (
                          <div 
                            key={`${item.term}-${index}`}
                            className="flex items-center justify-between hover:bg-neutral-800 px-2 py-1 rounded cursor-pointer group"
                            onClick={() => handleApplySavedSearch(item.term, item.options)}
                          >
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3 text-neutral-500" />
                              <span className="text-sm truncate max-w-[200px]" title={item.term}>
                                {(item as any).saved && (item as any).name 
                                  ? `${(item as any).name}: "${item.term}"`
                                  : item.term
                                }
                              </span>
                            </div>
                            <div className="text-xs text-neutral-500">
                              {item.frequency > 1 && `(${item.frequency})`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {state.searchTerm && (
                      <div className="pt-2 border-t border-neutral-800">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-neutral-300 border-neutral-700"
                          onClick={() => setSaveDialogOpen(true)}
                        >
                          <Save className="h-3 w-3 mr-2" />
                          Save current search
                        </Button>
                      </div>
                    )}
                    
                    {/* Save search dialog */}
                    {saveDialogOpen && (
                      <div className="pt-2 animate-in fade-in">
                        <div className="flex items-center space-x-2">
                          <Input
                            type="text"
                            placeholder="Search name..."
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            className="flex-1 h-8 text-sm bg-neutral-800 border-neutral-700"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-500"
                            onClick={handleSaveSearch}
                            disabled={!saveName.trim()}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-400"
                            onClick={() => {
                              setSaveDialogOpen(false);
                              setSaveName('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search history</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Close button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-neutral-400 hover:text-white"
                onClick={deactivateSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Close search (Esc)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Suggestions */}
      {state.suggestions.length > 0 && state.searchTerm && (
        <div className="px-2 py-1 border-t border-neutral-800 bg-neutral-950">
          <div className="text-xs text-neutral-500 mb-1">Suggestions:</div>
          <div className="flex flex-wrap gap-1">
            {state.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-6 text-xs bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
                onClick={() => performSearch(suggestion, searchAdapter)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}