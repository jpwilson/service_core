import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import {
  FileText,
  DollarSign,
  Calendar,
  Clock,
  X,
  Download,
  Send,
  ChevronRight,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import jsPDF from 'jspdf';
import {
  mockTimeEntries,
  mockEmployees,
  calculateHoursWorked,
} from '@servicecore/shared';
import { useAppStore } from '../../store/useAppStore';

interface Customer {
  id: string;
  name: string;
  contactName: string;
  email: string;
  billRate: number;
  outstandingHours: number;
  lastInvoiceDate: Date;
  projectIds: string[];
}

interface InvoiceLineItem {
  employeeName: string;
  hours: number;
  rate: number;
  total: number;
}

interface InvoicePreview {
  customer: Customer;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
}

const TAX_RATE = 0.085;

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    name: 'Metro Denver Construction Co',
    contactName: 'Robert Hensel',
    email: 'billing@metrodenverco.com',
    billRate: 85,
    outstandingHours: 312,
    lastInvoiceDate: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
    projectIds: ['proj-001', 'proj-009'],
  },
  {
    id: 'cust-002',
    name: 'Boulder Events LLC',
    contactName: 'Sarah Mitchell',
    email: 'accounts@boulderevents.com',
    billRate: 75,
    outstandingHours: 148,
    lastInvoiceDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    projectIds: ['proj-002', 'proj-011'],
  },
  {
    id: 'cust-003',
    name: 'Front Range Municipal Services',
    contactName: 'David Chen',
    email: 'ap@frontrangemunicipal.gov',
    billRate: 90,
    outstandingHours: 224,
    lastInvoiceDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    projectIds: ['proj-003', 'proj-013'],
  },
  {
    id: 'cust-004',
    name: 'Pikes Peak Event Services',
    contactName: 'Maria Gonzalez',
    email: 'invoices@pikespeakevents.com',
    billRate: 70,
    outstandingHours: 96,
    lastInvoiceDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    projectIds: ['proj-004'],
  },
  {
    id: 'cust-005',
    name: 'Richmond American Developments',
    contactName: 'Tom Bradley',
    email: 'ap@richmondamerican.com',
    billRate: 95,
    outstandingHours: 186,
    lastInvoiceDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    projectIds: ['proj-005', 'proj-012'],
  },
];

