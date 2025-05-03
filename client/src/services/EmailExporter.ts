import { saveAs } from 'file-saver';
import { Email, EmailWithDetails } from '../../../shared/schema';

// Type safety helpers for accessing properties
const getEmailName = (email: EmailWithDetails): string => {
  return email.subject || 'Untitled Email';
};

const getFromContactInfo = (email: EmailWithDetails): string => {
  if (!email.fromContact) return '';
  return `${email.fromContact.name} <${email.fromContact.email}>`;
};

const getToContactsInfo = (email: EmailWithDetails): string => {
  if (!email.recipients) return '';
  return email.recipients.map(r => 
    `${r.contact.name} <${r.contact.email}>`
  ).join('; ');
};

const getRecipientType = (recipient: any): string => {
  return recipient.recipientType || 'to';
};

const getAttachmentName = (attachment: any): string => {
  return attachment.fileName || 'Unknown file';
};

const getAttachmentSize = (attachment: any): number => {
  return attachment.fileSize || 0;
};

const getAttachmentType = (attachment: any): string => {
  return attachment.fileType || 'application/octet-stream';
};

// Define the available export formats
export type ExportFormat = 'csv' | 'json' | 'html' | 'txt' | 'markdown';

// Define options for exporting
export interface ExportOptions {
  includeAttachments?: boolean;
  includeHeaders?: boolean;
  dateFormat?: string;
  filename?: string;
}

// Default export options
const defaultOptions: ExportOptions = {
  includeAttachments: true,
  includeHeaders: true,
  dateFormat: 'yyyy-MM-dd HH:mm:ss',
  filename: 'nexus-email-export'
};

