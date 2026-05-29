// Ambient type for the preload-exposed bridge (see electron/preload.ts).
// Optional because it is undefined in the plain web build.
export {};

export interface PdfExportResult {
  success: boolean;
  filePath?: string;
  canceled?: boolean;
  error?: string;
}

declare global {
  interface Window {
    electronAPI?: {
      exportInvoicePdf: (opts: { defaultFileName: string }) => Promise<PdfExportResult>;
      openExternal: (url: string) => Promise<boolean>;
    };
  }
}