function generateInvoiceNumber(): string {
  const prefix = 'SC-INV';
  const datePart = format(new Date(), 'yyyyMM');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}-${datePart}-${seq}`;
}

function buildLineItemsForCustomer(customer: Customer): InvoiceLineItem[] {
  const employeeMap = new Map(mockEmployees.map((e) => [e.id, e]));
  const hoursPerEmployee = new Map<string, number>();

  for (const entry of mockTimeEntries) {
    if (!entry.clockOut) continue;
    if (entry.projectId && customer.projectIds.includes(entry.projectId)) {
      const hours = calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks);
      const current = hoursPerEmployee.get(entry.employeeId) || 0;
      hoursPerEmployee.set(entry.employeeId, current + hours);
    }
  }

  // If no matching time entries, create seeded line items from mock data
  if (hoursPerEmployee.size === 0) {
    const sampleEmployees = mockEmployees.slice(0, 3);
    const hoursOptions = [42, 38.5, 24, 36, 40];
    return sampleEmployees.map((emp, i) => {
      const hours = hoursOptions[i % hoursOptions.length];
      return {
        employeeName: `${emp.firstName} ${emp.lastName}`,
        hours: Math.round(hours * 100) / 100,
        rate: customer.billRate,
        total: Math.round(hours * customer.billRate * 100) / 100,
      };
    });
  }

  return Array.from(hoursPerEmployee.entries())
    .map(([empId, hours]) => {
      const emp = employeeMap.get(empId);
      if (!emp) return null;
      const roundedHours = Math.round(hours * 100) / 100;
      return {
        employeeName: `${emp.firstName} ${emp.lastName}`,
        hours: roundedHours,
        rate: customer.billRate,
        total: Math.round(roundedHours * customer.billRate * 100) / 100,
      };
    })
    .filter(Boolean) as InvoiceLineItem[];
}

export function Invoices() {
  const { addToast } = useAppStore();
  const [selectedInvoice, setSelectedInvoice] = useState<InvoicePreview | null>(null);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalOutstanding = MOCK_CUSTOMERS.reduce(
      (sum, c) => sum + c.outstandingHours * c.billRate,
      0
    );
    const invoicesThisMonth = 7;
    const avgDaysToPay = 24;
    return { totalOutstanding, invoicesThisMonth, avgDaysToPay };
  }, []);

  const handleGenerateInvoice = (customer: Customer) => {
    const lineItems = buildLineItemsForCustomer(customer);
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const invoice: InvoicePreview = {
      customer,
      invoiceNumber: generateInvoiceNumber(),
      date: new Date(),
      dueDate: addDays(new Date(), 30),
      lineItems,
      subtotal,
      tax,
      total,
    };

    setSelectedInvoice(invoice);
  };

  const handleDownloadPdf = () => {
    if (!selectedInvoice) return;
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.setTextColor(10, 31, 68);
    doc.text('INVOICE', 20, 30);
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(`Invoice #: ${selectedInvoice.invoiceNumber}`, 20, 45);
    doc.text(`Date: ${format(selectedInvoice.date, 'MMM d, yyyy')}`, 20, 52);
    doc.text(`Due: ${format(selectedInvoice.dueDate, 'MMM d, yyyy')}`, 20, 59);
    doc.text(`Customer: ${selectedInvoice.customer.name}`, 20, 72);
    doc.text(`Attn: ${selectedInvoice.customer.contactName}`, 20, 79);
    // Line items header
    let y = 95;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Employee', 20, y);
    doc.text('Hours', 120, y);
    doc.text('Rate', 145, y);
    doc.text('Amount', 170, y);
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 195, y);
    y += 6;
    doc.setTextColor(30, 30, 30);
    selectedInvoice.lineItems.forEach((item) => {
      doc.text(item.employeeName, 20, y);
      doc.text(item.hours.toString(), 120, y);
      doc.text(`$${item.rate.toFixed(2)}`, 145, y);
      doc.text(`$${item.total.toFixed(2)}`, 170, y);
      y += 7;
    });
    y += 10;
    doc.setFontSize(12);
    doc.text(`Subtotal: $${selectedInvoice.subtotal.toFixed(2)}`, 140, y);
    doc.text(`Tax (8.5%): $${selectedInvoice.tax.toFixed(2)}`, 140, y + 8);
    doc.setFontSize(14);
    doc.setTextColor(10, 31, 68);
    doc.text(`Total: $${selectedInvoice.total.toFixed(2)}`, 140, y + 18);
    doc.save(`invoice-${selectedInvoice.invoiceNumber}.pdf`);
    addToast('Invoice PDF downloaded', 'success');
  };

  const handleSendEmail = () => {
    if (selectedInvoice) {
      addToast(`Invoice sent to ${selectedInvoice.customer.email}`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-secondary-500 font-display">Invoices</h2>
        <p className="text-sm text-gray-500">
          Generate and send invoices to customers based on tracked time entries.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-primary-500" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Outstanding</p>
          </div>
          <p className="text-2xl font-bold text-secondary-500 font-display">
            ${summaryStats.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">across {MOCK_CUSTOMERS.length} customers</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-primary-500" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Invoices This Month</p>
          </div>
          <p className="text-2xl font-bold text-secondary-500 font-display">{summaryStats.invoicesThisMonth}</p>
          <p className="text-xs text-gray-400 mt-0.5">sent in March 2026</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Days to Pay</p>
          </div>
          <p className="text-2xl font-bold text-secondary-500 font-display">{summaryStats.avgDaysToPay}</p>
          <p className="text-xs text-gray-400 mt-0.5">net 30 terms</p>
        </div>
      </div>

      {/* Customer Cards */}
      <div>
        <h3 className="text-sm font-bold text-secondary-500 uppercase tracking-wider mb-3">Customers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_CUSTOMERS.map((customer) => {
            const billableAmount = customer.outstandingHours * customer.billRate;
            return (
              <div
                key={customer.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-secondary-500 truncate">{customer.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{customer.contactName}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Outstanding Hours
                    </span>
                    <span className="font-bold text-secondary-500">{customer.outstandingHours}h</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Billable Amount
                    </span>
                    <span className="font-bold text-green-600">
                      ${billableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Last Invoice
                    </span>
                    <span className="text-gray-600">{format(customer.lastInvoiceDate, 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateInvoice(customer)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Generate Invoice
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div>
                <h3 className="text-base font-bold text-secondary-500 font-display">Invoice Preview</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice Content */}
            <div className="px-6 py-5 space-y-5">
              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bill To</p>
                  <p className="text-sm font-bold text-secondary-500 mt-1">{selectedInvoice.customer.name}</p>
                  <p className="text-xs text-gray-500">Attn: {selectedInvoice.customer.contactName}</p>
                  <p className="text-xs text-gray-500">{selectedInvoice.customer.email}</p>
                </div>
                <div className="text-right">
                  <div className="space-y-1">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-xs text-gray-400">Invoice #:</span>
                      <span className="text-xs font-bold text-secondary-500">{selectedInvoice.invoiceNumber}</span>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-xs text-gray-400">Date:</span>
                      <span className="text-xs text-gray-700">{format(selectedInvoice.date, 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-xs text-gray-400">Due Date:</span>
                      <span className="text-xs font-semibold text-primary-600">{format(selectedInvoice.dueDate, 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-xs text-gray-400">Terms:</span>
                      <span className="text-xs text-gray-700">Net 30</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Employee</th>
                      <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Hours</th>
                      <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Rate</th>
                      <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedInvoice.lineItems.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 text-secondary-500 font-medium">{item.employeeName}</td>
                        <td className="py-2.5 px-4 text-right text-gray-600">{item.hours}</td>
                        <td className="py-2.5 px-4 text-right text-gray-600">${item.rate.toFixed(2)}/hr</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-secondary-500">
                          ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-secondary-500">
                      ${selectedInvoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tax ({(TAX_RATE * 100).toFixed(1)}%)</span>
                    <span className="font-medium text-secondary-500">
                      ${selectedInvoice.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-secondary-500">Total Due</span>
                      <span className="text-lg font-black text-secondary-500 font-display">
                        ${selectedInvoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
              <button
                onClick={handleSendEmail}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
