import React from 'react';
import {
  Mail as MailIcon,
  Inbox as InboxIcon,
  Star as StarIcon,
  FileText as FileTextIcon,
  Send as SendIcon,
  Trash as TrashIcon,
  Archive as ArchiveIcon,
  Settings as SettingsIcon,
  Users as UsersIcon,
  Tag as TagIcon,
  Calendar as CalendarIcon,
  CheckSquare as TaskIcon,
  FileBox as FileIcon,
  Folder as FolderIcon,
  Globe as GlobeIcon,
  Smartphone as MobileIcon,
  Calculator as CalculatorIcon,
  Clock as ClockIcon,
  BookOpen as NotesIcon,
  PanelLeftOpen as AccountsIcon,
  Search as SearchIcon,
  PanelRight as PanelRightIcon,
  MailOpen as MailOpenIcon
} from 'lucide-react';

import { PlaceholderComponent } from '../components/PlaceholderComponent';
import { TagManager } from '../components/TagManager';
import { SettingsPanel } from '../components/SettingsPanel';
import { EmailListPane } from '../components/EmailListPane';
import { EmailDetailPane } from '../components/EmailDetailPane';
import { FolderExplorer } from '../components/FolderExplorer';
import { EmailWorkspaceWithSearch } from '../components/EmailWorkspaceWithSearch';
import { AdvancedSearchComponent } from '../components/AdvancedSearchComponent';
import { withEnhancedComponent } from '../components/EnhancedComponentWrapper';

import {
  enhancedComponentRegistry,
  defineEnhancedComponent,
  ComponentPriority,
  ComponentVisibility,
  StatePersistence,
  SearchCapability,
  ComponentCategory
} from './enhancedComponentRegistry';

import { ComponentEventType } from './componentCommunication';
import { TextContentSearchAdapter } from './searchAdapters';

// Helper types to patch missing imports
type ComponentProps = Record<string, any>;

// Create wrapped versions of our components with enhanced features
const EnhancedEmailListPane = withEnhancedComponent(EmailListPane, {
  toolbar: <div className="text-sm font-medium">Email List</div>,
  searchAdapter: new TextContentSearchAdapter({ containerSelector: '.email-item' })
});

const EnhancedEmailDetailPane = withEnhancedComponent(EmailDetailPane, {
  toolbar: <div className="text-sm font-medium">Email Content</div>,
  searchAdapter: new TextContentSearchAdapter({ containerSelector: '.email-content' })
});

const EnhancedSettingsPanel = withEnhancedComponent(SettingsPanel, {
  toolbar: <div className="text-sm font-medium">Settings</div>
});

const EnhancedTagManager = withEnhancedComponent(TagManager, {
  toolbar: <div className="text-sm font-medium">Tag Manager</div>
});

// Create placeholder components for any missing components
const AccountsManager: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Accounts Manager" {...props} />
);

const TaskManager: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Task Manager" {...props} />
);

const ContactDatabase: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Contact Database" {...props} />
);

const TextEditor: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Text Editor" {...props} />
);

const NotesComponent: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Notes" {...props} />
);

const WebBrowser: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Web Browser" {...props} />
);

const MobileEmulator: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Mobile Browsing Emulator" {...props} />
);

const EmailTemplateEditor: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Email Template Editor" {...props} />
);

const CalculatorComponent: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Calculator" {...props} />
);

const ClockComponent: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Clock & Productivity Timer" {...props} />
);

const LocalFileBrowser: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Local File Browser" {...props} />
);

const CloudFileBrowser: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Cloud File Browser" {...props} />
);

const CalendarComponent: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Calendar" {...props} />
);

const ContactInfoPanel: React.FC<ComponentProps> = (props) => (
  <PlaceholderComponent name="Contact Info Panel" {...props} />
);

