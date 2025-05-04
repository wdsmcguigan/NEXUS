import React, { useState } from 'react';
import { SearchableEmailList } from './SearchableEmailList';
import { EmailViewer } from './EmailViewer';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

// Demo sample data
const SAMPLE_EMAILS = [
  {
    id: 1,
    subject: "Project Status Update - Week 23",
    from: "Sarah Johnson",
    preview: "The development team has completed the initial phase of the project ahead of schedule. We're now moving into testing with...",
    date: "2025-05-03T14:30:00",
    isRead: true,
    isStarred: true,
    hasAttachments: true,
    tags: ["Work", "Important"]
  },
  {
    id: 2,
    subject: "Meeting Notes: Product Strategy",
    from: "Michael Chen",
    preview: "Attached are the notes from yesterday's product strategy meeting. Key points discussed include the roadmap for Q3 and customer feedback...",
    date: "2025-05-02T10:15:00",
    isRead: false,
    isStarred: false,
    hasAttachments: true,
    tags: ["Work", "Meeting"]
  },
  {
    id: 3,
    subject: "Weekend plans?",
    from: "Alex Rodriguez",
    preview: "Hey! Are you free this weekend? A bunch of us are planning to check out that new restaurant downtown. Let me know if you'd like to join...",
    date: "2025-05-01T19:45:00",
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    tags: ["Personal"]
  },
  {
    id: 4,
    subject: "Your flight confirmation - NYC to SFO",
    from: "TravelBookings",
    preview: "Thank you for booking with us! Your upcoming flight from New York (JFK) to San Francisco (SFO) is confirmed. Flight details: Departure...",
    date: "2025-04-30T08:20:00",
    isRead: true,
    isStarred: true,
    hasAttachments: false,
    tags: ["Travel"]
  },
  {
    id: 5,
    subject: "Invoice #INV-2025-0428",
    from: "Accounting Department",
    preview: "Please find attached invoice #INV-2025-0428 for services rendered during April 2025. Payment is due within 30 days. If you have any questions...",
    date: "2025-04-28T11:30:00",
    isRead: false,
    isStarred: false,
    hasAttachments: true,
    tags: ["Work", "Finance"]
  }
];

// Sample email content
const SAMPLE_EMAIL_CONTENT = {
  1: {
    id: 1,
    subject: "Project Status Update - Week 23",
    from: "Sarah Johnson",
    fromEmail: "sarah.johnson@example.com",
    to: ["you@example.com"],
    date: "2025-05-03T14:30:00",
    body: `
      <h2>Project Status: Week 23</h2>
      <p>Hello team,</p>
      <p>I'm pleased to report that we've made significant progress on the project this week. Here's a summary of what we've accomplished:</p>
      
      <h3>Development Team</h3>
      <ul>
        <li>Completed the user authentication module</li>
        <li>Fixed 12 critical bugs identified in last week's testing</li>
        <li>Implemented the new dashboard interface</li>
        <li>Started work on the reporting feature</li>
      </ul>
      
      <h3>Design Team</h3>
      <ul>
        <li>Finalized the mobile UI components</li>
        <li>Created new icons for the navigation menu</li>
        <li>Completed user testing for the dashboard redesign</li>
      </ul>
      
      <h3>Testing Team</h3>
      <ul>
        <li>Completed regression testing for v2.3</li>
        <li>Created 30 new automated test cases</li>
        <li>Identified 8 minor issues that have been added to the backlog</li>
      </ul>
      
      <h3>Next Steps</h3>
      <p>We're on track to meet our deadline for the beta release next month. The development team will focus on completing the reporting feature while the design team will work on finalizing the mobile experience.</p>
      
      <p>Our next project meeting is scheduled for Tuesday at 10 AM. Please review the attached project timeline before the meeting.</p>
      
      <p>Let me know if you have any questions or concerns.</p>
      
      <p>Best regards,<br>Sarah</p>
    `,
    attachments: [
      {
        id: "att-1",
        name: "Project_Timeline_Week23.pdf",
        size: 1420345,
        type: "application/pdf"
      },
      {
        id: "att-2",
        name: "Developer_Notes.docx",
        size: 582910,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      }
    ],
    starred: true,
    tags: ["Work", "Important"]
  },
  
  2: {
    id: 2,
    subject: "Meeting Notes: Product Strategy",
    from: "Michael Chen",
    fromEmail: "m.chen@example.com",
    to: ["you@example.com", "team@example.com"],
    cc: ["boss@example.com"],
    date: "2025-05-02T10:15:00",
    body: `
      <h2>Product Strategy Meeting - Notes</h2>
      <p>Dear all,</p>
      
      <p>Thank you for participating in yesterday's product strategy meeting. Here's a summary of what was discussed and decided:</p>
      
      <h3>Current Product Performance</h3>
      <ul>
        <li>User growth: 18% increase month-over-month</li>
        <li>Revenue: Up 12% compared to last quarter</li>
        <li>Churn rate: Decreased to 3.2% (from 4.5%)</li>
        <li>Most used feature: Collaborative editing (52% of active users)</li>
      </ul>
      
      <h3>Q3 Roadmap Priorities</h3>
      <ol>
        <li>Mobile app redesign with focus on speed and reliability</li>
        <li>AI-powered content suggestions feature launch</li>
        <li>Enterprise SSO implementation</li>
        <li>New pricing tiers introduction</li>
      </ol>
      
      <h3>Customer Feedback Highlights</h3>
      <p>Our recent user surveys indicated the following top requests:</p>
      <ul>
        <li>Better offline support (mentioned by 65% of respondents)</li>
        <li>More integrations with third-party tools (58%)</li>
        <li>Advanced permissions system (42%)</li>
        <li>Improved collaboration features (37%)</li>
      </ul>
      
      <h3>Competitive Analysis</h3>
      <p>Our main competitor launched a new feature set last week that overlaps with our Q4 plans. The product team will revise our timeline to address this development. A separate email with the detailed analysis will be sent later this week.</p>
      
      <h3>Action Items</h3>
      <ul>
        <li>Product team: Revise Q3 roadmap to prioritize offline support (Due: May 10)</li>
        <li>Design team: Finalize mobile app redesign concepts (Due: May 15)</li>
        <li>Marketing team: Prepare communication plan for new pricing tiers (Due: May 20)</li>
        <li>Engineering team: Provide timeline estimates for top 3 roadmap items (Due: May 12)</li>
      </ul>
      
      <p>Our next strategy meeting is scheduled for May 30th. Please review the attached presentation before then.</p>
      
      <p>Best regards,<br>Michael</p>
    `,
    attachments: [
      {
        id: "att-3",
        name: "Product_Strategy_Q3_2025.pptx",
        size: 3845120,
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      }
    ],
    starred: false,
    tags: ["Work", "Meeting"]
  }
};

interface EmailWorkspaceProps {
  id: string;
}

export function EmailWorkspace({ id }: EmailWorkspaceProps) {
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  
  const handleSelectEmail = (email: any) => {
    // In a real app, you'd fetch the email content from the server
    // Here we're using the sample data
    setSelectedEmail(SAMPLE_EMAIL_CONTENT[email.id as keyof typeof SAMPLE_EMAIL_CONTENT]);
  };
  
  return (
    <div className="h-full bg-neutral-950">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30} minSize={20}>
          <SearchableEmailList 
            id={`${id}-list`}
            emails={SAMPLE_EMAILS}
            onSelectEmail={handleSelectEmail}
          />
        </ResizablePanel>
        
        <ResizablePanel defaultSize={70}>
          <EmailViewer 
            id={`${id}-viewer`}
            email={selectedEmail}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}