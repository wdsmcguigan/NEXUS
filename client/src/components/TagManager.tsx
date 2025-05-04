import React, { useState } from 'react';
import { X as XIcon, Plus as PlusIcon, ChevronDown as ChevronDownIcon, ChevronRight as ChevronRightIcon, Trash2 as TrashIcon, Edit as EditIcon, FolderPlus as FolderPlusIcon } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

interface Tag {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  parentId: string | null;
  children?: Tag[];
}

interface TagEditorProps {
  tag: Tag | null;
  onSave: (tag: Tag) => void;
  onCancel: () => void;
}

function TagEditor({ tag, onSave, onCancel }: TagEditorProps) {
  const [name, setName] = useState(tag?.name || '');
  const [bgColor, setBgColor] = useState(tag?.bgColor || '#16a34a');
  const [textColor, setTextColor] = useState(tag?.textColor || '#dcfce7');
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showTextPicker, setShowTextPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: tag?.id || `tag-${Date.now()}`,
      name,
      bgColor,
      textColor,
      parentId: tag?.parentId || null,
      children: tag?.children || []
    });
  };

  return (
    <div className="p-4 bg-neutral-850 border border-neutral-800 rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-neutral-200">
          {tag ? 'Edit Tag' : 'Create New Tag'}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded"
        >
          <XIcon size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-xs text-neutral-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Tag name"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-neutral-400 mb-1">Background Color</label>
          <div className="relative">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setShowBgPicker(!showBgPicker)}
            >
              <div 
                className="w-6 h-6 rounded border border-neutral-700" 
                style={{ backgroundColor: bgColor }}
              />
              <span className="text-sm text-neutral-200">{bgColor}</span>
            </div>

            {showBgPicker && (
              <div className="absolute z-10 mt-2">
                <div 
                  className="fixed inset-0" 
                  onClick={() => setShowBgPicker(false)}
                />
                <div className="relative z-20">
                  <HexColorPicker color={bgColor} onChange={setBgColor} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-neutral-400 mb-1">Text Color</label>
          <div className="relative">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setShowTextPicker(!showTextPicker)}
            >
              <div 
                className="w-6 h-6 rounded border border-neutral-700" 
                style={{ backgroundColor: textColor }}
              />
              <span className="text-sm text-neutral-200">{textColor}</span>
            </div>

            {showTextPicker && (
              <div className="absolute z-10 mt-2">
                <div 
                  className="fixed inset-0" 
                  onClick={() => setShowTextPicker(false)}
                />
                <div className="relative z-20">
                  <HexColorPicker color={textColor} onChange={setTextColor} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-12 p-2 rounded mb-4" style={{ backgroundColor: bgColor }}>
          <div className="flex items-center justify-center h-full">
            <span className="text-sm font-medium" style={{ color: textColor }}>{name || 'Tag Preview'}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
          >
            {tag ? 'Save Changes' : 'Create Tag'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface TagItemProps {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (id: string) => void;
  onMove: (tagId: string, parentId: string | null) => void;
  level?: number;
}

function TagItem({ tag, onEdit, onDelete, onMove, level = 0 }: TagItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = tag.children && tag.children.length > 0;

  return (
    <div className="mb-1">
      <div 
        className="group flex items-center py-1 px-2 rounded hover:bg-neutral-800/50" 
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mr-1 text-neutral-400 hover:text-neutral-200"
          >
            {expanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
          </button>
        ) : (
          <div className="w-4 mr-1" />
        )}

        <div 
          className="flex-1 py-1 px-2 rounded text-xs font-medium" 
          style={{ backgroundColor: `${tag.bgColor}40`, color: tag.textColor }}
        >
          {tag.name}
        </div>

        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(tag)}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded mr-1"
            title="Edit Tag"
          >
            <EditIcon size={12} />
          </button>
          <button
            onClick={() => onDelete(tag.id)}
            className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded"
            title="Delete Tag"
          >
            <TrashIcon size={12} />
          </button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="ml-4">
          {tag.children?.map((child) => (
            <TagItem
              key={child.id}
              tag={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TagManager() {
  // Sample initial tags - in a real app, these would come from your data source
  const [tags, setTags] = useState<Tag[]>([
    { id: 'tag-1', name: 'Important', bgColor: '#15803d', textColor: '#dcfce7', parentId: null },
    { id: 'tag-2', name: 'Work', bgColor: '#1e40af', textColor: '#dbeafe', parentId: null },
    { id: 'tag-3', name: 'Project', bgColor: '#7e22ce', textColor: '#f3e8ff', parentId: null }
  ]);
  
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [search, setSearch] = useState('');

  const handleAddTag = () => {
    setEditingTag(null);
    setShowTagEditor(true);
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setShowTagEditor(true);
  };

  const handleDeleteTag = (id: string) => {
    setTags(tags.filter(tag => tag.id !== id));
  };

  const handleMoveTag = (tagId: string, parentId: string | null) => {
    setTags(tags.map(tag => 
      tag.id === tagId ? { ...tag, parentId } : tag
    ));
  };

  const handleSaveTag = (updatedTag: Tag) => {
    if (editingTag) {
      // Update existing tag
      setTags(tags.map(tag => 
        tag.id === updatedTag.id ? updatedTag : tag
      ));
    } else {
      // Add new tag
      setTags([...tags, updatedTag]);
    }
    setShowTagEditor(false);
  };

  const filteredTags = search
    ? tags.filter(tag => tag.name.toLowerCase().includes(search.toLowerCase()))
    : tags;

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-neutral-200">
      <div className="sticky top-0 z-10 px-4 py-3 border-b border-neutral-800 bg-neutral-900">
        <div className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">Tag Manager</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search tags..."
          />
          <button
            onClick={handleAddTag}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
            title="Add New Tag"
          >
            <PlusIcon size={14} />
          </button>
          <button
            onClick={handleAddTag}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 transition-colors"
            title="Add Folder"
          >
            <FolderPlusIcon size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {showTagEditor ? (
          <TagEditor
            tag={editingTag}
            onSave={handleSaveTag}
            onCancel={() => setShowTagEditor(false)}
          />
        ) : (
          <div>
            {filteredTags.length > 0 ? (
              filteredTags.map(tag => (
                <TagItem
                  key={tag.id}
                  tag={tag}
                  onEdit={handleEditTag}
                  onDelete={handleDeleteTag}
                  onMove={handleMoveTag}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
                <p className="mb-2 text-sm">No tags found</p>
                <button
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-neutral-200 transition-colors flex items-center gap-1"
                >
                  <PlusIcon size={12} />
                  Create a tag
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}