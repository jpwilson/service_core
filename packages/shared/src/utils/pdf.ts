import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO, isWithinInterval } from 'date-fns';
import type { Employee, TimeEntry, Project, DateRange } from '../types';
import { calculateHoursWorked, calculateOvertimeHours, calculatePayroll } from './calculations';
import { formatCurrency } from './formatters';

export function generatePayrollReport(
  employees: Employee[],
  entries: TimeEntry[],
  projects: Project[],
  dateRange: DateRange,
): Uint8Array {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Filter entries within the date range
  const periodEntries = entries.filter((entry) => {
    const clockIn = parseISO(entry.clockIn);
    return isWithinInterval(clockIn, { start: dateRange.start, end: dateRange.end });
  });

  // ------------------------------------------------------------------
  // Calculate per-employee payroll data
  // ------------------------------------------------------------------
  const employeePayrollMap = new Map<
    string,
    { regularHours: number; overtimeHours: number }
  >();

  for (const entry of periodEntries) {
    const hours = calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks);
    const { regular, overtime } = calculateOvertimeHours(hours, 8);

    const existing = employeePayrollMap.get(entry.employeeId) ?? {
      regularHours: 0,
      overtimeHours: 0,
    };
    employeePayrollMap.set(entry.employeeId, {
      regularHours: existing.regularHours + regular,
      overtimeHours: existing.overtimeHours + overtime,
    });
  }

  // Build rows with full payroll summaries
  const employeeRows: {
    name: string;
    department: string;
    regularHrs: number;
    otHrs: number;
    rate: number;
    regularPay: number;
    otPay: number;
    totalPay: number;
  }[] = [];

  let grandTotalRegularHrs = 0;
  let grandTotalOtHrs = 0;
  let grandTotalRegularPay = 0;
  let grandTotalOtPay = 0;
  let grandTotalPay = 0;

  for (const employee of employees) {
    const hours = employeePayrollMap.get(employee.id);
    if (!hours) continue;

    const payroll = calculatePayroll(employee, hours.regularHours, hours.overtimeHours, 0);

    employeeRows.push({
      name: `${employee.firstName} ${employee.lastName}`,
      department: employee.department,
      regularHrs: payroll.regularHours,
      otHrs: payroll.overtimeHours,
      rate: employee.hourlyRate,
      regularPay: payroll.regularPay,
      otPay: payroll.overtimePay,
      totalPay: payroll.totalPay,
    });

    grandTotalRegularHrs += payroll.regularHours;
    grandTotalOtHrs += payroll.overtimeHours;
    grandTotalRegularPay += payroll.regularPay;
    grandTotalOtPay += payroll.overtimePay;
    grandTotalPay += payroll.totalPay;
  }

  // ------------------------------------------------------------------
  // Calculate per-project data
  // ------------------------------------------------------------------
  const projectMap = new Map<
    string,
    { hours: number; employeeIds: Set<string>; cost: number }
  >();

  for (const entry of periodEntries) {
    const projectId = entry.projectId;
    if (!projectId) continue;

    const hours = calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks);
    const employee = employees.find((e) => e.id === entry.employeeId);
    const cost = employee ? hours * employee.hourlyRate : 0;

    const existing = projectMap.get(projectId) ?? {
      hours: 0,
      employeeIds: new Set<string>(),
      cost: 0,
    };
    existing.hours += hours;
    existing.employeeIds.add(entry.employeeId);
    existing.cost += cost;
    projectMap.set(projectId, existing);
  }

  // ------------------------------------------------------------------
  // Header
  // ------------------------------------------------------------------
  let y = 20;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 31, 68); // #0a1f44
  doc.text('ServiceCore', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Payroll Report', pageWidth / 2, y, { align: 'center' });
  y += 8;

  const periodStart = format(dateRange.start, 'MMM d, yyyy');
  const periodEnd = format(dateRange.end, 'MMM d, yyyy');
  doc.setFontSize(10);
  doc.text(`Period: ${periodStart} - ${periodEnd}`, pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // ------------------------------------------------------------------
  // Summary Section
  // ------------------------------------------------------------------
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 31, 68);
  doc.text('Summary', 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const totalEmployees = employeeRows.length;
  const totalHours = grandTotalRegularHrs + grandTotalOtHrs;

  const summaryItems = [
    `Total Employees: ${totalEmployees}`,
    `Total Hours: ${totalHours.toFixed(1)}`,
    `Total Overtime Hours: ${grandTotalOtHrs.toFixed(1)}`,
    `Estimated Total Payroll: ${formatCurrency(grandTotalPay)}`,
  ];

  for (const item of summaryItems) {
    doc.text(item, 14, y);
    y += 5.5;
  }
  y += 6;

  // ------------------------------------------------------------------
  // Employee Detail Table
  // ------------------------------------------------------------------
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 31, 68);
  doc.text('Employee Detail', 14, y);
  y += 4;

  const tableBody = employeeRows.map((row) => [
    row.name,
    row.department,
    row.regularHrs.toFixed(1),
    row.otHrs.toFixed(1),
    formatCurrency(row.rate),
    formatCurrency(row.regularPay),
    formatCurrency(row.otPay),
    formatCurrency(row.totalPay),
  ]);

  // Totals row
  tableBody.push([
    'TOTALS',
    '',
    grandTotalRegularHrs.toFixed(1),
    grandTotalOtHrs.toFixed(1),
    '',
    formatCurrency(grandTotalRegularPay),
    formatCurrency(grandTotalOtPay),
    formatCurrency(grandTotalPay),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Employee Name', 'Department', 'Regular Hrs', 'OT Hrs', 'Rate', 'Regular Pay', 'OT Pay', 'Total Pay']],
    body: tableBody,
    headStyles: {
      fillColor: [248, 144, 32], // #f89020
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
    },
    // Bold the totals row
    didParseCell(data) {
      if (data.section === 'body' && data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [230, 230, 230];
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ------------------------------------------------------------------
  // Project Summary Table
  // ------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = (doc as any).lastAutoTable?.finalY ?? y + 60;
  finalY += 10;

  // Check if we need a new page
  if (finalY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 31, 68);
  doc.text('Project Summary', 14, finalY);
  finalY += 4;

  const projectBody: string[][] = [];
  for (const project of projects) {
    const data = projectMap.get(project.id);
    if (!data) continue;
    projectBody.push([
      project.name,
      data.hours.toFixed(1),
      String(data.employeeIds.size),
      formatCurrency(data.cost),
    ]);
  }

  if (projectBody.length > 0) {
    autoTable(doc, {
      startY: finalY,
      head: [['Project Name', 'Total Hours', '# Employees', 'Est. Cost']],
      body: projectBody,
      headStyles: {
        fillColor: [248, 144, 32],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [40, 40, 40],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // ------------------------------------------------------------------
  // Footer on each page
  // ------------------------------------------------------------------
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Generated by ServiceCore - Confidential',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' },
    );
  }

  // Return as Uint8Array
  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}
