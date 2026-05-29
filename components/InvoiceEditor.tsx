import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { InvoiceData, LineItem, DiscountType, SavedClient } from '../types';
import { Plus, ChevronDown, Image as ImageIcon, MinusCircle, GripVertical, AlertTriangle } from 'lucide-react';
import { useI18n } from '../i18n';
import { SignaturePad } from './SignaturePad';
import { getStoredClients, saveClient } from '../services/storageService';
import { FIELD_LIMITS } from '../services/fieldLimits';

interface LineItemRowProps {
  item: LineItem;
  index: number;
  currency: string;
  onUpdate: (id: string, field: keyof LineItem, value: string | number) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

// A single draggable line-item row. Dragging is initiated only from the grip
// handle (so the input fields stay fully editable), and the handle also moves
// the item with ArrowUp / ArrowDown for keyboard accessibility.
const LineItemRow: React.FC<LineItemRowProps> = ({ item, index, currency, onUpdate, onRemove, onMove }) => {
  const { t, locale } = useI18n();
  const formatLocale = locale === 'ms' ? 'ms-MY' : 'en-MY';
  const dragControls = useDragControls();

  // Local text buffers so a field can be cleared (shown empty) while editing
  // instead of snapping back to 0. The row is keyed by item.id, so it remounts
  // — and re-initialises these — when a different invoice is loaded.
  const [qtyText, setQtyText] = React.useState(() => String(item.quantity));
  const [rateText, setRateText] = React.useState(() => String(item.rate));
  const toNumber = (v: string) => (v === '' ? 0 : parseFloat(v) || 0);

  return (
    <Reorder.Item
      value={item}
      as="div"
      dragListener={false}
      dragControls={dragControls}
      className="bg-white dark:bg-surface rounded-xl overflow-hidden shadow-sm group"
    >
      <div className="flex items-start p-3 gap-2">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); onMove(index, -1); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); onMove(index, 1); }
          }}
          aria-label={`Reorder item ${index + 1}. Use arrow keys to move up or down.`}
          className="touch-none cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-0.5 p-1 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="flex-1 space-y-2">
          <input
            type="text"
            placeholder={t('description')}
            aria-label={`${t('description')} ${index + 1}`}
            maxLength={FIELD_LIMITS.description}
            value={item.description}
            onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
            className="w-full text-[15px] font-medium placeholder:text-gray-500 outline-none bg-transparent"
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-lg px-2 py-1">
              <span className="text-[11px] text-gray-500 uppercase font-bold">Qty</span>
              <input
                type="number"
                min="0"
                aria-label={`Quantity for item ${index + 1}`}
                value={qtyText}
                onChange={(e) => { setQtyText(e.target.value); onUpdate(item.id, 'quantity', toNumber(e.target.value)); }}
                className="w-12 bg-transparent text-[13px] text-center font-medium outline-none"
              />
            </div>
            <div className="text-gray-400" aria-hidden="true">×</div>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-lg px-2 py-1 flex-1">
              <span className="text-[11px] text-gray-500 uppercase font-bold">{currency}</span>
              <input
                type="number"
                min="0"
                aria-label={`Rate for item ${index + 1}`}
                value={rateText}
                onChange={(e) => { setRateText(e.target.value); onUpdate(item.id, 'rate', toNumber(e.target.value)); }}
                className="w-full bg-transparent text-[13px] font-medium outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => onRemove(item.id)}
            aria-label={`Remove item ${index + 1}`}
            className="text-gray-500 hover:text-red-600 dark:text-gray-400 transition-colors p-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-full"
          >
            <MinusCircle className="w-5 h-5" />
          </button>
          <div className="text-[13px] font-bold text-ink dark:text-white mt-auto">
            {(item.quantity * item.rate).toLocaleString(formatLocale, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
};

interface InvoiceEditorProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ data, onChange, onNotify }) => {
  const { t } = useI18n();

  // Only treat the due date as "overdue" when it is genuinely in the past;
  // otherwise it should read as neutral text, not an error state.
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !!data.dueDate && data.dueDate < todayStr;

