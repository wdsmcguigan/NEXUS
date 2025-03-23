import { useState, useEffect, useCallback } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useEmailContext } from "@/context/EmailContext";
import { debounce } from "lodash";

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
  
  // Recalculate panel sizes when window is resized
  const updatePanelSizes = useCallback(() => {
    if (preferences) {
      const totalWidth = window.innerWidth;
      const totalHeight = window.innerHeight;
      
      const newLeftSidebarSize = (preferences.leftSidebarWidth / totalWidth) * 100;
      const newEmailListSize = (preferences.emailListWidth / totalWidth) * 100;
      const newRightSidebarSize = (preferences.rightSidebarWidth / totalWidth) * 100;
      const newBottomPaneSize = (preferences.bottomPaneHeight / totalHeight) * 100;
      
      setLeftSidebarSize(newLeftSidebarSize);
      setEmailListSize(newEmailListSize);
      setRightSidebarSize(newRightSidebarSize);
      setBottomPaneSize(newBottomPaneSize);
      
      // Adjust email detail pane to fill the remaining space
      const remainingWidth = 100 - newLeftSidebarSize - newEmailListSize - newRightSidebarSize;
      setEmailDetailSize(remainingWidth > 0 ? remainingWidth : 30);
    }
  }, [preferences]);
  
  // Load sizes from preferences on initial render
  useEffect(() => {
    updatePanelSizes();
  }, [preferences, updatePanelSizes]);
  
  // Add window resize listener for responsive updates
  useEffect(() => {
    const debouncedHandleResize = debounce(updatePanelSizes, 100);
    window.addEventListener('resize', debouncedHandleResize);
    
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, [updatePanelSizes]);
  
  // Handle resize events
  const handleLeftSidebarResize = (size: number) => {
    setLeftSidebarSize(size);
    // Calculate pixel value based on percentage
    const pixelWidth = Math.max(150, (window.innerWidth * size) / 100); // Min width 150px
    updatePreferences({ leftSidebarWidth: pixelWidth });
    
    // Recalculate email detail size to adapt
    const remainingWidth = 100 - size - emailListSize - rightSidebarSize;
    if (remainingWidth > 10) { // Ensure minimum space
      setEmailDetailSize(remainingWidth);
    }
  };
  
  const handleEmailListResize = (size: number) => {
    setEmailListSize(size);
    // Calculate pixel value based on percentage
    const pixelWidth = Math.max(200, (window.innerWidth * size) / 100); // Min width 200px
    updatePreferences({ emailListWidth: pixelWidth });
    
    // Recalculate email detail size to adapt
    const remainingWidth = 100 - leftSidebarSize - size - rightSidebarSize;
    if (remainingWidth > 10) { // Ensure minimum space
      setEmailDetailSize(remainingWidth);
    }
  };
  
  const handleRightSidebarResize = (size: number) => {
    setRightSidebarSize(size);
    // Calculate pixel value based on percentage
    const pixelWidth = Math.max(150, (window.innerWidth * size) / 100); // Min width 150px
    updatePreferences({ rightSidebarWidth: pixelWidth });
    
    // Recalculate email detail size to adapt
    const remainingWidth = 100 - leftSidebarSize - emailListSize - size;
    if (remainingWidth > 10) { // Ensure minimum space
      setEmailDetailSize(remainingWidth);
    }
  };
  
  const handleBottomPaneResize = (size: number) => {
    setBottomPaneSize(size);
    // Calculate pixel value based on percentage
    const pixelHeight = Math.max(60, (window.innerHeight * size) / 100); // Min height 60px
    updatePreferences({ bottomPaneHeight: pixelHeight });
  };

  return (
    <ResizablePanelGroup direction="vertical" className="flex-1 overflow-hidden">
      <ResizablePanel 
        defaultSize={100 - bottomPaneSize} 
        minSize={60}
        maxSize={95}
        onResize={(size) => handleBottomPaneResize(100 - size)}
        className="transition-all duration-100 ease-in-out"
      >
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel 
            defaultSize={leftSidebarSize} 
            minSize={15} 
            maxSize={30}
            onResize={handleLeftSidebarResize}
            className="transition-all duration-100 ease-in-out"
          >
            {leftSidebar}
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-border hover:bg-primary/50" />
          
          <ResizablePanel 
            defaultSize={emailListSize + emailDetailSize} 
            minSize={40} 
            maxSize={85}
            className="transition-all duration-100 ease-in-out"
          >
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
                className="transition-all duration-100 ease-in-out"
              >
                {emailListPane}
              </ResizablePanel>
              
              <ResizableHandle withHandle className="bg-border hover:bg-primary/50" />
              
              <ResizablePanel 
                defaultSize={(emailDetailSize / (emailListSize + emailDetailSize)) * 100}
                className="transition-all duration-100 ease-in-out"
              >
                {emailDetailPane}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-border hover:bg-primary/50" />
          
          <ResizablePanel 
            defaultSize={rightSidebarSize} 
            minSize={15} 
            maxSize={30}
            onResize={handleRightSidebarResize}
            className="transition-all duration-100 ease-in-out"
          >
            {rightSidebar}
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      
      <ResizableHandle withHandle className="bg-border hover:bg-primary/50" />
      
      <ResizablePanel 
        defaultSize={bottomPaneSize} 
        minSize={5} 
        maxSize={30}
        onResize={handleBottomPaneResize}
        className="transition-all duration-100 ease-in-out"
      >
        {bottomPane}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ResizablePanels;
