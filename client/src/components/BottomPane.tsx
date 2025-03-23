import { useEmailContext } from "@/context/EmailContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { integrations } from "@/lib/data";
import { Plus } from "lucide-react";

const BottomPane = () => {
  return (
    <div className="h-16 border-t border-neutral-200 flex items-center px-4 bg-white">
      <ScrollArea orientation="horizontal" className="flex-1 py-1">
        <div className="flex space-x-6">
          {integrations.map((integration, index) => (
            <Button key={index} variant="ghost" className="flex flex-col items-center justify-center min-w-[60px] h-auto py-1">
              {integration.icon}
              <span className="text-xs mt-1">{integration.name}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>
      
      <div>
        <Button variant="ghost" size="icon" className="ml-4 p-2 hover:bg-neutral-100 rounded text-neutral-500">
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default BottomPane;