  // Text buffer for the tax field so it can be cleared while editing. A ref
  // tracks the value we last pushed up, so we only resync the buffer on a
  // genuine external change (invoice loaded/reset), never on our own edits.
  const [taxText, setTaxText] = React.useState(() => String(data.taxRate));
  const lastTaxRef = React.useRef(data.taxRate);
  React.useEffect(() => {
    if (data.taxRate !== lastTaxRef.current) {
      lastTaxRef.current = data.taxRate;
      setTaxText(String(data.taxRate));
    }
  }, [data.taxRate]);

  // Discount: same clearable-buffer pattern as tax.
  const discountType: DiscountType = data.discountType ?? 'percent';
  const [discountText, setDiscountText] = React.useState(() => String(data.discountValue ?? 0));
  const lastDiscountRef = React.useRef(data.discountValue ?? 0);
  React.useEffect(() => {
    const v = data.discountValue ?? 0;
    if (v !== lastDiscountRef.current) {
      lastDiscountRef.current = v;
      setDiscountText(String(v));
    }
  }, [data.discountValue]);

  // Saved clients for autofill.
  const [clients, setClients] = React.useState<SavedClient[]>(() => getStoredClients());

  const handleSaveClient = () => {
    const name = data.clientName.trim();
    if (!name) {
      onNotify?.(t('clientNameRequired'), 'error');
      return;
    }
    const existing = clients.find((c) => c.name.toLowerCase() === name.toLowerCase());
    const client: SavedClient = {
      id: existing?.id || crypto.randomUUID(),
      name,
      email: data.clientEmail,
      address: data.clientAddress,
    };
    setClients(saveClient(client));
    onNotify?.(t('clientSaved'), 'success');
  };

