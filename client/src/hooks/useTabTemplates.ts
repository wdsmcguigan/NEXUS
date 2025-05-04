import { useState, useEffect, useCallback } from 'react';
import { useTabContext } from '../context/TabContext';
import tabFactory, { TabTemplate } from '../services/TabFactory';

export interface SaveTemplateOptions {
  name: string;
  description: string;
  panelIds?: string[];
}

export function useTabTemplates() {
  const tabContext = useTabContext();
  const [templates, setTemplates] = useState<TabTemplate[]>([]);

  // Load templates
  useEffect(() => {
    setTemplates(tabFactory.getAllTemplates());
  }, []);

  // Save current layout as a template
  const saveAsTemplate = useCallback(
    ({ name, description, panelIds }: SaveTemplateOptions) => {
      const template = tabFactory.saveCurrentAsTemplate(
        tabContext,
        name,
        description,
        panelIds
      );
      
      // Update local state
      setTemplates(prev => [...prev, template]);
      
      return template;
    },
    [tabContext]
  );

  // Apply a template
  const applyTemplate = useCallback(
    (templateId: string) => {
      return tabFactory.createFromTemplate(tabContext, templateId);
    },
    [tabContext]
  );

  // Apply a template to a specific panel
  const applyTemplateToPanel = useCallback(
    (templateId: string, panelId: string) => {
      return tabFactory.createFromTemplate(tabContext, templateId, {
        targetPanelId: panelId
      });
    },
    [tabContext]
  );

  // Delete a template
  const deleteTemplate = useCallback(
    (templateId: string) => {
      // This is a mock implementation since we don't have a delete method in the factory
      // In a real implementation, you would call a method on tabFactory
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    },
    []
  );

  return {
    templates,
    saveAsTemplate,
    applyTemplate,
    applyTemplateToPanel,
    deleteTemplate
  };
}

export default useTabTemplates;