// Helper function to format date
function formatDate(date: Date, format: string): string {
  const pad = (num: number) => String(num).padStart(2, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  
  return format
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

export class EmailExporter {
  /**
   * Export emails in the specified format
   */
  static exportEmails(emails: EmailWithDetails[], format: ExportFormat, options: ExportOptions = {}): void {
    // Merge with default options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Generate filename with timestamp
    const timestamp = formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = `${mergedOptions.filename || 'nexus-email-export'}_${timestamp}`;
    
    switch (format) {
      case 'csv':
        this.exportAsCSV(emails, filename, mergedOptions);
        break;
      case 'json':
        this.exportAsJSON(emails, filename, mergedOptions);
        break;
      case 'html':
        this.exportAsHTML(emails, filename, mergedOptions);
        break;
      case 'txt':
        this.exportAsText(emails, filename, mergedOptions);
        break;
      case 'markdown':
        this.exportAsMarkdown(emails, filename, mergedOptions);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
  
  /**
   * Export emails as CSV
   */
  private static exportAsCSV(emails: EmailWithDetails[], filename: string, options: ExportOptions): void {
    // Define CSV headers
    const headers = ['Subject', 'From', 'To', 'Date', 'Category', 'Priority', 'Body'];
    
    // Build CSV content
    let csvContent = headers.join(',') + '\n';
    
    emails.forEach(email => {
      // Escape special characters in CSV fields
      const escapeCsv = (str: string) => {
        const escaped = String(str || '')
          .replace(/"/g, '""')
          .replace(/\n/g, ' ');
        return `"${escaped}"`;
      };
      
      const fromContact = email.fromContact ? `${email.fromContact.name} <${email.fromContact.email}>` : '';
      
      const toContacts = email.recipients
        ? email.recipients.map(r => `${r.contact.name} <${r.contact.email}>`).join('; ')
        : '';
      
      const date = email.timestamp 
        ? formatDate(new Date(email.timestamp), options.dateFormat || defaultOptions.dateFormat)
        : '';
      
      const row = [
        escapeCsv(email.subject),
        escapeCsv(fromContact),
        escapeCsv(toContacts),
        escapeCsv(date),
        escapeCsv(email.category),
        escapeCsv(email.priority),
        escapeCsv(email.body)
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${filename}.csv`);
  }
  
  /**
   * Export emails as JSON
   */
  private static exportAsJSON(emails: EmailWithDetails[], filename: string, options: ExportOptions): void {
    // Create a clean version of the emails without circular references
    const cleanEmails = emails.map(email => {
      const { recipients, fromContact, attachments, tags, ...cleanEmail } = email;
      
      return {
        ...cleanEmail,
        from: fromContact ? {
          name: fromContact.name,
          email: fromContact.email
        } : null,
        to: recipients ? recipients.map(r => ({
          name: r.contact.name,
          email: r.contact.email,
          type: getRecipientType(r)
        })) : [],
        attachments: options.includeAttachments && attachments ? attachments.map(a => ({
          name: getAttachmentName(a),
          size: getAttachmentSize(a),
          type: getAttachmentType(a)
        })) : [],
        tags: tags ? tags.map(t => ({
          name: t.tag.name,
          color: t.tag.textColor,
          bgColor: t.tag.bgColor,
          emoji: t.tag.emoji
        })) : []
      };
    });
    
    // Create blob and download
    const blob = new Blob([JSON.stringify(cleanEmails, null, 2)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, `${filename}.json`);
  }
  
  /**
   * Export emails as HTML
   */
  private static exportAsHTML(emails: EmailWithDetails[], filename: string, options: ExportOptions): void {
    // Generate HTML template
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEXUS.email Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .email-container { border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; border-radius: 5px; }
    .email-header { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
    .email-subject { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
    .email-meta { color: #666; font-size: 14px; display: flex; justify-content: space-between; }
    .email-body { line-height: 1.5; white-space: pre-wrap; }
    .email-attachments { margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; }
    .email-attachment { display: inline-block; background: #f5f5f5; padding: 5px 10px; margin-right: 10px; margin-bottom: 5px; border-radius: 3px; }
    .priority-high { border-left: 4px solid #e53e3e; }
    .priority-medium { border-left: 4px solid #dd6b20; }
    .priority-low { border-left: 4px solid #38a169; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-right: 5px; }
  </style>
</head>
<body>
  <h1>NEXUS.email Export</h1>
  <p>Exported on ${formatDate(new Date(), options.dateFormat || defaultOptions.dateFormat)}</p>
  <p>Total emails: ${emails.length}</p>
  <div class="emails">
`;

    // Add each email to the HTML
    emails.forEach(email => {
      const fromContact = email.fromContact ? `${email.fromContact.name} <${email.fromContact.email}>` : 'Unknown';
      
      const toContacts = email.recipients
        ? email.recipients.map(r => `${r.contact.name} <${r.contact.email}>`).join(', ')
        : 'Unknown';
      
      const date = email.timestamp 
        ? formatDate(new Date(email.timestamp), options.dateFormat || defaultOptions.dateFormat)
        : 'Unknown date';
      
      const priorityClass = email.priority === 'high' 
        ? 'priority-high' 
        : email.priority === 'medium' 
          ? 'priority-medium' 
          : email.priority === 'low' 
            ? 'priority-low' 
            : '';
      
      // Tags HTML
      const tagsHtml = email.tags && email.tags.length > 0 
        ? '<div class="email-tags">' + 
            email.tags.map(t => 
              `<span class="tag" style="background-color: ${t.tag.bgColor}; color: ${t.tag.textColor}">
                ${t.tag.emoji ? t.tag.emoji + ' ' : ''}${t.tag.name}
              </span>`
            ).join('') + 
          '</div>'
        : '';
      
      // Attachments HTML
      const attachmentsHtml = options.includeAttachments && email.attachments && email.attachments.length > 0
        ? '<div class="email-attachments">' +
            '<h4>Attachments:</h4>' +
            email.attachments.map(a => 
              `<div class="email-attachment">
                ${getAttachmentName(a)} (${Math.round(getAttachmentSize(a) / 1024)} KB)
              </div>`
            ).join('') +
          '</div>'
        : '';
      
      htmlContent += `
  <div class="email-container ${priorityClass}">
    <div class="email-header">
      <div class="email-subject">${email.subject}</div>
      <div class="email-meta">
        <div>
          <strong>From:</strong> ${fromContact}<br>
          <strong>To:</strong> ${toContacts}<br>
          ${tagsHtml}
        </div>
        <div>
          <strong>Date:</strong> ${date}<br>
          <strong>Category:</strong> ${email.category}<br>
          <strong>Priority:</strong> ${email.priority}
        </div>
      </div>
    </div>
    <div class="email-body">${email.body}</div>
    ${attachmentsHtml}
  </div>
`;
    });
    
    // Close HTML template
    htmlContent += `
  </div>
  <footer>
    <p>Generated by NEXUS.email</p>
  </footer>
</body>
</html>`;
    
    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `${filename}.html`);
  }
  
  /**
   * Export emails as plain text
   */
  private static exportAsText(emails: EmailWithDetails[], filename: string, options: ExportOptions): void {
    let textContent = `NEXUS.email Export\n`;
    textContent += `Exported on ${formatDate(new Date(), options.dateFormat || defaultOptions.dateFormat)}\n`;
    textContent += `Total emails: ${emails.length}\n\n`;
    
    emails.forEach((email, index) => {
      const fromContact = email.fromContact ? `${email.fromContact.name} <${email.fromContact.email}>` : 'Unknown';
      
      const toContacts = email.recipients
        ? email.recipients.map(r => `${r.contact.name} <${r.contact.email}>`).join(', ')
        : 'Unknown';
      
      const date = email.timestamp 
        ? formatDate(new Date(email.timestamp), options.dateFormat || defaultOptions.dateFormat)
        : 'Unknown date';
      
      textContent += `Email #${index + 1}\n`;
      textContent += `${'='.repeat(50)}\n`;
      textContent += `Subject: ${email.subject}\n`;
      textContent += `From: ${fromContact}\n`;
      textContent += `To: ${toContacts}\n`;
      textContent += `Date: ${date}\n`;
      textContent += `Category: ${email.category}\n`;
      textContent += `Priority: ${email.priority}\n`;
      
      if (email.tags && email.tags.length > 0) {
        textContent += `Tags: ${email.tags.map(t => `${t.tag.emoji || ''} ${t.tag.name}`).join(', ')}\n`;
      }
      
      textContent += `\n${email.body}\n\n`;
      
      if (options.includeAttachments && email.attachments && email.attachments.length > 0) {
        textContent += `Attachments:\n`;
        email.attachments.forEach(a => {
          textContent += `- ${a.name} (${Math.round(a.size / 1024)} KB)\n`;
        });
      }
      
      textContent += `\n${'='.repeat(50)}\n\n`;
    });
    
    // Create blob and download
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${filename}.txt`);
  }
  
  /**
   * Export emails as Markdown
   */
  private static exportAsMarkdown(emails: EmailWithDetails[], filename: string, options: ExportOptions): void {
    let mdContent = `# NEXUS.email Export\n\n`;
    mdContent += `Exported on ${formatDate(new Date(), options.dateFormat || defaultOptions.dateFormat)}\n\n`;
    mdContent += `Total emails: ${emails.length}\n\n`;
    
    emails.forEach((email, index) => {
      const fromContact = email.fromContact ? `${email.fromContact.name} <${email.fromContact.email}>` : 'Unknown';
      
      const toContacts = email.recipients
        ? email.recipients.map(r => `${r.contact.name} <${r.contact.email}>`).join(', ')
        : 'Unknown';
      
      const date = email.timestamp 
        ? formatDate(new Date(email.timestamp), options.dateFormat || defaultOptions.dateFormat)
        : 'Unknown date';
      
      mdContent += `## Email #${index + 1} - ${email.subject}\n\n`;
      
      mdContent += `**From:** ${fromContact}  \n`;
      mdContent += `**To:** ${toContacts}  \n`;
      mdContent += `**Date:** ${date}  \n`;
      mdContent += `**Category:** ${email.category}  \n`;
      mdContent += `**Priority:** ${email.priority}  \n`;
      
      if (email.tags && email.tags.length > 0) {
        mdContent += `**Tags:** ${email.tags.map(t => `${t.tag.emoji || ''} ${t.tag.name}`).join(', ')}  \n`;
      }
      
      mdContent += `\n### Body\n\n\`\`\`\n${email.body}\n\`\`\`\n\n`;
      
      if (options.includeAttachments && email.attachments && email.attachments.length > 0) {
        mdContent += `### Attachments\n\n`;
        email.attachments.forEach(a => {
          mdContent += `- ${a.name} (${Math.round(a.size / 1024)} KB)\n`;
        });
        mdContent += `\n`;
      }
      
      mdContent += `---\n\n`;
    });
    
    // Create blob and download
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${filename}.md`);
  }
}