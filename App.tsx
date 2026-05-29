import React, { useState, useEffect, useRef } from 'react';
import { InvoiceData, createDefaultInvoice } from './types';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';
import {
  saveInvoiceToHistory,
  getStoredInvoices,
  deleteInvoiceFromHistory,
  loadDraftRaw,
  saveDraft,
  getCounterRaw,
  setCounter,
  loadTheme,
  saveTheme,
} from './services/storageService';
import { Printer, X, Plus, Globe, Moon, Sun, History, Trash2, LayoutTemplate, Command, Download, Copy, Mail } from 'lucide-react';
import { useI18n } from './i18n';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { subtotal as invoiceSubtotal, grandTotal } from './services/invoiceCalculations';
import {
  computeNextInvoiceNumber,
  hydrateDraft,
  hasMeaningfulContent,
} from './services/invoiceDraft';
import { useFocusTrap, mergeRefs } from './hooks/useFocusTrap';

export default function App() {
  const { t, locale, setLocale } = useI18n();
  const [showHistory, setShowHistory] = useState(false);
  const [savedInvoices, setSavedInvoices] = useState<InvoiceData[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
  } | null>(null);
  
  // Preview Scaling Logic
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Toast Helpers
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Theme Management
  const [theme, setTheme] = useState<'light' | 'dark'>(loadTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    saveTheme(theme);
  }, [theme]);

  // Scroll effect & Resize Scale
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.offsetWidth;
        const A4_WIDTH_PX = 794;
        const CONTAINER_PADDING = 40;
        const scale = Math.min(1, (containerWidth - CONTAINER_PADDING) / A4_WIDTH_PX);
        setPreviewScale(scale);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    setTimeout(handleResize, 100);

    // Also recompute when the preview container itself changes size — e.g. the
    // history sidebar opening/closing or other layout shifts that `resize`
    // doesn't fire for. (Scale uses a CSS transform, which doesn't alter the
    // container's measured width, so this can't feed back into a loop.)
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && previewContainerRef.current) {
      observer = new ResizeObserver(() => handleResize());
      observer.observe(previewContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, []);

  // Load History on Mount
  useEffect(() => {
    setSavedInvoices(getStoredInvoices());
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Reads + increments the persisted counter. Side-effecting, so only call
  // from event handlers / effects — never from a render or state initializer.
  const getNextInvoiceNumber = () => {
    const { counter, invoiceNumber } = computeNextInvoiceNumber(getCounterRaw());
    setCounter(counter);
    return invoiceNumber;
  };

  // Initialize from a validated draft. Pure — no counter mutation here, so a
  // StrictMode double-invoke of the initializer can't skip invoice numbers.
  const [invoice, setInvoice] = useState<InvoiceData>(() =>
    hydrateDraft(loadDraftRaw())
  );

  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Focus traps for the modal dialogs (initial focus + Tab cycling + restore).
  const historyDialogRef = useFocusTrap<HTMLDivElement>(showHistory);
  const previewDialogRef = useFocusTrap<HTMLDivElement>(showMobilePreview);

  // On first mount with no saved draft, assign the next sequential number once.
  // The ref guard keeps it to a single increment even if the effect re-runs.
  const numberAssignedRef = useRef(false);
  useEffect(() => {
    if (numberAssignedRef.current) return;
    numberAssignedRef.current = true;
    if (!loadDraftRaw()) {
      setInvoice(prev => ({ ...prev, invoiceNumber: getNextInvoiceNumber() }));
    }
  }, []);

  // Auto-save effect
  useEffect(() => {
    saveDraft(invoice);
    setIsSaving(true);
    const timeoutId = setTimeout(() => {
      // Don't persist blank/just-created invoices to history, but still
      // reflect that the draft itself has been saved.
      if (hasMeaningfulContent(invoice)) {
        const { invoices, quotaExceeded } = saveInvoiceToHistory(invoice);
        setSavedInvoices(invoices);
        if (quotaExceeded) {
          addToast(t('storageFull') || 'Storage full. Consider deleting old invoices.', 'error');
        }
      }
      setIsSaving(false);
      setSavedAt(new Date());
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [invoice]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      if (window.electronAPI?.exportInvoicePdf) {
        // Desktop: render the real invoice in an isolated hidden window and
        // capture it — exact on-screen design + selectable text. The handler
        // shows a native Save-As dialog and only reports success after the file
        // is written, so the toast is never premature.
        saveDraft(invoice);
        addToast(t('generatingPdf'), 'info');
        const result = await window.electronAPI.exportInvoicePdf({
          defaultFileName: `${invoice.invoiceNumber || 'invoice'}.pdf`,
        });
        if (result.success) {
          addToast(t('pdfSuccess'), 'success');
        } else if (result.canceled) {
          // User dismissed the save dialog — no toast.
        } else {
          console.error('Native PDF export failed:', result.error);
          addToast(t('pdfError'), 'error');
        }
      } else {
        // Browser/dev fallback (the app ships as a desktop build): use the
        // browser's print-to-PDF via the print stylesheet.
        window.print();
      }
    } catch (error) {
      console.error('PDF Export Error:', error);
      addToast(t('pdfError'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareInvoice = () => {
    const email = invoice.clientEmail.trim();
    if (!email) {
      addToast(t('noClientEmail'), 'error');
      return;
    }
    const localeTag = locale === 'ms' ? 'ms-MY' : 'en-MY';
    const total = grandTotal(
      invoice.items,
      invoice.taxRate,
      invoice.discountType,
      invoice.discountValue,
    ).toLocaleString(localeTag, { style: 'currency', currency: invoice.currency });

    const subject = `${t('invoiceEmailSubject')} ${invoice.invoiceNumber}`;
    const body = `${subject}\n${t('total')}: ${total}\n\n${invoice.senderName}`;
    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(mailto);
    } else {
      window.location.href = mailto;
    }
  };

  const handleNewInvoice = () => {
    setConfirmState({
      title: t('newInvoice'),
      message: t('confirmNew'),
      confirmLabel: t('newInvoice'),
      onConfirm: performNewInvoice,
    });
  };

  const performNewInvoice = () => {
    const nextNumber = getNextInvoiceNumber();
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaults = createDefaultInvoice();

    const newInvoiceState: InvoiceData = {
      ...defaults,
      id: crypto.randomUUID(),
      invoiceNumber: nextNumber,
      date: today,
      dueDate: nextWeek,
      senderName: invoice.senderName,
      senderRegNo: invoice.senderRegNo,
      senderSstNo: invoice.senderSstNo,
      senderEmail: invoice.senderEmail,
      senderAddress: invoice.senderAddress,
      logo: invoice.logo,
      signature: invoice.signature,
      currency: invoice.currency,
      taxRate: invoice.taxRate,
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      notes: defaults.notes,
      items: [{
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        rate: 0
      }]
    };

    setInvoice(newInvoiceState);
    addToast(t('newInvoice'), 'success');
  };

  const loadInvoice = (inv: InvoiceData) => {
    setInvoice(inv);
    setShowHistory(false);
    addToast(t('invoiceLoaded'), 'success');
  };

  const duplicateInvoice = (e: React.MouseEvent, inv: InvoiceData) => {
    e.stopPropagation();
    const nextNumber = getNextInvoiceNumber();
    const today = new Date().toISOString().split('T')[0];
    const nextDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const copy: InvoiceData = {
      ...inv,
      id: crypto.randomUUID(),
      invoiceNumber: nextNumber,
      date: today,
      dueDate: nextDue,
      items: inv.items.map((it) => ({ ...it, id: crypto.randomUUID() })),
    };
    setInvoice(copy);
    setShowHistory(false);
    addToast(t('invoiceDuplicated'), 'success');
  };

  const deleteInvoice = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmState({
      title: t('deleteAction'),
      message: t('confirmDelete'),
      confirmLabel: t('deleteAction'),
      destructive: true,
      onConfirm: () => {
        const updated = deleteInvoiceFromHistory(id);
        setSavedInvoices(updated);
        addToast(t('invoiceDeleted'), 'info');
      },
    });
  };

  const toggleLanguage = () => setLocale(locale === 'en' ? 'ms' : 'en');

  // Styles
  const navBtnClass = "p-2 rounded-full text-ink dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2";

  return (
    <div className="min-h-screen bg-canvas dark:bg-black flex flex-col font-sans">
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        confirmLabel={confirmState?.confirmLabel}
        destructive={confirmState?.destructive}
        onConfirm={() => {
          confirmState?.onConfirm();
          setConfirmState(null);
        }}
        onCancel={() => setConfirmState(null)}
      />

      {/* Glass Navbar */}
      <div className="no-print sticky top-0 z-40 w-full glass-panel border-b border-gray-200/50 dark:border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-900 dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center shadow-lg">
                <Command className="w-5 h-5" />
              </div>
              <span className="font-semibold text-[17px] tracking-tight text-ink dark:text-white hidden md:inline">
                {t('appTitle')}
              </span>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
               <span className="hidden md:inline text-[11px] text-gray-500 dark:text-gray-400 mr-1 min-w-[52px] text-right" aria-live="polite">
                 {isSaving ? t('saving') : savedAt ? t('saved') : ''}
               </span>

               <button onClick={() => setShowHistory(true)} className={navBtnClass} title={t('history')} aria-label={t('history')}>
                 <History className="w-5 h-5" strokeWidth={1.5} />
               </button>

               <button onClick={toggleTheme} className={navBtnClass} title={theme === 'light' ? t('switchToDark') : t('switchToLight')} aria-label={theme === 'light' ? t('switchToDark') : t('switchToLight')}>
                 {theme === 'light' ? <Moon className="w-5 h-5" strokeWidth={1.5} /> : <Sun className="w-5 h-5" strokeWidth={1.5} />}
               </button>

               <button onClick={toggleLanguage} className={`${navBtnClass} flex items-center gap-1`} title={t('switchLanguage')} aria-label={t('switchLanguage')}>
                 <Globe className="w-5 h-5" strokeWidth={1.5} />
                 <span className="text-[10px] font-bold uppercase pt-0.5">{locale}</span>
               </button>

               <button onClick={handleShareInvoice} className={navBtnClass} title={t('emailInvoice')} aria-label={t('emailInvoice')}>
                 <Mail className="w-5 h-5" strokeWidth={1.5} />
               </button>

               <button onClick={handleNewInvoice} className={navBtnClass} title={t('newInvoice')} aria-label={t('newInvoice')}>
                 <Plus className="w-5 h-5" strokeWidth={1.5} />
               </button>

               <button
                onClick={handleExportPDF}
                disabled={isExporting}
                aria-busy={isExporting}
                title={t('exportPdf')}
                className={`hidden md:flex items-center gap-2 px-4 py-1.5 bg-brand-500 text-white rounded-full hover:bg-brand-600 active:scale-95 transition-all shadow-md text-xs font-semibold ml-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${isExporting ? 'opacity-70 cursor-wait' : ''}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? t('exporting') : t('exportPdf')}</span>
              </button>

               {/* Mobile Toggle */}
               <button
                onClick={() => setShowMobilePreview(!showMobilePreview)}
                className="md:hidden p-2 text-brand-500 bg-brand-500/10 rounded-full ml-1 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label={t('preview')}
              >
                {showMobilePreview ? <LayoutTemplate className="w-5 h-5" /> : <Printer className="w-5 h-5" />}
              </button>
            </div>
        </div>
      </div>

      {/* History Sidebar - macOS Style */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby="history-title" onKeyDown={(e) => { if (e.key === 'Escape') setShowHistory(false); }}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setShowHistory(false)} />
          <div ref={historyDialogRef} tabIndex={-1} className="relative w-80 bg-canvas/95 dark:bg-surface/95 backdrop-blur-2xl h-full shadow-2xl flex flex-col border-r border-gray-200 dark:border-white/10 animate-in slide-in-from-left duration-300 ease-out focus:outline-none">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/10">
              <h2 id="history-title" className="text-lg font-semibold text-ink dark:text-white">
                {t('history')}
              </h2>
              <button onClick={() => setShowHistory(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2" aria-label={t('closeHistory')}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
              {savedInvoices.length === 0 && (
                <div className="text-center text-gray-400 py-10 text-sm">
                  {t('noHistory')}
                </div>
              )}
              {savedInvoices.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => loadInvoice(inv)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') loadInvoice(inv); }}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-inset ${
                    invoice.id === inv.id
                    ? 'bg-white dark:bg-white/10 border-brand-500/30 shadow-sm'
                    : 'bg-white/50 dark:bg-white/5 border-transparent hover:bg-white dark:hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm text-ink dark:text-white">{inv.invoiceNumber}</span>
                    <span className="text-[10px] text-gray-400">{inv.date}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate mb-2">
                    {inv.clientName || t('noClient')}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-ink dark:text-white">
                      {invoiceSubtotal(inv.items).toLocaleString(locale === 'ms' ? 'ms-MY' : 'en-MY', { style: 'currency', currency: inv.currency })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => duplicateInvoice(e, inv)}
                        className="text-gray-500 hover:text-brand-600 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity p-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
                        aria-label={`Duplicate invoice ${inv.invoiceNumber}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => deleteInvoice(e, inv.id)}
                        className="text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity p-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
                        aria-label={`Delete invoice ${inv.invoiceNumber}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Dashboard */}
      <main className="app-print-main flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Editor Column - Left Side */}
        <div className={`lg:col-span-5 xl:col-span-4 ${showMobilePreview ? 'hidden' : 'block'} lg:block`}>
          <div className="no-print">
            <InvoiceEditor
              data={invoice}
              onChange={setInvoice}
              onNotify={addToast}
            />
          </div>
        </div>

        {/* Preview Column - Sticky Right Side */}
        <div
          ref={mergeRefs(previewContainerRef, previewDialogRef)}
          className={`preview-print-region lg:col-span-7 xl:col-span-8 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] ${showMobilePreview ? 'fixed inset-0 z-50 bg-canvas dark:bg-black p-4 overflow-y-auto' : 'hidden'} lg:block lg:overflow-y-auto flex flex-col no-scrollbar focus:outline-none`}
          {...(showMobilePreview ? { role: 'dialog', 'aria-modal': true, tabIndex: -1, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Escape') setShowMobilePreview(false); } } : {})}
        >
          
          {showMobilePreview && (
             <div className="no-print flex justify-between items-center mb-6 lg:hidden">
                <h2 className="text-xl font-bold text-ink dark:text-white">{t('preview')}</h2>
                <div className="flex gap-3">
                   <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    aria-busy={isExporting}
                    className={`px-4 py-2 bg-brand-500 text-white rounded-full font-medium text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${isExporting ? 'opacity-70' : ''}`}
                  >
                    {isExporting ? t('exporting') : t('exportPdf')}
                  </button>
                  <button
                    onClick={() => setShowMobilePreview(false)}
                    className="p-2 bg-white dark:bg-white/10 rounded-full text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    aria-label={t('closePreview')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
             </div>
          )}

          <div className="preview-print-flow flex-1 flex items-start justify-center overflow-y-auto lg:overflow-y-auto no-scrollbar pb-20">
            {/* The Scalable Preview Wrapper */}
            <div
              style={{
                transform: isDesktop ? `scale(${previewScale})` : 'none',
                transformOrigin: 'top center',
              }}
              className="preview-print-scale transition-transform duration-300 ease-out origin-top w-full flex justify-center shadow-float rounded-none md:rounded-sm bg-white"
            >
              <InvoicePreview data={invoice} />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Actions */}
      {!showMobilePreview && (
        <div className="lg:hidden fixed bottom-6 right-6 z-30 no-print flex flex-col gap-4">
           <button
            onClick={handleNewInvoice}
            aria-label={t('newInvoice')}
            className="flex items-center justify-center w-14 h-14 bg-white dark:bg-surface text-gray-600 dark:text-gray-300 rounded-full shadow-float border border-white/10 active:scale-90 transition-transform focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <Plus className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowMobilePreview(true)}
            aria-label={t('preview')}
            className="flex items-center justify-center w-14 h-14 bg-ink dark:bg-white text-white dark:text-black rounded-full shadow-float active:scale-90 transition-transform focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <Printer className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}