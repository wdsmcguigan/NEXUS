import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEmailContext } from "@/context/EmailContext";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import EmailListPane from "@/components/EmailListPane";
import EmailDetailPane from "@/components/EmailDetailPane";
import RightSidebar from "@/components/RightSidebar";
import BottomPane from "@/components/BottomPane";
import ResizablePanels from "@/components/ResizablePanels";
import { Skeleton } from "@/components/ui/skeleton";

const EmailClient = () => {
  const { userId, initializeEmailContext } = useEmailContext();

  // Fetch user data
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Fetch email accounts
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: [`/api/accounts/user/${userId}`],
    enabled: !!userId,
  });

  // Fetch user preferences
  const { data: preferencesData, isLoading: isLoadingPreferences } = useQuery({
    queryKey: [`/api/preferences/user/${userId}`],
    enabled: !!userId,
  });

  // Fetch tags
  const { data: tagsData, isLoading: isLoadingTags } = useQuery({
    queryKey: [`/api/tags/user/${userId}`],
    enabled: !!userId,
  });

  useEffect(() => {
    if (userData && accountsData && preferencesData && tagsData) {
      initializeEmailContext({
        user: userData,
        accounts: accountsData,
        preferences: preferencesData,
        tags: tagsData,
      });
    }
  }, [userData, accountsData, preferencesData, tagsData, initializeEmailContext]);

  const isLoading = isLoadingUser || isLoadingAccounts || isLoadingPreferences || isLoadingTags;

  if (isLoading) {
    return (
      <div className="bg-neutral-50 text-neutral-900 h-screen flex flex-col">
        <div className="bg-primary text-white py-2 px-4 h-14">
          <Skeleton className="h-6 w-32 bg-white/20" />
        </div>
        <div className="flex-1 flex">
          <Skeleton className="w-64 bg-white/10" />
          <div className="flex-1 flex">
            <Skeleton className="w-96 bg-white/10" />
            <Skeleton className="flex-1 bg-white/10" />
            <Skeleton className="w-80 bg-white/10" />
          </div>
        </div>
        <Skeleton className="h-16 bg-white/10" />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 text-neutral-900 h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden" id="app-container">
        <ResizablePanels
          leftSidebar={<LeftSidebar />}
          emailListPane={<EmailListPane />}
          emailDetailPane={<EmailDetailPane />}
          rightSidebar={<RightSidebar />}
          bottomPane={<BottomPane />}
        />
      </div>
    </div>
  );
};

export default EmailClient;
