// Preload script — contextIsolation bridge.
// Exposes a minimal, explicitly-allowlisted API to the renderer.
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Export the current page to a real (text-based, selectable) PDF via the
  // main process. Returns success / canceled / error so the renderer can fall
  // back to its in-browser rasterised export if needed.
  exportInvoicePdf: (opts: { defaultFileName: string }) =>
    ipcRenderer.invoke('export-pdf', opts),
  // Open an external URL (mailto: / http(s):) in the OS default handler.
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
});
