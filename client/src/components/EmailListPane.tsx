import { useState } from "react";
import { useEmailContext } from "@/context/EmailContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { accountColors, starColors } from "@/lib/data";
import { Email } from "@shared/schema";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { RefreshCcw, Trash, ArrowUpDown, Star } from "lucide-react";

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

  return (
    <div className="w-96 border-r border-neutral-200 flex flex-col bg-white">
      {/* Toolbar */}
      <div className="p-2 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center">
          <Checkbox 
            className="mr-2 h-4 w-4 cursor-pointer border-neutral-300 text-primary focus:ring-primary"
            checked={selectAllChecked}
            onCheckedChange={handleSelectAll}
          />
          <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-100 rounded">
            <RefreshCcw className="w-5 h-5 text-neutral-700" />
          </Button>
          <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-100 rounded">
            <Trash className="w-5 h-5 text-neutral-700" />
          </Button>
        </div>
        <div>
          <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-100 rounded">
            <ArrowUpDown className="w-5 h-5 text-neutral-700" />
          </Button>
        </div>
      </div>
      
      {/* Category tabs */}
      <Tabs defaultValue={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
        <TabsList className="w-full bg-transparent border-b border-neutral-200">
          <TabsTrigger 
            className="flex-1 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none" 
            value="primary"
          >
            Primary
          </TabsTrigger>
          <TabsTrigger 
            className="flex-1 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none" 
            value="social"
          >
            Social
          </TabsTrigger>
          <TabsTrigger 
            className="flex-1 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none" 
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
            className={`email-item p-3 relative ${selectedEmail?.id === email.id ? 'selected bg-neutral-100' : ''} ${isEmailSelected(email.id) ? 'bg-neutral-100' : ''}`}
            onClick={() => setSelectedEmail(email)}
          >
            <div className={`account-indicator ${selectedAccount ? accountColors[selectedAccount.accountType] : 'bg-primary'}`}></div>
            <div className="flex items-start">
              <Checkbox 
                className="mt-1 mr-3 h-4 w-4 cursor-pointer border-neutral-300 text-primary focus:ring-primary"
                checked={isEmailSelected(email.id)}
                onCheckedChange={(checked) => handleEmailSelect(email.id, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-1">
                  <span className={`font-semibold truncate flex-1 ${email.isRead ? 'font-normal' : 'font-semibold'}`}>
                    {email.fromContact?.name}
                  </span>
                  <span className="text-sm text-neutral-500 whitespace-nowrap ml-2">
                    {formatEmailDate(new Date(email.timestamp))}
                  </span>
                </div>
                <div className="flex items-center mb-1">
                  <span className={`truncate flex-1 ${email.isRead ? 'font-normal' : 'font-medium'}`}>
                    {email.subject}
                  </span>
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
                <div className="text-sm text-neutral-500 truncate">
                  {email.body.split('\n')[0]}
                </div>
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default EmailListPane;