  const updateField = <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    const newItems = data.items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      rate: 0
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const removeItem = (id: string) => {
    onChange({ ...data, items: data.items.filter(item => item.id !== id) });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= data.items.length) return;
    const newItems = [...data.items];
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    onChange({ ...data, items: newItems });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onNotify?.(t('logoTooLarge'), 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      updateField('logo', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // iOS-style Grouped List Classes
  const groupClass = "bg-white dark:bg-surface rounded-xl overflow-hidden shadow-sm mb-6";
  const rowClass = "relative flex items-center justify-between p-3.5 border-b border-gray-100 dark:border-white/5 last:border-0";
  const labelClass = "text-[15px] text-ink dark:text-white font-medium min-w-[100px]";
  const inputClass = "flex-1 text-right bg-transparent text-[15px] text-gray-600 dark:text-gray-300 placeholder:text-gray-500 outline-none transition-colors focus:text-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-inset rounded";
  const sectionTitleClass = "text-xs font-medium text-gray-500 uppercase tracking-wider ml-3 mb-2";
  // Stacked field with a persistent visible label (replaces placeholder-only labels).
  const fieldRowClass = "px-3.5 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0";
  const fieldLabelClass = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5";
  const fieldInputClass = "w-full bg-transparent text-[15px] text-ink dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-brand-500 focus:ring-inset rounded";

  return (
    <div className="pb-32 md:pb-0 font-sans">

      {/* SECTION: IDENTITY */}
      <h3 className={sectionTitleClass}>{t('invoiceDetails')}</h3>
      <div className={groupClass}>
        <div className={rowClass}>
          <label htmlFor="invoice-number" className={labelClass}>{t('number')}</label>
          <input
            id="invoice-number"
            type="text"
            maxLength={FIELD_LIMITS.invoiceNumber}
            value={data.invoiceNumber}
            onChange={(e) => updateField('invoiceNumber', e.target.value)}
            className={`${inputClass} font-semibold`}
          />
        </div>
        <div className={rowClass}>
          <label htmlFor="invoice-date" className={labelClass}>{t('date')}</label>
          <input
            id="invoice-date"
            type="date"
            value={data.date}
            onChange={(e) => updateField('date', e.target.value)}
            className={`${inputClass} appearance-none`}
          />
        </div>
        <div className={rowClass}>
          <label htmlFor="due-date" className={`${labelClass} flex items-center gap-1.5`}>
            {t('dueDate')}
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                {t('overdue')}
              </span>
            )}
          </label>
          <input
            id="due-date"
            type="date"
            value={data.dueDate}
            onChange={(e) => updateField('dueDate', e.target.value)}
            className={`${inputClass} appearance-none ${isOverdue ? 'text-red-600' : ''}`}
          />
        </div>
        <div className={rowClass}>
          <label htmlFor="currency" className={labelClass}>{t('currency')}</label>
           <select
            id="currency"
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
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 pointer-events-none" />
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
                <span className="text-[15px] text-brand-500">{data.logo ? 'Edit' : 'Add'}</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" aria-label="Upload logo" />
             </label>
          </div>
          <div className="p-4 bg-white dark:bg-surface">
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
           <span className="text-xs font-semibold text-gray-500 uppercase">{t('fromSender')}</span>
        </div>
        <div className={fieldRowClass}>
          <label htmlFor="sender-name" className={fieldLabelClass}>{t('businessName')}</label>
          <input
            id="sender-name"
            maxLength={FIELD_LIMITS.name}
            className={`${fieldInputClass} font-medium`}
            value={data.senderName}
            onChange={(e) => updateField('senderName', e.target.value)}
          />
        </div>
        <div className={fieldRowClass}>
          <label htmlFor="sender-email" className={fieldLabelClass}>{t('email')}</label>
          <input
            id="sender-email"
            type="email"
            maxLength={FIELD_LIMITS.email}
            className={fieldInputClass}
            value={data.senderEmail}
            onChange={(e) => updateField('senderEmail', e.target.value)}
          />
        </div>
        <div className={fieldRowClass}>
          <label htmlFor="sender-address" className={fieldLabelClass}>{t('address')}</label>
          <textarea
            id="sender-address"
            rows={2}
            maxLength={FIELD_LIMITS.address}
            className={`${fieldInputClass} resize-none`}
            value={data.senderAddress}
            onChange={(e) => updateField('senderAddress', e.target.value)}
          />
        </div>
        <div className="flex divide-x divide-gray-100 dark:divide-white/5">
          <div className="w-1/2 px-3.5 py-2.5">
            <label htmlFor="sender-regno" className={fieldLabelClass}>{t('regNo')}</label>
            <input
              id="sender-regno"
              maxLength={FIELD_LIMITS.idNo}
              className={`${fieldInputClass} text-[13px]`}
              value={data.senderRegNo || ''}
              onChange={(e) => updateField('senderRegNo', e.target.value)}
            />
          </div>
          <div className="w-1/2 px-3.5 py-2.5">
            <label htmlFor="sender-sstno" className={fieldLabelClass}>{t('sstNo')} ({t('optional')})</label>
            <input
              id="sender-sstno"
              maxLength={FIELD_LIMITS.idNo}
              className={`${fieldInputClass} text-[13px]`}
              value={data.senderSstNo || ''}
              onChange={(e) => updateField('senderSstNo', e.target.value)}
            />
          </div>
        </div>
        <div className="px-3.5 pt-1 pb-2.5 border-b border-gray-100 dark:border-white/5">
          <p className="text-[11px] text-gray-500 leading-snug">{t('sstHint')}</p>
        </div>

        {/* Client Header */}
         <div className="bg-gray-50/50 dark:bg-white/5 px-4 py-2 border-y border-gray-100 dark:border-white/5 flex items-center justify-between">
           <span className="text-xs font-semibold text-gray-500 uppercase">{t('toClient')}</span>
           <button
             type="button"
             onClick={handleSaveClient}
             className="text-[11px] font-semibold text-brand-500 hover:text-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-1"
           >
             {t('saveClient')}
           </button>
        </div>
        <div className={fieldRowClass}>
          <label htmlFor="client-name" className={fieldLabelClass}>{t('clientName')}</label>
          <input
            id="client-name"
            list="clients-datalist"
            maxLength={FIELD_LIMITS.name}
            className={`${fieldInputClass} font-medium`}
            value={data.clientName}
            onChange={(e) => {
              const val = e.target.value;
              const match = clients.find((c) => c.name === val);
              if (match) {
                onChange({ ...data, clientName: match.name, clientEmail: match.email, clientAddress: match.address });
              } else {
                updateField('clientName', val);
              }
            }}
          />
          <datalist id="clients-datalist">
            {clients.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        <div className={fieldRowClass}>
          <label htmlFor="client-email" className={fieldLabelClass}>{t('clientEmail')}</label>
          <input
            id="client-email"
            type="email"
            maxLength={FIELD_LIMITS.email}
            className={fieldInputClass}
            value={data.clientEmail}
            onChange={(e) => updateField('clientEmail', e.target.value)}
          />
        </div>
        <div className={fieldRowClass}>
          <label htmlFor="client-address" className={fieldLabelClass}>{t('clientAddress')}</label>
          <textarea
            id="client-address"
            rows={2}
            maxLength={FIELD_LIMITS.address}
            className={`${fieldInputClass} resize-none`}
            value={data.clientAddress}
            onChange={(e) => updateField('clientAddress', e.target.value)}
          />
        </div>
      </div>

      {/* SECTION: ITEMS */}
      <div className="flex items-center justify-between mb-2 ml-3 mr-1">
         <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lineItems')}</h3>
         <button onClick={addItem} aria-label={t('addItem') || 'Add item'} className="text-brand-500 hover:text-brand-600 transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-full">
            <Plus className="w-5 h-5" />
         </button>
      </div>

      <Reorder.Group
        axis="y"
        as="div"
        values={data.items}
        onReorder={(items) => onChange({ ...data, items })}
        className="space-y-3 mb-6"
      >
        {data.items.map((item, idx) => (
          <LineItemRow
            key={item.id}
            item={item}
            index={idx}
            currency={data.currency}
            onUpdate={updateItem}
            onRemove={removeItem}
            onMove={moveItem}
          />
        ))}
        {data.items.length === 0 && (
           <div onClick={addItem} className="text-center p-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl cursor-pointer hover:border-brand-300 transition-colors">
              <span className="text-sm text-gray-500 font-medium">Click to add an item.</span>
           </div>
        )}
      </Reorder.Group>

       {/* SECTION: FOOTER */}
       <h3 className={sectionTitleClass}>{t('settingsNotes')}</h3>
       <div className={groupClass}>
          <div className={rowClass}>
            <label htmlFor="tax-rate" className={labelClass}>{t('taxSst')} (%)</label>
            {/* taxSst no longer carries its own "(%)"; appended once here */}
            <input
              id="tax-rate"
              type="number"
              min="0"
              max="100"
              value={taxText}
              onChange={(e) => {
                const v = e.target.value;
                setTaxText(v);
                const n = v === '' ? 0 : parseFloat(v) || 0;
                lastTaxRef.current = n;
                updateField('taxRate', n);
              }}
              className={inputClass}
            />
          </div>
          <div className={rowClass}>
            <label htmlFor="discount" className={labelClass}>{t('discount')}</label>
            <div className="flex items-center gap-2">
              <select
                aria-label={`${t('discount')} type`}
                value={discountType}
                onChange={(e) => updateField('discountType', e.target.value as DiscountType)}
                className="bg-gray-50 dark:bg-white/5 rounded-lg text-[13px] px-2 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-brand-500"
              >
                <option value="percent">%</option>
                <option value="fixed">{data.currency}</option>
              </select>
              <input
                id="discount"
                type="number"
                min="0"
                value={discountText}
                onChange={(e) => {
                  const v = e.target.value;
                  setDiscountText(v);
                  const n = v === '' ? 0 : parseFloat(v) || 0;
                  lastDiscountRef.current = n;
                  updateField('discountValue', n);
                }}
                className="w-20 text-right bg-transparent text-[15px] text-gray-600 dark:text-gray-300 outline-none focus:text-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-inset rounded"
              />
            </div>
          </div>
          <div className="p-0">
             <div className="px-3.5 py-2 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                <span className="text-xs font-semibold text-gray-500 uppercase">{t('termsNotes')}</span>
             </div>
             <textarea
                id="notes"
                aria-label={t('termsNotes')}
                rows={4}
                maxLength={FIELD_LIMITS.notes}
                value={data.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full p-3.5 text-[14px] leading-relaxed bg-transparent outline-none resize-none placeholder:text-gray-500"
              />
          </div>
       </div>

    </div>
  );
};
