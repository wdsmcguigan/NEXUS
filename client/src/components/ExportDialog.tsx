import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmailExporter, ExportFormat, ExportOptions } from '../services/EmailExporter';
import { EmailWithDetails } from '../../shared/schema';
import { useToast } from '@/hooks/use-toast';
import { 
  FileJson, FileText, FileSpreadsheet, FileCode, CopyCheck,
  Download, Paperclip, Calendar 
} from 'lucide-react';

const FORMAT_OPTIONS = [
  { id: 'csv', label: 'CSV Spreadsheet', icon: <FileSpreadsheet className="h-4 w-4" />, description: 'Export as comma-separated values file' },
  { id: 'json', label: 'JSON File', icon: <FileJson className="h-4 w-4" />, description: 'Export as structured data for developers' },
  { id: 'html', label: 'HTML Document', icon: <FileCode className="h-4 w-4" />, description: 'Export as webpage with formatting' },
  { id: 'txt', label: 'Plain Text', icon: <FileText className="h-4 w-4" />, description: 'Export as simple text file' },
  { id: 'markdown', label: 'Markdown', icon: <CopyCheck className="h-4 w-4" />, description: 'Export as formatted markdown document' },
];

const DATE_FORMAT_OPTIONS = [
  { id: 'yyyy-MM-dd HH:mm:ss', label: '2023-01-25 14:30:00 (ISO)' },
  { id: 'MM/dd/yyyy HH:mm', label: '01/25/2023 14:30 (US)' },
  { id: 'dd/MM/yyyy HH:mm', label: '25/01/2023 14:30 (EU)' },
  { id: 'yyyy.MM.dd HH:mm', label: '2023.01.25 14:30 (JP)' },
];

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emails: EmailWithDetails[];
}

export function ExportDialog({ open, onOpenChange, emails }: ExportDialogProps) {
  const { toast } = useToast();
  
  // Export options state
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [dateFormat, setDateFormat] = useState(DATE_FORMAT_OPTIONS[0].id);
  const [filename, setFilename] = useState('nexus-email-export');
  
  const handleExport = () => {
    if (emails.length === 0) {
      toast({
        title: 'No emails to export',
        description: 'Please select at least one email to export.',
        variant: 'destructive',
      });
      return;
    }
    
    const options: ExportOptions = {
      includeAttachments,
      includeHeaders,
      dateFormat,
      filename,
    };
    
    try {
      EmailExporter.exportEmails(emails, exportFormat, options);
      
      toast({
        title: 'Export successful',
        description: `${emails.length} emails exported as ${exportFormat.toUpperCase()}.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: `An error occurred while exporting: ${error.message}`,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Emails</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup 
              value={exportFormat} 
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
              className="grid grid-cols-1 gap-2"
            >
              {FORMAT_OPTIONS.map((format) => (
                <div key={format.id} className={`
                  flex items-center space-x-2 rounded-md border p-3 transition-colors
                  ${exportFormat === format.id ? 'border-primary bg-primary/5' : 'border-neutral-200 dark:border-neutral-800'}
                `}>
                  <RadioGroupItem value={format.id} id={`format-${format.id}`} />
                  <Label htmlFor={`format-${format.id}`} className="flex flex-1 items-center cursor-pointer">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary mr-3">
                      {format.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{format.label}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">{format.description}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Filename */}
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="filename" className="text-right">
              Filename
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="nexus-email-export"
                className="flex-1"
              />
              <div className="text-sm text-neutral-500">.{exportFormat}</div>
            </div>
          </div>
          
          {/* Date Format */}
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="date-format" className="text-right flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Date Format</span>
            </Label>
            <Select value={dateFormat} onValueChange={setDateFormat} className="col-span-3">
              <SelectTrigger id="date-format">
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMAT_OPTIONS.map((format) => (
                  <SelectItem key={format.id} value={format.id}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Options */}
          <div className="space-y-3">
            <Label>Export Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-attachments" 
                checked={includeAttachments}
                onCheckedChange={(checked) => setIncludeAttachments(!!checked)}
              />
              <Label htmlFor="include-attachments" className="flex items-center gap-1 cursor-pointer">
                <Paperclip className="h-4 w-4" />
                <span>Include attachment information</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-headers" 
                checked={includeHeaders}
                onCheckedChange={(checked) => setIncludeHeaders(!!checked)}
              />
              <Label htmlFor="include-headers" className="cursor-pointer">
                Include email headers
              </Label>
            </div>
          </div>
          
          {/* Email Selection Info */}
          <div className="mt-2 text-sm">
            <span className="text-neutral-500">
              {emails.length} {emails.length === 1 ? 'email' : 'emails'} selected for export
            </span>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}