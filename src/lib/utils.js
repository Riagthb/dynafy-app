// ─── PURE UTILS ────────────────────────────────────────────────
// Geëxtraheerd uit App.jsx tijdens Fase-1 refactor (2026-05-27).
// Geen React state, geen DOM-side-effects — puur dataverwerking.

// isCountableIncome / isCountableExpense: skip internal transfers bij
// inkomsten/uitgaven-aggregaties. Op display-listen (af/bij overzicht,
// drawer detail) tonen we transfers wel maar met afwijkende styling
// (grijs + Repeat-icon ipv groen/rood). Truthy-check op !tx.is_transfer
// vangt zowel false als undefined (mock-data).
export const isCountableIncome  = (tx) => tx.amount > 0 && !tx.is_transfer;
export const isCountableExpense = (tx) => tx.amount < 0 && !tx.is_transfer;

// detectRecurring: analyseert transacties en groepeert herhalende kosten.
// Pass 1 groepeert op counterparty (meest betrouwbaar), pass 2 op description
// voor de overgebleven txs. Median-based filter weert eenmalige uitschieters.
// Recency-filter laat alleen items zien die in de laatste complete maand of
// recenter zijn betaald.
export function detectRecurring(transactions) {
  const results = [];
  const usedTxIds = new Set(); // track which txs are already in a group

  // Determine the 2 most recent COMPLETE calendar months in the dataset.
  // The current (latest) month may be incomplete, so we skip it and look at
  // the previous full month + the one before that as the recency window.
  const latestDate = transactions.reduce((best, tx) => tx.date > best ? tx.date : best, "");
  const latestMonth = latestDate.slice(0, 7); // e.g. "2026-03" — may be incomplete
  const [ly, lm] = latestMonth.split("-").map(Number);
  const m1 = lm - 1 > 0 ? lm - 1 : 12;
  const y1 = lm - 1 > 0 ? ly : ly - 1;
  const prevMonth = `${y1}-${String(m1).padStart(2, "0")}`; // e.g. "2026-02" (last complete month)

  // ── Pass 1: Group by counterparty (most reliable) ──────────────
  const byCounterparty = {};
  transactions.filter(tx => isCountableExpense(tx) && tx.category !== "income").forEach(tx => {
    if (!tx.counterparty || tx.counterparty.length < 3) return;
    const key = tx.counterparty.trim().toLowerCase();
    if (!byCounterparty[key]) byCounterparty[key] = [];
    byCounterparty[key].push(tx);
  });

  Object.entries(byCounterparty).forEach(([key, txs]) => {
    const allAmounts = txs.map(tx => Math.abs(tx.amount)).sort((a, b) => a - b);
    const mid = Math.floor(allAmounts.length / 2);
    const median = allAmounts.length % 2 !== 0
      ? allAmounts[mid]
      : (allAmounts[mid - 1] + allAmounts[mid]) / 2;
    if (median > 5000) return;
    const coreTxs = txs.filter(tx => Math.abs(Math.abs(tx.amount) - median) / median < 0.30);
    const months = new Set(coreTxs.map(tx => tx.date.slice(0, 7)));
    if (months.size < 2) return;
    const coreAmounts = coreTxs.map(tx => Math.abs(tx.amount));
    const avgAmount = coreAmounts.reduce((s, a) => s + a, 0) / coreAmounts.length;

    coreTxs.forEach(tx => usedTxIds.add(tx.id));
    results.push({
      key: `cp:${key}`,
      label: coreTxs.find(tx => tx.description?.toLowerCase().includes("huur"))?.description.trim()
        || coreTxs[0].description.trim(),
      counterparty: coreTxs[0].counterparty,
      avgAmount: parseFloat(avgAmount.toFixed(2)),
      count: coreTxs.length,
      months: [...months].sort(),
      lastDate: coreTxs.map(tx => tx.date).sort().pop(),
      category: coreTxs[0].category,
      txIds: coreTxs.map(tx => tx.id),
    });
  });

  // ── Pass 2: Group remaining txs by description ─────────────────
  const byDescription = {};
  transactions.filter(tx => isCountableExpense(tx) && tx.category !== "income" && !usedTxIds.has(tx.id)).forEach(tx => {
    const key = tx.description.trim().toLowerCase();
    if (!byDescription[key]) byDescription[key] = [];
    byDescription[key].push(tx);
  });

  Object.entries(byDescription).forEach(([key, txs]) => {
    const allAmounts = txs.map(tx => Math.abs(tx.amount)).sort((a, b) => a - b);
    const mid = Math.floor(allAmounts.length / 2);
    const median = allAmounts.length % 2 !== 0
      ? allAmounts[mid]
      : (allAmounts[mid - 1] + allAmounts[mid]) / 2;
    if (median > 5000) return;
    const coreTxs = txs.filter(tx => Math.abs(Math.abs(tx.amount) - median) / median < 0.30);
    const months = new Set(coreTxs.map(tx => tx.date.slice(0, 7)));
    if (months.size < 2) return;
    const coreAmounts = coreTxs.map(tx => Math.abs(tx.amount));
    const avgAmount = coreAmounts.reduce((s, a) => s + a, 0) / coreAmounts.length;

    const cpMap = {};
    coreTxs.forEach(tx => { if (tx.counterparty) cpMap[tx.counterparty] = (cpMap[tx.counterparty]||0)+1; });
    const topCp = Object.entries(cpMap).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;

    results.push({
      key: `desc:${key}`,
      label: coreTxs[0].description.trim(),
      counterparty: topCp,
      avgAmount: parseFloat(avgAmount.toFixed(2)),
      count: coreTxs.length,
      months: [...months].sort(),
      lastDate: coreTxs.map(tx => tx.date).sort().pop(),
      category: coreTxs[0].category,
      txIds: coreTxs.map(tx => tx.id),
    });
  });

  // ── Recency filter ────────────────────────────────────────────────────────
  // Current month is skipped (may be incomplete). Item must have been paid in
  // the last COMPLETE month (prevMonth) or later to be considered active.
  return results
    .filter(r => r.lastDate.slice(0, 7) >= prevMonth)
    .sort((a, b) => b.avgAmount - a.avgAmount);
}

// filterByAccount: filtert transacties op geselecteerd rekening-account.
// Probeert 3 keys want oude mock-data + nieuwe DB-rijen gebruiken verschillende
// veld-namen (account = name-match, account_id / accountId = id-match).
export function filterByAccount(transactions, accounts, selectedAccount) {
  if (!selectedAccount) return transactions;
  const acc = accounts.find(a => a.id === selectedAccount);
  if (!acc) return transactions;
  return transactions.filter(tx =>
    tx.account === acc.name ||
    tx.account_id === selectedAccount ||
    tx.accountId === selectedAccount
  );
}

// invoiceTotals: berekent excl-btw, btw per percentage, en incl-btw vanuit
// invoice.lines. Gebruikt in InvoiceForm, MailPopup, FacturenView, PDF-render.
export function invoiceTotals(invoice) {
  const lines = invoice.lines || [];
  const btwGroups = {};
  let exclBtw = 0;
  lines.forEach(l => {
    const lineExcl = parseFloat(l.quantity || 0) * parseFloat(l.unit_price || 0);
    exclBtw += lineExcl;
    const pct = String(parseFloat(l.btw_percentage || 0));
    btwGroups[pct] = (btwGroups[pct] || 0) + lineExcl * parseFloat(l.btw_percentage || 0) / 100;
  });
  const btw = Object.values(btwGroups).reduce((s, v) => s + v, 0);
  return { exclBtw, btw, inclBtw: exclBtw + btw, btwGroups };
}