// Wrap our placeholder components with the enhanced component wrapper
const EnhancedAccountsManager = withEnhancedComponent(AccountsManager);
const EnhancedTaskManager = withEnhancedComponent(TaskManager);
const EnhancedContactDatabase = withEnhancedComponent(ContactDatabase);
const EnhancedTextEditor = withEnhancedComponent(TextEditor);
const EnhancedNotesComponent = withEnhancedComponent(NotesComponent);
const EnhancedWebBrowser = withEnhancedComponent(WebBrowser);
const EnhancedMobileEmulator = withEnhancedComponent(MobileEmulator);
const EnhancedEmailTemplateEditor = withEnhancedComponent(EmailTemplateEditor);
const EnhancedCalculatorComponent = withEnhancedComponent(CalculatorComponent);
const EnhancedClockComponent = withEnhancedComponent(ClockComponent);
const EnhancedLocalFileBrowser = withEnhancedComponent(LocalFileBrowser);
const EnhancedCloudFileBrowser = withEnhancedComponent(CloudFileBrowser);
const EnhancedCalendarComponent = withEnhancedComponent(CalendarComponent);
const EnhancedContactInfoPanel = withEnhancedComponent(ContactInfoPanel);

// Register all components
export function registerEnhancedComponents() {
  // Accounts Management
  defineEnhancedComponent({
    id: 'accounts-manager',
    displayName: 'Accounts Manager',
    description: 'Manage email accounts and settings',
    category: 'email',
    tags: ['account', 'setup', 'configuration'],
    icon: AccountsIcon,
    component: EnhancedAccountsManager,
    supportedPanelTypes: ['main', 'any'],
    priority: ComponentPriority.HIGH,
    statePersistence: StatePersistence.LOCAL,
    singleton: true,
    integrations: {
      events: [
        ComponentEventType.USER_LOGGED_IN,
        ComponentEventType.USER_LOGGED_OUT
      ],
      dataProvider: true
    }
  });

  // Email Components
  defineEnhancedComponent({
    id: 'inbox-list',
    displayName: 'Inbox',
    description: 'View all incoming emails',
    category: 'email',
    tags: ['email', 'inbox', 'messages'],
    icon: InboxIcon,
    component: EnhancedEmailListPane,
    supportedPanelTypes: ['main', 'sidebar', 'any'],
    priority: ComponentPriority.CRITICAL,
    statePersistence: StatePersistence.SESSION,
    searchCapability: SearchCapability.ADVANCED,
    defaultConfig: {
      defaultFilters: { category: 'inbox' },
      refreshOnMount: true,
      refreshOnFocus: true
    },
    integrations: {
      events: [
        ComponentEventType.EMAIL_SELECTED,
        ComponentEventType.EMAIL_READ,
        ComponentEventType.EMAIL_ARCHIVED,
        ComponentEventType.EMAIL_DELETED
      ],
      dataProvider: true
    }
  });

  defineEnhancedComponent({
    id: 'starred-emails',
    displayName: 'Starred Emails',
    description: 'View all starred emails',
    category: 'email',
    tags: ['email', 'starred', 'important'],
    icon: StarIcon,
    component: EnhancedEmailListPane,
    supportedPanelTypes: ['main', 'sidebar', 'any'],
    priority: ComponentPriority.NORMAL,
    statePersistence: StatePersistence.SESSION,
    searchCapability: SearchCapability.ADVANCED,
    defaultConfig: {
      defaultFilters: { isStarred: true },
      refreshOnMount: true
    },
    integrations: {
      events: [
        ComponentEventType.EMAIL_SELECTED,
        ComponentEventType.EMAIL_STARRED
      ],
      dataProvider: true
    }
  });

  defineEnhancedComponent({
    id: 'drafts',
    displayName: 'Drafts',
    description: 'View saved email drafts',
    category: 'email',
    tags: ['email', 'drafts', 'compose'],
    icon: FileTextIcon,
    component: EnhancedEmailListPane,
    supportedPanelTypes: ['main', 'sidebar', 'any'],
    priority: ComponentPriority.NORMAL,
    statePersistence: StatePersistence.SESSION,
    searchCapability: SearchCapability.BASIC,
    defaultConfig: {
      defaultFilters: { category: 'drafts' },
      refreshOnMount: true
    },
    integrations: {
      events: [
        ComponentEventType.EMAIL_SELECTED,
        ComponentEventType.EMAIL_DRAFT_SAVED
      ],
      dataProvider: true
    }
  });

  defineEnhancedComponent({
    id: 'sent-emails',
    displayName: 'Sent Emails',
    description: 'View sent emails',
    category: 'email',
    tags: ['email', 'sent', 'outgoing'],
    icon: SendIcon,
    component: EnhancedEmailListPane,
    supportedPanelTypes: ['main', 'sidebar', 'any'],
    priority: ComponentPriority.NORMAL,
    statePersistence: StatePersistence.SESSION,
    searchCapability: SearchCapability.BASIC,
    defaultConfig: {
      defaultFilters: { category: 'sent' },
      refreshOnMount: true
    },
    integrations: {
      events: [
        ComponentEventType.EMAIL_SELECTED,
        ComponentEventType.EMAIL_SENT
      ],
      dataProvider: true
    }
  });

  defineEnhancedComponent({
    id: 'archived-emails',
    displayName: 'Archived Emails',
    description: 'View archived emails',
    category: 'email',
    tags: ['email', 'archived', 'storage'],
    icon: ArchiveIcon,
    component: EnhancedEmailListPane,
    supportedPanelTypes: ['main', 'sidebar', 'any'],
    priority: ComponentPriority.LOW,
    statePersistence: StatePersistence.SESSION,
    searchCapability: SearchCapability.BASIC,
    defaultConfig: {
      defaultFilters: { category: 'archived' },
      refreshOnMount: true
    },
    integrations: {
      events: [
        ComponentEventType.EMAIL_SELECTED,
        ComponentEventType.EMAIL_ARCHIVED
      ],
      dataProvider: true
    }
  });

  defineEnhancedComponent({
    id: 'trash',
    displayName: 'Trash',
    description: 'View deleted emails',
    category: 'email',
    tags: ['email', 'trash', 'deleted'],
    icon: TrashIcon,
    component: EnhancedEmailListPane,
    supportedPanelTypes: ['main', 'sidebar', 'any'],
    priority: ComponentPriority.LOW,
    statePersistence: StatePersistence.SESSION,
    searchCapability: SearchCapability.BASIC,
    defaultConfig: {
      defaultFilters: { category: 'trash' },
      refreshOnMount: true
    },
    integrations: {
      events: [
        ComponentEventType.EMAIL_SELECTED,
        ComponentEventType.EMAIL_DELETED
      ],
      dataProvider: true
    }
  });

  defineEnhancedComponent({
    id: 'email-content-viewer',
    displayName: 'Email Viewer',
    description: 'View email content',
    category: 'email',
    tags: ['email', 'content', 'reader'],
    icon: MailOpenIcon,
    component: EnhancedEmailDetailPane,
    supportedPanelTypes: ['main', 'any'],
    priority: ComponentPriority.CRITICAL,
    statePersistence: StatePersistence.SESSION,
    searchCapability: SearchCapability.BASIC,
    defaultConfig: {
      refreshOnMount: false
    },
    integrations: {
      events: [
        ComponentEventType.EMAIL_SELECTED,
        ComponentEventType.EMAIL_READ
      ],
      dataConsumer: true
    }
  });

  // Content Info Panel
  defineEnhancedComponent({
    id: 'contact-info-panel',
    displayName: 'Contact Info',
    description: 'View contact details',
    category: 'contacts',
    tags: ['contact', 'info', 'details'],
    icon: UsersIcon,
    component: EnhancedContactInfoPanel,
    supportedPanelTypes: ['sidebar', 'any'],
    priority: ComponentPriority.NORMAL,
    statePersistence: StatePersistence.SESSION,
    integrations: {
      events: [ComponentEventType.CONTACT_SELECTED],
      dataConsumer: true
    }
  });

  // Tag Manager
  defineEnhancedComponent({
    id: 'tag-manager',
    displayName: 'Tag Manager',
    description: 'Manage email tags and categories',
    category: 'tags',
    tags: ['tags', 'labels', 'categories'],
    icon: TagIcon,
    component: EnhancedTagManager,
    supportedPanelTypes: ['sidebar', 'any'],
    priority: ComponentPriority.NORMAL,
    statePersistence: StatePersistence.LOCAL,
    integrations: {
      events: [ComponentEventType.EMAIL_TAGGED],
      dataProvider: true
    }
  });

  // Calendar (both generic and integration-ready)
  defineEnhancedComponent({
    id: 'calendar',
    displayName: 'Calendar',
    description: 'View and manage calendar events',
    category: 'calendar',
    tags: ['calendar', 'events', 'schedule', 'planning'],
    icon: CalendarIcon,
    component: EnhancedCalendarComponent,
    supportedPanelTypes: ['main', 'any'],
    priority: ComponentPriority.HIGH,
    statePersistence: StatePersistence.LOCAL,
    integrations: {
      events: [
        ComponentEventType.CALENDAR_EVENT_CREATED,
        ComponentEventType.CALENDAR_EVENT_UPDATED,
        ComponentEventType.CALENDAR_EVENT_DELETED
      ],
      dataProvider: true
    }
  });

  // Task Manager
  defineEnhancedComponent({
    id: 'task-manager',
    displayName: 'Task Manager',
    description: 'Manage tasks and to-dos',
    category: 'tasks',
    tags: ['tasks', 'todo', 'productivity'],
    icon: TaskIcon,
    component: EnhancedTaskManager,
    supportedPanelTypes: ['main', 'any'],
    priority: ComponentPriority.HIGH,
    statePersistence: StatePersistence.LOCAL,
    integrations: {
      events: [
        ComponentEventType.TASK_CREATED,
        ComponentEventType.TASK_UPDATED,
        ComponentEventType.TASK_COMPLETED,
        ComponentEventType.TASK_DELETED
      ],
      dataProvider: true
    }
  });

  // Contact Database
  defineEnhancedComponent({
    id: 'contact-database',
    displayName: 'Contact Database',
    description: 'View and manage contacts',
    category: 'contacts',
    tags: ['contacts', 'people', 'address book'],
    icon: UsersIcon,
    component: EnhancedContactDatabase,
    supportedPanelTypes: ['main', 'any'],
    priority: ComponentPriority.NORMAL,
    statePersistence: StatePersistence.LOCAL,
    searchCapability: SearchCapability.ADVANCED,
    integrations: {
      events: [
        ComponentEventType.CONTACT_CREATED,
        ComponentEventType.CONTACT_UPDATED,
        ComponentEventType.CONTACT_DELETED,
        ComponentEventType.CONTACT_SELECTED
      ],
      dataProvider: true
    }
  });

  // Text Editor
  defineEnhancedComponent({
    id: 'text-editor',
    displayName: 'Text Editor',
    description: 'Edit and format text',
    category: 'utility',
    tags: ['text', 'editor', 'writing'],
    icon: FileTextIcon,
    component: EnhancedTextEditor,
    supportedPanelTypes: ['main', 'any'],
    priority: ComponentPriority.NORMAL,
    statePersistence: StatePersistence.LOCAL
  });

  // Notes
  defineEnhancedComponent({
    id: 'notes',
    displayName: 'Notes',
    description: 'Take and organize notes',
    category: 'notes',
    tags: ['notes', 'writing', 'organization'],
    icon: NotesIcon,
    component: EnhancedNotesComponent,
    supportedPanelTypes: ['main', 'any'],
    priority: ComponentPriority.NORMAL,
    statePersistence: StatePersistence.LOCAL,
    searchCapability: SearchCapability.BASIC,
    integrations: {
      events: [
        ComponentEventType.NOTE_CREATED,
        ComponentEventType.NOTE_UPDATED,
        ComponentEventType.NOTE_DELETED
      ],
      dataProvider: true
    }
  });

  // Web Browser
  defineEnhancedComponent({
    id: 'web-browser',
    displayName: 'Web Browser',
    description: 'Browse the web within NEXUS.email',
    category: 'browser',
    tags: ['browser', 'web', 'internet'],
    icon: GlobeIcon,
    component: EnhancedWebBrowser,
    supportedPanelTypes: ['main', 'any'],
    priority: ComponentPriority.NORMAL,
    statePersistence: StatePersistence.SESSION,
    integrations: {
      events: [
        ComponentEventType.BROWSER_PAGE_LOADED,
        ComponentEventType.BROWSER_NAV_CHANGED
      ]
    }
  });

  // Mobile Browsing Emulator
  defineEnhancedComponent({
    id: 'mobile-emulator',
    displayName: 'Mobile Emulator',
    description: 'Emulate mobile browsing experience',
    category: 'browser',
    tags: ['browser', 'mobile', 'emulator', 'responsive'],
    icon: MobileIcon,
    component: EnhancedMobileEmulator,
    supportedPanelTypes: ['main', 'any'],
    priority: ComponentPriority.LOW,
    statePersistence: StatePersistence.SESSION,
    visibility: ComponentVisibility.ADVANCED
  });

  // Email Template Editor
  defineEnhancedComponent({
    id: 'email-template-editor',
    displayName: 'Email Template Editor',
    description: 'Create and edit email templates',
    category: 'email',
    tags: ['email', 'templates', 'design'],
    icon: FileTextIcon,
    component: EnhancedEmailTemplateEditor,
    supportedPanelTypes: ['main', 'any'],
    priority: ComponentPriority.NORMAL,
    statePersistence: StatePersistence.LOCAL
  });

  // Application Settings
  defineEnhancedComponent({
    id: 'settings',
    displayName: 'Settings',
    description: 'Configure application settings',
    category: 'settings',
    tags: ['settings', 'preferences', 'configuration'],
    icon: SettingsIcon,
    component: EnhancedSettingsPanel,
    supportedPanelTypes: ['main', 'bottom', 'any'],
    priority: ComponentPriority.NORMAL,
    statePersistence: StatePersistence.LOCAL,
    singleton: true,
    integrations: {
      events: [ComponentEventType.USER_SETTINGS_UPDATED],
      dataProvider: true
    }
  });

  // Calculator
  defineEnhancedComponent({
    id: 'calculator',
    displayName: 'Calculator',
    description: 'Perform calculations',
    category: 'tools',
    tags: ['calculator', 'math', 'utility'],
    icon: CalculatorIcon,
    component: EnhancedCalculatorComponent,
    supportedPanelTypes: ['sidebar', 'bottom', 'any'],
    priority: ComponentPriority.LOW,
    statePersistence: StatePersistence.SESSION
  });

  // Clock with Productivity Timer
  defineEnhancedComponent({
    id: 'clock',
    displayName: 'Clock & Productivity Timer',
    description: 'View time and track productivity sessions',
    category: 'tools',
    tags: ['clock', 'timer', 'productivity', 'pomodoro'],
    icon: ClockIcon,
    component: EnhancedClockComponent,
    supportedPanelTypes: ['sidebar', 'bottom', 'any'],
    priority: ComponentPriority.LOW,
    statePersistence: StatePersistence.LOCAL
  });

  // File Browser (Local)
  defineEnhancedComponent({
    id: 'local-file-browser',
    displayName: 'Local File Browser',
    description: 'Browse and manage local files',
    category: 'files',
    tags: ['files', 'browser', 'local', 'storage'],
    icon: FolderIcon,
    component: EnhancedLocalFileBrowser,
    supportedPanelTypes: ['main', 'any'],
    priority: ComponentPriority.NORMAL,
    statePersistence: StatePersistence.SESSION,
    integrations: {
      events: [
        ComponentEventType.FILE_CREATED,
        ComponentEventType.FILE_UPDATED,
        ComponentEventType.FILE_DELETED,
        ComponentEventType.FILE_SELECTED
      ],
      dataProvider: true
    }
  });

  // File Browser (Cloud)
  defineEnhancedComponent({
    id: 'cloud-file-browser',
    displayName: 'Cloud File Browser',
    description: 'Browse and manage cloud files',
    category: 'files',
    tags: ['files', 'browser', 'cloud', 'storage'],
    icon: FileIcon,
    component: EnhancedCloudFileBrowser,
    supportedPanelTypes: ['main', 'any'],
    priority: ComponentPriority.NORMAL,
    statePersistence: StatePersistence.SESSION,
    integrations: {
      events: [
        ComponentEventType.FILE_UPLOADED,
        ComponentEventType.FILE_DOWNLOADED,
        ComponentEventType.FILE_SELECTED
      ],
      dataProvider: true
    }
  });

  // Advanced Search
  defineEnhancedComponent({
    id: 'advanced-search',
    displayName: 'Advanced Search',
    description: 'Perform advanced searches across all data',
    category: 'search',
    tags: ['search', 'filter', 'find'],
    icon: SearchIcon,
    component: AdvancedSearchComponent,
    supportedPanelTypes: ['main', 'sidebar', 'any'],
    priority: ComponentPriority.HIGH,
    statePersistence: StatePersistence.LOCAL,
    searchCapability: SearchCapability.FULL,
    integrations: {
      events: [
        ComponentEventType.SEARCH_PERFORMED,
        ComponentEventType.SEARCH_RESULT
      ],
      dataConsumer: true
    }
  });

  return enhancedComponentRegistry;
}

export default registerEnhancedComponents;