export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceData {
  id: string; // Unique ID for history management
  invoiceNumber: string;
  date: string;
  dueDate: string;
  senderName: string;
  senderRegNo?: string; 
  senderSstNo?: string;
  senderEmail: string;
  senderAddress: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  currency: string;
  taxRate: number;
  notes: string;
  items: LineItem[];
  logo?: string; // Base64 Data URL
  signature?: string; // Base64 Data URL
}

export const createDefaultInvoice = (): InvoiceData => ({
  id: crypto.randomUUID(),
  invoiceNumber: 'INV-2024-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
  senderName: 'Inovasi Digital Sdn. Bhd.',
  senderRegNo: '202301001234 (123456-X)', 
  senderSstNo: 'W10-2301-32000123', 
  senderEmail: 'billing@inovasidigital.my',
  senderAddress: 'Level 23, Menara TRX, Tun Razak Exchange,\n55188 Kuala Lumpur, Malaysia',
  clientName: 'Jabatan Teknologi Maklumat',
  clientEmail: 'admin@jtm.gov.my',
  clientAddress: 'Aras 3, Blok B, Kompleks Kerajaan,\n62502 Putrajaya, Wilayah Persekutuan',
  currency: 'MYR',
  taxRate: 6, 
  notes: 'Payment terms: 30 days.\nCheques payable to "Inovasi Digital Sdn Bhd".\nBank: Maybank Berhad (Account: 5140-1122-3344)',
  items: [
    {
      id: '1',
      description: 'Consultancy Services - System Architecture Review',
      quantity: 1,
      rate: 5500,
    },
    {
      id: '2',
      description: 'Server Migration & Deployment',
      quantity: 1,
      rate: 2400,
    }
  ],
});