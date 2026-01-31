import React from 'react';
import { InvoiceData } from '../types';
import { useI18n } from '../i18n';
import { Command } from 'lucide-react';

interface InvoicePreviewProps {
  data: InvoiceData;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ data }) => {
  const { t, locale } = useI18n();
  const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount;

  const formatLocale = locale === 'ms' ? 'ms-MY' : 'en-MY';

  const formatMoney = (amount: number) => {
    return amount.toLocaleString(formatLocale, {
      style: 'currency',
      currency: data.currency
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(formatLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const invoiceTitle = (data.senderSstNo && data.senderSstNo.trim().length > 0) 
    ? t('taxInvoice') 
    : t('simpleInvoice');

  return (
    <div id="invoice-preview" className="print-container bg-white shadow-2xl md:min-h-[29.7cm] w-full max-w-[21cm] mx-auto text-[#1D1D1F] flex flex-col relative text-sm font-sans transition-all duration-300">
      
      {/* Container Padding */}
      <div className="p-10 md:p-14 h-full flex flex-col flex-1">
        
        {/* Header Section - Avoid breaking inside the header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-10 pb-8 border-b-2 border-gray-900 break-inside-avoid">
          <div className="flex-1 pr-6">
             {/* Logo */}
            <div className="flex items-center gap-4 mb-5">
              {data.logo ? (
                 <img src={data.logo} alt="Company Logo" className="h-20 w-auto object-contain max-w-[220px]" />
              ) : (
                 <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center rounded-lg shadow-md">
                    <Command className="w-7 h-7" />
                 </div>
              )}
               {!data.logo && <h1 className="text-2xl font-bold uppercase tracking-wide">{data.senderName}</h1>}
            </div>
            
            {data.logo && <h1 className="text-xl font-bold uppercase tracking-wide mb-3">{data.senderName}</h1>}

            <div className="text-xs text-gray-600 leading-relaxed max-w-sm font-medium">
              <p className="whitespace-pre-line mb-3">{data.senderAddress}</p>
              <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1">
                {data.senderRegNo && (
                  <>
                    <span className="font-bold text-gray-800">{t('regNo')}:</span>
                    <span>{data.senderRegNo}</span>
                  </>
                )}
                {data.senderSstNo && (
                   <>
                    <span className="font-bold text-gray-800">{t('sstNo')}:</span>
                    <span>{data.senderSstNo}</span>
                  </>
                )}
                 <span className="font-bold text-gray-800">{t('email')}:</span>
                 <span>{data.senderEmail}</span>
              </div>
            </div>
          </div>

          <div className="text-right mt-8 md:mt-0 min-w-[220px]">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-5 tracking-tight">{invoiceTitle}</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between gap-6">
                <span className="font-semibold text-gray-500">{t('number')}:</span>
                <span className="font-bold text-gray-900">{data.invoiceNumber}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="font-semibold text-gray-500">{t('date')}:</span>
                <span className="font-medium">{formatDate(data.date)}</span>
              </div>
               <div className="flex justify-between gap-6">
                <span className="font-semibold text-gray-500">{t('dueDate')}:</span>
                <span className="font-medium">{formatDate(data.dueDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recipient Section - Avoid breaking inside */}
        <div className="mb-10 break-inside-avoid">
           <div className="w-full md:w-1/2 p-5 border-l-4 border-gray-200 bg-gray-50/50">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('billTo')}</h3>
             <div className="font-bold text-lg mb-1 text-gray-900">{data.clientName}</div>
             <div className="text-sm text-gray-600 whitespace-pre-line mb-2 leading-relaxed">{data.clientAddress}</div>
             {data.clientEmail && <div className="text-sm font-medium text-brand-600">{data.clientEmail}</div>}
           </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900 text-gray-900">
                <th className="py-3 px-2 text-xs font-bold uppercase tracking-wider text-center w-14">No.</th>
                <th className="py-3 px-2 text-xs font-bold uppercase tracking-wider">{t('description')}</th>
                <th className="py-3 px-2 text-xs font-bold uppercase tracking-wider text-right w-24">{t('qty')}</th>
                <th className="py-3 px-2 text-xs font-bold uppercase tracking-wider text-right w-32">{t('rate')}</th>
                <th className="py-3 px-2 text-xs font-bold uppercase tracking-wider text-right w-36">{t('amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.items.map((item, index) => (
                <tr key={item.id} className="break-inside-avoid">
                  <td className="py-4 px-2 text-center text-gray-500 align-top">{index + 1}</td>
                  <td className="py-4 px-2 font-medium text-gray-800 align-top">{item.description}</td>
                  <td className="py-4 px-2 text-right text-gray-600 align-top">{item.quantity}</td>
                  <td className="py-4 px-2 text-right text-gray-600 align-top">{formatMoney(item.rate)}</td>
                  <td className="py-4 px-2 text-right font-bold text-gray-900 align-top">
                    {formatMoney(item.quantity * item.rate)}
                  </td>
                </tr>
              ))}
               {data.items.length === 0 && (
                <tr className="break-inside-avoid">
                  <td colSpan={5} className="py-12 text-center text-gray-400 italic bg-gray-50">
                    {t('noItems')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section - Avoid breaking */}
        <div className="flex justify-end mb-16 break-inside-avoid">
          <div className="w-full md:w-5/12">
             <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-500">{t('subtotal')}</span>
                  <span className="text-gray-900 font-medium">{formatMoney(subtotal)}</span>
                </div>
                {data.taxRate > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-gray-500">{t('taxSst')} ({data.taxRate}%)</span>
                    <span className="text-gray-900 font-medium">{formatMoney(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4">
                  <span className="font-bold text-lg text-gray-900">{t('total')}</span>
                  <span className="font-bold text-2xl text-brand-700">{formatMoney(total)}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Footer Notes & Signature - Keep these together if possible */}
        <div className="mt-auto break-inside-avoid">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-10">
            <div className="flex-1">
              {data.notes && (
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('termsNotes')}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">{data.notes}</p>
                </div>
              )}
            </div>

            {/* Signature Area */}
            {data.signature && (
              <div className="text-center min-w-[200px]">
                <img src={data.signature} alt="Signature" className="h-24 mx-auto object-contain mb-2 mix-blend-multiply" />
                <div className="border-t-2 border-gray-900 pt-2">
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">{t('authorizedSignature')}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 pt-6 text-center">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('computerGenerated')}</p>
             <p className="text-[10px] text-gray-300">Created with SmartInvoice AI</p>
          </div>
        </div>
      </div>
    </div>
  );
};