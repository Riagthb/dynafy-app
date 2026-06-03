// ─── INVOICE PDF GENERATORS ─────────────────────────────────────
// Geëxtraheerd uit App.jsx tijdens Fase-1 refactor (2026-05-27).
// printInvoicePDF: opent print-dialog in nieuwe window (klant browser-print).
// generateInvoicePDFBase64: rendert off-screen via html2canvas → jsPDF → base64
// voor email-bijlage.

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { invoiceTotals } from './utils.js';

export function printInvoicePDF(invoice, zzpProfile) {
  const escHtml = (s) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const p = zzpProfile || {};
  const totals = invoiceTotals(invoice);
  const client = invoice.client || {};
  const clientName = escHtml(client.company_name || [client.first_name, client.last_name].filter(Boolean).join(' ') || '—');
  const clientAddr = [client.address, [client.postal_code, client.city].filter(Boolean).join(' ')].filter(Boolean).map(escHtml).join('<br>');
  const fmtN = (n) => Number(n || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const linesHtml = (invoice.lines || []).sort((a,b) => a.sort_order - b.sort_order).map(l => {
    const excl = parseFloat(l.quantity||0) * parseFloat(l.unit_price||0);
    return `<tr>
      <td>${escHtml(l.description)}</td>
      <td style="text-align:right">${parseFloat(l.quantity||0).toLocaleString('nl-NL')}</td>
      <td style="text-align:right">€ ${fmtN(l.unit_price)}</td>
      <td style="text-align:right">${l.btw_percentage}%</td>
      <td style="text-align:right">€ ${fmtN(excl)}</td>
    </tr>`;
  }).join('');

  const btwRows = Object.entries(totals.btwGroups).map(([pct, amt]) =>
    `<tr><td colspan="4" style="text-align:right;color:#64748b">BTW ${pct}%</td><td style="text-align:right;color:#64748b">€ ${fmtN(amt)}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Factuur ${invoice.invoice_number}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;padding:48px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px}
    .company-name{font-size:22px;font-weight:800;margin-bottom:8px}
    .meta{color:#64748b;line-height:1.7;font-size:12px}
    .invoice-title{font-size:36px;font-weight:800;color:#1a1a1a;text-align:right;margin-bottom:12px}
    .bill-to{margin-bottom:36px}
    .label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-top:24px}
    th{text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;padding:8px 6px;border-bottom:2px solid #e2e8f0}
    td{padding:10px 6px;border-bottom:1px solid #f1f5f9;vertical-align:top}
    .totals-table{margin-left:auto;width:280px;margin-top:8px}
    .totals-table td{border:none;padding:3px 6px}
    .grand-total td{font-size:16px;font-weight:800;border-top:2px solid #1a1a1a;padding-top:10px!important}
    .footer{margin-top:48px;padding-top:20px;border-top:1px solid #e2e8f0;color:#64748b;font-size:11px;line-height:1.6}
    @media print{body{padding:0}}
  </style></head><body>
  <div class="header">
    <div>
      <div class="company-name">${p.company_name || 'Bedrijfsnaam'}</div>
      <div class="meta">
        ${p.address || ''}${p.address ? '<br>' : ''}
        ${[p.postal_code, p.city].filter(Boolean).join(' ')}${p.city ? '<br>' : ''}
        ${p.kvk ? 'KvK: ' + p.kvk + '<br>' : ''}
        ${p.btw_number ? 'BTW: ' + p.btw_number + '<br>' : ''}
        ${p.iban ? 'IBAN: ' + p.iban : ''}
      </div>
    </div>
    <div>
      <div class="invoice-title">FACTUUR</div>
      <div class="meta" style="text-align:right;line-height:1.9">
        <b>Nummer:</b> ${invoice.invoice_number}<br>
        <b>Datum:</b> ${new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}<br>
        ${invoice.due_date ? '<b>Vervaldatum:</b> ' + new Date(invoice.due_date).toLocaleDateString('nl-NL') : ''}
      </div>
    </div>
  </div>
  <div class="bill-to">
    <div class="label">Factuur aan</div>
    <div style="font-weight:700;font-size:14px">${clientName}</div>
    <div class="meta">${clientAddr}${client.email ? '<br>' + client.email : ''}${client.kvk ? '<br>KvK: ' + client.kvk : ''}${client.btw_number ? '<br>BTW: ' + client.btw_number : ''}</div>
  </div>
  <table>
    <thead><tr><th>Omschrijving</th><th style="text-align:right">Aantal</th><th style="text-align:right">Prijs</th><th style="text-align:right">BTW</th><th style="text-align:right">Bedrag</th></tr></thead>
    <tbody>${linesHtml}</tbody>
  </table>
  <table class="totals-table">
    <tr><td colspan="4" style="text-align:right;color:#64748b">Subtotaal excl. BTW</td><td style="text-align:right;color:#64748b">€ ${fmtN(totals.exclBtw)}</td></tr>
    ${btwRows}
    <tr class="grand-total"><td colspan="4" style="text-align:right">Totaal incl. BTW</td><td style="text-align:right">€ ${fmtN(totals.inclBtw)}</td></tr>
  </table>
  ${invoice.notes ? `<div style="margin-top:32px;padding:16px;background:#f8fafc;border-radius:8px"><div class="label">Opmerkingen</div><div style="margin-top:4px">${invoice.notes}</div></div>` : ''}
  <div class="footer">
    Gelieve € ${fmtN(totals.inclBtw)} over te maken op <b>${p.iban || '—'}</b> o.v.v. factuurnummer <b>${invoice.invoice_number}</b>.
  </div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`;

  const w = window.open('', '_blank', 'width=860,height=1100');
  if (w) { w.document.write(html); w.document.close(); }
}

export async function generateInvoicePDFBase64(invoice, zzpProfile) {
  // Render the invoice HTML off-screen, capture with html2canvas, convert to PDF
  const escHtml = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const p = zzpProfile || {};
  const totals = invoiceTotals(invoice);
  const client = invoice.client || {};
  const clientName = escHtml(client.company_name || [client.first_name, client.last_name].filter(Boolean).join(' ') || '—');
  const clientAddr = [client.address, [client.postal_code, client.city].filter(Boolean).join(' ')].filter(Boolean).map(escHtml).join('<br>');
  const fmtN = (n) => Number(n || 0).toLocaleString('nl-NL', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const linesHtml = (invoice.lines || []).sort((a,b) => a.sort_order - b.sort_order).map(l => {
    const excl = parseFloat(l.quantity||0) * parseFloat(l.unit_price||0);
    return `<tr><td>${escHtml(l.description)}</td><td style="text-align:right">${parseFloat(l.quantity||0).toLocaleString('nl-NL')}</td><td style="text-align:right">€ ${fmtN(l.unit_price)}</td><td style="text-align:right">${l.btw_percentage}%</td><td style="text-align:right">€ ${fmtN(excl)}</td></tr>`;
  }).join('');
  const btwRows = Object.entries(totals.btwGroups).map(([pct, amt]) =>
    `<tr><td colspan="4" style="text-align:right;color:#64748b">BTW ${pct}%</td><td style="text-align:right;color:#64748b">€ ${fmtN(amt)}</td></tr>`
  ).join('');

  const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;padding:48px;width:794px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px}
    .company-name{font-size:22px;font-weight:800;margin-bottom:8px}
    .meta{color:#64748b;line-height:1.7;font-size:12px}
    .invoice-title{font-size:36px;font-weight:800;color:#1a1a1a;text-align:right;margin-bottom:12px}
    .bill-to{margin-bottom:36px}
    .label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-top:24px}
    th{text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;padding:8px 6px;border-bottom:2px solid #e2e8f0}
    td{padding:10px 6px;border-bottom:1px solid #f1f5f9;vertical-align:top}
    .totals-table{margin-left:auto;width:280px;margin-top:8px}
    .totals-table td{border:none;padding:3px 6px}
    .grand-total td{font-size:16px;font-weight:800;border-top:2px solid #1a1a1a;padding-top:10px!important}
    .footer{margin-top:48px;padding-top:20px;border-top:1px solid #e2e8f0;color:#64748b;font-size:11px;line-height:1.6}
  </style></head><body>
  <div class="header">
    <div>
      <div class="company-name">${p.company_name || 'Bedrijfsnaam'}</div>
      <div class="meta">${p.address || ''}${p.address ? '<br>' : ''}${[p.postal_code, p.city].filter(Boolean).join(' ')}${p.city ? '<br>' : ''}${p.kvk ? 'KvK: ' + p.kvk + '<br>' : ''}${p.btw_number ? 'BTW: ' + p.btw_number + '<br>' : ''}${p.iban ? 'IBAN: ' + p.iban : ''}</div>
    </div>
    <div>
      <div class="invoice-title">FACTUUR</div>
      <div class="meta" style="text-align:right;line-height:1.9"><b>Nummer:</b> ${invoice.invoice_number}<br><b>Datum:</b> ${new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}<br>${invoice.due_date ? '<b>Vervaldatum:</b> ' + new Date(invoice.due_date).toLocaleDateString('nl-NL') : ''}</div>
    </div>
  </div>
  <div class="bill-to">
    <div class="label">Factuur aan</div>
    <div style="font-weight:700;font-size:14px">${clientName}</div>
    <div class="meta">${clientAddr}${client.email ? '<br>' + client.email : ''}${client.kvk ? '<br>KvK: ' + client.kvk : ''}${client.btw_number ? '<br>BTW: ' + client.btw_number : ''}</div>
  </div>
  <table><thead><tr><th>Omschrijving</th><th style="text-align:right">Aantal</th><th style="text-align:right">Prijs</th><th style="text-align:right">BTW</th><th style="text-align:right">Bedrag</th></tr></thead><tbody>${linesHtml}</tbody></table>
  <table class="totals-table">
    <tr><td colspan="4" style="text-align:right;color:#64748b">Subtotaal excl. BTW</td><td style="text-align:right;color:#64748b">€ ${fmtN(totals.exclBtw)}</td></tr>
    ${btwRows}
    <tr class="grand-total"><td colspan="4" style="text-align:right">Totaal incl. BTW</td><td style="text-align:right">€ ${fmtN(totals.inclBtw)}</td></tr>
  </table>
  ${invoice.notes ? `<div style="margin-top:32px;padding:16px;background:#f8fafc;border-radius:8px"><div class="label">Opmerkingen</div><div style="margin-top:4px">${invoice.notes}</div></div>` : ''}
  <div class="footer">Gelieve € ${fmtN(totals.inclBtw)} over te maken op <b>${p.iban || '—'}</b> o.v.v. factuurnummer <b>${invoice.invoice_number}</b>.</div>
  </body></html>`;

  // Render off-screen
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale:2, useCORS:true, logging:false, backgroundColor:'#fff' });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;
    let posY = 0;
    while (posY < imgH) {
      if (posY > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, -posY, pageW, imgH);
      posY += pageH;
    }
    return pdf.output('datauristring').split(',')[1]; // base64 only
  } finally {
    document.body.removeChild(container);
  }
}
