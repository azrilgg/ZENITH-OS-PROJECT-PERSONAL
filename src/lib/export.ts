import { Task } from './store';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export function exportToJSON(tasks: Task[], filename = 'zenith-tasks') {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  saveAs(blob, `${filename}.json`);
}

export function exportToTXT(tasks: Task[], filename = 'zenith-tasks') {
  const lines = tasks.map((t, i) => {
    const status = t.completed ? '✓' : '○';
    const deadline = t.deadline ? ` | Due: ${new Date(t.deadline).toLocaleDateString()}` : '';
    const cat = t.category ? ` [${t.category}]` : '';
    return `${i + 1}. ${status} ${t.title}${cat}${deadline}`;
  });
  const text = `ZENITH OS — Task Export\n${'═'.repeat(40)}\nExported: ${new Date().toLocaleString()}\n\n${lines.join('\n')}`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${filename}.txt`);
}

export function exportToExcel(tasks: Task[], filename = 'zenith-tasks') {
  const data = tasks.map(t => ({
    Title: t.title,
    Category: t.category,
    Priority: t.priority,
    Status: t.completed ? 'Completed' : 'Pending',
    Deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : 'N/A',
    Location: t.location || 'N/A',
    'Created At': new Date(t.createdAt).toLocaleString(),
    'Completed At': t.completedAt ? new Date(t.completedAt).toLocaleString() : 'N/A',
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(tasks: Task[], filename = 'zenith-tasks') {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('ZENITH OS — Task Report', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Exported: ${new Date().toLocaleString()}`, 14, 28);

  let y = 40;
  doc.setFontSize(11);
  doc.setTextColor(40);

  tasks.forEach((t, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const status = t.completed ? '[✓]' : '[ ]';
    const line = `${i + 1}. ${status} ${t.title}`;
    doc.text(line, 14, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(120);
    const meta = [`Category: ${t.category}`, `Priority: ${t.priority}`];
    if (t.deadline) meta.push(`Due: ${new Date(t.deadline).toLocaleDateString()}`);
    if (t.location) meta.push(`Location: ${t.location}`);
    doc.text(meta.join(' | '), 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(40);
  });

  doc.save(`${filename}.pdf`);
}

// Full system backup
export function exportFullBackup() {
  const data: Record<string, unknown> = {};
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('zenith_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, `zenith-os-backup-${new Date().toISOString().split('T')[0]}.json`);
}

export function importFullBackup(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
