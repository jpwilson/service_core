import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data: ArrayBuffer, defaultName: string, filters?: { name: string; extensions: string[] }[]) =>
    ipcRenderer.invoke('save-file', { data, defaultName, filters }),
  onTrayClockIn: (callback: () => void) =>
    ipcRenderer.on('tray-clock-in', callback),
  onTrayClockOut: (callback: () => void) =>
    ipcRenderer.on('tray-clock-out', callback),
  platform: process.platform,
});
