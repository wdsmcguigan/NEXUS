import { useState } from "react";
import { useEmailContext } from "@/context/EmailContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Mail, Phone, Globe } from "lucide-react";

const RightSidebar = () => {
  const { selectedEmail } = useEmailContext();
  const [activeTab, setActiveTab] = useState("contact");

  if (!selectedEmail || !selectedEmail.fromContact) {
    return (
      <div className="w-80 border-l border-neutral-200 flex flex-col h-full bg-white">
        <Tabs defaultValue="contact" onValueChange={setActiveTab}>
          <TabsList className="w-full bg-transparent border-b border-neutral-200">
            <TabsTrigger 
              className="flex-1 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium rounded-none" 
              value="contact"
            >
              Contact
            </TabsTrigger>
            <TabsTrigger 
              className="flex-1 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium rounded-none" 
              value="todo"
            >
              Todo
            </TabsTrigger>
            <TabsTrigger 
              className="flex-1 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium rounded-none" 
              value="tags"
            >
              Tags
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="contact" className="p-8 flex flex-col items-center justify-center h-full text-neutral-500">
            <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-neutral-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <p className="text-center">Select an email to view contact information</p>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  const { fromContact } = selectedEmail;
  
  return (
    <div className="w-80 border-l border-neutral-200 flex flex-col h-full">
      {/* Tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-transparent border-b border-neutral-200">
          <TabsTrigger 
            className="flex-1 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium rounded-none" 
            value="contact"
          >
            Contact
          </TabsTrigger>
          <TabsTrigger 
            className="flex-1 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium rounded-none" 
            value="todo"
          >
            Todo
          </TabsTrigger>
          <TabsTrigger 
            className="flex-1 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-medium rounded-none" 
            value="tags"
          >
            Tags
          </TabsTrigger>
        </TabsList>
        
        {/* Contact information */}
        <TabsContent value="contact" className="p-0 flex-1">
          <ScrollArea className="p-4 flex-1">
            <div className="flex items-center mb-6">
              <div className={`w-14 h-14 rounded-full ${fromContact.avatarColor || 'bg-teal-500'} text-white flex items-center justify-center font-semibold mr-3 text-xl`}>
                {fromContact.avatarInitials}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{fromContact.name}</h3>
                <p className="text-neutral-500">{fromContact.jobTitle || ''}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-semibold uppercase text-neutral-500 mb-2">Contact Information</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-neutral-500 mr-2" />
                  <span>{fromContact.email}</span>
                </div>
                {fromContact.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-neutral-500 mr-2" />
                    <span>{fromContact.phone}</span>
                  </div>
                )}
                {fromContact.website && (
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-neutral-500 mr-2" />
                    <span>{fromContact.website}</span>
                  </div>
                )}
              </div>
            </div>
            
            {fromContact.company && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold uppercase text-neutral-500 mb-2">Company</h4>
                <p>{fromContact.company}</p>
                {fromContact.jobTitle && <p className="text-sm text-neutral-500">{fromContact.jobTitle}</p>}
              </div>
            )}
            
            {fromContact.notes && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold uppercase text-neutral-500 mb-2">Notes</h4>
                {fromContact.notes.split('\n').map((note, index) => (
                  <p key={index} className="text-sm text-neutral-600 mb-2">
                    {note}
                  </p>
                ))}
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-semibold uppercase text-neutral-500 mb-2">Recent Communications</h4>
              <div className="space-y-3">
                <div className="border-l-2 border-primary pl-3">
                  <p className="font-medium">{selectedEmail.subject}</p>
                  <p className="text-sm text-neutral-500">{format(new Date(selectedEmail.timestamp), 'h:mm a, MMM d')}</p>
                </div>
                <div className="border-l-2 border-neutral-300 pl-3">
                  <p className="font-medium">Team Meeting Notes</p>
                  <p className="text-sm text-neutral-500">Yesterday</p>
                </div>
                <div className="border-l-2 border-neutral-300 pl-3">
                  <p className="font-medium">Social Media Strategy</p>
                  <p className="text-sm text-neutral-500">May 15, 2023</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="todo" className="p-4">
          <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 text-neutral-300 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            <p className="text-center">No tasks associated with this email</p>
            <button className="mt-4 text-primary hover:underline">Create task</button>
          </div>
        </TabsContent>
        
        <TabsContent value="tags" className="p-4">
          <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 text-neutral-300 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
            <p className="text-center">No tags associated with this email</p>
            <button className="mt-4 text-primary hover:underline">Add tags</button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RightSidebar;
