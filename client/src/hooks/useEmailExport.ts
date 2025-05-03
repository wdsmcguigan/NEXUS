import { useState, useCallback } from 'react';
// Use the exact path to the shared schema
import type { EmailWithDetails } from '../../shared/schema';
import { useToast } from '@/hooks/use-toast';

export function useEmailExport() {
  const [selectedEmails, setSelectedEmails] = useState<EmailWithDetails[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Function to toggle selection of a single email
  const toggleEmailSelection = useCallback((email: EmailWithDetails) => {
    setSelectedEmails(prevSelected => {
      const isAlreadySelected = prevSelected.some(e => e.id === email.id);
      
      if (isAlreadySelected) {
        return prevSelected.filter(e => e.id !== email.id);
      } else {
        return [...prevSelected, email];
      }
    });
  }, []);
  
  // Function to check if an email is selected
  const isEmailSelected = useCallback((emailId: number) => {
    return selectedEmails.some(e => e.id === emailId);
  }, [selectedEmails]);
  
  // Function to select all emails
  const selectAllEmails = useCallback((emails: EmailWithDetails[]) => {
    setSelectedEmails(emails);
    
    toast({
      title: 'Selected all emails',
      description: `${emails.length} emails selected.`,
    });
  }, [toast]);
  
  // Function to clear all selections
  const clearSelections = useCallback(() => {
    setSelectedEmails([]);
    
    toast({
      title: 'Selection cleared',
      description: 'All emails have been deselected.',
    });
  }, [toast]);
  
  // Function to open export dialog
  const openExportDialog = useCallback(() => {
    if (selectedEmails.length === 0) {
      toast({
        title: 'No emails selected',
        description: 'Please select at least one email to export.',
        variant: 'destructive',
      });
      return;
    }
    
    setExportDialogOpen(true);
  }, [selectedEmails.length, toast]);
  
  // Return values and functions
  return {
    selectedEmails,
    exportDialogOpen,
    setExportDialogOpen,
    toggleEmailSelection,
    isEmailSelected,
    selectAllEmails,
    clearSelections,
    openExportDialog,
  };
}