import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export interface TagItem {
  id: string;
  name: string;
  color: string;
  emoji?: string;
  textColor: string;
  parentId?: string;
  children?: TagItem[];
  expanded?: boolean;
}

interface TagContextType {
  tags: TagItem[];
  setTags: React.Dispatch<React.SetStateAction<TagItem[]>>;
  getTagById: (id: string) => TagItem | undefined;
  updateTag: (updatedTag: TagItem) => void;
  addTag: (tag: Omit<TagItem, 'id'>) => string;
  deleteTag: (id: string) => void;
}

export const TagContext = createContext<TagContextType | undefined>(undefined);

interface TagProviderProps {
  children: ReactNode;
}

export function TagProvider({ children }: TagProviderProps) {
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
      name: 'Travel',
      color: '#ed8936',
      textColor: '#ffffff',
      emoji: '✈️'
    }
  ]);

  // Function to find a tag by ID, searching through all tags and their children
  const getTagById = (id: string): TagItem | undefined => {
    // Check top-level tags
    const topLevelTag = tags.find(tag => tag.id === id);
    if (topLevelTag) return topLevelTag;

    // Check children
    for (const tag of tags) {
      if (tag.children) {
        const childTag = tag.children.find(child => child.id === id);
        if (childTag) return childTag;
      }
    }

    return undefined;
  };

  // Function to update a tag (either top-level or child)
  const updateTag = (updatedTag: TagItem) => {
    setTags(prevTags => 
      prevTags.map(tag => {
        if (tag.id === updatedTag.id) {
          return { ...tag, ...updatedTag };
        } else if (tag.children) {
          return {
            ...tag,
            children: tag.children.map(child => 
              child.id === updatedTag.id ? { ...child, ...updatedTag } : child
            )
          };
        }
        return tag;
      })
    );
  };

  // Function to add a new tag
  const addTag = (tag: Omit<TagItem, 'id'>) => {
    const newId = `tag-${Date.now()}`;
    const newTag: TagItem = { ...tag, id: newId };
    
    setTags(prevTags => [...prevTags, newTag]);
    return newId;
  };

  // Function to delete a tag
  const deleteTag = (id: string) => {
    setTags(prevTags => {
      // Filter out the tag at the top level
      const filtered = prevTags.filter(tag => tag.id !== id);
      
      // Also filter children in each tag
      return filtered.map(tag => {
        if (tag.children) {
          return {
            ...tag,
            children: tag.children.filter(child => child.id !== id)
          };
        }
        return tag;
      });
    });
  };

  const value = {
    tags,
    setTags,
    getTagById,
    updateTag,
    addTag,
    deleteTag
  };

  return (
    <TagContext.Provider value={value}>
      {children}
    </TagContext.Provider>
  );
}

export const useTagContext = () => {
  const context = useContext(TagContext);
  if (context === undefined) {
    throw new Error('useTagContext must be used within a TagProvider');
  }
  return context;
};