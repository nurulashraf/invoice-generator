import React, { useState } from 'react';
import { InvoiceData, LineItem } from '../types';
import { Plus, Trash2, ChevronRight, Image as ImageIcon, PenTool, Layout, FileType, Users, ShoppingCart, MinusCircle } from 'lucide-react';
import { useI18n } from '../i18n';
import { SignaturePad } from './SignaturePad';

interface InvoiceEditorProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
  onAiRequest: (text: string) => Promise<void>; 
  isAiLoading: boolean;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ data, onChange }) => {
  const { t } = useI18n();
  // Flattened view for minimalism - sections are just headers in the scroll flow
  
  const updateField = (field: keyof InvoiceData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    const newItems = data.items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).slice(2, 11),
      description: '',
      quantity: 1,
      rate: 0
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const removeItem = (id: string) => {
    onChange({ ...data, items: data.items.filter(item => item.id !== id) });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // iOS-style Grouped List Classes
  const groupClass = "bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm mb-6";
  const rowClass = "relative flex items-center justify-between p-3.5 border-b border-gray-100 dark:border-white/5 last:border-0";
  const labelClass = "text-[15px] text-[#1D1D1F] dark:text-white font-medium min-w-[100px]";
  const inputClass = "flex-1 text-right bg-transparent text-[15px] text-gray-600 dark:text-gray-300 placeholder:text-gray-300 outline-none transition-colors focus:text-brand-500";
  const sectionTitleClass = "text-xs font-medium text-gray-500 uppercase tracking-wider ml-3 mb-2";

  return (
    <div className="pb-32 md:pb-0 font-sans">
      
      {/* SECTION: IDENTITY */}
      <h3 className={sectionTitleClass}>{t('invoiceDetails')}</h3>
      <div className={groupClass}>
        <div className={rowClass}>
          <span className={labelClass}>{t('number')}</span>
          <input 
            type="text" 
            value={data.invoiceNumber}
            onChange={(e) => updateField('invoiceNumber', e.target.value)}
            className={`${inputClass} font-semibold`}
          />
        </div>
        <div className={rowClass}>
          <span className={labelClass}>{t('date')}</span>
          <input 
            type="date" 
            value={data.date}
            onChange={(e) => updateField('date', e.target.value)}
            className={`${inputClass} appearance-none`}
          />
        </div>
        <div className={rowClass}>
          <span className={labelClass}>{t('dueDate')}</span>
          <input 
            type="date" 
            value={data.dueDate}
            onChange={(e) => updateField('dueDate', e.target.value)}
            className={`${inputClass} appearance-none text-red-500`}
          />
        </div>
        <div className={rowClass}>
          <span className={labelClass}>{t('currency')}</span>
           <select
            value={data.currency}
            onChange={(e) => updateField('currency', e.target.value)}
            className={`${inputClass} bg-transparent appearance-none cursor-pointer pr-4`}
            style={{ direction: 'rtl' }}
          >
            <option value="MYR">MYR (RM)</option>
            <option value="USD">USD ($)</option>
            <option value="SGD">SGD (S$)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
          <ChevronRight className="w-4 h-4 text-gray-300 absolute right-2 pointer-events-none" />
        </div>
      </div>

      {/* SECTION: BRANDING */}
       <h3 className={sectionTitleClass}>{t('branding')}</h3>
       <div className={groupClass}>
          <div className={`${rowClass} py-3`}>
             <span className={labelClass}>{t('logo')}</span>
             <label className="flex items-center gap-3 cursor-pointer">
                {data.logo ? (
                  <img src={data.logo} alt="Logo" className="w-8 h-8 rounded object-contain border border-gray-100 dark:border-white/10" />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                )}
                <span className="text-[15px] text-brand-500">Edit</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
             </label>
          </div>
          <div className="p-4 bg-white dark:bg-[#1C1C1E]">
             <div className="flex justify-between items-center mb-2">
                <span className={labelClass}>{t('signature')}</span>
             </div>
             <SignaturePad initialValue={data.signature} onChange={(val) => updateField('signature', val)} />
          </div>
       </div>

      {/* SECTION: PEOPLE */}
      <h3 className={sectionTitleClass}>{t('fromTo')}</h3>
      <div className={groupClass}>
        {/* Sender Header */}
        <div className="bg-gray-50/50 dark:bg-white/5 px-4 py-2 border-b border-gray-100 dark:border-white/5">
           <span className="text-xs font-semibold text-gray-400 uppercase">{t('fromSender')}</span>
        </div>
        <div className={rowClass}>
          <input 
            placeholder={t('businessName')}
            className="w-full text-[15px] font-medium bg-transparent outline-none placeholder:text-gray-300"
            value={data.senderName}
            onChange={(e) => updateField('senderName', e.target.value)}
          />
        </div>
        <div className={rowClass}>
          <input 
            placeholder={t('email')}
            className="w-full text-[15px] bg-transparent outline-none placeholder:text-gray-300"
            value={data.senderEmail}
            onChange={(e) => updateField('senderEmail', e.target.value)}
          />
        </div>
         <div className={rowClass}>
            <textarea 
              placeholder={t('address')}
              rows={2}
              className="w-full text-[15px] bg-transparent outline-none placeholder:text-gray-300 resize-none py-1"
              value={data.senderAddress}
              onChange={(e) => updateField('senderAddress', e.target.value)}
            />
        </div>
        <div className="flex divide-x divide-gray-100 dark:divide-white/5">
            <input 
              placeholder={t('regNo')}
              className="w-1/2 p-3.5 text-[13px] bg-transparent outline-none placeholder:text-gray-300"
              value={data.senderRegNo || ''}
              onChange={(e) => updateField('senderRegNo', e.target.value)}
            />
             <input 
              placeholder={t('sstNo')}
              className="w-1/2 p-3.5 text-[13px] bg-transparent outline-none placeholder:text-gray-300"
              value={data.senderSstNo || ''}
              onChange={(e) => updateField('senderSstNo', e.target.value)}
            />
        </div>

        {/* Client Header */}
         <div className="bg-gray-50/50 dark:bg-white/5 px-4 py-2 border-y border-gray-100 dark:border-white/5">
           <span className="text-xs font-semibold text-gray-400 uppercase">{t('toClient')}</span>
        </div>
        <div className={rowClass}>
          <input 
            placeholder={t('clientName')}
            className="w-full text-[15px] font-medium bg-transparent outline-none placeholder:text-gray-300"
            value={data.clientName}
            onChange={(e) => updateField('clientName', e.target.value)}
          />
        </div>
         <div className={rowClass}>
          <input 
            placeholder={t('clientEmail')}
            className="w-full text-[15px] bg-transparent outline-none placeholder:text-gray-300"
            value={data.clientEmail}
            onChange={(e) => updateField('clientEmail', e.target.value)}
          />
        </div>
         <div className={rowClass}>
             <textarea 
              placeholder={t('clientAddress')}
              rows={2}
              className="w-full text-[15px] bg-transparent outline-none placeholder:text-gray-300 resize-none py-1"
              value={data.clientAddress}
              onChange={(e) => updateField('clientAddress', e.target.value)}
            />
        </div>
      </div>

      {/* SECTION: ITEMS */}
      <div className="flex items-center justify-between mb-2 ml-3 mr-1">
         <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lineItems')}</h3>
         <button onClick={addItem} className="text-brand-500 hover:text-brand-600 transition-colors">
            <Plus className="w-5 h-5" />
         </button>
      </div>
      
      <div className="space-y-3 mb-6">
        {data.items.map((item, idx) => (
          <div key={item.id} className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm group">
            <div className="flex items-start p-3 gap-3">
               <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder={t('description')}
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full text-[15px] font-medium placeholder:text-gray-300 outline-none bg-transparent"
                  />
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-lg px-2 py-1">
                        <span className="text-[11px] text-gray-400 uppercase font-bold">Qty</span>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-transparent text-[13px] text-center font-medium outline-none"
                        />
                     </div>
                     <div className="text-gray-300">×</div>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-lg px-2 py-1 flex-1">
                        <span className="text-[11px] text-gray-400 uppercase font-bold">{data.currency}</span>
                        <input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-[13px] font-medium outline-none"
                        />
                     </div>
                  </div>
               </div>
               
               <div className="flex flex-col items-end gap-2">
                 <button 
                  onClick={() => removeItem(item.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                >
                  <MinusCircle className="w-5 h-5" />
                </button>
                <div className="text-[13px] font-bold text-[#1D1D1F] dark:text-white mt-auto">
                   {(item.quantity * item.rate).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </div>
               </div>
            </div>
          </div>
        ))}
        {data.items.length === 0 && (
           <div onClick={addItem} className="text-center p-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl cursor-pointer hover:border-brand-300 transition-colors">
              <span className="text-sm text-gray-400 font-medium">No items. Tap to add.</span>
           </div>
        )}
      </div>

       {/* SECTION: FOOTER */}
       <h3 className={sectionTitleClass}>{t('settingsNotes')}</h3>
       <div className={groupClass}>
          <div className={rowClass}>
            <span className={labelClass}>{t('taxSst')} (%)</span>
            <input 
              type="number" 
              min="0"
              max="100"
              value={data.taxRate}
              onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div className="p-0">
             <div className="px-3.5 py-2 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                <span className="text-xs font-semibold text-gray-400 uppercase">{t('termsNotes')}</span>
             </div>
             <textarea 
                rows={4}
                value={data.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full p-3.5 text-[14px] leading-relaxed bg-transparent outline-none resize-none placeholder:text-gray-300"
              />
          </div>
       </div>

    </div>
  );
};