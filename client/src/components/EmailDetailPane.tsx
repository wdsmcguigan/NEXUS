import { useState } from "react";
import { useEmailContext } from "@/context/EmailContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { starColors } from "@/lib/data";
import { format } from "date-fns";
import { ArrowLeft, Trash, Archive, Share, Printer, Star, MoreHorizontal } from "lucide-react";

const EmailDetailPane = () => {
  const { selectedEmail, toggleEmailStar, setSelectedEmail } = useEmailContext();
  const [replyText, setReplyText] = useState("");

  if (!selectedEmail) {
    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden items-center justify-center text-neutral-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
          className="w-16 h-16 mb-4 text-neutral-300"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </svg>
        <h3 className="text-lg font-medium mb-2">No email selected</h3>
        <p>Select an email from the list to view its contents</p>
      </div>
    );
  }

  const formatParagraphs = (text: string) => {
    return text.split('\n').map((paragraph, index) => {
      if (paragraph.trim() === '') {
        return <br key={index} />;
      }
      
      // Check if this is a list item (starts with a dash or bullet)
      if (paragraph.trim().startsWith('- ')) {
        return (
          <li key={index} className="mb-2">
            {paragraph.trim().substring(2)}
          </li>
        );
      }
      
      return <p key={index} className="mb-4">{paragraph}</p>;
    });
  };

  // Format the timestamp as a human-readable string
  const formatEmailTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return `${format(date, 'h:mm a')} (${format(date, 'MMMM d, yyyy')})`;
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="p-2 border-b border-neutral-200 flex justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-100 rounded mr-1" onClick={() => setSelectedEmail(null)}>
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </Button>
          <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-100 rounded">
            <Trash className="w-5 h-5 text-neutral-700" />
          </Button>
          <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-100 rounded">
            <Archive className="w-5 h-5 text-neutral-700" />
          </Button>
          <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-100 rounded">
            <Share className="w-5 h-5 text-neutral-700" />
          </Button>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-100 rounded">
            <Printer className="w-5 h-5 text-neutral-700" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`p-1 hover:bg-neutral-100 rounded ${starColors[selectedEmail.starColor]}`} 
            onClick={() => toggleEmailStar(selectedEmail)}
          >
            {selectedEmail.starColor !== 'none' ? (
              <Star className="w-5 h-5" fill="currentColor" />
            ) : (
              <Star className="w-5 h-5" />
            )}
          </Button>
          <Button variant="outline" size="sm" className="px-2 py-1 text-sm flex items-center hover:bg-neutral-100 rounded ml-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 mr-1 text-neutral-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export
          </Button>
        </div>
      </div>
      
      {/* Email content */}
      <ScrollArea className="flex-1 p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-4">{selectedEmail.subject}</h1>
          <div className="flex items-center mb-4">
            <div className={`w-10 h-10 rounded-full ${selectedEmail.fromContact?.avatarColor || 'bg-teal-500'} text-white flex items-center justify-center font-semibold mr-3`}>
              {selectedEmail.fromContact?.avatarInitials || 'UN'}
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium">{selectedEmail.fromContact?.name}</span>
                <span className="text-neutral-500 text-sm ml-2">&lt;{selectedEmail.fromContact?.email}&gt;</span>
              </div>
              <div className="text-sm text-neutral-500">
                To: Me{selectedEmail.recipients?.length > 0 ? ', Others' : ''}
              </div>
            </div>
            <div className="text-right text-sm text-neutral-500">
              <div>{formatEmailTime(new Date(selectedEmail.timestamp))}</div>
              <div className="flex items-center justify-end mt-1">
                <span className={`mr-2 ${starColors[selectedEmail.starColor]}`} onClick={() => toggleEmailStar(selectedEmail)}>
                  {selectedEmail.starColor !== 'none' ? (
                    <Star className="w-5 h-5" fill="currentColor" />
                  ) : (
                    <Star className="w-5 h-5" />
                  )}
                </span>
                <MoreHorizontal className="w-5 h-5 text-neutral-500" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Email body */}
        <div className="text-neutral-800 leading-relaxed mb-6">
          {selectedEmail.body.includes('- ') ? (
            <>
              {formatParagraphs(selectedEmail.body.split('- ')[0])}
              <ul className="list-disc ml-5 mb-4">
                {formatParagraphs(selectedEmail.body.substring(selectedEmail.body.indexOf('- ')))}
              </ul>
            </>
          ) : (
            formatParagraphs(selectedEmail.body)
          )}
        </div>
        
        {/* Attachments - would be dynamic based on email data */}
        {selectedEmail.subject.includes("Marketing") && (
          <div className="border-t border-neutral-200 pt-4 mb-6">
            <h3 className="font-medium mb-3">Attachments (2)</h3>
            <div className="flex space-x-4">
              <div className="border border-neutral-200 rounded p-3 flex items-center w-64">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-red-600 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <div>
                  <div className="font-medium">Q3_Budget_Revised.pdf</div>
                  <div className="text-sm text-neutral-500">2.4 MB</div>
                </div>
              </div>
              <div className="border border-neutral-200 rounded p-3 flex items-center w-64">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-green-600 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
                <div>
                  <div className="font-medium">Content_Calendar.xlsx</div>
                  <div className="text-sm text-neutral-500">1.8 MB</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Reply area */}
        <div className="border border-neutral-200 rounded-lg p-3">
          <div className="flex items-start mb-3">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold mr-2 mt-1">
              Me
            </div>
            <div className="flex-1">
              <div 
                className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 w-full min-h-24 focus:outline-none"
                contentEditable="true"
                role="textbox"
                aria-label="Reply text area"
                onInput={(e) => setReplyText(e.currentTarget.textContent || '')}
                placeholder="Type your reply here..."
              >
                {replyText}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex">
              <Button variant="ghost" size="icon" className="p-2 hover:bg-neutral-100 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-neutral-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              </Button>
              <Button variant="ghost" size="icon" className="p-2 hover:bg-neutral-100 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-neutral-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
              </Button>
              <Button variant="ghost" size="icon" className="p-2 hover:bg-neutral-100 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-neutral-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </Button>
            </div>
            <div>
              <Button className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-light">
                Send
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default EmailDetailPane;
