import { useState } from "react";
import { useEmailContext } from "@/context/EmailContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { accountColors, starColors } from "@/lib/data";
import { Email, EmailWithDetails, Tag } from "@shared/schema";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { RefreshCcw, Trash, ArrowUpDown, Star, CheckSquare, Square } from "lucide-react";
import { Tag as TagComponent } from "@/components/ui/tag";

const EmailListPane = () => {
  const { 
    emails, 
    selectedEmail, 
    setSelectedEmail, 
    selectedCategory,
    setSelectedCategory,
    toggleEmailStar,
    selectedAccount
  } = useEmailContext();
  
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  const handleEmailSelect = (emailId: number, checked: boolean) => {
    if (checked) {
      setSelectedEmails(prev => [...prev, emailId]);
    } else {
      setSelectedEmails(prev => prev.filter(id => id !== emailId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAllChecked(checked);
    if (checked) {
      setSelectedEmails(emails.map(email => email.id));
    } else {
      setSelectedEmails([]);
    }
  };

  const formatEmailDate = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  // Determine if an email is selected by checking the selectedEmails array
  const isEmailSelected = (emailId: number) => selectedEmails.includes(emailId);

  // Function to render tags for an email
  const renderTags = (email: Email & { tags?: (any & { tag: Tag })[] }) => {
    if (!email.tags || email.tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {email.tags.map((emailTag) => (
          <TagComponent 
            key={emailTag.id}
            color={emailTag.tag.textColor}
            bgColor={emailTag.tag.bgColor}
            emoji={emailTag.tag.emoji}
            className="text-xs py-0 px-1.5"
          >
            {emailTag.tag.name}
          </TagComponent>
        ))}
      </div>
    );
  };

  return (
    <div className="w-96 border-r border-neutral-200 flex flex-col bg-white dark:bg-neutral-900 dark:border-neutral-800">
      {/* Toolbar */}
      <div className="p-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center">
          <Checkbox 
            className="mr-2 h-4 w-4 cursor-pointer border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary"
            checked={selectAllChecked}
            onCheckedChange={handleSelectAll}
          />
          <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
            <RefreshCcw className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </Button>
          <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
            <Trash className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </Button>
        </div>
        <div>
          <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
            <ArrowUpDown className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </Button>
        </div>
      </div>
      
      {/* Category tabs */}
      <Tabs defaultValue={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
        <TabsList className="w-full bg-transparent border-b border-neutral-200 dark:border-neutral-800">
          <TabsTrigger 
            className="flex-1 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none dark:text-neutral-300 dark:data-[state=active]:text-primary" 
            value="primary"
          >
            Primary
          </TabsTrigger>
          <TabsTrigger 
            className="flex-1 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none dark:text-neutral-300 dark:data-[state=active]:text-primary" 
            value="social"
          >
            Social
          </TabsTrigger>
          <TabsTrigger 
            className="flex-1 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none dark:text-neutral-300 dark:data-[state=active]:text-primary" 
            value="promotions"
          >
            Promotions
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Email list */}
      <ScrollArea className="flex-1">
        {emails.map((email) => (
          <div 
            key={email.id} 
            className={`email-item p-3 relative border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${selectedEmail?.id === email.id ? 'selected bg-neutral-100 dark:bg-neutral-800' : ''} ${isEmailSelected(email.id) ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
            onClick={() => setSelectedEmail(email)}
          >
            <div className={`account-indicator absolute left-0 top-0 bottom-0 w-1 ${selectedAccount ? accountColors[selectedAccount.accountType] : 'bg-primary'}`}></div>
            <div className="flex items-start">
              <Checkbox 
                className="mt-1 mr-3 h-4 w-4 cursor-pointer border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary"
                checked={isEmailSelected(email.id)}
                onCheckedChange={(checked) => handleEmailSelect(email.id, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-1">
                  <span className={`truncate flex-1 ${email.isRead ? 'font-normal' : 'font-semibold'} dark:text-neutral-200`}>
                    {/* Display sender name from EmailWithDetails or fallback to fetching contact */}
                    {(email as any).fromContact?.name || ''}
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap ml-2">
                    {formatEmailDate(new Date(email.timestamp))}
                  </span>
                </div>
                <div className="flex items-center mb-1">
                  <span className={`truncate flex-1 ${email.isRead ? 'font-normal' : 'font-medium'} dark:text-neutral-300`}>
                    {email.subject}
                  </span>
                  
                  {/* Todo Indicator */}
                  {email.hasTodo && (
                    <span className="mr-2" onClick={(e) => e.stopPropagation()}>
                      {email.todoCompleted ? (
                        <CheckSquare className="w-4 h-4 text-green-500" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                      )}
                    </span>
                  )}
                  
                  {/* Star Button */}
                  <span 
                    className={`star ml-2 ${starColors[email.starColor]}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEmailStar(email);
                    }}
                  >
                    {email.starColor !== 'none' ? (
                      <Star className="w-5 h-5" fill="currentColor" />
                    ) : (
                      <Star className="w-5 h-5" />
                    )}
                  </span>
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                  {email.body.split('\n')[0]}
                </div>
                
                {/* Email Tags */}
                {renderTags(email as any)}
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default EmailListPane;
