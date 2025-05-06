// Simple global state for direct communication between email components
class DirectEmailBridge {
  private static instance: DirectEmailBridge;
  private selectedEmailId: string | null = null;
  private listeners: ((emailId: string) => void)[] = [];
  
  private constructor() {
    console.log('[DirectEmailBridge] Created');
  }
  
  public static getInstance(): DirectEmailBridge {
    if (!DirectEmailBridge.instance) {
      DirectEmailBridge.instance = new DirectEmailBridge();
    }
    return DirectEmailBridge.instance;
  }
  
  public setSelectedEmail(emailId: string): void {
    console.log(`[DirectEmailBridge] Setting selected email to ${emailId}`);
    this.selectedEmailId = emailId;
    this.notifyListeners(emailId);
  }
  
  public getSelectedEmail(): string | null {
    return this.selectedEmailId;
  }
  
  public addListener(listener: (emailId: string) => void): void {
    console.log('[DirectEmailBridge] Adding listener');
    this.listeners.push(listener);
  }
  
  public removeListener(listener: (emailId: string) => void): void {
    console.log('[DirectEmailBridge] Removing listener');
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  private notifyListeners(emailId: string): void {
    console.log(`[DirectEmailBridge] Notifying ${this.listeners.length} listeners`);
    this.listeners.forEach(listener => {
      try {
        listener(emailId);
      } catch (error) {
        console.error('[DirectEmailBridge] Error in email selection listener:', error);
      }
    });
  }
}

export default DirectEmailBridge;