import { useState } from "react";
import { useEmailContext } from "@/context/EmailContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Bell, Search, Plus } from "lucide-react";

const Header = () => {
  const { user } = useEmailContext();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="bg-primary text-white py-2 px-4 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-7 h-7 mr-2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </svg>
        <h1 className="text-xl font-semibold">NEXUS.email</h1>
      </div>
      <div className="flex items-center">
        <div className="relative mr-4">
          <Input
            className="bg-white bg-opacity-20 rounded px-3 py-1 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 w-64 border-0"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2" />
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="hover:bg-primary-light p-1 rounded">
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-primary-light p-1 rounded">
            <Bell className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center font-semibold cursor-pointer">
            {user?.avatarInitials || "JD"}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
