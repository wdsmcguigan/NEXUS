import React, { useState } from 'react';
import { Tag, Plus, Edit, Trash, ChevronRight, ChevronDown } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

// Define sample tag data structure for a folder-based tag system
interface TagItem {
  id: string;
  name: string;
  color: string;
  emoji?: string;
  textColor: string;
  parentId?: string;
  children?: TagItem[];
  expanded?: boolean;
}

export function TagManager() {
  const [tags, setTags] = useState<TagItem[]>([
    {
      id: '1',
      name: 'Work',
      color: '#4299e1',
      textColor: '#ffffff',
      emoji: '💼',
      expanded: true,
      children: [
        {
          id: '1-1',
          name: 'Meetings',
          color: '#3182ce',
          textColor: '#ffffff',
          emoji: '📅',
          parentId: '1'
        },
        {
          id: '1-2',
          name: 'Projects',
          color: '#2b6cb0',
          textColor: '#ffffff',
          emoji: '📂',
          parentId: '1'
        }
      ]
    },
    {
      id: '2',
      name: 'Personal',
      color: '#48bb78',
      textColor: '#ffffff',
      emoji: '🏠',
      expanded: true,
      children: [
        {
          id: '2-1',
          name: 'Family',
          color: '#38a169',
          textColor: '#ffffff',
          emoji: '👪',
          parentId: '2'
        },
        {
          id: '2-2',
          name: 'Finance',
          color: '#2f855a',
          textColor: '#ffffff',
          emoji: '💰',
          parentId: '2'
        }
      ]
    },
    {
      id: '3',
      name: 'Urgent',
      color: '#f56565',
      textColor: '#ffffff',
      emoji: '🔥'
    },
    {
      id: '4',
      name: 'Later',
      color: '#ed8936',
      textColor: '#ffffff',
      emoji: '⏱️'
    }
  ]);

  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<Partial<TagItem> | null>(null);
  const [originalTagState, setOriginalTagState] = useState<Partial<TagItem> | null>(null);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  
  // Common emoji icons for tags
  const iconOptions = [
    { value: '🏷️', label: 'Tag' },
    { value: '💼', label: 'Work' },
    { value: '🏠', label: 'Home' },
    { value: '📋', label: 'List' },
    { value: '⭐', label: 'Star' },
    { value: '🔍', label: 'Search' },
    { value: '⚠️', label: 'Warning' },
    { value: '🔥', label: 'Urgent' },
    { value: '⏱️', label: 'Later' },
    { value: '🗓️', label: 'Calendar' },
    { value: '📊', label: 'Data' },
    { value: '📂', label: 'Folder' },
    { value: '📝', label: 'Note' },
    { value: '📌', label: 'Pin' },
    { value: '💬', label: 'Chat' },
    { value: '📧', label: 'Email' },
    { value: '🔔', label: 'Notification' },
    { value: '❤️', label: 'Heart' },
    { value: '', label: 'None' },
  ];

  const toggleExpand = (tagId: string) => {
    setTags(prevTags => 
      prevTags.map(tag => 
        tag.id === tagId 
          ? { ...tag, expanded: !tag.expanded } 
          : tag
      )
    );
  };

  const startEditing = (tag: TagItem) => {
    const tagCopy = {
      name: tag.name,
      color: tag.color,
      emoji: tag.emoji,
      textColor: tag.textColor
    };
    
    setEditingTagId(tag.id);
    setEditingTag(tagCopy);
    setOriginalTagState(tagCopy);
  };

  const saveTagEdit = (tagId: string) => {
    if (!editingTag) return;
    
    setTags(prevTags => {
      return prevTags.map(tag => {
        if (tag.id === tagId) {
          return { ...tag, ...editingTag };
        } else if (tag.children) {
          return {
            ...tag,
            children: tag.children.map(child => 
              child.id === tagId ? { ...child, ...editingTag } : child
            )
          };
        }
        return tag;
      });
    });
    
    setEditingTagId(null);
    setEditingTag(null);
    setShowBgColorPicker(false);
    setShowTextColorPicker(false);
  };

  const cancelEditing = () => {
    // Reset to original tag state before canceling
    if (originalTagState && editingTagId) {
      setTags(prevTags => {
        return prevTags.map(tag => {
          if (tag.id === editingTagId) {
            return { ...tag, ...originalTagState };
          } else if (tag.children) {
            return {
              ...tag,
              children: tag.children.map(child => 
                child.id === editingTagId ? { ...child, ...originalTagState } : child
              )
            };
          }
          return tag;
        });
      });
    }
    
    setEditingTagId(null);
    setEditingTag(null);
    setOriginalTagState(null);
    setShowBgColorPicker(false);
    setShowTextColorPicker(false);
  };

  const renderTag = (tag: TagItem, level = 0) => {
    const isEditing = editingTagId === tag.id;
    const hasChildren = tag.children && tag.children.length > 0;
    
    return (
      <div key={tag.id} className="w-full">
        <div className={`flex items-center py-2 px-1 group rounded hover:bg-neutral-800 ${isEditing ? 'bg-neutral-800' : ''}`} style={{ paddingLeft: `${level * 16 + 8}px` }}>
          {hasChildren && (
            <button 
              onClick={() => toggleExpand(tag.id)} 
              className="mr-1 text-neutral-400 hover:text-white"
            >
              {tag.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          
          {!isEditing ? (
            <>
              <div 
                className="flex items-center flex-1 overflow-hidden"
                style={{ 
                  backgroundColor: tag.color,
                  color: tag.textColor,
                  borderRadius: '4px',
                  padding: '2px 6px'
                }}
              >
                <span className="mr-1">{tag.emoji}</span>
                <span className="truncate">{tag.name}</span>
              </div>
              
              <div className="hidden group-hover:flex">
                <button 
                  onClick={() => startEditing(tag)}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <Edit size={14} />
                </button>
                <button className="p-1 text-neutral-400 hover:text-red-500">
                  <Trash size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col space-y-2">
              <div className="flex items-center mb-2">
                <select
                  value={editingTag?.emoji || '🏷️'}
                  onChange={e => setEditingTag(prev => ({ ...prev, emoji: e.target.value }))}
                  className="w-16 bg-neutral-700 border border-neutral-600 rounded px-1 text-center"
                >
                  {iconOptions.map(icon => (
                    <option key={icon.value} value={icon.value}>
                      {icon.value || 'None'}
                    </option>
                  ))}
                </select>
                <input
                  value={editingTag?.name || ''}
                  onChange={e => setEditingTag(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 ml-2 bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-sm"
                  placeholder="Tag name"
                />
              </div>
              
              <div className="flex flex-col space-y-2 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Background color:</span>
                  <div className="flex space-x-2 items-center">
                    <button 
                      onClick={() => {
                        setShowBgColorPicker(!showBgColorPicker);
                        setShowTextColorPicker(false);
                      }}
                      className="w-6 h-6 rounded-sm border border-neutral-600"
                      style={{ backgroundColor: editingTag?.color }}
                      title="Background color"
                    ></button>
                    <button
                      onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                      className="px-1 py-0.5 text-xs bg-neutral-700 rounded hover:bg-neutral-600"
                    >
                      {showBgColorPicker ? 'Close' : 'Edit'}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Text color:</span>
                  <div className="flex space-x-2 items-center">
                    <button 
                      onClick={() => {
                        setShowTextColorPicker(!showTextColorPicker);
                        setShowBgColorPicker(false);
                      }}
                      className="w-6 h-6 rounded-sm border border-neutral-600"
                      style={{ backgroundColor: editingTag?.textColor }}
                      title="Text color"
                    ></button>
                    <button
                      onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                      className="px-1 py-0.5 text-xs bg-neutral-700 rounded hover:bg-neutral-600"
                    >
                      {showTextColorPicker ? 'Close' : 'Edit'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-3">
                <button 
                  onClick={() => saveTagEdit(tag.id)}
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs flex-1"
                >
                  Save
                </button>
                <button 
                  onClick={cancelEditing}
                  className="px-4 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs flex-1"
                >
                  Cancel
                </button>
              </div>
              
              {showBgColorPicker && (
                <div className="absolute mt-1 z-10">
                  <div className="bg-neutral-800 border border-neutral-700 p-2 rounded-sm">
                    <HexColorPicker 
                      color={editingTag?.color}
                      onChange={color => setEditingTag(prev => ({ ...prev, color }))}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <div 
                        className="w-8 h-8 rounded-sm" 
                        style={{backgroundColor: editingTag?.color}}
                      ></div>
                      <input 
                        value={editingTag?.color}
                        onChange={e => setEditingTag(prev => ({ ...prev, color: e.target.value }))}
                        className="flex-1 ml-2 bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => setShowBgColorPicker(false)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => {
                          setShowBgColorPicker(false);
                          if (originalTagState) {
                            setEditingTag(prev => ({ ...prev, color: originalTagState.color }));
                          }
                        }}
                        className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {showTextColorPicker && (
                <div className="absolute mt-1 z-10">
                  <div className="bg-neutral-800 border border-neutral-700 p-2 rounded-sm">
                    <HexColorPicker 
                      color={editingTag?.textColor}
                      onChange={textColor => setEditingTag(prev => ({ ...prev, textColor }))}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <div 
                        className="w-8 h-8 rounded-sm" 
                        style={{backgroundColor: editingTag?.textColor}}
                      ></div>
                      <input 
                        value={editingTag?.textColor}
                        onChange={e => setEditingTag(prev => ({ ...prev, textColor: e.target.value }))}
                        className="flex-1 ml-2 bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => setShowTextColorPicker(false)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => {
                          setShowTextColorPicker(false);
                          if (originalTagState) {
                            setEditingTag(prev => ({ ...prev, textColor: originalTagState.textColor }));
                          }
                        }}
                        className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {hasChildren && tag.expanded && (
          <div>
            {tag.children!.map(child => renderTag(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const addNewTag = () => {
    const newTag: TagItem = {
      id: `new-${Date.now()}`,
      name: 'New Tag',
      color: '#718096',
      textColor: '#ffffff',
      emoji: '🏷️'
    };
    
    setTags(prev => [...prev, newTag]);
    startEditing(newTag);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-white">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <h2 className="font-semibold flex items-center">
          <Tag className="mr-2" size={18} /> 
          <span>Tag Manager</span>
        </h2>
        <button 
          onClick={addNewTag}
          className="p-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {tags.map(tag => renderTag(tag))}
      </div>
    </div>
  );
}

export default TagManager;