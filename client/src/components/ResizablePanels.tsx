import { useState, useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useEmailContext } from "@/context/EmailContext";

interface ResizablePanelsProps {
  leftSidebar: React.ReactNode;
  emailListPane: React.ReactNode;
  emailDetailPane: React.ReactNode;
  rightSidebar: React.ReactNode;
  bottomPane: React.ReactNode;
}

const ResizablePanels: React.FC<ResizablePanelsProps> = ({
  leftSidebar,
  emailListPane,
  emailDetailPane,
  rightSidebar,
  bottomPane,
}) => {
  const { preferences, updatePreferences } = useEmailContext();
  
  // Default sizes for panels
  const [leftSidebarSize, setLeftSidebarSize] = useState(20); // 20% of width
  const [emailListSize, setEmailListSize] = useState(30); // 30% of width
  const [emailDetailSize, setEmailDetailSize] = useState(30); // 30% of width
  const [rightSidebarSize, setRightSidebarSize] = useState(20); // 20% of width
  const [bottomPaneSize, setBottomPaneSize] = useState(10); // 10% of height
  
  // Load sizes from preferences on initial render
  useEffect(() => {
    if (preferences) {
      // Convert absolute pixel measurements to percentage of viewport
      const totalWidth = window.innerWidth;
      const totalHeight = window.innerHeight;
      
      setLeftSidebarSize((preferences.leftSidebarWidth / totalWidth) * 100);
      setEmailListSize((preferences.emailListWidth / totalWidth) * 100);
      setRightSidebarSize((preferences.rightSidebarWidth / totalWidth) * 100);
      setBottomPaneSize((preferences.bottomPaneHeight / totalHeight) * 100);
      
      // Adjust email detail pane to fill the remaining space
      const remainingWidth = 100 - leftSidebarSize - emailListSize - rightSidebarSize;
      setEmailDetailSize(remainingWidth > 0 ? remainingWidth : 30);
    }
  }, [preferences]);
  
  // Handle resize events
  const handleLeftSidebarResize = (size: number) => {
    setLeftSidebarSize(size);
    // Calculate pixel value based on percentage
    const pixelWidth = (window.innerWidth * size) / 100;
    updatePreferences({ leftSidebarWidth: pixelWidth });
  };
  
  const handleEmailListResize = (size: number) => {
    setEmailListSize(size);
    // Calculate pixel value based on percentage
    const pixelWidth = (window.innerWidth * size) / 100;
    updatePreferences({ emailListWidth: pixelWidth });
  };
  
  const handleRightSidebarResize = (size: number) => {
    setRightSidebarSize(size);
    // Calculate pixel value based on percentage
    const pixelWidth = (window.innerWidth * size) / 100;
    updatePreferences({ rightSidebarWidth: pixelWidth });
  };
  
  const handleBottomPaneResize = (size: number) => {
    setBottomPaneSize(size);
    // Calculate pixel value based on percentage
    const pixelHeight = (window.innerHeight * size) / 100;
    updatePreferences({ bottomPaneHeight: pixelHeight });
  };

  return (
    <ResizablePanelGroup direction="vertical" className="flex-1 overflow-hidden">
      <ResizablePanel 
        defaultSize={100 - bottomPaneSize} 
        minSize={60}
        maxSize={95}
        onResize={(size) => handleBottomPaneResize(100 - size)}
      >
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel 
            defaultSize={leftSidebarSize} 
            minSize={15} 
            maxSize={30}
            onResize={handleLeftSidebarResize}
          >
            {leftSidebar}
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={emailListSize + emailDetailSize} minSize={40} maxSize={85}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel 
                defaultSize={(emailListSize / (emailListSize + emailDetailSize)) * 100} 
                minSize={25} 
                maxSize={75}
                onResize={(size) => {
                  // Convert the inner panel size to the overall size
                  const newSize = ((emailListSize + emailDetailSize) * size) / 100;
                  handleEmailListResize(newSize);
                  // Adjust email detail size to maintain total
                  setEmailDetailSize(emailListSize + emailDetailSize - newSize);
                }}
              >
                {emailListPane}
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={(emailDetailSize / (emailListSize + emailDetailSize)) * 100}>
                {emailDetailPane}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel 
            defaultSize={rightSidebarSize} 
            minSize={15} 
            maxSize={30}
            onResize={handleRightSidebarResize}
          >
            {rightSidebar}
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      <ResizablePanel 
        defaultSize={bottomPaneSize} 
        minSize={5} 
        maxSize={30}
        onResize={handleBottomPaneResize}
      >
        {bottomPane}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ResizablePanels;
