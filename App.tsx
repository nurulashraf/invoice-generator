import React, { useState, useEffect, useRef } from 'react';
import { InvoiceData, createDefaultInvoice } from './types';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';
import { saveInvoiceToHistory, getStoredInvoices, deleteInvoiceFromHistory } from './services/storageService';
import { Printer, X, Plus, Globe, Moon, Sun, History, Trash2, LayoutTemplate, Command, Download } from 'lucide-react';
import { useI18n } from './i18n';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const { t, locale, setLocale } = useI18n();
  const [showHistory, setShowHistory] = useState(false);
  const [savedInvoices, setSavedInvoices] = useState<InvoiceData[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // Preview Scaling Logic
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Toast Helpers
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Theme Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Scroll effect & Resize Scale
  useEffect(() => {
    const handleResize = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.offsetWidth;
        const targetWidth = 794; // A4 width in pixels
        const scale = Math.min(1, (containerWidth - 40) / targetWidth); 
        setPreviewScale(scale);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Load History on Mount
  useEffect(() => {
    setSavedInvoices(getStoredInvoices());
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const getNextInvoiceNumber = () => {
    if (typeof window === 'undefined') return 'INV-001';
    const saved = localStorage.getItem('invoiceCounter');
    let next = 1;
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) {
        next = parsed + 1;
      }
    }
    localStorage.setItem('invoiceCounter', String(next));
    return `INV-${String(next).padStart(3, '0')}`;
  };

  // Initialize state
  const [invoice, setInvoice] = useState<InvoiceData>(() => {
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem('invoiceDraft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          const defaultInv = createDefaultInvoice();
          return { ...defaultInv, ...parsed, id: parsed.id || defaultInv.id };
        } catch (e) {
          console.error('Failed to parse invoice draft', e);
        }
      }
    }
    return {
      ...createDefaultInvoice(),
      invoiceNumber: getNextInvoiceNumber()
    };
  });
  
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Auto-save effect
  useEffect(() => {
    localStorage.setItem('invoiceDraft', JSON.stringify(invoice));
    const timeoutId = setTimeout(() => {
      const updatedHistory = saveInvoiceToHistory(invoice);
      setSavedInvoices(updatedHistory);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [invoice]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    addToast('Generating PDF...', 'info');

    try {
      // @ts-ignore - html2pdf is loaded via CDN in index.html
      if (typeof window.html2pdf === 'undefined') {
        window.print();
        return;
      }

      const element = document.getElementById('invoice-preview');
      if (!element) throw new Error('Preview not found');

      const opt = {
        margin: 0,
        filename: `${invoice.invoiceNumber || 'invoice'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0, width: 794, windowWidth: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();
      addToast('PDF Downloaded successfully', 'success');

    } catch (error) {
      console.error('PDF Export Error:', error);
      addToast('Failed to generate PDF. Falling back to print.', 'error');
      setTimeout(() => window.print(), 1000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleNewInvoice = () => {
    if (!window.confirm(t('confirmNew'))) return;

    const currentStored = localStorage.getItem('invoiceCounter');
    let currentCounter = 0;
    if (currentStored) {
      const parsed = parseInt(currentStored, 10);
      if (!isNaN(parsed)) currentCounter = parsed;
    }
    localStorage.setItem('invoiceCounter', String(currentCounter + 1));

    const nextNumber = `INV-${String(currentCounter + 1).padStart(3, '0')}`;
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
        id: Math.random().toString(36).slice(2, 11),
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
    addToast('Invoice loaded successfully', 'success');
  };

  const deleteInvoice = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this invoice permanently?')) {
      const updated = deleteInvoiceFromHistory(id);
      setSavedInvoices(updated);
      addToast('Invoice deleted', 'info');
    }
  };

  const toggleLanguage = () => setLocale(locale === 'en' ? 'ms' : 'en');

  // Styles
  const navBtnClass = "p-2 rounded-full text-[#1D1D1F] dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95";

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] flex flex-col font-sans">
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Glass Navbar */}
      <div className="no-print sticky top-0 z-40 w-full glass-panel border-b border-gray-200/50 dark:border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-900 dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center shadow-lg">
                <Command className="w-5 h-5" />
              </div>
              <span className="font-semibold text-[17px] tracking-tight text-[#1D1D1F] dark:text-white hidden md:inline">
                {t('appTitle')}
              </span>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
               <button onClick={() => setShowHistory(true)} className={navBtnClass} title={t('history')}>
                 <History className="w-5 h-5" strokeWidth={1.5} />
               </button>

               <button onClick={toggleTheme} className={navBtnClass}>
                 {theme === 'light' ? <Moon className="w-5 h-5" strokeWidth={1.5} /> : <Sun className="w-5 h-5" strokeWidth={1.5} />}
               </button>

               <button onClick={toggleLanguage} className={`${navBtnClass} flex items-center gap-1`}>
                 <Globe className="w-5 h-5" strokeWidth={1.5} />
                 <span className="text-[10px] font-bold uppercase pt-0.5">{locale}</span>
               </button>

               <button onClick={handleNewInvoice} className={navBtnClass}>
                 <Plus className="w-5 h-5" strokeWidth={1.5} />
               </button>

               <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className={`hidden md:flex items-center gap-2 px-4 py-1.5 bg-brand-500 text-white rounded-full hover:bg-brand-600 active:scale-95 transition-all shadow-md text-xs font-semibold ml-2 ${isExporting ? 'opacity-70 cursor-wait' : ''}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
              </button>

               {/* Mobile Toggle */}
               <button 
                onClick={() => setShowMobilePreview(!showMobilePreview)}
                className="md:hidden p-2 text-brand-500 bg-brand-500/10 rounded-full ml-1"
              >
                {showMobilePreview ? <LayoutTemplate className="w-5 h-5" /> : <Printer className="w-5 h-5" />}
              </button>
            </div>
        </div>
      </div>

      {/* History Sidebar - macOS Style */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setShowHistory(false)} />
          <div className="relative w-80 bg-[#F5F5F7]/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl h-full shadow-2xl flex flex-col border-r border-gray-200 dark:border-white/10 animate-in slide-in-from-left duration-300 ease-out">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/10">
              <h2 className="text-lg font-semibold text-[#1D1D1F] dark:text-white">
                {t('history')}
              </h2>
              <button onClick={() => setShowHistory(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white">
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
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                    invoice.id === inv.id 
                    ? 'bg-white dark:bg-white/10 border-brand-500/30 shadow-sm' 
                    : 'bg-white/50 dark:bg-white/5 border-transparent hover:bg-white dark:hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm text-[#1D1D1F] dark:text-white">{inv.invoiceNumber}</span>
                    <span className="text-[10px] text-gray-400">{inv.date}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate mb-2">
                    {inv.clientName || 'No Client'}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                      {inv.items.reduce((acc, i) => acc + (i.quantity * i.rate), 0).toLocaleString(locale, { style: 'currency', currency: inv.currency })}
                    </span>
                    <button 
                      onClick={(e) => deleteInvoice(e, inv.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Editor Column - Left Side */}
        <div className={`lg:col-span-5 xl:col-span-4 ${showMobilePreview ? 'hidden' : 'block'} lg:block`}>
          <div className="no-print">
            <InvoiceEditor
              data={invoice}
              onChange={setInvoice}
            />
          </div>
        </div>

        {/* Preview Column - Sticky Right Side */}
        <div 
          ref={previewContainerRef}
          className={`lg:col-span-7 xl:col-span-8 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] ${showMobilePreview ? 'fixed inset-0 z-50 bg-[#F5F5F7] dark:bg-black p-4 overflow-y-auto' : 'hidden'} lg:block lg:overflow-y-auto flex flex-col no-scrollbar`}
        >
          
          {showMobilePreview && (
             <div className="no-print flex justify-between items-center mb-6 lg:hidden pt-safe">
                <h2 className="text-xl font-bold text-[#1D1D1F] dark:text-white">{t('preview')}</h2>
                <div className="flex gap-3">
                   <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className={`px-4 py-2 bg-brand-500 text-white rounded-full font-medium text-sm shadow-md ${isExporting ? 'opacity-70' : ''}`}
                  >
                    {isExporting ? 'Exporting...' : 'Export PDF'}
                  </button>
                  <button
                    onClick={() => setShowMobilePreview(false)}
                    className="p-2 bg-white dark:bg-white/10 rounded-full text-gray-600 dark:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
             </div>
          )}

          <div className="flex-1 flex items-start justify-center overflow-y-auto lg:overflow-y-auto no-scrollbar pb-20">
            {/* The Scalable Preview Wrapper */}
            <div 
              style={{ 
                transform: window.innerWidth >= 1024 ? `scale(${previewScale})` : 'none',
                transformOrigin: 'top center',
              }}
              className="transition-transform duration-300 ease-out origin-top w-full flex justify-center shadow-float rounded-none md:rounded-sm bg-white"
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
            className="flex items-center justify-center w-14 h-14 bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 rounded-full shadow-float border border-white/10 active:scale-90 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowMobilePreview(true)}
            className="flex items-center justify-center w-14 h-14 bg-[#1D1D1F] dark:bg-white text-white dark:text-black rounded-full shadow-float active:scale-90 transition-transform"
          >
            <Printer className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}