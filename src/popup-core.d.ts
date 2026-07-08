export function captureActiveTabPage(chromeApi: {
  tabs: {
    sendMessage(tabId: number, message: unknown): Promise<unknown>;
  };
  scripting: {
    executeScript(options: unknown): Promise<unknown>;
  };
}, tab: { id?: number }): Promise<unknown>;
