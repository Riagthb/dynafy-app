
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, AreaChart, Area
} from "recharts";
import { Upload, Home, List, TrendingUp, Lightbulb, Settings,
  Plus, X, ChevronDown, ArrowUpRight, ArrowDownRight, Wallet,
  RefreshCw, BarChart2, Globe, Check, Edit2, Trash2, AlertCircle,
  PiggyBank, Target, Zap, Moon, Sun, ChevronRight, Building2,
  CreditCard, DollarSign, Activity, Sliders, Search, Tag, ChevronUp,
  Repeat, Bell, BellOff, Download, FileText, FileSpreadsheet,
  Calendar, Clock, Eye, EyeOff, Filter, ChevronLeft } from "lucide-react";

// ─── TRANSLATIONS ─────────────────────────────────────────────
const T = {
  en: {
    appName: "Dynafy",
    tagline: "Your personal financial assistant",
    nav: { dashboard: "Dashboard", transactions: "Transactions", investments: "Investments", insights: "Insights", settings: "Settings" },
    dashboard: {
      netWorth: "Total Balance", totalIncome: "Total Income", totalExpenses: "Total Expenses",
      monthlyBalance: "Monthly Balance", expensesByCategory: "Expenses by Category",
      incomeVsExpenses: "Income vs Expenses", spendingTrend: "Spending Trend",
      thisMonth: "This month", allTime: "All time", vsLastMonth: "vs last month",
    },
    transactions: {
      title: "Transactions", uploadCSV: "Upload CSV", addManual: "Add Manual",
      search: "Search transactions...", filter: "Filter", noTransactions: "No transactions yet",
      uploadPrompt: "Upload your bank CSV to get started",
      columns: { date: "Date", description: "Description", category: "Category", account: "Account", amount: "Amount" },
    },
    investments: {
      title: "Investments", addInvestment: "Add Investment", portfolio: "Portfolio Value",
      totalInvested: "Total Invested", totalProfit: "Total Profit", roi: "ROI",
      allocation: "Allocation", noInvestments: "No investments yet",
      form: { name: "Name", type: "Type", invested: "Invested (€)", currentValue: "Current Value (€)", add: "Add", cancel: "Cancel" },
      types: { crypto: "Crypto", stocks: "Stocks", real_estate: "Real Estate", metals: "Precious Metals", savings: "Savings", other: "Other" },
    },
    insights: {
      title: "AI Insights", generatingInsights: "Generating insights...",
      budgetSuggestions: "Budget Suggestions", anomalies: "Anomaly Detection",
      savingTip: "Saving Opportunity",
    },
    settings: {
      title: "Settings", language: "Language", currency: "Currency",
      categories: "Categories", accounts: "Bank Accounts", addCategory: "Add Category",
      addAccount: "Add Account", theme: "Theme", dark: "Dark", light: "Light",
    },
    categories: {
      groceries: "Groceries", fixed_expenses: "Fixed Expenses", eating_out: "Eating Out",
      shopping: "Shopping", transport: "Transport", subscriptions: "Subscriptions",
      income: "Income", gifts: "Gifts", debt: "Debt / Loans", savings: "Savings",
      investments: "Investments", other: "Other", entertainment: "Entertainment",
      health: "Health", insurance: "Insurance", taxes: "Taxes",
      education: "Education", home: "Housing", travel: "Travel", sports: "Sports",
    },
    recurring: {
      title: "Monthly Liabilities", subtitle: "Auto-detected + manually added · recurring monthly",
      addBtn: "Add liability", totalMonth: "Total per month", totalYear: "Total per year",
      count: "Number of liabilities", withReminder: "With reminder",
      manual: "Manual", seen: "× seen · last", removeTitle: "Remove from liabilities",
      removeNote: "Removing from this list does not delete the transaction — only the recurring flag",
      searchMode: "Search transactions", manualMode: "Add manually",
    },
    calibrate: {
      title: "Categorize", subtitle: "Assign categories to recurring transactions. The rule applies to all transactions with that description.",
      unique: "Unique descriptions", total: "Total transactions", uncategorized: "Still 'Other'",
      manage: "Manage categories", search: "Search by description...", onlyOther: "Only 'Other'",
      apply: "Apply", applyAll: "Apply all", newCat: "New category...", addCat: "Add",
      headers: ["Description", "Counterparty", "Count", "Category", ""],
    },
    overzicht: {
      allAccounts: "All accounts", perMonth: "Per month", months3: "3 months", months6: "6 months",
      perYear: "Per year", custom: "Custom", transactions: "transactions", cumulative: "cumulative",
    },
    goals: {
      savingsTitle: "Saving Goals", fireTitle: "FIRE", budgetTitle: "Budget", debtTitle: "Debt",
      newGoal: "+ New goal", noGoals: "No saving goals yet. Add your first goal →",
      monthly: "per month", months: "months", deadline: "Deadline",
    },
    general: {
      income: "Income", expenses: "Expenses", balance: "Balance", savings: "Savings rate",
      apply: "Apply", cancel: "Cancel", save: "Save", delete: "Delete", edit: "Edit",
      add: "Add", close: "Close", confirm: "Confirm", back: "Back",
      vsLastMonth: "vs last month", perMonth: "per month", perYear: "per year",
      positive: "positive", negative: "negative", cumulative: "cumulative",
      done: "Done", later: "Later", search: "Search",
    },
  },
  nl: {
    appName: "Dynafy",
    tagline: "Jouw persoonlijke financiële assistent",
    nav: { dashboard: "Dashboard", transactions: "Transacties", investments: "Investeringen", insights: "Inzichten", settings: "Instellingen" },
    dashboard: {
      netWorth: "Totaal Saldo", totalIncome: "Totale Inkomsten", totalExpenses: "Totale Uitgaven",
      monthlyBalance: "Maandelijks Saldo", expensesByCategory: "Uitgaven per Categorie",
      incomeVsExpenses: "Inkomsten vs Uitgaven", spendingTrend: "Uitgaventrend",
      thisMonth: "Deze maand", allTime: "Altijd", vsLastMonth: "vs vorige maand",
    },
    transactions: {
      title: "Transacties", uploadCSV: "CSV Uploaden", addManual: "Handmatig Toevoegen",
      search: "Zoek transacties...", filter: "Filter", noTransactions: "Nog geen transacties",
      uploadPrompt: "Upload je bank CSV om te beginnen",
      columns: { date: "Datum", description: "Omschrijving", category: "Categorie", account: "Rekening", amount: "Bedrag" },
    },
    investments: {
      title: "Investeringen", addInvestment: "Investering Toevoegen", portfolio: "Portefeuillewaarde",
      totalInvested: "Totaal Geïnvesteerd", totalProfit: "Totale Winst", roi: "ROI",
      allocation: "Verdeling", noInvestments: "Nog geen investeringen",
      form: { name: "Naam", type: "Type", invested: "Geïnvesteerd (€)", currentValue: "Huidige Waarde (€)", add: "Toevoegen", cancel: "Annuleren" },
      types: { crypto: "Crypto", stocks: "Aandelen", real_estate: "Vastgoed", metals: "Edelmetalen", savings: "Spaargeld", other: "Overig" },
    },
    insights: {
      title: "AI Inzichten", generatingInsights: "Inzichten genereren...",
      budgetSuggestions: "Budgetaanbevelingen", anomalies: "Anomalie Detectie",
      savingTip: "Spaaropportuniteit",
    },
    settings: {
      title: "Instellingen", language: "Taal", currency: "Valuta",
      categories: "Categorieën", accounts: "Rekeningen", addCategory: "Categorie Toevoegen",
      addAccount: "Rekening Toevoegen", theme: "Thema", dark: "Donker", light: "Licht",
    },
    categories: {
      groceries: "Boodschappen", fixed_expenses: "Vaste Lasten", eating_out: "Uit Eten",
      shopping: "Winkelen", transport: "Vervoer", subscriptions: "Abonnementen",
      income: "Inkomen", gifts: "Cadeaus", debt: "Schulden", savings: "Spaargeld",
      investments: "Investeringen", other: "Overig", entertainment: "Uitgaan",
      health: "Gezondheid", insurance: "Verzekering", taxes: "Belasting",
      education: "Opleiding", home: "Wonen", travel: "Reizen", sports: "Sport",
    },
    recurring: {
      title: "Vaste Lasten", subtitle: "Automatisch herkend + handmatig toegevoegd · maandelijks terugkerend",
      addBtn: "Vaste last toevoegen", totalMonth: "Totaal per maand", totalYear: "Totaal per jaar",
      count: "Aantal vaste lasten", withReminder: "Met herinnering",
      manual: "Handmatig", seen: "× gezien · laatste", removeTitle: "Verwijder uit vaste lasten",
      removeNote: "Verwijderen uit dit overzicht verwijdert de transactie niet — alleen de markering als vaste last",
      searchMode: "Zoek in transacties", manualMode: "Handmatig aanmaken",
    },
    calibrate: {
      title: "Categoriseren", subtitle: "Wijs categorieën toe aan veelvoorkomende transacties. De regel geldt voor alle transacties met die omschrijving.",
      unique: "Unieke omschrijvingen", total: "Totaal transacties", uncategorized: "Nog 'Overig'",
      manage: "Categorieën beheren", search: "Zoek op omschrijving...", onlyOther: "Alleen 'Overig'",
      apply: "Toepassen", applyAll: "Alles toepassen", newCat: "Nieuwe categorie...", addCat: "Toevoegen",
      headers: ["Omschrijving", "Tegenpartij", "Aantal", "Categorie", ""],
    },
    overzicht: {
      allAccounts: "Alle rekeningen", perMonth: "Per maand", months3: "3 maanden", months6: "6 maanden",
      perYear: "Per jaar", custom: "Aangepast", transactions: "transacties", cumulative: "cumulatief",
    },
    goals: {
      savingsTitle: "Spaardoelen", fireTitle: "FIRE", budgetTitle: "Budgetteren", debtTitle: "Schulden",
      newGoal: "+ Nieuw doel", noGoals: "Nog geen spaardoelen. Voeg je eerste doel toe →",
      monthly: "per maand", months: "maanden", deadline: "Deadline",
    },
    general: {
      income: "Inkomen", expenses: "Uitgaven", balance: "Saldo", savings: "Spaarquote",
      apply: "Toepassen", cancel: "Annuleren", save: "Opslaan", delete: "Verwijderen", edit: "Bewerken",
      add: "Toevoegen", close: "Sluiten", confirm: "Bevestigen", back: "Terug",
      vsLastMonth: "vs vorige maand", perMonth: "per maand", perYear: "per jaar",
      positive: "positief", negative: "negatief", cumulative: "cumulatief",
      done: "Klaar", later: "Later", search: "Zoeken",
    },
  }
};

// ─── MOCK DATA ─────────────────────────────────────────────────
const MOCK_TRANSACTIONS = [
  { id: 1, date: "2024-03-15", description: "Albert Heijn", amount: -87.43, category: "groceries", account: "ING Betaalrekening" },
  { id: 2, date: "2024-03-14", description: "Salary March", amount: 3800.00, category: "income", account: "ING Betaalrekening" },
  { id: 3, date: "2024-03-13", description: "Spotify Premium", amount: -10.99, category: "subscriptions", account: "ABN AMRO" },
  { id: 4, date: "2024-03-12", description: "Cafe Restaurant Blauw", amount: -45.20, category: "eating_out", account: "ING Betaalrekening" },
  { id: 5, date: "2024-03-11", description: "NS Treinkaartje", amount: -12.80, category: "transport", account: "ABN AMRO" },
  { id: 6, date: "2024-03-10", description: "Huur Maart", amount: -1200.00, category: "fixed_expenses", account: "ING Betaalrekening" },
  { id: 7, date: "2024-03-09", description: "Zara Online", amount: -89.95, category: "shopping", account: "ABN AMRO" },
  { id: 8, date: "2024-03-08", description: "Netflix", amount: -15.99, category: "subscriptions", account: "ABN AMRO" },
  { id: 9, date: "2024-03-07", description: "Jumbo Supermarkt", amount: -63.18, category: "groceries", account: "ING Betaalrekening" },
  { id: 10, date: "2024-03-06", description: "Thuisbezorgd", amount: -32.50, category: "eating_out", account: "ING Betaalrekening" },
  { id: 11, date: "2024-03-05", description: "Freelance Payment - Klant B", amount: 950.00, category: "income", account: "ING Betaalrekening" },
  { id: 12, date: "2024-03-04", description: "Energie Rekening", amount: -145.00, category: "fixed_expenses", account: "ABN AMRO" },
  { id: 13, date: "2024-03-03", description: "IKEA Amsterdam", amount: -234.50, category: "shopping", account: "ABN AMRO" },
  { id: 14, date: "2024-03-02", description: "GVB Maandkaart", amount: -100.00, category: "transport", account: "ING Betaalrekening" },
  { id: 15, date: "2024-03-01", description: "Spaartransfer", amount: -300.00, category: "savings", account: "ING Betaalrekening" },
];

const MOCK_MONTHLY = [
  { month: "Oct", income: 4200, expenses: 2800 },
  { month: "Nov", income: 3900, expenses: 3100 },
  { month: "Dec", income: 5200, expenses: 4100 },
  { month: "Jan", income: 4100, expenses: 2900 },
  { month: "Feb", income: 4750, expenses: 3200 },
  { month: "Mar", income: 4750, expenses: 2336 },
];

const MOCK_TREND = [
  { week: "W1", amount: 580 },
  { week: "W2", amount: 420 },
  { week: "W3", amount: 750 },
  { week: "W4", amount: 390 },
  { week: "W5", amount: 610 },
  { week: "W6", amount: 280 },
  { week: "W7", amount: 490 },
  { week: "W8", amount: 820 },
];

const MOCK_INVESTMENTS = [
  { id: 1, name: "Bitcoin",  type: "crypto",  invested: 2000, currentValue: 3240, ticker: "bitcoin",  units: 0.04 },
  { id: 2, name: "VWCE ETF", type: "stocks",  invested: 5000, currentValue: 6180, ticker: "vwce",     units: 24 },
  { id: 3, name: "Tesla",    type: "stocks",  invested: 800,  currentValue: 620,  ticker: "tsla",     units: 5 },
  { id: 4, name: "Ethereum", type: "crypto",  invested: 1200, currentValue: 1580, ticker: "ethereum", units: 0.8 },
];

const COINGECKO_IDS = {
  bitcoin: "bitcoin", btc: "bitcoin",
  ethereum: "ethereum", eth: "ethereum",
  solana: "solana", sol: "solana",
  cardano: "cardano", ada: "cardano",
  xrp: "ripple", ripple: "ripple",
  dogecoin: "dogecoin", doge: "dogecoin",
  bnb: "binancecoin", binance: "binancecoin",
  litecoin: "litecoin", ltc: "litecoin",
  polkadot: "polkadot", dot: "polkadot",
  chainlink: "chainlink", link: "chainlink",
  avalanche: "avalanche-2", avax: "avalanche-2",
  polygon: "matic-network", matic: "matic-network",
};

const CATEGORY_COLORS = {
  groceries: "#4f8ef7", fixed_expenses: "#a855f7", eating_out: "#f59e0b",
  shopping: "#ec4899", transport: "#14b8a6", subscriptions: "#6366f1",
  income: "#22c55e", gifts: "#f97316", debt: "#ef4444", savings: "#10b981",
  investments: "#8b5cf6", other: "#64748b",
};

const INVESTMENT_COLORS = { crypto: "#f59e0b", stocks: "#4f8ef7", real_estate: "#10b981", savings: "#22c55e", metals: "#d4af37", other: "#a855f7" };
const FINNHUB_API_KEY = "d0ks6qhr01qjh8sktm10d0ks6qhr01qjh8sktm1g"; // vervang met jouw eigen key

// ─── HELPERS ───────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
const fmtShort = (n) => `€${Math.abs(n).toFixed(0)}`;
// ─── ROBUST CSV PARSER ────────────────────────────────────────
const parseCSVLine = (line, delim) => {
  const result = [];
  let cur = "", inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === delim && !inQuote) {
      result.push(cur.trim()); cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
};

const parseEuroAmount = (s) => {
  if (!s) return null;
  // Remove currency symbols and spaces
  let clean = s.replace(/[€$£\s]/g, "").trim();
  // Determine sign from prefix/suffix
  const negative = clean.startsWith("-") || clean.endsWith("-") ||
    /af$/i.test(s) || /debit/i.test(s);
  clean = clean.replace(/[+\-]/g, "");
  // European format: "1.234,56" → "1234.56"  or  "1,234.56" → "1234.56"
  if (/^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(clean)) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(clean)) {
    clean = clean.replace(/,/g, "");
  } else {
    // fallback: just replace comma decimal
    clean = clean.replace(/,/g, ".");
  }
  const n = parseFloat(clean);
  if (isNaN(n)) return null;
  return negative ? -Math.abs(n) : Math.abs(n);
};

const normalizeDate = (s) => {
  if (!s) return null;
  s = s.trim();
  // YYYYMMDD
  if (/^\d{8}$/.test(s)) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`;
  // YYYY-MM-DD already fine
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
};

const detectColumns = (headers) => {
  const raw = headers.map(x => x.trim());
  const h = raw.map(x => x.toLowerCase().replace(/[^a-z]/g, ""));

  const find = (...keys) => {
    for (const k of keys) {
      const i = h.findIndex(x => x === k || x.startsWith(k));
      if (i >= 0) return i;
    }
    // Fallback: partial match
    for (const k of keys) {
      const i = h.findIndex(x => x.includes(k));
      if (i >= 0) return i;
    }
    return -1;
  };

  // ING-specific: detect "Naam / Omschrijving" as counterparty, "Mededelingen" as description
  const isING = h.some(x => x.includes("medede")) || raw.some(x => /naam.*omschrijving/i.test(x));

  return {
    date:        find("date","datum","dag"),
    amount:      find("amount","bedrag","betrag"),
    desc:        isING
                   ? find("medede","omschrijving","description","memo","subject","paymentdesc")
                   : find("description","medede","omschrijving","paymentdesc","memo","subject"),
    credit:      find("bij","credit","inkomst"),
    debit:       find("af","debit","uitgave"),
    // "name" = actual person/company name (NOT the IBAN "counterparty" column)
    name:        find("name","naam","tenaamstelling","tegenpartij","begunstigde","naambegunstigde"),
    // "ibanFrom" = IBAN of counterparty (Bunq calls this "Counterparty", ING calls it "Tegenrekening")
    ibanFrom:    find("counterparty","tegenrekening","tegenpartijiban","iban","rekeningnummer","accountnumber","rekening"),
    paymentType: find("mutatiesoort","soortbetaling","transactietype","mutatiecode","code","soort"),
  };
};

const parseCSVTransactions = (text, accountName = "Imported") => {
  // Normalize line endings
  const rawLines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (rawLines.length < 2) return [];

  // Detect delimiter by counting in header
  const sampleLine = rawLines[0];
  const delim = (sampleLine.split(";").length > sampleLine.split(",").length) ? ";" : ",";

  const headers = parseCSVLine(rawLines[0], delim);
  const cols = detectColumns(headers);

  const results = [];
  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;
    const row = parseCSVLine(line, delim);
    if (row.length < 2) continue;

    // --- DATE ---
    const rawDate = cols.date >= 0 ? row[cols.date] : row[0];
    const date = normalizeDate(rawDate) || new Date().toISOString().slice(0, 10);

    // --- AMOUNT ---
    let amount = null;
    if (cols.amount >= 0) {
      amount = parseEuroAmount(row[cols.amount]);
    }
    // ING style: separate Af/Bij columns
    if (amount === null && cols.credit >= 0 && cols.debit >= 0) {
      const cr = parseEuroAmount(row[cols.credit]);
      const db = parseEuroAmount(row[cols.debit]);
      if (cr && cr !== 0) amount = Math.abs(cr);
      else if (db && db !== 0) amount = -Math.abs(db);
    }
    // ING style: single amount column + "Af Bij" direction column
    if (amount === null) {
      // Try to find any column with a parseable number
      for (let c = 0; c < row.length; c++) {
        const v = parseEuroAmount(row[c]);
        if (v !== null && v !== 0) { amount = v; break; }
      }
    }
    if (amount === null || amount === 0) continue; // skip rows with no valid amount

    // ING has "Af Bij" column: "Af" = debit (negative), "Bij" = credit (positive)
    const afBijCol = headers.findIndex(h => /af.?bij|debet.?credit/i.test(h));
    if (afBijCol >= 0 && row[afBijCol]) {
      const dir = row[afBijCol].toLowerCase().trim();
      if (dir === "af" || dir === "debet" || dir === "d") amount = -Math.abs(amount);
      else if (dir === "bij" || dir === "credit" || dir === "c") amount = Math.abs(amount);
    }

    // --- DESCRIPTION ---
    let desc = "";
    if (cols.desc >= 0 && row[cols.desc]) {
      desc = row[cols.desc].trim();
    }
    // If description is empty, fall back to Name column (Bunq style)
    if (!desc && cols.name >= 0 && row[cols.name]) {
      desc = row[cols.name].trim();
    }
    // Last resort: pick longest non-IBAN, non-date, non-name field
    if (!desc) {
      desc = row.reduce((best, cell, idx) => {
        if (idx === cols.ibanFrom) return best;
        const c = cell.trim();
        if (/^[A-Z]{2}\d{2}[A-Z0-9]{4,}/.test(c.replace(/\s/g, ""))) return best;
        if (/^\d{6,8}$/.test(c)) return best;
        return c.length > best.length ? c : best;
      }, "");
    }
    if (!desc) desc = "Unknown";

    // --- COUNTERPARTY NAME ---
    let counterparty = "";
    if (cols.name >= 0 && row[cols.name]) {
      const n = row[cols.name].trim();
      const isIBAN = /^[A-Z]{2}\d{2}[A-Z0-9]{4,}/.test(n.replace(/\s/g, ""));
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(n);
      // Show as counterparty if it's a real name AND different from description
      if (n && !isIBAN && !isDate && n.toLowerCase() !== desc.toLowerCase() && n.length > 1) {
        counterparty = n;
      }
    }
    // Fallback: try to extract name from description patterns like "Naam: X"
    if (!counterparty) {
      const naamMatch = desc.match(/[Nn]aam[:\s]+([A-Za-z][^/|]{2,30})/);
      if (naamMatch) counterparty = naamMatch[1].trim();
    }

    // --- PAYMENT TYPE ---
    let paymentType = "";
    if (cols.paymentType >= 0 && row[cols.paymentType]) {
      paymentType = row[cols.paymentType].trim();
    }
    // Normalize common Dutch payment type codes
    const ptMap = {
      "gt": "Overboeking", "ba": "PIN", "id": "iDEAL",
      "ac": "Incasso", "sb": "SEPA", "ic": "Incasso",
      "div": "Diversen", "gm": "Geldautomaat",
      "betaalautomaat": "PIN", "online banking": "Overboeking",
    };
    const ptLower = paymentType.toLowerCase();
    paymentType = ptMap[ptLower] || paymentType;

    const category = guessCategory(desc, amount, counterparty);
    results.push({
      id: Date.now() + i + Math.random(),
      date, description: desc, amount, category,
      account: accountName,
      counterparty: counterparty || null,
      paymentType: paymentType || null,
    });
  }
  return results;
};

const guessCategory = (desc, amount, counterparty = "") => {
  if (amount > 0) return "income";
  const d = (desc + " " + counterparty).toLowerCase();
  if (/albert|jumbo|lidl|aldi|supermarkt|ah\b|dirk|spar|hoogvliet|picnic/.test(d)) return "groceries";
  if (/spotify|netflix|apple|adobe|subscription|disney\+|videoland|prime/.test(d)) return "subscriptions";
  if (/restaurant|cafe|eten|thuisbezorgd|uber eats|mcdonalds|dominos|takeaway|lunch/.test(d)) return "eating_out";
  if (/ns\b|trein|gvb|ov-chip|transport|arriva|connexxion|flixbus|ryanair|klm/.test(d)) return "transport";
  if (/huur|rent|energie|gas|water|internet|ziggo|kpn|vodafone|t-mobile|nuon|vattenfall/.test(d)) return "fixed_expenses";
  if (/zara|h&m|ikea|shop|bol\.com|zalando|coolblue|mediamarkt|amazon/.test(d)) return "shopping";
  if (/spaar|saving/.test(d)) return "savings";
  if (/gym|sportschool|fitness/.test(d)) return "other";
  return "other";
};

// ─── STYLE CONSTANTS ─────────────────────────────────────────
const S = {
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "20px 24px",
    backdropFilter: "blur(12px)",
  },
  cardHover: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(79,142,247,0.25)",
  },
};

// Theme-aware card style
const card = (isDark) => ({
  background: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e6ed",
  borderRadius: 16,
  padding: "20px 24px",
  boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.25)" : "0 1px 8px rgba(15,23,42,0.06)",
  transition: "transform 0.18s ease, box-shadow 0.18s ease",
});


/* ─── PILL BUTTON STYLE ──────────────────────────────────────── */
const pillBtn = (color1 = "#4f8ef7", color2 = "#6366f1") => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "12px 22px",
  background: `linear-gradient(135deg, ${color1}, ${color2})`,
  border: "none",
  borderRadius: 50,
  color: "#fff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "0.01em",
  boxShadow: `0 4px 16px ${color1}40`,
  transition: "all 0.18s",
  flexShrink: 0,
});

const pillBtnGhost = (isDark = true) => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "12px 22px",
  background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
  border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e6ed",
  borderRadius: 50,
  color: isDark ? "#94a3b8" : "#475569",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  transition: "all 0.18s",
  flexShrink: 0,
});

// ─── MONTH LABEL HELPERS ─────────────────────────────────────
const fmtMonth = (ym, locale = "nl-NL") => {
  if (!ym) return "";
  const d = new Date(ym + "-01");
  return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
};
const fmtMonthShort = (ym, locale = "nl-NL") => {
  if (!ym) return "";
  const d = new Date(ym + "-01");
  return d.toLocaleDateString(locale, { month: "short" });
};




// ─── TRANSACTION DRAWER ────────────────────────────────────────
function NewCatInline({ onAdd, isDark, C }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const inputRef = useRef();

  const submit = () => {
    const trimmed = val.trim().toLowerCase().replace(/\s+/g, "_");
    if (!trimmed) return;
    onAdd(trimmed);
    setVal(""); setOpen(false);
  };

  if (!open) return (
    <button onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
      style={{ padding: "5px 11px", borderRadius: 20, border: `1px dashed ${isDark ? "rgba(255,255,255,0.2)" : "#cbd5e1"}`, background: "transparent", color: isDark ? "#64748b" : "#94a3b8", fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.12s" }}>
      <Plus size={11} /> Nieuwe categorie
    </button>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 6px 3px 10px", borderRadius: 20, border: "1px solid rgba(79,142,247,0.5)", background: "rgba(79,142,247,0.08)" }}>
      <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") { setOpen(false); setVal(""); } }}
        placeholder="naam..."
        style={{ border: "none", background: "transparent", outline: "none", fontSize: 11, color: isDark ? "#f1f5f9" : "#0f172a", width: 90, fontWeight: 500 }} />
      <button onClick={submit} style={{ width: 20, height: 20, borderRadius: 10, background: "#4f8ef7", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Check size={11} color="#fff" />
      </button>
      <button onClick={() => { setOpen(false); setVal(""); }} style={{ width: 20, height: 20, borderRadius: 10, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isDark ? "#64748b" : "#94a3b8", flexShrink: 0 }}>
        <X size={11} />
      </button>
    </div>
  );
}

function TransactionDrawer({ title, subtitle, transactions, allTransactions, isDark, onClose, onCategorize }) {
  const C = {
    text: isDark ? "#f1f5f9" : "#0f172a",
    sub: isDark ? "#94a3b8" : "#475569",
    muted: isDark ? "#64748b" : "#64748b",
    border: isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed",
    rowBg: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    bg: isDark ? "#111827" : "#ffffff",
  };

  const [openCatPicker, setOpenCatPicker] = useState(null);
  const [viewMode, setViewMode] = useState("grouped");
  const [justCategorized, setJustCategorized] = useState({});
  const [catOverrides, setCatOverrides] = useState({});
  const [fuzzyKeys, setFuzzyKeys] = useState({}); // descKey → true if fuzzy enabled

  const totalIncome = transactions.filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const totalExpenses = transactions.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);

  // Count how many transactions in the FULL dataset match (exact or fuzzy)
  const getMatchCount = (descKey, useFuzzy) => {
    if (!allTransactions) return null;
    return allTransactions.filter(tx => {
      const txKey = tx.description.trim().toLowerCase();
      if (txKey === descKey) return true;
      if (useFuzzy && descKey.length >= 6 && txKey.slice(0, 8) === descKey.slice(0, 8)) return true;
      return false;
    }).length;
  };

  // Group transactions by normalized description
  const groups = useMemo(() => {
    const map = {};
    [...transactions].sort((a, b) => b.date.localeCompare(a.date)).forEach(tx => {
      const key = tx.description.trim().toLowerCase();
      if (!map[key]) map[key] = { key, label: tx.description.trim(), txs: [], totalAmount: 0, category: tx.category };
      map[key].txs.push(tx);
      map[key].totalAmount += tx.amount;
      if (tx.date > (map[key].latestDate || "")) {
        map[key].latestDate = tx.date;
        map[key].category = tx.category;
      }
    });
    // Apply local overrides immediately
    Object.entries(catOverrides).forEach(([key, cat]) => {
      if (map[key]) map[key].category = cat;
    });
    return Object.values(map).sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount));
  }, [transactions, catOverrides]);

  const uncategorizedCount = groups.filter(g => !g.category || g.category === "other").length;

  const applyCategory = (descKey, cat) => {
    const useFuzzy = !!fuzzyKeys[descKey];
    setCatOverrides(prev => ({ ...prev, [descKey]: cat }));
    if (onCategorize) onCategorize(descKey, cat, useFuzzy);
    const matched = getMatchCount(descKey, useFuzzy) || 1;
    setJustCategorized(prev => ({ ...prev, [descKey]: matched }));
    setTimeout(() => setJustCategorized(prev => { const n = { ...prev }; delete n[descKey]; return n; }), 2000);
    setOpenCatPicker(null);
  };

  const CATS = Object.keys(CATEGORY_COLORS);

  return (
    <div onClick={onClose} className="glass-modal" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: "min(520px, 100vw)", height: "100%", background: isDark ? "rgba(8,13,24,0.92)" : C.bg, borderLeft: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : C.border}`, display: "flex", flexDirection: "column", animation: "slideIn 0.22s ease", backdropFilter: "blur(2px)" }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .cat-pill:hover { filter: brightness(1.15); transform: scale(1.04); }
        .group-row:hover { background: ${isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} !important; }`}</style>

        {/* Header */}
        <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{title}</div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: C.rowBg, border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{subtitle}</div>

          {/* Quick totals */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {totalIncome > 0 && (
              <div style={{ flex: 1, padding: "9px 12px", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Inkomsten</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#22c55e", fontFamily: "'DM Mono', monospace" }}>+{fmt(totalIncome)}</div>
              </div>
            )}
            {totalExpenses > 0 && (
              <div style={{ flex: 1, padding: "9px 12px", borderRadius: 10, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Uitgaven</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#f43f5e", fontFamily: "'DM Mono', monospace" }}>−{fmt(totalExpenses)}</div>
              </div>
            )}
            <div style={{ flex: 1, padding: "9px 12px", borderRadius: 10, background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Groepen</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: "'DM Mono', monospace" }}>{groups.length}</div>
            </div>
          </div>

          {/* Mode toggle + uncategorized badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[["grouped", "Groeperen"], ["list", "Lijst"]].map(([mode, label]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  style={{ padding: "5px 12px", borderRadius: 20, border: viewMode === mode ? "1px solid rgba(79,142,247,0.5)" : `1px solid ${C.border}`, background: viewMode === mode ? "rgba(79,142,247,0.12)" : "transparent", color: viewMode === mode ? "#4f8ef7" : C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
            {uncategorizedCount > 0 && (
              <div style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontWeight: 700 }}>
                {uncategorizedCount} zonder categorie
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
          {transactions.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: C.muted, fontSize: 13 }}>Geen transacties</div>
          )}

          {viewMode === "grouped" ? (
            // ── GROUPED VIEW ──────────────────────────────────
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {groups.map(group => {
                const color = CATEGORY_COLORS[group.category] || "#64748b";
                const isOpen = openCatPicker === group.key;
                const justDone = justCategorized[group.key];
                const isUncategorized = !group.category || group.category === "other";

                return (
                  <div key={group.key} style={{ borderRadius: 12, border: isOpen ? `1px solid rgba(79,142,247,0.4)` : justDone ? "1px solid rgba(34,197,94,0.4)" : isUncategorized ? `1px solid rgba(245,158,11,0.25)` : `1px solid ${C.border}`, overflow: "hidden", transition: "border-color 0.2s", background: justDone ? (isDark ? "rgba(34,197,94,0.06)" : "#f0fdf4") : C.rowBg }}>

                    {/* Group header row */}
                    <div className="group-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer", transition: "background 0.12s" }}
                      onClick={() => setOpenCatPicker(isOpen ? null : group.key)}>

                      {/* Category color dot */}
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                        {group.txs.length > 1 && (
                          <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, background: "#4f8ef7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>{group.txs.length}</div>
                        )}
                      </div>

                      {/* Description + meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {group.txs[0]?.counterparty || group.label}
                        </div>
                        {group.txs[0]?.counterparty && (
                          <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                            {group.label}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 6, background: `${color}18`, color, fontWeight: 700, border: `1px solid ${color}30` }}>
                            {group.category || "geen categorie"}
                          </span>
                          {group.txs[0]?.paymentType && (
                            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", color: isDark ? "#64748b" : "#94a3b8", fontWeight: 600 }}>
                              {group.txs[0].paymentType}
                            </span>
                          )}
                          {group.txs.length > 1 && <span style={{ fontSize: 10, color: C.muted }}>{group.txs.length}× · {group.txs[0].date}</span>}
                          {group.txs.length === 1 && <span style={{ fontSize: 10, color: C.muted }}>{group.txs[0].date}</span>}
                        </div>
                      </div>

                      {/* Amount + action */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: group.totalAmount >= 0 ? "#22c55e" : "#f43f5e", fontFamily: "'DM Mono', monospace" }}>
                          {group.totalAmount >= 0 ? "+" : "−"}{fmt(Math.abs(group.totalAmount))}
                        </div>
                        <div style={{ fontSize: 10, color: justDone ? "#22c55e" : "#4f8ef7", fontWeight: 600, marginTop: 2 }}>
                          {justDone ? `✓ ${typeof justDone === "number" ? `${justDone} tx bijgewerkt` : "Opgeslagen"}` : isOpen ? "Sluiten ↑" : "Categorie ↓"}
                        </div>
                      </div>
                    </div>

                    {/* Category picker — inline pills */}
                    {isOpen && (() => {
                      const useFuzzy = !!fuzzyKeys[group.key];
                      const matchCount = getMatchCount(group.key, useFuzzy);
                      const fuzzyCount = getMatchCount(group.key, true);
                      const canFuzzy = fuzzyCount > (getMatchCount(group.key, false) || 0);
                      return (
                        <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 14px 14px", background: isDark ? "rgba(0,0,0,0.2)" : "#fafafa" }}>
                          {/* Scope indicator + fuzzy toggle */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              {matchCount > 1 ? `Past toe op ${matchCount} transacties` : "Kies categorie"}
                            </div>
                            {canFuzzy && (
                              <button onClick={() => setFuzzyKeys(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, border: useFuzzy ? "1px solid rgba(245,158,11,0.5)" : `1px solid ${C.border}`, background: useFuzzy ? "rgba(245,158,11,0.12)" : "transparent", color: useFuzzy ? "#f59e0b" : C.muted, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                                <div style={{ width: 12, height: 12, borderRadius: 6, background: useFuzzy ? "#f59e0b" : C.border, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
                                  {useFuzzy && <div style={{ width: 6, height: 6, borderRadius: 3, background: "#fff" }} />}
                                </div>
                                {useFuzzy ? `Soortgelijk · ${fuzzyCount} tx` : `Soortgelijk ook? (${fuzzyCount})`}
                              </button>
                            )}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {CATS.map(cat => {
                              const catColor = CATEGORY_COLORS[cat];
                              const isSelected = group.category === cat;
                              return (
                                <button key={cat} className="cat-pill" onClick={() => applyCategory(group.key, cat)}
                                  style={{ padding: "5px 11px", borderRadius: 20, border: isSelected ? `1.5px solid ${catColor}` : `1px solid ${catColor}30`, background: isSelected ? `${catColor}25` : `${catColor}12`, color: catColor, fontSize: 11, fontWeight: isSelected ? 700 : 500, cursor: "pointer", transition: "all 0.12s", display: "flex", alignItems: "center", gap: 5 }}>
                                  {isSelected && <Check size={10} />}
                                  {cat}
                                </button>
                              );
                            })}
                            <NewCatInline onAdd={(newCat) => {
                              CATEGORY_COLORS[newCat] = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#eab308","#22c55e","#14b8a6","#06b6d4","#3b82f6"][Math.floor(Math.random()*10)];
                              applyCategory(group.key, newCat);
                            }} isDark={isDark} C={C} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          ) : (
            // ── LIST VIEW ────────────────────────────────────
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[...transactions].sort((a, b) => b.date.localeCompare(a.date)).map((tx, i) => (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: i % 2 === 0 ? C.rowBg : "transparent", border: `1px solid ${i % 2 === 0 ? C.border : "transparent"}` }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${CATEGORY_COLORS[tx.category] || "#64748b"}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[tx.category] || "#64748b" }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.counterparty || tx.description}</div>
                      <div style={{ fontSize: 10, color: C.muted, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                        <span>{tx.date}</span>
                        {tx.counterparty && tx.description && tx.description !== tx.counterparty && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>· {tx.description}</span>}
                        {tx.paymentType && <span style={{ padding: "1px 5px", borderRadius: 4, background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", fontWeight: 600 }}>{tx.paymentType}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: tx.amount >= 0 ? "#22c55e" : "#f43f5e", fontFamily: "'DM Mono', monospace", flexShrink: 0, marginLeft: 8 }}>
                    {tx.amount >= 0 ? "+" : "−"}{fmt(Math.abs(tx.amount))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COUNT-UP HOOK ──────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [current, setCurrent] = useState(0);
  const startRef = useRef(0);
  const rafRef   = useRef(null);
  useEffect(() => {
    if (target == null || isNaN(target)) return;
    const from = startRef.current;
    const diff = target - from;
    if (Math.abs(diff) < 0.001) { setCurrent(target); return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);          // ease-out cubic
      setCurrent(from + diff * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else { startRef.current = target; setCurrent(target); }
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return current;
}

// ─── DYNAFY LOGO ───────────────────────────────────────────────
function DynafyLogo({ size = 32, bg }) {
  const uid = bg ? "custom" : "default";
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      {/* Background */}
      <rect width="512" height="512" rx="112" fill={bg || `url(#dynMainGrad_${uid})`}/>
      {/* Inner highlight */}
      {!bg && <rect width="512" height="512" rx="112" fill={`url(#dynGlow_${uid})`} opacity="0.5"/>}
      {/* D — left vertical bar */}
      <rect x="128" y="130" width="66" height="252" rx="33" fill="white"/>
      {/* D — right arc */}
      <path d="M158 138 H232 C340 138 412 190 412 256 C412 322 340 374 232 374 H158"
        stroke="white" strokeWidth="66" strokeLinecap="round" fill="none"/>
      {/* D — inner cutout */}
      <path d="M188 186 H228 C306 186 352 218 352 256 C352 294 306 326 228 326 H188"
        stroke={bg ? "rgba(255,255,255,0.35)" : `url(#dynCutout_${uid})`}
        strokeWidth="44" strokeLinecap="round" fill="none"/>
      {/* Trend spark lines top-right */}
      <path d="M348 138 L384 94" stroke="rgba(255,255,255,0.45)" strokeWidth="22" strokeLinecap="round"/>
      <path d="M388 150 L416 110" stroke="rgba(255,255,255,0.22)" strokeWidth="16" strokeLinecap="round"/>
      {!bg && (
        <defs>
          <linearGradient id={`dynMainGrad_${uid}`} x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6"/>
            <stop offset="0.55" stopColor="#6366F1"/>
            <stop offset="1" stopColor="#8B5CF6"/>
          </linearGradient>
          <radialGradient id={`dynGlow_${uid}`} cx="28%" cy="22%" r="55%">
            <stop stopColor="white" stopOpacity="0.18"/>
            <stop offset="1" stopColor="white" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id={`dynCutout_${uid}`} x1="188" y1="256" x2="352" y2="256" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6"/>
            <stop offset="1" stopColor="#7C3AED"/>
          </linearGradient>
        </defs>
      )}
    </svg>
  );
}

// ─── STAT CARD ─────────────────────────────────────────────────
function StatCard({ label, value, rawValue, formatter, sub, color = "#4f8ef7", icon: Icon, trend, isDark = true, onClick }) {
  const animated     = useCountUp(rawValue ?? null);
  const displayValue = rawValue != null && formatter ? formatter(animated) : value;
  const topBorderColor = isDark ? "transparent" : color;
  return (
    <div
      onClick={onClick}
      style={{ ...card(isDark), flex: 1, minWidth: 180, position: "relative", overflow: "hidden",
        borderTop: isDark ? `1px solid ${color}30` : `2.5px solid ${topBorderColor}`,
        cursor: onClick ? "pointer" : "default" }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px) scale(1.01)";
        e.currentTarget.style.boxShadow = isDark
          ? `0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px ${color}25`
          : `0 16px 36px ${color}22, 0 2px 8px rgba(0,0,0,0.08)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = isDark ? "0 2px 12px rgba(0,0,0,0.25)" : "0 1px 8px rgba(15,23,42,0.06)";
      }}>
      {/* Accent glow top-right */}
      <div style={{ position: "absolute", top: 0, right: 0, width: 100, height: 100,
        background: `radial-gradient(circle at 80% 10%, ${color}28, transparent 65%)`,
        borderRadius: "0 16px 0 0", pointerEvents: "none" }} />
      {/* Bottom accent line */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${color}20, transparent)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: isDark ? "#475569" : "#94a3b8", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a",
            fontFamily: "'DM Mono', monospace", letterSpacing: "-0.03em", lineHeight: 1.1,
            animation: "statReveal 0.5s ease forwards" }}>{displayValue}</div>
          {sub && <div style={{ fontSize: 12, color: isDark ? "#64748b" : "#64748b", marginTop: 4 }}>{sub}</div>}
          {trend !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 12,
              color: trend >= 0 ? "#22c55e" : "#f43f5e", fontWeight: 700 }}>
              {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(trend)}%
            </div>
          )}
          {onClick && <div style={{ fontSize: 11, color: color, marginTop: 6, fontWeight: 600, opacity: 0.7 }}>Klik voor detail →</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`,
          border: `1px solid ${color}25`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={19} color={color} />
        </div>
      </div>
    </div>
  );
}

// ─── DONUT CHART ───────────────────────────────────────────────
function CategoryPie({ transactions, t, isDark = true }) {
  const data = useMemo(() => {
    const map = {};
    transactions.filter(tx => tx.amount < 0).forEach(tx => {
      const key = tx.category;
      map[key] = (map[key] || 0) + Math.abs(tx.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
  }, [transactions]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const { name, value } = payload[0].payload;
      return (
        <div style={{ background: isDark ? "#1a2235" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e6ed", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ color: CATEGORY_COLORS[name] || "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.categories[name] || name}</div>
          <div style={{ color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 16, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{fmt(value)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ ...card(isDark) }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 16 }}>{t.dashboard.expensesByCategory}</div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <ResponsiveContainer width="100%" height={200} minWidth={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
              {data.map((entry) => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#64748b"} stroke="transparent" />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 120 }}>
          {data.slice(0, 6).map(d => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[d.name] || "#64748b", flexShrink: 0 }} />
              <span style={{ color: isDark ? "#94a3b8" : "#475569", flex: 1 }}>{t.categories[d.name] || d.name}</span>
              <span style={{ color: isDark ? "#f1f5f9" : "#0f172a", fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{fmtShort(d.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BAR CHART ─────────────────────────────────────────────────
function IncomeExpensesBar({ t, isDark = true }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: isDark ? "#1a2235" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e6ed", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ color: isDark ? "#64748b" : "#64748b", fontSize: 12, marginBottom: 6 }}>{label}</div>
          {payload.map(p => (
            <div key={p.name} style={{ color: p.fill, fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
              {p.name === "income" ? "+" : "-"}{fmt(p.value)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  return (
    <div style={{ ...card(isDark) }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 16 }}>{t.dashboard.incomeVsExpenses}</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={MOCK_MONTHLY} barGap={4} barSize={10}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} />
          <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v/1000}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── TREND LINE ────────────────────────────────────────────────
function SpendingTrend({ t, isDark = true }) {
  return (
    <div style={{ ...card(isDark) }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 16 }}>{t.dashboard.spendingTrend}</div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={MOCK_TREND}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} />
          <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
          <Tooltip contentStyle={{ background: isDark ? "#1a2235" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e6ed", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: isDark ? "#64748b" : "#64748b" }} itemStyle={{ color: "#4f8ef7" }} />
          <Area type="monotone" dataKey="amount" stroke="#4f8ef7" strokeWidth={2} fill="url(#areaGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── CSV UPLOAD MODAL ──────────────────────────────────────────
function CSVModal({ onClose, onImport, t, accounts, setAccounts, isDark = true }) {
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [selectedAccId, setSelectedAccId] = useState(accounts[0]?.id ?? null);
  const [showNewAcc, setShowNewAcc] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccIban, setNewAccIban] = useState("");
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const accName = accounts.find(a => a.id === selectedAccId)?.name || "Imported";
      const txs = parseCSVTransactions(e.target.result, accName);
      setParsed(txs);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleClose = (e) => {
    e?.stopPropagation();
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: isDark ? "#111827" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e6ed", borderRadius: 24, padding: 32, width: "100%", maxWidth: 520, position: "relative" }}>
        <button onClick={handleClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 32, height: 32, color: isDark ? "#94a3b8" : "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={16} />
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 6 }}>
          {t.transactions.uploadCSV}
        </div>
        <div style={{ fontSize: 13, color: isDark ? "#64748b" : "#64748b", marginBottom: 16 }}>
          ING, ABN AMRO, Rabobank, Bunq, N26 • Auto-parsed
        </div>

        {/* Account selector + add new */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: isDark ? "#64748b" : "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Importeer naar rekening</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {accounts.map(acc => (
              <button key={acc.id} onClick={() => { setSelectedAccId(acc.id); setShowNewAcc(false); }}
                style={{ padding: "7px 14px", borderRadius: 9, border: selectedAccId === acc.id && !showNewAcc ? "1px solid rgba(79,142,247,0.5)" : isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e6ed", background: selectedAccId === acc.id && !showNewAcc ? "rgba(79,142,247,0.15)" : isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", color: selectedAccId === acc.id && !showNewAcc ? "#4f8ef7" : isDark ? "#64748b" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: selectedAccId === acc.id && !showNewAcc ? 700 : 500, display: "flex", alignItems: "center", gap: 6 }}>
                <CreditCard size={12} /> {acc.name}
                {selectedAccId === acc.id && !showNewAcc && <Check size={11} />}
              </button>
            ))}
            <button onClick={() => setShowNewAcc(p => !p)}
              style={{ padding: "7px 14px", borderRadius: 9, border: showNewAcc ? "1px solid rgba(79,142,247,0.5)" : "1px dashed rgba(79,142,247,0.3)", background: showNewAcc ? "rgba(79,142,247,0.15)" : "rgba(79,142,247,0.04)", color: "#4f8ef7", cursor: "pointer", fontSize: 12, fontWeight: showNewAcc ? 700 : 500, display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={12} /> Nieuwe rekening
            </button>
          </div>
          {showNewAcc && (
            <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(79,142,247,0.3)", background: isDark ? "rgba(79,142,247,0.06)" : "#eff6ff", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#4f8ef7", marginBottom: 2 }}>Nieuwe rekening aanmaken</div>
              <input value={newAccName} onChange={e => setNewAccName(e.target.value)} placeholder="Naam (bijv. Rabobank Spaarrekening)" autoFocus
                style={{ padding: "9px 12px", background: isDark ? "rgba(255,255,255,0.06)" : "#fff", border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e6ed", borderRadius: 9, color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 13, outline: "none" }} />
              <input value={newAccIban} onChange={e => setNewAccIban(e.target.value)} placeholder="IBAN (optioneel)"
                style={{ padding: "9px 12px", background: isDark ? "rgba(255,255,255,0.06)" : "#fff", border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e6ed", borderRadius: 9, color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 13, outline: "none", fontFamily: "monospace" }} />
              <button onClick={() => {
                if (!newAccName.trim()) return;
                const newAcc = { id: Date.now(), name: newAccName.trim(), iban: newAccIban.trim() || "—" };
                setAccounts(prev => [...prev, newAcc]);
                setSelectedAccId(newAcc.id);
                setNewAccName(""); setNewAccIban(""); setShowNewAcc(false);
              }} style={{ ...pillBtn(), padding: "8px 14px", fontSize: 12, opacity: newAccName.trim() ? 1 : 0.45 }}>
                <Check size={13} /> Aanmaken & selecteren
              </button>
            </div>
          )}
        </div>

        {!parsed ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "#4f8ef7" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 16, padding: "40px 24px", textAlign: "center", cursor: "pointer",
              background: dragging ? "rgba(79,142,247,0.08)" : "rgba(255,255,255,0.02)",
              transition: "all 0.2s"
            }}
          >
            <input ref={inputRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            <Upload size={32} color={dragging ? "#4f8ef7" : "#334155"} style={{ marginBottom: 12 }} />
            <div style={{ color: isDark ? "#94a3b8" : "#475569", fontSize: 14, marginBottom: 4 }}>Drop CSV hier of klik om te bladeren</div>
            <div style={{ color: isDark ? "#334155" : "#94a3b8", fontSize: 12 }}>Komma- of puntkomma-gescheiden • Europees formaat ondersteund</div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
              <Check size={16} color="#22c55e" />
              <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>{fileName} — {parsed.length} transacties gevonden</div>
            </div>
            <div style={{ maxHeight: 180, overflowY: "auto", fontSize: 12, color: isDark ? "#64748b" : "#64748b", display: "flex", flexDirection: "column", gap: 4 }}>
              {parsed.slice(0, 8).map((tx, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", borderRadius: 8 }}>
                  <span style={{ color: isDark ? "#94a3b8" : "#475569", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 12 }}>{tx.counterparty || tx.description}</span>
                  <span style={{ color: tx.amount < 0 ? "#f43f5e" : "#22c55e", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{fmt(tx.amount)}</span>
                </div>
              ))}
              {parsed.length > 8 && <div style={{ textAlign: "center", color: isDark ? "#334155" : "#94a3b8", padding: "4px 0" }}>+{parsed.length - 8} meer</div>}
            </div>
            {parsed.length === 0 && (
              <div style={{ padding: "16px", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 10, color: "#f43f5e", fontSize: 13 }}>
                Geen geldige transacties gevonden. Controleer of het bestand een datum-, omschrijving- en bedragkolom bevat.
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button
            onClick={handleClose}
            style={{...pillBtnGhost(isDark), flex: 1, padding: "12px 20px", fontSize: 14 }}>
            Annuleren
          </button>
          {parsed && parsed.length > 0 && (
            <button onClick={() => {
              // Find or build the account object
              const existingAcc = accounts.find(a => a.id === selectedAccId);
              const importedAcc = existingAcc || (newAccName.trim() ? { id: Date.now(), name: newAccName.trim(), iban: newAccIban.trim() || "—" } : null);
              onImport(parsed, importedAcc ? [importedAcc] : null);
              onClose();
            }} style={{ ...pillBtn(), flex: 2, padding: "12px 20px", fontSize: 14 }}>
              Importeer {parsed.length} transacties
            </button>
          )}
          {parsed && parsed.length === 0 && (
            <button onClick={() => setParsed(null)} style={{...pillBtnGhost(isDark), flex: 2, padding: "12px 20px", fontSize: 14 }}>
              Opnieuw proberen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── DASHBOARD VIEW ────────────────────────────────────────────
// ─── WIDGET DASHBOARD ─────────────────────────────────────────
const DEFAULT_WIDGETS = [
  { id: "balance",     icon: "💰", enabled: true  },
  { id: "spending",    icon: "🍕", enabled: true  },
  { id: "investments", icon: "📈", enabled: true  },
  { id: "goals",       icon: "🎯", enabled: true  },
  { id: "fire",        icon: "🔥", enabled: true  },
  { id: "budget",      icon: "📊", enabled: true  },
  { id: "cashflow",    icon: "📉", enabled: true  },
  { id: "debts",       icon: "🏦", enabled: false },
  { id: "topcat",      icon: "🏆", enabled: false },
];

const WIDGET_LABELS = {
  nl: { balance:"Saldo overzicht", spending:"Uitgaven verdeling", investments:"Investeringen", goals:"Spaardoelen", fire:"FIRE voortgang", budget:"Budget status", cashflow:"Cashflow trend", debts:"Schulden", topcat:"Top categorieën" },
  en: { balance:"Balance overview", spending:"Spending breakdown", investments:"Investments", goals:"Saving goals", fire:"FIRE progress", budget:"Budget status", cashflow:"Cashflow trend", debts:"Debt", topcat:"Top categories" },
};

function WidgetDashboard({ transactions, t, isDark, accent = "#4f8ef7", accounts, investments = [], goals = [], lang = "nl" }) {
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const [editMode, setEditMode] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const C = {
    text: isDark ? "#f1f5f9" : "#0f172a",
    sub: isDark ? "#94a3b8" : "#475569",
    muted: isDark ? "#64748b" : "#64748b",
    border: isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed",
    rowBg: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
  };

  // ── Data calculations ─────────────────────────────────────────
  const latestMonth = transactions.reduce((best, tx) => tx.date > best ? tx.date : best, "").slice(0, 7);
  const prevMonthStr = latestMonth ? (() => { const [y,m] = latestMonth.split("-").map(Number); return `${m===1?y-1:y}-${String(m===1?12:m-1).padStart(2,"0")}`; })() : "";
  const thisTxs = transactions.filter(tx => tx.date.startsWith(latestMonth));
  const prevTxs = transactions.filter(tx => tx.date.startsWith(prevMonthStr));
  const income   = thisTxs.filter(tx => tx.amount > 0).reduce((s,tx) => s+tx.amount, 0);
  const expenses = thisTxs.filter(tx => tx.amount < 0).reduce((s,tx) => s+Math.abs(tx.amount), 0);
  const balance  = income - expenses;
  const prevIncome = prevTxs.filter(tx => tx.amount > 0).reduce((s,tx) => s+tx.amount, 0);
  const prevExpenses = prevTxs.filter(tx => tx.amount < 0).reduce((s,tx) => s+Math.abs(tx.amount), 0);
  const totalSaldo = transactions.filter(tx => tx.amount > 0).reduce((s,tx) => s+tx.amount, 0) -
                     transactions.filter(tx => tx.amount < 0).reduce((s,tx) => s+Math.abs(tx.amount), 0);

  const catData = useMemo(() => {
    const map = {};
    thisTxs.filter(tx => tx.amount < 0).forEach(tx => { map[tx.category] = (map[tx.category]||0) + Math.abs(tx.amount); });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
  }, [thisTxs]);

  const trendData = useMemo(() => {
    const months = [...new Set(transactions.map(tx => tx.date.slice(0,7)))].sort().slice(-6);
    const locale = lang === "nl" ? "nl-NL" : "en-US";
    return months.map(m => ({
      month: fmtMonthShort(m, locale),
      income: Math.round(transactions.filter(tx => tx.date.startsWith(m) && tx.amount > 0).reduce((s,tx) => s+tx.amount, 0)),
      expenses: Math.round(transactions.filter(tx => tx.date.startsWith(m) && tx.amount < 0).reduce((s,tx) => s+Math.abs(tx.amount), 0)),
    }));
  }, [transactions]);

  // ── Drag & Drop handlers ─────────────────────────────────────
  const handleDragStart = (id) => setDragging(id);
  const handleDragOver  = (e, id) => { e.preventDefault(); setDragOver(id); };
  const handleDrop      = (targetId) => {
    if (!dragging || dragging === targetId) { setDragging(null); setDragOver(null); return; }
    setWidgets(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(w => w.id === dragging);
      const toIdx   = arr.findIndex(w => w.id === targetId);
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
    setDragging(null); setDragOver(null);
  };

  const toggleWidget = (id) => setWidgets(prev => prev.map(w => w.id === id ? {...w, enabled: !w.enabled} : w));

  // ── Widget renderers ─────────────────────────────────────────
  const renderWidget = (w) => {
    const wCard = { ...card(isDark), position: "relative", transition: "box-shadow 0.2s", minHeight: 120 };

    switch (w.id) {
      case "balance": return (
        <div style={wCard}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{lang === "nl" ? "💰 Saldo overzicht" : "💰 Balance overview"} · {fmtMonth(latestMonth, lang === "nl" ? "nl-NL" : "en-US")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: t.general.income, value: fmt(income), color: "#22c55e", sub: prevIncome ? `${income >= prevIncome ? "↑" : "↓"} ${Math.round(Math.abs(income-prevIncome)/prevIncome*100)}% ${t.general.vsLastMonth}` : "" },
              { label: t.general.expenses, value: fmt(expenses), color: "#f43f5e", sub: prevExpenses ? `${expenses >= prevExpenses ? "↑" : "↓"} ${Math.round(Math.abs(expenses-prevExpenses)/prevExpenses*100)}% ${t.general.vsLastMonth}` : "" },
              { label: t.general.balance, value: fmt(Math.abs(balance)), color: balance >= 0 ? "#4f8ef7" : "#f43f5e", sub: balance >= 0 ? lang === "nl" ? "positief" : "positive" : lang === "nl" ? "negatief" : "negative" },
            ].map(k => (
              <div key={k.label} style={{ padding: "10px 12px", borderRadius: 10, background: `${k.color}10`, border: `1px solid ${k.color}25` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: k.color, fontFamily: "'DM Mono', monospace" }}>{k.value}</div>
                {k.sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{k.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      );

      case "spending": return (
        <div style={wCard}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{lang === "nl" ? "🍕 Uitgaven verdeling" : "🍕 Spending breakdown"}</div>
          {catData.length === 0 ? (
            <div style={{ textAlign: "center", color: C.muted, fontSize: 13, padding: "20px 0" }}>{lang === "nl" ? "Geen data" : "No data"}</div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <ResponsiveContainer width={120} height={120}>
                <PieChart><Pie data={catData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={2}>
                  {catData.map((_, i) => <Cell key={i} fill={Object.values(CATEGORY_COLORS)[i % Object.values(CATEGORY_COLORS).length]}/>)}
                </Pie></PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {catData.map((cat, i) => (
                  <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: Object.values(CATEGORY_COLORS)[i % Object.values(CATEGORY_COLORS).length], flexShrink: 0 }}/>
                    <span style={{ fontSize: 11, color: C.sub, flex: 1 }}>{t.categories[cat.name] || cat.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>{fmt(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

      case "cashflow": return (
        <div style={{...wCard, gridColumn: "span 3"}}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>📉 Cashflow trend</div>
          {trendData.length < 2 ? (
            <div style={{ textAlign: "center", color: C.muted, fontSize: 13, padding: "20px 0" }}>{lang === "nl" ? "Minimaal 2 maanden data nodig" : "At least 2 months of data needed"}</div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={trendData} barGap={3}>
                <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v => fmtShort(v)} tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={44}/>
                <Tooltip formatter={(v, n) => [fmt(v), n === "income" ? t.general.income : t.general.expenses]}
                  contentStyle={{ background: isDark ? "#1e293b" : "#fff", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }}/>
                <Bar dataKey="income"   fill="#22c55e" radius={[3,3,0,0]} opacity={0.85}/>
                <Bar dataKey="expenses" fill="#f43f5e" radius={[3,3,0,0]} opacity={0.85}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      );

      case "fire": {
        const monthlyExp = expenses || 3000;
        const fireNum = Math.round(monthlyExp * 12 * 25);
        const wealth = Math.max(0, totalSaldo);
        const pct = Math.min(100, Math.round(wealth / fireNum * 100));
        return (
          <div style={wCard}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{lang === "nl" ? "🔥 FIRE voortgang" : "🔥 FIRE progress"}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>{pct}%</span>
              <span style={{ fontSize: 12, color: C.muted }}>{lang === "nl" ? "doel" : "goal"}: {fmtShort(fireNum)}</span>
            </div>
            <div style={{ height: 8, background: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #f59e0b, #ef4444)", borderRadius: 4 }}/>
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>{lang === "nl" ? `Gebaseerd op €${Math.round(monthlyExp)}/mnd uitgaven · 4% regel` : `Based on €${Math.round(monthlyExp)}/mo expenses · 4% rule`}</div>
          </div>
        );
      }

      case "goals": return (
        <div style={wCard}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{lang === "nl" ? "🎯 Spaardoelen" : "🎯 Savings goals"}</div>
          {goals.length === 0 ? (
            <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "12px 0" }}>{lang === "nl" ? "Nog geen spaardoelen toegevoegd" : "No savings goals added yet"}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {goals.slice(0, 3).map(goal => {
                const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
                return (
                  <div key={goal.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>{goal.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: goal.color, fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
                    </div>
                    <div style={{ height: 5, background: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: goal.color, borderRadius: 3 }}/>
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{fmt(goal.current)} / {fmt(goal.target)}</div>
                  </div>
                );
              })}
              {goals.length > 3 && <div style={{ fontSize: 11, color: C.muted }}>+{goals.length - 3} {lang === "nl" ? "meer doelen" : "more goals"}</div>}
            </div>
          )}
        </div>
      );

      case "investments": {
        const totalInvested = investments.reduce((s, inv) => s + (parseFloat(inv.invested) || 0), 0);
        const totalValue = investments.reduce((s, inv) => s + (parseFloat(inv.currentValue) || parseFloat(inv.invested) || 0), 0);
        const gain = totalValue - totalInvested;
        const gainPct = totalInvested > 0 ? ((gain / totalInvested) * 100).toFixed(1) : 0;
        return (
          <div style={wCard}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{lang === "nl" ? "📈 Investeringen" : "📈 Investments"}</div>
            {investments.length === 0 ? (
              <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "12px 0" }}>{lang === "nl" ? "Nog geen investeringen toegevoegd" : "No investments added yet"}</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "rgba(79,142,247,0.1)", border: "1px solid rgba(79,142,247,0.2)" }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>{lang === "nl" ? "Geïnvesteerd" : "Invested"}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#4f8ef7", fontFamily: "'DM Mono', monospace" }}>{fmt(totalInvested)}</div>
                  </div>
                  <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: gain >= 0 ? "rgba(34,197,94,0.1)" : "rgba(244,63,94,0.1)", border: `1px solid ${gain >= 0 ? "rgba(34,197,94,0.2)" : "rgba(244,63,94,0.2)"}` }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>{lang === "nl" ? "Winst/Verlies" : "Profit/Loss"}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: gain >= 0 ? "#22c55e" : "#f43f5e", fontFamily: "'DM Mono', monospace" }}>{gain >= 0 ? "+" : ""}{fmt(gain)} ({gainPct}%)</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {investments.slice(0, 4).map(inv => (
                    <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 2, background: INVESTMENT_COLORS[inv.type] || "#64748b", flexShrink: 0 }}/>
                      <span style={{ fontSize: 12, color: C.sub, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>{fmt(parseFloat(inv.currentValue) || parseFloat(inv.invested) || 0)}</span>
                    </div>
                  ))}
                  {investments.length > 4 && <div style={{ fontSize: 11, color: C.muted }}>+{investments.length - 4} {lang === "nl" ? "meer" : "more"}</div>}
                </div>
              </>
            )}
          </div>
        );
      }

      case "budget": {
        const cats = ["groceries","eating_out","subscriptions","transport","shopping"];
        const items = cats.map(cat => ({
          cat, spent: thisTxs.filter(tx => tx.category === cat && tx.amount < 0).reduce((s,tx) => s+Math.abs(tx.amount), 0),
          budget: prevTxs.filter(tx => tx.category === cat && tx.amount < 0).reduce((s,tx) => s+Math.abs(tx.amount), 0) * 1.1 || 0,
        })).filter(x => x.spent > 0 || x.budget > 0).slice(0, 4);
        return (
          <div style={wCard}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>📊 Budget status</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.length === 0 ? (
                <div style={{ fontSize: 13, color: C.muted, textAlign: "center" }}>{lang === "nl" ? "Geen data beschikbaar" : "No data available"}</div>
              ) : items.map(b => {
                const pct = b.budget > 0 ? Math.min(100, b.spent/b.budget*100) : 0;
                const color = pct >= 100 ? "#f43f5e" : pct >= 80 ? "#f59e0b" : "#22c55e";
                return (
                  <div key={b.cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: C.sub }}>{t.categories[b.cat] || b.cat}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>{fmt(b.spent)}</span>
                    </div>
                    <div style={{ height: 4, background: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case "debts": return (
        <div style={wCard}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{lang === "nl" ? "🏦 Schulden" : "🏦 Debts"}</div>
          <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "12px 0" }}>{lang === "nl" ? "Open Goals → Schulden om schulden te beheren" : "Open Goals → Debts to manage your debts"}</div>
        </div>
      );

      case "topcat": {
        const top = catData.slice(0, 4);
        return (
          <div style={wCard}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{lang === "nl" ? "🏆 Top categorieën" : "🏆 Top categories"}</div>
            {top.map((cat, i) => (
              <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < top.length-1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.muted, width: 18 }}>#{i+1}</span>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[cat.name] || "#64748b" }}/>
                <span style={{ fontSize: 12, color: C.sub, flex: 1 }}>{t.categories[cat.name] || cat.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#f43f5e", fontFamily: "'DM Mono', monospace" }}>{fmt(cat.value)}</span>
              </div>
            ))}
          </div>
        );
      }
      default: return null;
    }
  };

  const enabledWidgets = widgets.filter(w => w.enabled);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Dashboard</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{lang === "nl" ? "Jouw financieel overzicht op één plek" : "Your financial overview in one place"}</div>
        </div>
        <button onClick={() => setEditMode(e => !e)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 20, border: editMode ? `1px solid ${accent}` : `1px solid ${C.border}`, background: editMode ? `${accent}15` : "transparent", color: editMode ? accent : C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          <Sliders size={13}/> {editMode ? t.general.done : (lang === "nl" ? "Dashboard aanpassen" : "Customize dashboard")}
        </button>
      </div>

      {/* Edit mode — widget picker */}
      {editMode && (
        <div style={{ ...card(isDark), marginBottom: 16, border: `1px solid ${accent}40` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{lang === "nl" ? "Widgets beheren" : "Manage widgets"}</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{lang === "nl" ? "Zet aan/uit · sleep om de volgorde aan te passen" : "Toggle on/off · drag to reorder"}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {widgets.map(w => (
              <button key={w.id} onClick={() => toggleWidget(w.id)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 20, border: w.enabled ? `1.5px solid ${accent}` : `1px solid ${C.border}`, background: w.enabled ? `${accent}15` : "transparent", color: w.enabled ? accent : C.muted, fontSize: 12, fontWeight: w.enabled ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                <span>{w.icon}</span> {(WIDGET_LABELS[lang] || WIDGET_LABELS.nl)[w.id] || w.id}
                {w.enabled && <Check size={11}/>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Widget grid — 2 columns, draggable */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {enabledWidgets.map(w => (
          <div key={w.id}
            draggable={editMode}
            onDragStart={() => handleDragStart(w.id)}
            onDragOver={e => handleDragOver(e, w.id)}
            onDrop={() => handleDrop(w.id)}
            onDragEnd={() => { setDragging(null); setDragOver(null); }}
            style={{
              gridColumn: (w.id === "cashflow" || w.id === "balance") ? "span 3" : "span 1",
              opacity: dragging === w.id ? 0.5 : 1,
              outline: dragOver === w.id && dragging !== w.id ? `2px dashed ${accent}` : "none",
              borderRadius: 16,
              cursor: editMode ? "grab" : "default",
              transition: "opacity 0.15s, outline 0.1s",
            }}>
            {editMode && (
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textAlign: "center", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span style={{ cursor: "grab" }}>⠿</span> {lang === "nl" ? "Sleep om te verplaatsen" : "Drag to reorder"}
              </div>
            )}
            {renderWidget(w)}
          </div>
        ))}
      </div>

      {enabledWidgets.length === 0 && (
        <div style={{ ...card(isDark), textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>{lang === "nl" ? "Geen widgets actief" : "No widgets active"}</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{lang === "nl" ? "Klik op \"Dashboard aanpassen\" om widgets toe te voegen." : "Click \"Customize dashboard\" to add widgets."}</div>
          <button onClick={() => setEditMode(true)} style={{ ...pillBtn(), padding: "10px 24px", fontSize: 13 }}>
            <Sliders size={14}/> {lang === "nl" ? "Dashboard aanpassen" : "Customize dashboard"}
          </button>
        </div>
      )}
    </div>
  );
}

function Overzicht({ transactions, t, accounts, selectedAccount, setSelectedAccount, isDark, accent = "#3b82f6", accentBg = "#eff6ff", setTransactions, onUploadClick, lang = "nl" }) {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [periodPreset, setPeriodPreset] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [periodOffset, setPeriodOffset] = useState(0); // 0 = current, 1 = one period back, etc.

  const filtered = selectedAccount
    ? transactions.filter(tx => {
        const acc = accounts.find(a => a.id === selectedAccount);
        return acc ? tx.account === acc.name : true;
      })
    : transactions;

  const allMonths = useMemo(() => {
    const months = new Set(filtered.map(tx => tx.date.slice(0, 7)));
    return [...months].sort((a, b) => b.localeCompare(a));
  }, [filtered]);

  const latestMonth = allMonths[0] || new Date().toISOString().slice(0, 7);
  const currentMonth = (selectedMonth && allMonths.includes(selectedMonth)) ? selectedMonth : latestMonth;
  const currentIdx = allMonths.indexOf(currentMonth);
  const canPrev = currentIdx < allMonths.length - 1;
  const canNext = currentIdx > 0;
  const prevMonthYM = allMonths[currentIdx + 1] || null;

  // Period range for cumulative view
  const getPeriodRange = () => {
    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    // Shift reference date back by offset periods
    const ref = new Date(now);
    if (periodPreset === "3m") ref.setMonth(ref.getMonth() - periodOffset * 3);
    if (periodPreset === "6m") ref.setMonth(ref.getMonth() - periodOffset * 6);
    if (periodPreset === "year") ref.setFullYear(ref.getFullYear() - periodOffset);
    const refStr = `${ref.getFullYear()}-${pad(ref.getMonth()+1)}-${pad(ref.getDate())}`;

    if (periodPreset === "3m")   { const f = new Date(ref); f.setMonth(f.getMonth()-3); return { from: f.toISOString().slice(0,10), to: refStr }; }
    if (periodPreset === "6m")   { const f = new Date(ref); f.setMonth(f.getMonth()-6); return { from: f.toISOString().slice(0,10), to: refStr }; }
    if (periodPreset === "year") { const f = new Date(ref); f.setFullYear(f.getFullYear()-1); return { from: f.toISOString().slice(0,10), to: refStr }; }
    if (periodPreset === "custom") return { from: customFrom, to: customTo };
    return null;
  };

  const getPeriodLabel = () => {
    const range = getPeriodRange();
    if (!range?.from) return "";
    const fmtD = d => { const [y,m,dy] = d.split("-"); return `${dy}-${m}-${y}`; };
    if (periodPreset === "year") {
      // Show the TO year (the end of the period)
      const toYear = new Date(range.to).getFullYear();
      const fromYear = new Date(range.from).getFullYear();
      return fromYear === toYear ? `${fromYear}` : `${fromYear} – ${toYear}`;
    }
    return `${fmtD(range.from)} → ${fmtD(range.to)}`;
  };
  const periodRange = getPeriodRange();
  const isMultiPeriod = periodPreset !== "month";

  // Transactions for current period
  const periodTxs = isMultiPeriod && periodRange?.from
    ? filtered.filter(tx => tx.date >= periodRange.from && (!periodRange.to || tx.date <= periodRange.to))
    : filtered.filter(tx => tx.date.startsWith(currentMonth));

  const thisMonthTxs = periodTxs;
  const income   = thisMonthTxs.filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const expenses = thisMonthTxs.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const allIncome   = filtered.filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const allExpenses = filtered.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);

  const prevMonthTxs = (!isMultiPeriod && prevMonthYM) ? filtered.filter(tx => tx.date.startsWith(prevMonthYM)) : [];
  const prevIncome   = prevMonthTxs.filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const prevExpenses = prevMonthTxs.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);

  const pillScrollRef = useRef(null);
  const activePillRef = useRef(null);
  useEffect(() => {
    if (activePillRef.current && pillScrollRef.current) {
      const container = pillScrollRef.current;
      const pill = activePillRef.current;
      container.scrollTo({ left: pill.offsetLeft - container.offsetWidth / 2 + pill.offsetWidth / 2, behavior: "smooth" });
    }
  }, [currentMonth]);

  const calcTrend = (curr, prev) => {
    if (!prev || !curr) return undefined;
    return parseFloat(((curr - prev) / prev * 100).toFixed(1));
  };

  // Bar chart data: all months ascending
  const barData = useMemo(() => {
    return [...allMonths].reverse().map(ym => {
      const txs = filtered.filter(tx => tx.date.startsWith(ym));
      return {
        month: fmtMonthShort(ym),
        ym,
        income:   parseFloat(txs.filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0).toFixed(2)),
        expenses: parseFloat(txs.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0).toFixed(2)),
      };
    });
  }, [filtered, allMonths]);

  const monthLabel = fmtMonth(currentMonth);

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: isDark ? "#1a2235" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e6ed", borderRadius: 10, padding: "10px 14px" }}>
        <div style={{ color: isDark ? "#64748b" : "#64748b", fontSize: 12, marginBottom: 6 }}>{label}</div>
        <div style={{ color: "#22c55e", fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>+{fmt(payload[0]?.value || 0)}</div>
        <div style={{ color: "#f43f5e", fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>−{fmt(payload[1]?.value || 0)}</div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Account selector + Upload button ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setSelectedAccount(null)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10, border: !selectedAccount ? "1px solid rgba(79,142,247,0.5)" : "1px solid rgba(255,255,255,0.08)", background: !selectedAccount ? "rgba(79,142,247,0.15)" : "rgba(255,255,255,0.03)", color: !selectedAccount ? "#4f8ef7" : "#475569", cursor: "pointer", fontSize: 13, fontWeight: !selectedAccount ? 700 : 500, transition: "all 0.15s" }}>
          <Wallet size={14} />
          Alle rekeningen
          <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 6, background: !selectedAccount ? "rgba(79,142,247,0.25)" : "rgba(255,255,255,0.06)", color: !selectedAccount ? "#4f8ef7" : "#334155", fontWeight: 700 }}>{accounts.length}</span>
        </button>
        {accounts.map(acc => {
          const active = selectedAccount === acc.id;
          return (
            <button key={acc.id} onClick={() => setSelectedAccount(acc.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10, border: active ? "1px solid rgba(79,142,247,0.5)" : "1px solid rgba(255,255,255,0.08)", background: active ? "rgba(79,142,247,0.15)" : "rgba(255,255,255,0.03)", color: active ? "#4f8ef7" : "#475569", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 500, transition: "all 0.15s" }}>
              <CreditCard size={14} />
              {acc.name}
              <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 6, background: active ? "rgba(79,142,247,0.25)" : "rgba(255,255,255,0.06)", color: active ? "#4f8ef7" : "#334155", fontWeight: 700 }}>
                {transactions.filter(tx => tx.account === acc.name).length}
              </span>
            </button>
          );
        })}
        {onUploadClick && (
          <button onClick={onUploadClick} style={{ ...pillBtn(), fontSize: 12, padding: "8px 16px", marginLeft: "auto" }}>
            <Upload size={13}/> CSV Uploaden
          </button>
        )}
      </div>

      {/* ── Period selector ── */}
      <div style={{ marginBottom: 12 }}>
        {/* Row 1: preset buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
          {[
            { id: "month", label: t.overzicht.perMonth },
            { id: "3m", label: t.overzicht.months3 },
            { id: "6m", label: t.overzicht.months6 },
            { id: "year", label: t.overzicht.perYear },
            { id: "custom", label: "📅 " + t.overzicht.custom },
          ].map(p => (
            <button key={p.id} onClick={() => { setPeriodPreset(p.id); setPeriodOffset(0); }}
              style={{ padding: "6px 14px", borderRadius: 20, border: periodPreset === p.id ? `1.5px solid ${accent}` : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed"}`, background: periodPreset === p.id ? `${accent}18` : "transparent", color: periodPreset === p.id ? accent : isDark ? "#64748b" : "#94a3b8", fontSize: 12, fontWeight: periodPreset === p.id ? 700 : 400, cursor: "pointer" }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Row 2: navigation or custom date inputs */}
        {isMultiPeriod && periodPreset !== "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed"}` }}>
              <button onClick={() => setPeriodOffset(o => o + 1)}
                style={{ background: "none", border: "none", color: isDark ? "#94a3b8" : "#475569", cursor: "pointer", display: "flex", alignItems: "center", padding: "0 2px" }}>
                <ChevronLeft size={14}/>
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", minWidth: 120, textAlign: "center" }}>
                {getPeriodLabel()}
              </span>
              <button onClick={() => setPeriodOffset(o => Math.max(0, o - 1))} disabled={periodOffset === 0}
                style={{ background: "none", border: "none", color: periodOffset === 0 ? (isDark ? "#334155" : "#cbd5e1") : (isDark ? "#94a3b8" : "#475569"), cursor: periodOffset === 0 ? "default" : "pointer", display: "flex", alignItems: "center", padding: "0 2px" }}>
                <ChevronRight size={14}/>
              </button>
            </div>
            {periodRange?.from && (
              <span style={{ fontSize: 11, color: isDark ? "#475569" : "#94a3b8" }}>
                {periodTxs.length} {t.overzicht.transactions} · {t.overzicht.cumulative}
              </span>
            )}
          </div>
        )}

        {isMultiPeriod && periodPreset === "custom" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                style={{ padding: "6px 10px 6px 32px", borderRadius: 8, border: `2px solid ${accent}`, background: isDark ? "rgba(79,142,247,0.08)" : "#eff6ff", color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 12, outline: "none", colorScheme: isDark ? "dark" : "light" }}/>
              <Calendar size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: accent, pointerEvents: "none" }}/>
            </div>
            <span style={{ color: isDark ? "#475569" : "#94a3b8", fontSize: 12 }}>tot</span>
            <div style={{ position: "relative" }}>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                style={{ padding: "6px 10px 6px 32px", borderRadius: 8, border: `2px solid ${accent}`, background: isDark ? "rgba(79,142,247,0.08)" : "#eff6ff", color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 12, outline: "none", colorScheme: isDark ? "dark" : "light" }}/>
              <Calendar size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: accent, pointerEvents: "none" }}/>
            </div>
            {periodRange?.from && (
              <span style={{ fontSize: 11, color: isDark ? "#475569" : "#94a3b8" }}>
                {periodTxs.length} {t.overzicht.transactions}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Month selector bar (only in single-month mode) ── */}
      {!isMultiPeriod && (
        <div style={{ ...card(isDark), padding: "14px 16px" }}>
        {allMonths.length > 0 && (() => {
          const years = [...new Set(allMonths.map(m => m.slice(0, 4)))].sort().reverse();
          const activeYear = currentMonth.slice(0, 4);
          return years.length > 1 ? (
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {years.map(yr => (
                <button key={yr} onClick={() => {
                  const monthsInYear = allMonths.filter(m => m.startsWith(yr));
                  if (monthsInYear.length) setSelectedMonth(monthsInYear[monthsInYear.length - 1]);
                }}
                  style={{ padding: "3px 12px", borderRadius: 20, border: yr === activeYear ? `1.5px solid ${accent}` : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed"}`, background: yr === activeYear ? `${accent}18` : "transparent", color: yr === activeYear ? accent : isDark ? "#64748b" : "#94a3b8", fontSize: 12, fontWeight: yr === activeYear ? 700 : 500, cursor: "pointer" }}>
                  {yr}
                </button>
              ))}
            </div>
          ) : null;
        })()}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Prev arrow (older) */}
          <button onClick={() => canPrev && setSelectedMonth(allMonths[currentIdx + 1])}
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: canPrev ? "rgba(255,255,255,0.04)" : "transparent", color: canPrev ? "#94a3b8" : "#1e293b", cursor: canPrev ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ChevronRight size={15} style={{ transform: "rotate(180deg)" }} />
          </button>

          {/* Scrollable month pills — filtered to active year */}
          <div ref={pillScrollRef} style={{ flex: 1, overflowX: "auto", display: "flex", gap: 6, scrollbarWidth: "none" }}>
            {allMonths.length === 0
              ? <span style={{ fontSize: 13, color: isDark ? "#334155" : "#94a3b8", padding: "8px 0" }}>Geen data — upload een CSV</span>
              : [...allMonths].reverse()
                  .filter(ym => ym.startsWith(currentMonth.slice(0, 4))) // show only selected year
                  .map(ym => {
                  const isActive = ym === currentMonth;
                  const mIncome   = filtered.filter(tx => tx.date.startsWith(ym) && tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
                  const mExpenses = filtered.filter(tx => tx.date.startsWith(ym) && tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);
                  const net = mIncome - mExpenses;
                  return (
                    <button key={ym} ref={isActive ? activePillRef : null} onClick={() => setSelectedMonth(ym)}
                      style={{ flexShrink: 0, padding: "7px 13px", borderRadius: 10, border: isActive ? `1.5px solid ${accent}` : isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #e2e6ed", background: isActive ? accentBg : isDark ? "rgba(255,255,255,0.03)" : "#ffffff", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                      <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? accent : "#64748b", whiteSpace: "nowrap" }}>
                        {fmtMonthShort(ym)}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: net >= 0 ? "#22c55e" : "#f43f5e", marginTop: 2 }}>
                        {net >= 0 ? "+" : ""}{fmtShort(net)}
                      </div>
                    </button>
                  );
                })}
          </div>

          {/* Next arrow (newer) */}
          <button onClick={() => canNext && setSelectedMonth(allMonths[currentIdx - 1])}
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: canNext ? "rgba(255,255,255,0.04)" : "transparent", color: canNext ? "#94a3b8" : "#1e293b", cursor: canNext ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      )} {/* end !isMultiPeriod */}

      {/* ── KPI cards ── */}
      {drawer && (
        <TransactionDrawer
          title={drawer.title}
          subtitle={drawer.subtitle}
          transactions={drawer.transactions}
          allTransactions={filtered}
          isDark={isDark}
          onClose={() => setDrawer(null)}
          onCategorize={(descKey, cat, useFuzzy) => {
            if (setTransactions) {
              setTransactions(prev => prev.map(tx => {
                const txKey = tx.description.trim().toLowerCase();
                // Exact match
                if (txKey === descKey) return { ...tx, category: cat };
                // Fuzzy match: same first 8 chars (for bank codes that vary per month)
                if (useFuzzy && descKey.length >= 6 && txKey.slice(0, 8) === descKey.slice(0, 8)) return { ...tx, category: cat };
                return tx;
              }));
            }
          }}
        />
      )}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <StatCard label={t.dashboard.netWorth} rawValue={allIncome - allExpenses} formatter={fmt} sub={lang === "nl" ? "Gecumuleerd saldo" : "Cumulative balance"} color="#4f8ef7" icon={Wallet} isDark={isDark}
          onClick={() => setDrawer({ title: lang === "nl" ? "Alle transacties" : "All transactions", subtitle: `${filtered.length} ${t.overzicht.transactions} · ${t.dashboard.allTime}`, transactions: filtered })} />
        <StatCard label={t.dashboard.totalIncome} rawValue={income} formatter={fmt} sub={monthLabel} color="#22c55e" icon={ArrowUpRight} trend={calcTrend(income, prevIncome)} isDark={isDark}
          onClick={() => setDrawer({ title: t.general.income, subtitle: `${monthLabel} · ${thisMonthTxs.filter(tx => tx.amount > 0).length} transacties`, transactions: thisMonthTxs.filter(tx => tx.amount > 0) })} />
        <StatCard label={t.dashboard.totalExpenses} rawValue={expenses} formatter={fmt} sub={monthLabel} color="#f43f5e" icon={ArrowDownRight} trend={calcTrend(expenses, prevExpenses)} isDark={isDark}
          onClick={() => setDrawer({ title: t.general.expenses, subtitle: `${monthLabel} · ${thisMonthTxs.filter(tx => tx.amount < 0).length} transacties`, transactions: thisMonthTxs.filter(tx => tx.amount < 0) })} />
        <StatCard label={t.dashboard.monthlyBalance} rawValue={income - expenses} formatter={fmt} sub={monthLabel} color="#a855f7" icon={Activity} trend={calcTrend(income - expenses, prevIncome - prevExpenses)} isDark={isDark}
          onClick={() => setDrawer({ title: lang === "nl" ? "Maandoverzicht" : "Monthly overview", subtitle: monthLabel, transactions: thisMonthTxs })} />
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Category pie — selected month, interactive */}
        <div style={{ ...card(isDark) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 2 }}>{t.dashboard.expensesByCategory}</div>
          <div style={{ fontSize: 11, color: isDark ? "#334155" : "#94a3b8", marginBottom: 14 }}>{monthLabel} · klik een categorie voor detail</div>
          {(() => {
            const map = {};
            thisMonthTxs.filter(tx => tx.amount < 0).forEach(tx => {
              map[tx.category] = (map[tx.category] || 0) + Math.abs(tx.amount);
            });
            const pieData = Object.entries(map).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
            if (!pieData.length) return <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: isDark ? "#334155" : "#94a3b8", fontSize: 13 }}>Geen uitgaven deze maand</div>;

            const CatTip = ({ active, payload }) => active && payload?.length ? (
              <div style={{ background: isDark ? "#1a2235" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e6ed", borderRadius: 10, padding: "10px 14px", pointerEvents: "none" }}>
                <div style={{ color: CATEGORY_COLORS[payload[0].payload.name] || "#64748b", fontSize: 12, fontWeight: 700 }}>{t.categories[payload[0].payload.name] || payload[0].payload.name}</div>
                <div style={{ color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 15, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{fmt(payload[0].payload.value)}</div>
                <div style={{ fontSize: 11, color: isDark ? "#64748b" : "#64748b", marginTop: 3 }}>Klik voor transacties →</div>
              </div>
            ) : null;

            return (
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <ResponsiveContainer width="100%" height={180} minWidth={140}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveCategory(pieData[index]?.name)}
                      onMouseLeave={() => setActiveCategory(null)}
                      onClick={(entry) => {
                        const cat = entry?.name;
                        if (!cat) return;
                        const catTxs = thisMonthTxs.filter(tx => tx.category === cat && tx.amount < 0);
                        setDrawer({ title: t.categories[cat] || cat, subtitle: `${monthLabel} · ${catTxs.length} transacties`, transactions: catTxs });
                      }}
                      style={{ cursor: "pointer" }}>
                      {pieData.map(e => (
                        <Cell
                          key={e.name}
                          fill={CATEGORY_COLORS[e.name] || "#64748b"}
                          stroke={activeCategory === e.name ? "#ffffff" : "transparent"}
                          strokeWidth={activeCategory === e.name ? 2 : 0}
                          opacity={activeCategory && activeCategory !== e.name ? 0.4 : 1}
                          style={{ transition: "opacity 0.15s, stroke-width 0.15s", filter: activeCategory === e.name ? "brightness(1.15)" : "none" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CatTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 90 }}>
                  {pieData.slice(0, 7).map(d => (
                    <div key={d.name}
                      onClick={() => {
                        const catTxs = thisMonthTxs.filter(tx => tx.category === d.name && tx.amount < 0);
                        setDrawer({ title: t.categories[d.name] || d.name, subtitle: `${monthLabel} · ${catTxs.length} transacties`, transactions: catTxs });
                      }}
                      onMouseEnter={() => setActiveCategory(d.name)}
                      onMouseLeave={() => setActiveCategory(null)}
                      style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, cursor: "pointer", padding: "3px 6px", borderRadius: 6, background: activeCategory === d.name ? `${CATEGORY_COLORS[d.name] || "#64748b"}15` : "transparent", transition: "background 0.15s" }}>
                      <div style={{ width: 7, height: 7, borderRadius: 2, background: CATEGORY_COLORS[d.name] || "#64748b", flexShrink: 0, opacity: activeCategory && activeCategory !== d.name ? 0.4 : 1 }} />
                      <span style={{ color: activeCategory === d.name ? (CATEGORY_COLORS[d.name] || "#64748b") : isDark ? "#94a3b8" : "#475569", flex: 1, fontWeight: activeCategory === d.name ? 700 : 400 }}>{t.categories[d.name] || d.name}</span>
                      <span style={{ color: isDark ? "#f1f5f9" : "#0f172a", fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{fmtShort(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Income vs Expenses bar — all months, selected highlighted */}
        <div style={{ ...card(isDark) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 2 }}>{t.dashboard.incomeVsExpenses}</div>
          <div style={{ fontSize: 11, color: isDark ? "#334155" : "#94a3b8", marginBottom: 14 }}>Klik een balk om die maand te selecteren</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barGap={2} barSize={barData.length > 12 ? 5 : 8}
              onClick={d => d?.activePayload?.[0]?.payload?.ym && setSelectedMonth(d.activePayload[0].payload.ym)}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="income" radius={[3, 3, 0, 0]}>
                {barData.map(entry => <Cell key={entry.ym} fill={entry.ym === currentMonth ? "#22c55e" : "rgba(34,197,94,0.3)"} />)}
              </Bar>
              <Bar dataKey="expenses" radius={[3, 3, 0, 0]}>
                {barData.map(entry => <Cell key={entry.ym} fill={entry.ym === currentMonth ? "#f43f5e" : "rgba(244,63,94,0.3)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Daily spending trend for selected month ── */}
      <div style={{ ...card(isDark) }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 2 }}>{t.dashboard.spendingTrend}</div>
        <div style={{ fontSize: 11, color: isDark ? "#334155" : "#94a3b8", marginBottom: 14 }}>{monthLabel} — uitgaven per dag</div>
        {(() => {
          const dayMap = {};
          thisMonthTxs.filter(tx => tx.amount < 0).forEach(tx => {
            const day = tx.date.slice(8, 10);
            dayMap[day] = (dayMap[day] || 0) + Math.abs(tx.amount);
          });
          const trendData = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b))
            .map(([day, amount]) => ({ day: parseInt(day), amount: parseFloat(amount.toFixed(2)) }));
          if (!trendData.length) return <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: isDark ? "#334155" : "#94a3b8", fontSize: 13 }}>Geen uitgaven deze maand</div>;
          return (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} />
                <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                <Tooltip contentStyle={{ background: isDark ? "#1a2235" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e6ed", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: isDark ? "#64748b" : "#64748b" }} itemStyle={{ color: "#4f8ef7" }} formatter={v => [fmt(v), t.general.expenses]} labelFormatter={d => `Dag ${d}`} />
                <Area type="monotone" dataKey="amount" stroke="#4f8ef7" strokeWidth={2} fill="url(#trendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

    </div>
  );
}

// ─── TRANSACTIONS VIEW ─────────────────────────────────────────
function Transactions({ transactions, setTransactions, t, accounts, setAccounts, isDark, onImportDone, lang = "nl" }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [inlineCatInput, setInlineCatInput] = useState(null); // tx.id when adding new cat inline
  const [inlineCatVal, setInlineCatVal] = useState("");

  const addInlineCat = (txId) => {
    if (!inlineCatVal.trim()) return;
    const key = inlineCatVal.trim().toLowerCase().replace(/\s+/g, "_");
    CATEGORY_COLORS[key] = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#14b8a6","#22c55e","#3b82f6"][Math.floor(Math.random()*8)];
    updateCategory(txId, key);
    setInlineCatInput(null); setInlineCatVal("");
  };
  const [datePreset, setDatePreset] = useState("all"); // all | this_month | last_month | 3m | 6m | custom
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const today = new Date();
  const getPresetRange = (preset) => {
    const pad = n => String(n).padStart(2, "0");
    const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
    const fmt = (yr, mo, dy) => `${yr}-${pad(mo)}-${pad(dy)}`;
    if (preset === "this_month") return { from: fmt(y, m, 1), to: fmt(y, m, d) };
    if (preset === "last_month") {
      const lm = m === 1 ? 12 : m - 1, ly = m === 1 ? y - 1 : y;
      const lastDay = new Date(ly, lm, 0).getDate();
      return { from: fmt(ly, lm, 1), to: fmt(ly, lm, lastDay) };
    }
    if (preset === "3m") { const d3 = new Date(today); d3.setMonth(d3.getMonth() - 3); return { from: d3.toISOString().slice(0,10), to: fmt(y, m, d) }; }
    if (preset === "6m") { const d6 = new Date(today); d6.setMonth(d6.getMonth() - 6); return { from: d6.toISOString().slice(0,10), to: fmt(y, m, d) }; }
    return null;
  };

  const filtered = [...transactions]
    .filter(tx => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        tx.description.toLowerCase().includes(q) ||
        (tx.counterparty || "").toLowerCase().includes(q) ||
        (tx.category || "").toLowerCase().includes(q) ||
        (tx.paymentType || "").toLowerCase().includes(q);
      const matchCat = !filterCat || tx.category === filterCat;
      let matchDate = true;
      if (datePreset !== "all") {
        const range = datePreset === "custom" ? { from: dateFrom, to: dateTo } : getPresetRange(datePreset);
        if (range?.from) matchDate = tx.date >= range.from;
        if (range?.to) matchDate = matchDate && tx.date <= range.to;
      }
      return matchSearch && matchCat && matchDate;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleImport = (newTxs, importedAccounts) => {
    if (onImportDone) {
      onImportDone(newTxs, importedAccounts);
    } else {
      setTransactions(prev => [...newTxs, ...prev]);
    }
  };

  const updateCategory = (id, cat) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, category: cat } : tx));
    setEditCat(null);
  };

  return (
    <div>
      {showUpload && <CSVModal onClose={() => setShowUpload(false)} onImport={(txs, importedAccounts) => handleImport(txs, importedAccounts)} t={t} accounts={accounts} setAccounts={setAccounts} isDark={isDark} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a" }}>{t.transactions.title}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowUpload(true)} style={{ ...pillBtn(), fontSize: 13 }}>
            <Upload size={15} /> {t.transactions.uploadCSV}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.transactions.search}
            style={{ width: "100%", padding: "10px 16px 10px 40px", background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e6ed", borderRadius: 12, color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: isDark ? "#334155" : "#94a3b8" }}>
            <Activity size={14} />
          </div>
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding: "10px 14px", background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e6ed", borderRadius: 12, color: filterCat ? (isDark ? "#f1f5f9" : "#0f172a") : "#334155", fontSize: 13, cursor: "pointer", outline: "none" }}>
          <option value="">{t.transactions.filter} — {lang === "en" ? "All" : "Alle"}</option>
          {Object.keys(CATEGORY_COLORS).map(k => <option key={k} value={k}>{t.categories[k] || k}</option>)}
        </select>
      </div>

      {/* Date range filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { id: "all", label: lang === "nl" ? "Alles" : "All" },
          { id: "this_month", label: lang === "nl" ? "Deze maand" : "This month" },
          { id: "last_month", label: lang === "nl" ? "Vorige maand" : "Last month" },
          { id: "3m", label: t.overzicht.months3 },
          { id: "6m", label: t.overzicht.months6 },
          { id: "custom", label: lang === "nl" ? "Aangepast" : "Custom" },
        ].map(p => (
          <button key={p.id} onClick={() => setDatePreset(p.id)}
            style={{ padding: "6px 14px", borderRadius: 20, border: datePreset === p.id ? `1.5px solid #4f8ef7` : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed"}`, background: datePreset === p.id ? "rgba(79,142,247,0.12)" : "transparent", color: datePreset === p.id ? "#4f8ef7" : isDark ? "#64748b" : "#94a3b8", fontSize: 12, fontWeight: datePreset === p.id ? 700 : 400, cursor: "pointer" }}>
            {p.label}
          </button>
        ))}
        {datePreset === "custom" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ padding: "6px 10px 6px 32px", borderRadius: 8, border: "2px solid #4f8ef7", background: isDark ? "rgba(79,142,247,0.08)" : "#eff6ff", color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 12, outline: "none", colorScheme: isDark ? "dark" : "light" }}/>
              <Calendar size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#4f8ef7", pointerEvents: "none" }}/>
            </div>
            <span style={{ color: isDark ? "#475569" : "#94a3b8", fontSize: 12 }}>tot</span>
            <div style={{ position: "relative" }}>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ padding: "6px 10px 6px 32px", borderRadius: 8, border: "2px solid #4f8ef7", background: isDark ? "rgba(79,142,247,0.08)" : "#eff6ff", color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 12, outline: "none", colorScheme: isDark ? "dark" : "light" }}/>
              <Calendar size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#4f8ef7", pointerEvents: "none" }}/>
            </div>
          </div>
        )}
        <span style={{ fontSize: 11, color: isDark ? "#334155" : "#94a3b8", marginLeft: "auto" }}>{filtered.length} transacties</span>
      </div>

      {/* Table */}
      <div style={{ ...card(isDark), padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "100px" }}/>
            <col style={{ width: "auto" }}/>
            <col style={{ width: "160px" }}/>
            <col style={{ width: "160px" }}/>
            <col style={{ width: "130px" }}/>
          </colgroup>
          <thead>
            <tr style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e6ed" }}>
              {["date", "description", "category", "account", "amount"].map(col => (
                <th key={col} style={{ padding: "14px 16px", textAlign: col === "amount" ? "right" : "left", fontSize: 11, fontWeight: 700, color: isDark ? "#334155" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {t.transactions.columns[col]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: isDark ? "#334155" : "#94a3b8" }}>{t.transactions.noTransactions}</td></tr>
            ) : filtered.map((tx, i) => (
              <tr key={tx.id} style={{ borderBottom: i < filtered.length - 1 ? isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #f1f5f9" : "none", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "8px 16px", fontSize: 12, color: isDark ? "#64748b" : "#64748b", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>{tx.date}</td>
                <td style={{ padding: "8px 16px", fontSize: 13, color: isDark ? "#f1f5f9" : "#0f172a" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                    <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0, maxWidth: 220 }}>{tx.counterparty || tx.description}</span>
                    {tx.counterparty && tx.description && tx.description !== tx.counterparty && (
                      <span style={{ fontSize: 11, color: "rgba(100,116,139,0.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{tx.description}</span>
                    )}
                    {tx.paymentType && (
                      <span style={{ flexShrink: 0, padding: "1px 6px", borderRadius: 4, background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", fontSize: 10, fontWeight: 600, color: isDark ? "#64748b" : "#94a3b8", whiteSpace: "nowrap" }}>{tx.paymentType}</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "8px 16px" }}>
                  {inlineCatInput === tx.id ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <input autoFocus value={inlineCatVal} onChange={e => setInlineCatVal(e.target.value)}
                        placeholder="Naam categorie..."
                        onKeyDown={e => { if (e.key === "Enter") addInlineCat(tx.id); if (e.key === "Escape") { setInlineCatInput(null); setInlineCatVal(""); } }}
                        style={{ flex: 1, padding: "4px 8px", background: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc", border: "2px solid #4f8ef7", borderRadius: 7, color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 11, outline: "none", minWidth: 0 }}/>
                      <button onClick={() => addInlineCat(tx.id)} style={{ width: 24, height: 24, borderRadius: 6, background: "#22c55e", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={10}/></button>
                      <button onClick={() => { setInlineCatInput(null); setInlineCatVal(""); }} style={{ width: 24, height: 24, borderRadius: 6, background: "transparent", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#e2e6ed"}`, color: isDark ? "#64748b" : "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><X size={10}/></button>
                    </div>
                  ) : editCat === tx.id ? (
                    <select autoFocus defaultValue={tx.category}
                      onChange={e => { if (e.target.value === "__new__") { setInlineCatInput(tx.id); setInlineCatVal(""); setEditCat(null); } else updateCategory(tx.id, e.target.value); }}
                      onBlur={e => { if (e.target.value !== "__new__") setEditCat(null); }}
                      style={{ padding: "4px 10px", background: isDark ? "#1a2235" : "#f8fafc", border: `1px solid ${CATEGORY_COLORS[tx.category] || "#334155"}`, borderRadius: 8, color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 12, cursor: "pointer", outline: "none" }}>
                      {Object.keys(CATEGORY_COLORS).map(k => <option key={k} value={k}>{t.categories[k] || k}</option>)}
                      <option disabled>──────────</option>
                      <option value="__new__">+ Nieuwe categorie...</option>
                    </select>
                  ) : (
                    <div onClick={() => setEditCat(tx.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, background: `${CATEGORY_COLORS[tx.category] || "#334155"}20`, cursor: "pointer", fontSize: 12, color: CATEGORY_COLORS[tx.category] || "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
                      <div style={{ width: 6, height: 6, borderRadius: 2, background: CATEGORY_COLORS[tx.category] || "#64748b", flexShrink: 0 }} />
                      {t.categories[tx.category] || tx.category}
                      <Edit2 size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
                    </div>
                  )}
                </td>
                <td style={{ padding: "8px 16px", fontSize: 12, color: isDark ? "#64748b" : "#64748b", whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Building2 size={12} />
                    {tx.account}
                  </div>
                </td>
                <td style={{ padding: "8px 16px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: tx.amount < 0 ? "#f43f5e" : "#22c55e", whiteSpace: "nowrap" }}>
                  {tx.amount < 0 ? "−" : "+"}{fmt(Math.abs(tx.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── INVESTMENTS VIEW ──────────────────────────────────────────
// CoinGecko coin ID mapping (name → coingecko id)


// ─── FINNHUB KEY (hardcoded) ──────────────────────────────────

function Investments({ t, isDark, useMockData = true, investments, setInvestments, lang = "nl", allTransactions = [], goals = [], setGoals }) {
  // Use passed-in state if available, otherwise fall back to local
  const [localInvestments, setLocalInvestments] = useState(useMockData ? MOCK_INVESTMENTS : []);
  const invs = investments !== undefined ? investments : localInvestments;
  const setInvs = setInvestments || setLocalInvestments;
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("choose"); // "choose" | "transaction" | "manual"
  const [txSearch, setTxSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState(null);
  const [form, setForm] = useState({ name: "", type: "crypto", invested: "", currentValue: "", ticker: "", units: "", savingsCurrency: "EUR", linkedGoalId: "", address: "", wozValue: "", mortgage: "" });
  const [prices, setPrices] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const closeForm = () => {
    setShowForm(false);
    setFormMode("choose");
    setTxSearch("");
    setSelectedTx(null);
    setForm({ name: "", type: "crypto", invested: "", currentValue: "", ticker: "", units: "", savingsCurrency: "EUR", linkedGoalId: "", address: "", wozValue: "", mortgage: "" });
  };

  // Transactions with category "investments" for the fetch-from-tx flow
  const investmentTxs = allTransactions.filter(tx =>
    tx.category && tx.category.toLowerCase().includes("invest")
  );

  const [ticker, setTicker] = useState({});
  const [tickerLoading, setTickerLoading] = useState(false);
  const [tickerLastUpdate, setTickerLastUpdate] = useState(null);
  const [tickerCurrency, setTickerCurrency] = useState("EUR");
  const [hiddenInvs, setHiddenInvs] = useState(new Set());
  const [invPeriod, setInvPeriod] = useState("Max");
  const [periodBaselines, setPeriodBaselines] = useState({});
  const [periodLoading, setPeriodLoading] = useState(false);
  const [fxRates, setFxRates] = useState({});

  const TICKER_ASSETS = [
    { id: "bitcoin",  label: "Bitcoin",  emoji: "₿",  type: "crypto", color: "#f59e0b" },
    { id: "ethereum", label: "Ethereum", emoji: "Ξ",  type: "crypto", color: "#6366f1" },
    { id: "gold",     label: "Goud",     emoji: "🥇", type: "metal",  color: "#d4af37" },
    { id: "silver",   label: "Zilver",   emoji: "🥈", type: "metal",  color: "#94a3b8" },
    { id: "aex",      label: "AEX",      emoji: "🇳🇱", type: "stock",  color: "#ff6b35" },
    { id: "nasdaq",   label: "Nasdaq",   emoji: "📈", type: "stock",  color: "#22c55e" },
  ];


  // ── Marktprijzen via gratis publieke APIs ────────────────────────────────

  // CoinGecko IDs voor crypto
  const COINGECKO_IDS = {
    bitcoin: "bitcoin",   btc: "bitcoin",
    ethereum: "ethereum", eth: "ethereum",
    solana: "solana",     sol: "solana",
    cardano: "cardano",   ada: "cardano",
    xrp: "ripple",        ripple: "ripple",
    dogecoin: "dogecoin", doge: "dogecoin",
    bnb: "binancecoin",
    litecoin: "litecoin", ltc: "litecoin",
    polkadot: "polkadot", dot: "polkadot",
    avalanche: "avalanche-2", avax: "avalanche-2",
    polygon: "matic-network", matic: "matic-network",
    chainlink: "chainlink", link: "chainlink",
  };

  // Yahoo Finance symbolen voor indices/ETFs
  const YAHOO_SYMBOLS = {
    aex: "^AEX", nasdaq: "^IXIC", sp500: "^GSPC",
    vwce: "VWCE.AS", iwda: "IWDA.AS", voo: "VOO",
  };

  const PROXY = "https://corsproxy.io/?";

  const tsFmt = () => new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  // Haal goud/zilver + EUR wisselkoers op
  const fetchMetals = async () => {
    const fxRes = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR", { signal: AbortSignal.timeout(8000) });
    if (!fxRes.ok) throw new Error("fx failed");
    const fx = await fxRes.json();
    const rate = fx.rates.EUR;

    // Probeer meerdere gratis metal APIs
    const METAL_URLS = [
      "https://api.metals.live/v1/spot",
      "https://metals.live/api/spot",
    ];
    let metals = null;
    for (const url of METAL_URLS) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (r.ok) { metals = await r.json(); break; }
      } catch {}
    }
    if (!metals) throw new Error("no metals data");

    const getPrice = (sym) => {
      if (Array.isArray(metals)) {
        const item = metals.find(m => (m.symbol||m.Symbol||m.name||"").toUpperCase().startsWith(sym.replace("X","")));
        return item ? (item.price ?? item.Price ?? item.ask ?? item.bid) : null;
      }
      // object format: { gold: 1234, silver: 15, XAU: 1234, ... }
      const keys = { XAU: ["gold","Gold","XAU","xau"], XAG: ["silver","Silver","XAG","xag"] };
      for (const k of keys[sym] || []) { if (metals[k] != null) return metals[k]; }
      return null;
    };

    const goldUSD   = getPrice("XAU");
    const silverUSD = getPrice("XAG");
    return {
      gold:   goldUSD   != null ? { price: Math.round(goldUSD   * rate * 100) / 100, unit: "/oz", source: "metals.live" } : null,
      silver: silverUSD != null ? { price: Math.round(silverUSD * rate * 100) / 100, unit: "/oz", source: "metals.live" } : null,
    };
  };

  // Haal Yahoo Finance prijs op (via CORS proxy)
  const fetchYahoo = async (symbol) => {
    const url = `${PROXY}https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error("yahoo " + res.status);
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) throw new Error("no price");
    const current = meta.regularMarketPrice;
    const prev = meta.previousClose || meta.chartPreviousClose;
    const change24h = prev ? ((current - prev) / prev) * 100 : null;
    return { price: Math.round(current * 100) / 100, change24h, source: "Yahoo Finance" };
  };

  const lastTickerFetch = useRef(0);
  const fetchTicker = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastTickerFetch.current < 30_000) return; // min 30s between calls
    lastTickerFetch.current = now;
    setTickerLoading(true);
    const results = {};

    // Haal EUR/USD wisselkoers op (nodig voor conversies)
    let eurusd = 1.1;
    try { const fx = await fetchYahoo("EURUSD=X"); eurusd = fx.price || 1.1; } catch {}

    // 1. Crypto via CoinGecko (EUR + USD in één call)
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=eur,usd&include_24hr_change=true",
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const d = await res.json();
        if (d.bitcoin)  results.bitcoin  = { priceEur: d.bitcoin.eur,  priceUsd: d.bitcoin.usd,  change24h: d.bitcoin.eur_24h_change,  source: "CoinGecko" };
        if (d.ethereum) results.ethereum = { priceEur: d.ethereum.eur, priceUsd: d.ethereum.usd, change24h: d.ethereum.eur_24h_change, source: "CoinGecko" };
      }
    } catch (e) { console.warn("CoinGecko ticker:", e.message); }

    // 2. Goud & Zilver via Yahoo Finance futures (GC=F / SI=F in USD)
    try {
      const [goldRes, silverRes] = await Promise.all([fetchYahoo("GC=F"), fetchYahoo("SI=F")]);
      const OZ = 31.1035;
      results.gold   = { priceUsd: Math.round(goldRes.price   / OZ * 100) / 100, priceEur: Math.round(goldRes.price   / OZ / eurusd * 100) / 100, change24h: goldRes.change24h,   unit: "/gram", source: "Yahoo Finance" };
      results.silver = { priceUsd: Math.round(silverRes.price / OZ * 100) / 100, priceEur: Math.round(silverRes.price / OZ / eurusd * 100) / 100, change24h: silverRes.change24h, unit: "/gram", source: "Yahoo Finance" };
    } catch (e) { console.warn("Metals ticker:", e.message); }

    // 3. AEX (EUR) & Nasdaq (USD) via Yahoo
    try {
      const aexRes = await fetchYahoo("^AEX");
      results.aex = { priceEur: aexRes.price, priceUsd: Math.round(aexRes.price * eurusd * 100) / 100, change24h: aexRes.change24h, source: "Yahoo Finance" };
    } catch (e) { console.warn("aex ticker:", e.message); results.aex = { error: true }; }
    try {
      const nqRes = await fetchYahoo("^IXIC");
      results.nasdaq = { priceUsd: nqRes.price, priceEur: Math.round(nqRes.price / eurusd * 100) / 100, change24h: nqRes.change24h, source: "Yahoo Finance" };
    } catch (e) { console.warn("nasdaq ticker:", e.message); results.nasdaq = { error: true }; }

    setTicker(prev => ({
      ...prev,
      ...Object.fromEntries(
        ["bitcoin","ethereum","gold","silver","aex","nasdaq"].map(k => [k, results[k] ?? { error: true }])
      ),
    }));
    setTickerLoading(false);
    setTickerLastUpdate(tsFmt());
  };

  useEffect(() => { fetchTicker(); }, []);

  const fetchPrice = async (inv) => {
    setPrices(prev => ({ ...prev, [inv.id]: { loading: true, error: null } }));
    const key = (inv.ticker || inv.name || "").toLowerCase().replace(/[\s-]/g, "");
    try {
      let result = null;

      if (COINGECKO_IDS[key]) {
        const cgId = COINGECKO_IDS[key];
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=eur&include_24hr_change=true`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (res.ok) {
          const d = await res.json();
          if (d[cgId]?.eur) result = { price: d[cgId].eur, change24h: d[cgId].eur_24h_change, source: "CoinGecko" };
        }
      } else if (key === "gold" || key === "goud" || key === "xau") {
        const [g, fx] = await Promise.all([fetchYahoo("GC=F"), fetchYahoo("EURUSD=X")]);
        result = { price: Math.round(g.price / 31.1035 / fx.price * 100) / 100, change24h: g.change24h, unit: "/gram", source: "Yahoo Finance" };
      } else if (key === "silver" || key === "zilver" || key === "xag") {
        const [s, fx] = await Promise.all([fetchYahoo("SI=F"), fetchYahoo("EURUSD=X")]);
        result = { price: Math.round(s.price / 31.1035 / fx.price * 100) / 100, change24h: s.change24h, unit: "/gram", source: "Yahoo Finance" };
      } else {
        // ETF / aandeel / index
        const sym = YAHOO_SYMBOLS[key] || inv.ticker?.toUpperCase();
        if (sym) result = await fetchYahoo(sym);
      }

      if (!result?.price) throw new Error("geen prijs");
      const ts = tsFmt();
      setPrices(prev => ({ ...prev, [inv.id]: { ...result, lastUpdated: ts, loading: false } }));
      if (inv.units) {
        setInvs(prev => prev.map(i => i.id === inv.id
          ? { ...i, currentValue: parseFloat((result.price * inv.units).toFixed(2)) } : i));
      }
    } catch (e) {
      console.warn("fetchPrice:", e.message);
      setPrices(prev => ({ ...prev, [inv.id]: { loading: false, error: "Niet beschikbaar" } }));
    }
  };

  const fetchAllPrices = async () => {
    setGlobalLoading(true);

    // Groepeer crypto voor batch call
    const cryptoInvs = invs.filter(inv => COINGECKO_IDS[(inv.ticker||inv.name||"").toLowerCase().replace(/[\s-]/g,"")]);
    const otherInvs  = invs.filter(inv => !COINGECKO_IDS[(inv.ticker||inv.name||"").toLowerCase().replace(/[\s-]/g,"")]);

    if (cryptoInvs.length > 0) {
      const ids = [...new Set(cryptoInvs.map(inv => COINGECKO_IDS[(inv.ticker||inv.name||"").toLowerCase().replace(/[\s-]/g,"")]))].join(",");
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur&include_24hr_change=true`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (res.ok) {
          const d = await res.json();
          const ts = tsFmt();
          cryptoInvs.forEach(inv => {
            const cgId = COINGECKO_IDS[(inv.ticker||inv.name||"").toLowerCase().replace(/[\s-]/g,"")];
            if (d[cgId]?.eur) {
              const price = d[cgId].eur;
              setPrices(prev => ({ ...prev, [inv.id]: { price, change24h: d[cgId].eur_24h_change, source: "CoinGecko", lastUpdated: ts, loading: false } }));
              if (inv.units) setInvs(prev => prev.map(i => i.id === inv.id ? { ...i, currentValue: parseFloat((price * inv.units).toFixed(2)) } : i));
            }
          });
        }
      } catch (e) { console.warn("Batch crypto:", e.message); await Promise.all(cryptoInvs.map(fetchPrice)); }
    }

    await Promise.all(otherInvs.map(fetchPrice));
    setGlobalLoading(false);
    setLastRefresh(tsFmt());
  };

  const PERIOD_CONFIG = {
    "1D":  { cgDays: 1,    yhRange: "2d",   yhInterval: "60m" },
    "5D":  { cgDays: 5,    yhRange: "5d",   yhInterval: "1d"  },
    "1M":  { cgDays: 30,   yhRange: "1mo",  yhInterval: "1d"  },
    "6M":  { cgDays: 180,  yhRange: "6mo",  yhInterval: "1wk" },
    "YTD": { cgDays: Math.floor((Date.now() - new Date(new Date().getFullYear(),0,1)) / 86400000), yhRange: "ytd", yhInterval: "1d" },
    "1Y":  { cgDays: 365,  yhRange: "1y",   yhInterval: "1wk" },
    "5Y":  { cgDays: 1825, yhRange: "5y",   yhInterval: "1mo" },
    "Max": null,
  };

  const fetchPeriodBaselines = async (period) => {
    if (period === "Max" || invs.length === 0) { setPeriodBaselines({}); return; }
    setPeriodLoading(true);
    const cfg = PERIOD_CONFIG[period];
    const baselines = {};
    await Promise.all(invs.map(async (inv) => {
      const key = (inv.ticker || inv.name || "").toLowerCase().replace(/[\s-]/g, "");
      const cgId = COINGECKO_IDS[key];
      try {
        if (cgId) {
          const res = await fetch(
            `https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=eur&days=${cfg.cgDays}`,
            { signal: AbortSignal.timeout(10000) }
          );
          if (res.ok) {
            const data = await res.json();
            const first = data.prices?.find(p => p[1] != null);
            if (first) baselines[inv.id] = first[1];
          }
        } else {
          const sym = YAHOO_SYMBOLS[key] || inv.ticker?.toUpperCase();
          if (!sym) return;
          const url = `${PROXY}https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=${cfg.yhInterval}&range=${cfg.yhRange}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
          if (res.ok) {
            const data = await res.json();
            const closes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
            const first = closes?.find(p => p != null);
            if (first != null) {
              // Metals need USD→EUR conversion
              if (key === "gold" || key === "goud" || key === "xau") baselines[inv.id] = first / 31.1035;
              else if (key === "silver" || key === "zilver" || key === "xag") baselines[inv.id] = first / 31.1035;
              else baselines[inv.id] = first;
            }
          }
        }
      } catch (e) { console.warn(`Period baseline ${inv.name}:`, e.message); }
    }));
    setPeriodBaselines(baselines);
    setPeriodLoading(false);
  };

  useEffect(() => { fetchPeriodBaselines(invPeriod); }, [invPeriod]);

  // Live FX rates via open.er-api.com (supports GHS, AED, MAD + all ECB currencies)
  const fetchFxRates = async () => {
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/EUR`, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const data = await res.json();
        if (data.result === "success" && data.rates) {
          // data.rates = { USD: 1.08, GHS: 16.5, ... } = 1 EUR → X foreign
          // Invert: 1 foreign = Y EUR
          const inverted = { EUR: 1 };
          Object.entries(data.rates).forEach(([cur, rate]) => { if (rate > 0) inverted[cur] = 1 / rate; });
          setFxRates(inverted);
        }
      }
    } catch (e) { console.warn("FX rates:", e.message); }
  };
  useEffect(() => { fetchFxRates(); }, []);

  // Auto-update EUR value of savings positions when fxRates refresh
  useEffect(() => {
    if (Object.keys(fxRates).length === 0) return;
    setInvs(prev => prev.map(inv => {
      if (inv.type !== "savings" || !inv.savingsCurrency || inv.savingsCurrency === "EUR") return inv;
      const rate = fxRates[inv.savingsCurrency];
      if (!rate) return inv;
      const newEur = parseFloat((inv.savingsAmount * rate).toFixed(2));
      return { ...inv, currentValue: newEur, liveValue: newEur };
    }));
  }, [fxRates]);

  const addInvestment = () => {
    if (!form.name || !form.invested) return;
    const savingsAmount = parseFloat(form.invested);
    const isSavings = form.type === "savings";
    const cur = isSavings ? (form.savingsCurrency || "EUR") : "EUR";
    const rate = fxRates[cur] || 1;
    // invested = original amount in original currency (for savings); in EUR for others
    const invested = isSavings ? parseFloat((savingsAmount * rate).toFixed(2)) : savingsAmount;
    const currentValue = form.currentValue ? parseFloat(form.currentValue) : invested;
    const units = form.units ? parseFloat(form.units) : null;
    const isRealEstate = form.type === "real_estate";
    // Real estate: currentValue = WOZ - mortgage
    let finalCurrentValue = currentValue;
    if (isRealEstate && form.wozValue) {
      const woz = parseFloat(form.wozValue) || 0;
      const mort = parseFloat(form.mortgage) || 0;
      finalCurrentValue = parseFloat((woz - mort).toFixed(2));
    }
    const invId = Date.now();
    setInvs(prev => [...prev, {
      id: invId, name: form.name, type: form.type,
      invested, currentValue: finalCurrentValue,
      ticker: isRealEstate ? undefined : form.ticker,
      units: (isSavings || isRealEstate) ? null : units,
      ...(isSavings && cur !== "EUR" ? { savingsCurrency: cur, savingsAmount } : {}),
      ...(form.linkedGoalId ? { linkedGoalId: parseInt(form.linkedGoalId) } : {}),
      ...(isRealEstate ? { address: form.address, wozValue: parseFloat(form.wozValue) || 0, mortgage: parseFloat(form.mortgage) || 0 } : {})
    }]);
    // Update linked goal's current amount
    if (form.linkedGoalId && setGoals) {
      const eurValue = parseFloat(form.currentValue) || invested;
      setGoals(prev => prev.map(g =>
        g.id === parseInt(form.linkedGoalId)
          ? { ...g, current: parseFloat((g.current + eurValue).toFixed(2)) }
          : g
      ));
    }
    closeForm();
  };

  const removeInvestment = (id) => {
    setInvs(prev => prev.filter(i => i.id !== id));
    setPrices(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const enriched = invs.map(inv => {
    const p = prices[inv.id];
    const liveValue = p?.price ? parseFloat((p.price * (inv.units || 1)).toFixed(2)) : inv.currentValue;
    return { ...inv, liveValue, liveData: p };
  });

  const visibleEnriched = enriched.filter(i => !hiddenInvs.has(i.id));
  const totalCurrent  = visibleEnriched.reduce((s, i) => s + i.liveValue, 0);
  const totalInvested = invPeriod === "Max"
    ? visibleEnriched.reduce((s, i) => s + i.invested, 0)
    : visibleEnriched.reduce((s, i) => {
        const base = periodBaselines[i.id];
        return s + (base != null ? base * (i.units || 1) : i.invested);
      }, 0);
  const totalProfit   = totalCurrent - totalInvested;
  const roi = totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(1) : "0.0";

  const allocationData = useMemo(() => {
    const map = {};
    visibleEnriched.forEach(i => { map[i.type] = (map[i.type] || 0) + i.liveValue; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [visibleEnriched]);

  const inputStyle = {
    width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: isDark ? "#f1f5f9" : "#0f172a",
    fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" };

  return (
    <div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Add Investment Form (inline, no overlay) ── */}
      {showForm && (
        <div style={{ ...card(isDark), marginBottom: 20, border: isDark ? "1px solid rgba(79,142,247,0.3)" : "1px solid #93c5fd", position: "relative" }}>
          <button onClick={closeForm} style={{ position: "absolute", top: 16, right: 16, width: 30, height: 30, borderRadius: 8, background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e6ed"}`, color: isDark ? "#64748b" : "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
          <div style={{ fontSize: 17, fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 4 }}>{t.investments.addInvestment}</div>
          <div style={{ fontSize: 12, color: isDark ? "#334155" : "#94a3b8", marginBottom: 20 }}>{lang === "nl" ? "Voeg een aandeel, crypto of andere investering toe" : "Add a stock, crypto or other investment"}</div>

          {/* ── STEP 1: Choose method ── */}
          {formMode === "choose" && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => setFormMode("transaction")}
                style={{ flex: 1, minWidth: 180, padding: "18px 16px", borderRadius: 14, border: isDark ? "1px solid rgba(79,142,247,0.25)" : "1px solid #93c5fd", background: isDark ? "rgba(79,142,247,0.07)" : "#eff6ff", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(79,142,247,0.14)" : "#dbeafe"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isDark ? "rgba(79,142,247,0.07)" : "#eff6ff"; }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>📄</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 3 }}>{lang === "nl" ? "Haal op uit transacties" : "Import from transactions"}</div>
                <div style={{ fontSize: 11, color: isDark ? "#475569" : "#64748b" }}>{lang === "nl" ? "Kies een transactie met categorie Investeringen" : "Pick a transaction with category Investments"}</div>
              </button>
              <button onClick={() => setFormMode("manual")}
                style={{ flex: 1, minWidth: 180, padding: "18px 16px", borderRadius: 14, border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e6ed", background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "#f1f5f9"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"; }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>✏️</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 3 }}>{lang === "nl" ? "Handmatig invoeren" : "Enter manually"}</div>
                <div style={{ fontSize: 11, color: isDark ? "#475569" : "#64748b" }}>{lang === "nl" ? "Vul zelf alle gegevens in" : "Fill in all details yourself"}</div>
              </button>
            </div>
          )}

          {/* ── STEP 2a: Pick from transactions ── */}
          {formMode === "transaction" && !selectedTx && (
            <div>
              <button onClick={() => setFormMode("choose")} style={{ background: "none", border: "none", color: isDark ? "#4f8ef7" : "#2563eb", cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 14, padding: 0 }}>← {lang === "nl" ? "Terug" : "Back"}</button>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: isDark ? "#475569" : "#94a3b8" }} />
                <input value={txSearch} onChange={e => setTxSearch(e.target.value)}
                  placeholder={lang === "nl" ? "Zoek transactie..." : "Search transaction..."}
                  style={{ ...inputStyle, paddingLeft: 36 }} />
              </div>
              {investmentTxs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: isDark ? "#475569" : "#94a3b8", fontSize: 13 }}>
                  {lang === "nl" ? "Geen transacties gevonden met categorie 'Investeringen'" : "No transactions found with category 'Investments'"}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
                  {investmentTxs
                    .filter(tx => {
                      const q = txSearch.toLowerCase();
                      return !q || (tx.counterparty||"").toLowerCase().includes(q) || (tx.description||"").toLowerCase().includes(q);
                    })
                    .map(tx => (
                      <button key={tx.id} onClick={() => {
                        setSelectedTx(tx);
                        setForm(p => ({ ...p, name: tx.counterparty || tx.description || "", invested: Math.abs(tx.amount).toFixed(2) }));
                      }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e6ed", cursor: "pointer", textAlign: "left", transition: "all 0.12s" }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(79,142,247,0.1)" : "#eff6ff"}
                        onMouseLeave={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#f1f5f9" : "#0f172a" }}>{tx.counterparty || tx.description}</div>
                          <div style={{ fontSize: 11, color: isDark ? "#475569" : "#94a3b8", marginTop: 2 }}>{tx.date}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: tx.amount < 0 ? "#f43f5e" : "#22c55e", fontFamily: "monospace" }}>
                          {tx.amount < 0 ? "-" : "+"}{fmt(Math.abs(tx.amount))}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2b: Fill form (manual OR after tx selected) ── */}
          {(formMode === "manual" || (formMode === "transaction" && selectedTx)) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(formMode === "manual" || selectedTx) && (
                <button onClick={() => { setFormMode(selectedTx ? "transaction" : "choose"); setSelectedTx(null); }}
                  style={{ background: "none", border: "none", color: isDark ? "#4f8ef7" : "#2563eb", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0, textAlign: "left" }}>← {lang === "nl" ? "Terug" : "Back"}</button>
              )}
              {selectedTx && (
                <div style={{ padding: "8px 12px", background: isDark ? "rgba(34,197,94,0.08)" : "#f0fdf4", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, fontSize: 12, color: isDark ? "#86efac" : "#16a34a" }}>
                  📄 {lang === "nl" ? "Transactie" : "Transaction"}: {selectedTx.counterparty || selectedTx.description} · {selectedTx.date} · {fmt(Math.abs(selectedTx.amount))}
                </div>
              )}

              {/* Type selector */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(t.investments.types).map(([k, v]) => (
                  <button key={k} onClick={() => setForm(p => ({ ...p, type: k }))}
                    style={{ padding: "7px 13px", borderRadius: 50, border: form.type === k ? `1.5px solid ${INVESTMENT_COLORS[k]}` : isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e6ed", background: form.type === k ? `${INVESTMENT_COLORS[k]}18` : isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", color: form.type === k ? INVESTMENT_COLORS[k] : isDark ? "#475569" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: form.type === k ? 700 : 500, transition: "all 0.15s" }}>
                    {v}
                  </button>
                ))}
              </div>

              {/* Name + Ticker/Address row */}
              <div style={{ display: "grid", gridTemplateColumns: (form.type === "savings" || form.type === "real_estate") ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>{lang === "nl" ? "Naam" : "Name"}</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder={form.type === "crypto" ? "Bitcoin" : form.type === "stocks" ? "Apple" : form.type === "metals" ? "Goud" : form.type === "savings" ? "ING Spaarrekening" : form.type === "real_estate" ? "Woning Amsterdam" : "Naam"} style={inputStyle} />
                </div>
                {form.type !== "savings" && form.type !== "real_estate" && (
                  <div>
                    <label style={labelStyle}>Ticker {form.type === "crypto" ? "(CoinGecko ID)" : form.type === "metals" ? "(metaalnaam)" : "(beurssymbool)"}</label>
                    <input value={form.ticker} onChange={e => setForm(p => ({ ...p, ticker: e.target.value }))}
                      placeholder={form.type === "crypto" ? "bitcoin" : form.type === "metals" ? "goud / zilver" : "AAPL"}
                      style={{ ...inputStyle, fontFamily: "monospace", fontSize: 13 }} />
                  </div>
                )}
              </div>
              {/* Real Estate: Address field */}
              {form.type === "real_estate" && (
                <div>
                  <label style={labelStyle}>{lang === "nl" ? "Adres" : "Address"}</label>
                  <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="Keizersgracht 123, Amsterdam" style={inputStyle} />
                </div>
              )}

              {/* Invested + Units */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  {form.type === "savings" ? (
                    <>
                      <label style={labelStyle}>{lang === "nl" ? "Gespaard" : "Saved"}</label>
                      <div style={{ display: "flex", gap: 6 }}>
                        <select value={form.savingsCurrency} onChange={e => {
                            const cur = e.target.value;
                            setForm(p => {
                              const rate = fxRates[cur] || null;
                              const eurVal = (rate && p.invested) ? (parseFloat(p.invested) * rate).toFixed(2) : p.currentValue;
                              return { ...p, savingsCurrency: cur, currentValue: cur === "EUR" ? p.invested : (eurVal || "") };
                            });
                          }}
                          style={{ ...inputStyle, width: "auto", minWidth: 80, paddingLeft: 10, paddingRight: 10, cursor: "pointer" }}>
                          {["EUR","USD","GBP","CHF","JPY","CAD","AUD","GHS","AED","MAD"].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="number" value={form.invested} onChange={e => {
                            const val = e.target.value;
                            setForm(p => {
                              const rate = fxRates[p.savingsCurrency] || null;
                              const eurVal = (rate && val && p.savingsCurrency !== "EUR") ? (parseFloat(val) * rate).toFixed(2) : val;
                              return { ...p, invested: val, currentValue: eurVal || "" };
                            });
                          }}
                          placeholder="0,00" style={inputStyle} />
                      </div>
                    </>
                  ) : (
                    <>
                      <label style={labelStyle}>
                        {form.type === "real_estate"
                          ? (lang === "nl" ? "Aankoopprijs (€)" : "Purchase price (€)")
                          : (lang === "nl" ? "Geïnvesteerd (€)" : "Invested (€)")}
                      </label>
                      <input type="number" value={form.invested} onChange={e => setForm(p => ({ ...p, invested: e.target.value }))}
                        placeholder="0,00" style={inputStyle} />
                    </>
                  )}
                </div>
                {form.type === "real_estate" ? (
                  <>
                    <div>
                      <label style={labelStyle}>{lang === "nl" ? "WOZ-waarde (€)" : "WOZ Value (€)"}</label>
                      <input type="number" value={form.wozValue} onChange={e => setForm(p => ({ ...p, wozValue: e.target.value }))}
                        placeholder="bijv. 350000" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>{lang === "nl" ? "Hypotheek (€)" : "Mortgage (€)"}</label>
                      <input type="number" value={form.mortgage} onChange={e => setForm(p => ({ ...p, mortgage: e.target.value }))}
                        placeholder="bijv. 200000" style={inputStyle} />
                      {form.wozValue && (
                        <div style={{ fontSize: 11, color: "#22c55e", marginTop: 4 }}>
                          {lang === "nl" ? "Overwaarde" : "Equity"}: {fmt((parseFloat(form.wozValue) || 0) - (parseFloat(form.mortgage) || 0))}
                        </div>
                      )}
                    </div>
                  </>
                ) : form.type !== "savings" && (
                  <div>
                    <label style={labelStyle}>
                      {lang === "nl" ? "Aantal" : "Amount"} {form.type === "metals" ? "gram" : form.type === "crypto" ? "coins" : "aandelen"}
                      {(form.type === "crypto" || form.type === "metals" || form.type === "stocks") && <span style={{ color: "#f59e0b", fontWeight: 700, marginLeft: 6 }}>← live prijs</span>}
                    </label>
                    <input type="number" value={form.units} onChange={e => setForm(p => ({ ...p, units: e.target.value }))}
                      placeholder={form.type === "crypto" ? "bijv. 0.05" : form.type === "metals" ? "bijv. 10" : "bijv. 10"} style={inputStyle} />
                    {form.units && form.invested && parseFloat(form.units) > 0 && (
                      <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>
                        Aankoopprijs: {fmt(parseFloat(form.invested) / parseFloat(form.units))} per {form.type === "metals" ? "gram" : form.type === "crypto" ? "coin" : "aandeel"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Current value — savings shows EUR equivalent calculation */}
              <div>
                {form.type === "savings" && goals.length > 0 && (
                <div>
                  <label style={labelStyle}>{lang === "nl" ? "Koppel aan spaardoel" : "Link to savings goal"} <span style={{ fontWeight: 400, opacity: 0.6, textTransform: "none" }}>— {lang === "nl" ? "optioneel" : "optional"}</span></label>
                  <select value={form.linkedGoalId} onChange={e => setForm(p => ({ ...p, linkedGoalId: e.target.value }))}
                    style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">{lang === "nl" ? "— Geen koppeling —" : "— No link —"}</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} — {lang === "nl" ? "huidig" : "current"}: {fmt(g.current)} / {fmt(g.target)}
                      </option>
                    ))}
                  </select>
                  {form.linkedGoalId && (
                    <div style={{ fontSize: 11, color: "#22c55e", marginTop: 4 }}>
                      ✓ {lang === "nl" ? "Saldo wordt opgeteld bij dit doel" : "Balance will be added to this goal"}
                    </div>
                  )}
                </div>
              )}
              {form.type === "savings" ? (
                  <>
                    <label style={labelStyle}>{lang === "nl" ? "Huidige waarde (€)" : "Current value (€)"} <span style={{ fontWeight: 400, opacity: 0.6, textTransform: "none" }}>— {lang === "nl" ? "huidig saldo in euro" : "current balance in euros"}</span></label>
                    <input type="number" value={form.currentValue} onChange={e => setForm(p => ({ ...p, currentValue: e.target.value }))}
                      placeholder={form.savingsCurrency === "EUR" && form.invested ? form.invested : lang === "nl" ? "Voer saldo in euro in" : "Enter balance in euros"} style={inputStyle} />
                    {form.savingsCurrency !== "EUR" && form.invested && (
                      <div style={{ fontSize: 11, color: "#22c55e", marginTop: 4 }}>
                        {fxRates[form.savingsCurrency]
                          ? `1 ${form.savingsCurrency} = ${fmt(fxRates[form.savingsCurrency])} · ${lang === "nl" ? "automatisch omgezet" : "auto-converted"}`
                          : (lang === "nl" ? "Koers laden..." : "Loading rate...")}
                      </div>
                    )}
                  </>
                ) : form.type === "real_estate" ? (
                  <>
                    <label style={labelStyle}>{lang === "nl" ? "Huidige waarde (€)" : "Current value (€)"} <span style={{ fontWeight: 400, opacity: 0.6, textTransform: "none" }}>— {lang === "nl" ? "automatisch berekend" : "auto-calculated"}</span></label>
                    <div style={{ ...inputStyle, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: isDark ? "#94a3b8" : "#64748b", cursor: "default", display: "flex", alignItems: "center" }}>
                      {form.wozValue
                        ? `${fmt((parseFloat(form.wozValue) || 0) - (parseFloat(form.mortgage) || 0))} (WOZ − hypotheek)`
                        : (lang === "nl" ? "Vul WOZ-waarde in" : "Enter WOZ value above")}
                    </div>
                  </>
                ) : (
                  <>
                    <label style={labelStyle}>{lang === "nl" ? "Huidige waarde (€)" : "Current value (€)"} <span style={{ fontWeight: 400, opacity: 0.6, textTransform: "none" }}>— {lang === "nl" ? "laat leeg voor automatisch" : "leave empty for auto"}</span></label>
                    <input type="number" value={form.currentValue} onChange={e => setForm(p => ({ ...p, currentValue: e.target.value }))}
                      placeholder={lang === "nl" ? "Wordt automatisch ingevuld na prijsupdate" : "Auto-filled after price update"} style={inputStyle} />
                  </>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={closeForm} style={{ ...pillBtnGhost(isDark), flex: 1 }}>{lang === "nl" ? "Annuleren" : "Cancel"}</button>
                <button onClick={addInvestment}
                  disabled={!form.name || (form.type === "real_estate" ? !form.wozValue : !form.invested)}
                  style={{ ...pillBtn(), flex: 2, opacity: (form.name && (form.type === "real_estate" ? form.wozValue : form.invested)) ? 1 : 0.45 }}>
                  <Plus size={15} /> {lang === "nl" ? "Toevoegen" : "Add"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}



      {/* ── Market Ticker ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#334155" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {lang === "nl" ? "Marktprijzen" : "Market prices"} {tickerLastUpdate ? `· ${lang === "nl" ? "bijgewerkt" : "updated"} ${tickerLastUpdate}` : ""}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* EUR / USD toggle */}
            <div style={{ display: "flex", borderRadius: 20, border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e6ed", overflow: "hidden" }}>
              {[["EUR","€"],["USD","$"]].map(([cur, sym]) => (
                <button key={cur} onClick={() => setTickerCurrency(cur)}
                  style={{ padding: "4px 10px", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700,
                    background: tickerCurrency === cur ? (isDark ? "rgba(255,255,255,0.1)" : "#e2e6ed") : "transparent",
                    color: tickerCurrency === cur ? (isDark ? "#f1f5f9" : "#0f172a") : (isDark ? "#475569" : "#94a3b8") }}>
                  {sym} {cur}
                </button>
              ))}
            </div>
            <button onClick={() => fetchTicker(true)} disabled={tickerLoading}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "transparent", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e6ed", color: isDark ? "#475569" : "#94a3b8", cursor: tickerLoading ? "wait" : "pointer", fontSize: 11, fontWeight: 600 }}>
              <RefreshCw size={11} style={{ animation: tickerLoading ? "spin 1s linear infinite" : "none" }} />
              {tickerLoading ? "Laden..." : "Vernieuwen"}
            </button>
          </div>
        </div>
        {/* Row 1: Goud, Zilver, Bitcoin */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 10 }}>
          {TICKER_ASSETS.slice(0, 3).map(asset => {
            const d = ticker[asset.id];
            const change = d?.change24h ? parseFloat(d.change24h) : null;
            const isPos = change !== null && change >= 0;
            return (
              <div key={asset.id} style={{ ...card(isDark), padding: "14px 16px", borderLeft: `3px solid ${asset.color}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${asset.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {asset.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#94a3b8" : "#475569" }}>{asset.label}</div>
                    {d?.unit && <div style={{ fontSize: 10, color: isDark ? "#334155" : "#94a3b8" }}>{d.unit}</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {tickerLoading && !d ? (
                    <div style={{ fontSize: 13, color: isDark ? "#334155" : "#94a3b8" }}>···</div>
                  ) : d?.error ? (
                    <div style={{ fontSize: 11, color: "#f43f5e" }}>—</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 15, fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a", fontFamily: "'DM Mono', monospace" }}>{tickerCurrency === "USD" ? (d?.priceUsd ? `$ ${d.priceUsd.toLocaleString("en-US", {minimumFractionDigits:2,maximumFractionDigits:2})}` : "···") : (d?.priceEur ? fmt(d.priceEur) : "···")}</div>
                      {change !== null && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: isPos ? "#22c55e" : "#f43f5e", marginTop: 2 }}>
                          {isPos ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Row 2: AEX, Ethereum, Nasdaq */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {TICKER_ASSETS.slice(3, 6).map(asset => {
            const d = ticker[asset.id];
            const change = d?.change24h ? parseFloat(d.change24h) : null;
            const isPos = change !== null && change >= 0;
            return (
              <div key={asset.id} style={{ ...card(isDark), padding: "14px 16px", borderLeft: `3px solid ${asset.color}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${asset.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {asset.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#94a3b8" : "#475569" }}>{asset.label}</div>
                    {asset.type === "stock" && <div style={{ fontSize: 10, color: isDark ? "#334155" : "#94a3b8" }}>index</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {tickerLoading && !d ? (
                    <div style={{ fontSize: 13, color: isDark ? "#334155" : "#94a3b8" }}>···</div>
                  ) : d?.error ? (
                    <div style={{ fontSize: 11, color: "#f43f5e" }}>—</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 15, fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a", fontFamily: "'DM Mono', monospace" }}>{tickerCurrency === "USD" ? (d?.priceUsd ? `$ ${d.priceUsd.toLocaleString("en-US", {minimumFractionDigits:2,maximumFractionDigits:2})}` : "···") : (d?.priceEur ? fmt(d.priceEur) : "···")}</div>
                      {change !== null && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: isPos ? "#22c55e" : "#f43f5e", marginTop: 2 }}>
                          {isPos ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a" }}>{t.investments.title}</div>
          {lastRefresh && <div style={{ fontSize: 11, color: isDark ? "#334155" : "#94a3b8", marginTop: 2 }}>Laatste update: {lastRefresh}</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchAllPrices} disabled={globalLoading}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.3)", borderRadius: 50, color: "#4f8ef7", cursor: globalLoading ? "wait" : "pointer", fontSize: 12, fontWeight: 700, boxShadow: "0 2px 12px rgba(79,142,247,0.15)" }}>
            <RefreshCw size={14} style={{ animation: globalLoading ? "spin 1s linear infinite" : "none" }} />
            {globalLoading ? "Laden..." : "Prijzen vernieuwen"}
          </button>
          <button onClick={() => setShowForm(true)} style={{ ...pillBtn(), fontSize: 13 }}>
            <Plus size={15} /> {t.investments.addInvestment}
          </button>
        </div>
      </div>
      {/* Period filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {["1D","5D","1M","6M","YTD","1Y","5Y","Max"].map(p => (
          <button key={p} onClick={() => setInvPeriod(p)}
            style={{ padding: "4px 12px", borderRadius: 20, border: invPeriod === p ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed"}`,
              background: invPeriod === p ? "#4f8ef7" : "transparent",
              color: invPeriod === p ? "#fff" : (isDark ? "#64748b" : "#94a3b8"),
              fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
            {p}
          </button>
        ))}
        {periodLoading && <span style={{ fontSize: 11, color: isDark ? "#334155" : "#94a3b8" }}>Laden...</span>}
        {hiddenInvs.size > 0 && <span style={{ fontSize: 11, color: "#f59e0b", marginLeft: 4 }}>{hiddenInvs.size} positie{hiddenInvs.size > 1 ? "s" : ""} verborgen</span>}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label={t.investments.portfolio} rawValue={totalCurrent} formatter={fmt} color="#4f8ef7" icon={TrendingUp} trend={parseFloat(roi)} isDark={isDark} />
        <StatCard label={invPeriod === "Max" ? t.investments.totalInvested : `Waarde ${invPeriod} geleden`} rawValue={totalInvested} formatter={fmt} color="#a855f7" icon={PiggyBank} isDark={isDark} />
        <StatCard label={invPeriod === "Max" ? t.investments.totalProfit : `Winst/verlies ${invPeriod}`} rawValue={totalProfit} formatter={fmt} color={totalProfit >= 0 ? "#22c55e" : "#f43f5e"} icon={Target} trend={parseFloat(roi)} isDark={isDark} />
        <StatCard label={`ROI ${invPeriod}`} rawValue={parseFloat(roi)} formatter={v => v.toFixed(1) + "%"} color="#f59e0b" icon={BarChart2} isDark={isDark} />
      </div>

      {/* Positions + Allocation */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ ...card(isDark) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 16 }}>Posities</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {enriched.map(inv => {
              const profit = inv.liveValue - inv.invested;
              const pct = inv.invested > 0 ? ((profit / inv.invested) * 100).toFixed(1) : "0.0";
              const color = INVESTMENT_COLORS[inv.type] || "#64748b";
              const liveD = inv.liveData;
              const isLoading = liveD?.loading;
              const hasLive = liveD?.price && !liveD?.error;

              const isHidden = hiddenInvs.has(inv.id);
              const toggleHide = () => setHiddenInvs(prev => { const n = new Set(prev); n.has(inv.id) ? n.delete(inv.id) : n.add(inv.id); return n; });
              return (
                <div key={inv.id} style={{ padding: "12px 14px", background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", borderRadius: 12, border: `1px solid ${hasLive ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)"}`, opacity: isHidden ? 0.35 : 1, transition: "opacity 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color, flexShrink: 0 }}>
                        {inv.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#f1f5f9" : "#0f172a" }}>{inv.name}</div>
                        <div style={{ fontSize: 11, color: isDark ? "#64748b" : "#64748b" }}>
                          {inv.type === "real_estate" ? (
                            inv.address && <span style={{ color: "#94a3b8" }}>{inv.address} · </span>
                          ) : (
                            inv.ticker && <span style={{ fontFamily: "monospace", color: "#475569" }}>{inv.ticker.toUpperCase()} · </span>
                          )}
                          {t.investments.types[inv.type]}{inv.units && inv.type === 'metals' ? ` · ${inv.units} gram` : ''}
                          {inv.type === "real_estate" && inv.wozValue > 0 && (
                            <span style={{ marginLeft: 6, padding: "1px 6px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 6, color: "#818cf8", fontSize: 10, fontWeight: 700 }}>
                              WOZ {fmt(inv.wozValue)}{inv.mortgage > 0 ? ` − hyp. ${fmt(inv.mortgage)}` : ""}
                            </span>
                          )}
                          {inv.savingsCurrency && inv.savingsCurrency !== "EUR" && (
                            <span style={{ marginLeft: 6, padding: "1px 6px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 6, color: "#22c55e", fontSize: 10, fontWeight: 700 }}>
                              {inv.savingsAmount?.toLocaleString()} {inv.savingsCurrency} · {fxRates[inv.savingsCurrency] ? `1=${fmt(fxRates[inv.savingsCurrency])}` : "koers laden..."}
                            </span>
                          )}
                          {inv.linkedGoalId && (() => { const g = goals.find(g => g.id === inv.linkedGoalId); return g ? (
                            <span style={{ marginLeft: 6, padding: "1px 6px", background: `${g.color}18`, border: `1px solid ${g.color}40`, borderRadius: 6, color: g.color, fontSize: 10, fontWeight: 700 }}>
                              🎯 {g.name}
                            </span>
                          ) : null; })()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* Hide toggle */}
                      <button onClick={toggleHide}
                        style={{ width: 28, height: 28, borderRadius: 8, background: isHidden ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)", border: isHidden ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: isHidden ? "#f59e0b" : "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title={isHidden ? "Toon positie" : "Verberg positie"}>
                        {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      {/* Live fetch button */}
                      <button onClick={() => fetchPrice(inv)} disabled={isLoading}
                        style={{ width: 28, height: 28, borderRadius: 8, background: hasLive ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", border: hasLive ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(255,255,255,0.08)", cursor: isLoading ? "wait" : "pointer", color: hasLive ? "#22c55e" : "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <RefreshCw size={12} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
                      </button>
                      {/* Delete */}
                      <button onClick={() => removeInvestment(inv.id)}
                        style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.15)", cursor: "pointer", color: "#f43f5e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={12} />
                      </button>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", fontFamily: "'DM Mono', monospace" }}>{fmt(inv.liveValue)}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: profit >= 0 ? "#22c55e" : "#f43f5e" }}>
                          {profit >= 0 ? "+" : ""}{fmt(profit)} ({pct}%)
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Live price bar */}
                  {liveD && !isLoading && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 12, fontSize: 11 }}>
                      {liveD.error ? (
                        <span style={{ color: "#f43f5e" }}>⚠ {liveD.error}</span>
                      ) : (
                        <>
                          <span style={{ color: isDark ? "#64748b" : "#64748b" }}>Live prijs:</span>
                          <span style={{ color: isDark ? "#f1f5f9" : "#0f172a", fontFamily: "monospace", fontWeight: 700 }}>{fmt(liveD.price)}</span>
                          {liveD.change24h && (
                            <span style={{ color: parseFloat(liveD.change24h) >= 0 ? "#22c55e" : "#f43f5e", fontWeight: 600 }}>
                              {parseFloat(liveD.change24h) >= 0 ? "▲" : "▼"} {Math.abs(liveD.change24h)}% (24u)
                            </span>
                          )}
                          <span style={{ color: isDark ? "#334155" : "#94a3b8", marginLeft: "auto" }}>🕐 {liveD.lastUpdated}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...card(isDark) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 16 }}>{t.investments.allocation}</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={allocationData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {allocationData.map(entry => <Cell key={entry.name} fill={INVESTMENT_COLORS[entry.name] || "#64748b"} stroke="transparent" />)}
              </Pie>
              <Tooltip contentStyle={{ background: isDark ? "#1a2235" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e6ed", borderRadius: 10, fontSize: 12 }} itemStyle={{ color: isDark ? "#f1f5f9" : "#0f172a" }} formatter={v => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {allocationData.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: INVESTMENT_COLORS[d.name] || "#64748b" }} />
                  <span style={{ color: isDark ? "#94a3b8" : "#475569", textTransform: "capitalize" }}>{t.investments.types[d.name]}</span>
                </div>
                <span style={{ color: isDark ? "#f1f5f9" : "#0f172a", fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{fmt(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INSIGHTS VIEW ─────────────────────────────────────────────
function Insights({ transactions, t, isDark, recurringItems = [], lang = "nl" }) {
  const today = new Date().toISOString().slice(0, 10);
  const C = {
    text: isDark ? "#f1f5f9" : "#0f172a",
    sub: isDark ? "#94a3b8" : "#475569",
    muted: isDark ? "#64748b" : "#64748b",
    border: isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed",
    rowBg: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
  };

  const reminderAlerts = recurringItems.filter(r => r.remindDate && r.remindDate <= today);

  // ── Core calculations ─────────────────────────────────────────
  const { currentMonth, prevMonth, prev2Month, thisMonthTxs, lastMonthTxs, prev2Txs, allMonths } = useMemo(() => {
    if (!transactions.length) return { currentMonth: "", prevMonth: "", prev2Month: "", thisMonthTxs: [], lastMonthTxs: [], prev2Txs: [], allMonths: [] };
    const latestDate = transactions.reduce((best, tx) => tx.date > best ? tx.date : best, "");
    const cur = latestDate.slice(0, 7);
    const [cy, cm] = cur.split("-").map(Number);
    const prev = `${cy}-${String(cm - 1 > 0 ? cm - 1 : 12).padStart(2,"0")}`.replace(/(\d{4})-0/, (_, y) => `${Number(y)-1}-0`);
    const prev2 = `${cy}-${String(cm - 2 > 0 ? cm - 2 : 12).padStart(2,"0")}`.replace(/(\d{4})-0/, (_, y) => `${Number(y)-1}-0`);
    const months = [...new Set(transactions.map(tx => tx.date.slice(0,7)))].sort();
    return {
      currentMonth: cur, prevMonth: prev, prev2Month: prev2,
      thisMonthTxs: transactions.filter(tx => tx.date.startsWith(cur)),
      lastMonthTxs: transactions.filter(tx => tx.date.startsWith(prev)),
      prev2Txs:     transactions.filter(tx => tx.date.startsWith(prev2)),
      allMonths:    months,
    };
  }, [transactions]);

  const sum = (txs, cat, sign) => txs
    .filter(tx => (!cat || tx.category === cat) && (sign === "+" ? tx.amount > 0 : sign === "-" ? tx.amount < 0 : true))
    .reduce((s, tx) => s + Math.abs(tx.amount), 0);

  const income    = sum(thisMonthTxs, null, "+");
  const expenses  = sum(thisMonthTxs, null, "-");
  const prevIncome  = sum(lastMonthTxs, null, "+");
  const prevExpenses = sum(lastMonthTxs, null, "-");
  const balance   = income - expenses;
  const savingsRate = income > 0 ? Math.round((Math.max(0, balance) / income) * 100) : 0;

  // ── Category breakdown ──────────────────────────────────────
  const catBreakdown = useMemo(() => {
    const map = {};
    thisMonthTxs.filter(tx => tx.amount < 0).forEach(tx => {
      map[tx.category] = (map[tx.category] || 0) + Math.abs(tx.amount);
    });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0, 8);
  }, [thisMonthTxs]);

  // ── Top tegenpartijen ──────────────────────────────────────
  const topCounterparties = useMemo(() => {
    const map = {};
    thisMonthTxs.filter(tx => tx.amount < 0 && tx.counterparty).forEach(tx => {
      map[tx.counterparty] = (map[tx.counterparty] || 0) + Math.abs(tx.amount);
    });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0, 5);
  }, [thisMonthTxs]);

  // ── Grootste transacties ──────────────────────────────────
  const biggestTxs = useMemo(() =>
    [...thisMonthTxs].filter(tx => tx.amount < 0).sort((a,b) => a.amount - b.amount).slice(0, 5)
  , [thisMonthTxs]);

  // ── Maandtrend (laatste 6 maanden) ────────────────────────
  const monthTrend = useMemo(() => {
    return allMonths.slice(-6).map(m => {
      const txs = transactions.filter(tx => tx.date.startsWith(m));
      return {
        month: fmtMonthShort(m),
        income: Math.round(txs.filter(tx => tx.amount > 0).reduce((s,tx) => s + tx.amount, 0)),
        expenses: Math.round(txs.filter(tx => tx.amount < 0).reduce((s,tx) => s + Math.abs(tx.amount), 0)),
      };
    });
  }, [transactions, allMonths]);

  // ── Alerts ─────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const result = [];
    if (!thisMonthTxs.length) return result;

    // Income drop
    if (prevIncome > 0 && income < prevIncome * 0.7) {
      result.push({ type: "warning", icon: "📉", color: "#f43f5e", title: lang === "nl" ? "Inkomensdaling" : "Income drop",
        body: `Je inkomen is ${Math.round((1 - income/prevIncome)*100)}% lager dan vorige maand (${fmt(prevIncome)} → ${fmt(income)}).` });
    }
    // Over budget
    if (income > 0 && expenses > income) {
      result.push({ type: "warning", icon: "⚠️", color: "#f43f5e", title: lang === "nl" ? "Meer uitgegeven dan verdiend" : "Spent more than earned",
        body: `Je geeft ${fmt(expenses - income)} meer uit dan je verdient. Bekijk je grootste uitgaven hieronder.` });
    }
    // High eating out
    const eating = sum(thisMonthTxs, "eating_out", "-");
    if (income > 0 && eating / income > 0.12) {
      result.push({ type: "warning", icon: "🍽️", color: "#f59e0b", title: lang === "nl" ? "Hoge horecakosten" : "High dining costs",
        body: `Uit eten maakt ${Math.round(eating/income*100)}% van je inkomen uit (${fmt(eating)}). Gemiddeld is dit 5-10%.` });
    }
    // Good savings
    if (savingsRate >= 20) {
      result.push({ type: "success", icon: "🎉", color: "#22c55e", title: lang === "nl" ? "Sterke spaarquote" : "Strong savings rate",
        body: `Je spaart ${savingsRate}% van je inkomen — ruim boven het aanbevolen minimum van 20%. Goed bezig!` });
    } else if (income > 0 && balance > 0 && savingsRate < 20) {
      result.push({ type: "info", icon: "💡", color: "#4f8ef7", title: lang === "nl" ? "Spaarruimte beschikbaar" : "Savings room available",
        body: `Je hebt ${fmt(balance)} over. Door dit te sparen ga je van ${savingsRate}% naar ${Math.round(balance/income*100)}% spaarquote.` });
    }
    // Subscriptions
    const subs = sum(thisMonthTxs, "subscriptions", "-");
    if (subs > 100) {
      result.push({ type: "info", icon: "📱", color: "#6366f1", title: `${fmt(subs)}/maand aan abonnementen`,
        body: `Dat is ${fmt(subs * 12)}/jaar. Loop ze door in Vaste Lasten en zeg op wat je niet gebruikt.` });
    }
    return result;
  }, [thisMonthTxs, income, expenses, prevIncome, savingsRate]);

  // ── Health score ───────────────────────────────────────────
  const healthScore = useMemo(() => {
    let score = 60;
    if (income > 0) {
      if (savingsRate >= 20) score += 20;
      else if (savingsRate >= 10) score += 10;
      if (expenses <= income) score += 15;
      else score -= 20;
      const fixedRatio = sum(thisMonthTxs, "fixed_expenses", "-") / income;
      if (fixedRatio < 0.5) score += 5;
    }
    return Math.min(100, Math.max(0, score));
  }, [income, expenses, savingsRate, thisMonthTxs]);

  const healthColor = healthScore >= 75 ? "#22c55e" : healthScore >= 50 ? "#f59e0b" : "#f43f5e";
  const healthLabel = healthScore >= 75 ? lang === "nl" ? "Goed" : "Good" : healthScore >= 50 ? lang === "nl" ? "Matig" : "Fair" : lang === "nl" ? "Aandacht nodig" : "Needs attention";

  if (!transactions.length) {
    return (
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 20 }}>{t.insights.title}</div>
        <div style={{ ...card(isDark), textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Geen transacties</div>
          <div style={{ fontSize: 13, color: C.muted }}>Upload een CSV-bestand om inzichten te genereren.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>{t.insights.title}</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{fmtMonth(currentMonth)} · analyse op basis van jouw transacties</div>

      {/* ── Reminders ── */}
      {reminderAlerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {reminderAlerts.map(r => (
            <div key={r.key} style={{ ...card(isDark), borderLeft: "3px solid #f59e0b", display: "flex", gap: 14, alignItems: "center", padding: "12px 18px" }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.label}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{r.remindNote || "Datum bereikt."}</div></div>
            </div>
          ))}
        </div>
      )}

      {/* ── Row 1: Health score + Month KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14, marginBottom: 14 }}>
        {/* Health score donut */}
        <div style={{ ...card(isDark), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
          <div style={{ position: "relative", width: 88, height: 88, marginBottom: 12 }}>
            <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="44" cy="44" r="36" fill="none" stroke={isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"} strokeWidth="8"/>
              <circle cx="44" cy="44" r="36" fill="none" stroke={healthColor} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 36 * healthScore / 100} ${2 * Math.PI * 36}`}
                strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s ease" }}/>
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: healthColor, lineHeight: 1 }}>{healthScore}</span>
              <span style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: "uppercase" }}>score</span>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: healthColor }}>{healthLabel}</div>
          <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 4 }}>{lang === "nl" ? "Financiële gezondheid" : "Financial health"}</div>
        </div>

        {/* KPI grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: t.general.income, value: fmt(income), sub: prevIncome ? `${income >= prevIncome ? "+" : ""}${Math.round((income-prevIncome)/prevIncome*100)}% ${t.general.vsLastMonth}` : "", color: "#22c55e" },
            { label: t.general.expenses, value: fmt(expenses), sub: prevExpenses ? `${expenses >= prevExpenses ? "+" : ""}${Math.round((expenses-prevExpenses)/prevExpenses*100)}% ${t.general.vsLastMonth}` : "", color: "#f43f5e" },
            { label: t.general.balance, value: fmt(Math.abs(balance)), sub: balance >= 0 ? lang === "nl" ? lang === "nl" ? "over deze maand" : "surplus" : "surplus" : lang === "nl" ? lang === "nl" ? "tekort deze maand" : "deficit" : "deficit", color: balance >= 0 ? "#4f8ef7" : "#f43f5e" },
            { label: t.general.savings, value: `${savingsRate}%`, sub: savingsRate >= 20 ? lang === "nl" ? "✓ boven 20% doel" : "✓ above 20% goal" : `doel: 20% (${fmt(income*0.2)})`, color: savingsRate >= 20 ? "#22c55e" : "#f59e0b" },
          ].map(k => (
            <div key={k.label} style={{ ...card(isDark), padding: "12px 14px", borderTop: `2.5px solid ${k.color}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.color, fontFamily: "'DM Mono', monospace" }}>{k.value}</div>
              {k.sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{k.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ ...card(isDark), borderLeft: `3px solid ${a.color}`, display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 18px" }}>
              <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{a.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{a.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Row 2: Category breakdown + Top counterparties ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Category breakdown */}
        <div style={{ ...card(isDark) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>{lang === "nl" ? "📊 Uitgaven per categorie" : "📊 Expenses by category"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {catBreakdown.map(([cat, amount]) => {
              const pct = expenses > 0 ? (amount / expenses * 100) : 0;
              const color = CATEGORY_COLORS[cat] || "#64748b";
              const prevAmt = sum(lastMonthTxs, cat, "-");
              const change = prevAmt > 0 ? Math.round((amount - prevAmt) / prevAmt * 100) : null;
              return (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }}/>
                      <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>{t.categories[cat] || cat}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {change !== null && (
                        <span style={{ fontSize: 10, color: change > 10 ? "#f43f5e" : change < -10 ? "#22c55e" : C.muted, fontWeight: 600 }}>
                          {change > 0 ? `+${change}%` : `${change}%`}
                        </span>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>{fmt(amount)}</span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top tegenpartijen + Grootste transacties */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {topCounterparties.length > 0 && (
            <div style={{ ...card(isDark) }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>{lang === "nl" ? "👤 Meeste geld naar" : "👤 Most money to"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topCounterparties.map(([name, amount], i) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: C.muted, flexShrink: 0 }}>#{i+1}</div>
                    <span style={{ fontSize: 12, color: C.sub, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#f43f5e", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{fmt(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ ...card(isDark) }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>{lang === "nl" ? "💸 Grootste uitgaven" : "💸 Biggest expenses"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {biggestTxs.map(tx => (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[tx.category] || "#64748b", flexShrink: 0 }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tx.counterparty || tx.description}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted }}>{tx.date}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#f43f5e", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{fmt(Math.abs(tx.amount))}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Maandtrend chart ── */}
      {monthTrend.length >= 2 && (
        <div style={{ ...card(isDark) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>{lang === "nl" ? `📈 Trend laatste ${monthTrend.length} maanden` : `📈 Trend last ${monthTrend.length} months`}</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthTrend} barGap={4}>
              <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmtShort(v)} tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
              <Tooltip formatter={(v, n) => [fmt(v), n === "income" ? t.general.income : t.general.expenses]}
                contentStyle={{ background: isDark ? "#1e293b" : "#fff", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: C.text, fontWeight: 700, marginBottom: 4 }} />
              <Bar dataKey="income"   fill="#22c55e" radius={[4,4,0,0]} opacity={0.85} name="income" />
              <Bar dataKey="expenses" fill="#f43f5e" radius={[4,4,0,0]} opacity={0.85} name="expenses" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "#22c55e" }}/> Inkomsten
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "#f43f5e" }}/> Uitgaven
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS VIEW ─────────────────────────────────────────────
// ─── REKENINGEN VIEW ──────────────────────────────────────────
function RekeningenView({ accounts, setAccounts, onDeleteAccount, isDark, t, onUploadClick, lang = "nl" }) {
  const [categories, setCategories] = useState(Object.keys(CATEGORY_COLORS));
  const [newCat, setNewCat] = useState("");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccIban, setNewAccIban] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editAccId, setEditAccId] = useState(null);
  const [editAccName, setEditAccName] = useState("");
  const [editCatName, setEditCatName] = useState(null);
  const [editCatValue, setEditCatValue] = useState("");

  const C = {
    text: isDark ? "#f1f5f9" : "#0f172a",
    sub: isDark ? "#94a3b8" : "#475569",
    muted: isDark ? "#64748b" : "#64748b",
    border: isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed",
    rowBg: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
  };

  const addAccount = () => {
    if (!newAccName.trim()) return;
    setAccounts(prev => [...prev, { id: Date.now(), name: newAccName.trim(), iban: newAccIban.trim() || "—" }]);
    setNewAccName(""); setNewAccIban(""); setShowAddAccount(false);
  };

  const pageSubtitle = lang === "nl" ? "Beheer je bankrekeningen en transactiecategorieën" : "Manage your bank accounts and transaction categories";
  const pageTitle = lang === "nl" ? "Rekeningen" : "Bank Accounts";

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>{pageTitle}</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>{pageSubtitle}</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Rekeningen ── */}
        <div style={{ ...card(isDark) }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{lang === "nl" ? "Bankrekeningen" : "Bank Accounts"}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{lang === "nl" ? `${accounts.length} rekening${accounts.length !== 1 ? "en" : ""} gekoppeld` : `${accounts.length} account${accounts.length !== 1 ? "s" : ""} linked`}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {onUploadClick && (
                <button onClick={onUploadClick} style={{ ...pillBtnGhost(isDark), fontSize: 12, padding: "8px 14px" }}>
                  <Upload size={13}/> {lang === "nl" ? "CSV Uploaden" : "Upload CSV"}
                </button>
              )}
              {!showAddAccount && (
                <button onClick={() => setShowAddAccount(true)} style={{ ...pillBtn(), fontSize: 13, padding: "9px 18px" }}>
                  <Plus size={14} /> {lang === "nl" ? "Rekening toevoegen" : "Add account"}
                </button>
              )}
            </div>
          </div>

          {/* Accounts list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {accounts.length === 0 && (
              <div style={{ padding: "28px", textAlign: "center", color: C.muted, fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏦</div>
                Nog geen rekeningen. Voeg je eerste rekening toe.
              </div>
            )}
            {accounts.map(acc => (
              <div key={acc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: C.rowBg, borderRadius: 12, border: `1px solid ${C.border}`, transition: "border-color 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(79,142,247,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CreditCard size={17} color="#4f8ef7" />
                  </div>
                  <div>
                    {editAccId === acc.id ? (
                      <input autoFocus value={editAccName} onChange={e => setEditAccName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { setAccounts(prev => prev.map(a => a.id === acc.id ? {...a, name: editAccName} : a)); setEditAccId(null); } if (e.key === "Escape") setEditAccId(null); }}
                        style={{ fontSize: 14, fontWeight: 600, padding: "2px 8px", background: isDark ? "rgba(255,255,255,0.06)" : "#fff", border: `1.5px solid ${accent || "#4f8ef7"}`, borderRadius: 8, color: C.text, outline: "none", width: "100%" }} />
                    ) : (
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{acc.name}</div>
                    )}
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Mono', monospace" }}>{acc.iban}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(34,197,94,0.12)", color: "#22c55e", fontWeight: 700 }}>{lang === "nl" ? "Actief" : "Active"}</span>
                  <button onClick={() => { setEditAccId(acc.id); setEditAccName(acc.name); }}
                    style={{ width: 28, height: 28, borderRadius: 8, background: C.rowBg, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
                    <Edit2 size={12} />
                  </button>
                  {deleteConfirm === acc.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { onDeleteAccount(acc.id); setDeleteConfirm(null); }}
                        style={{ padding: "5px 12px", background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 8, color: "#f43f5e", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                        Verwijder
                      </button>
                      <button onClick={() => setDeleteConfirm(null)}
                        style={{ padding: "5px 12px", background: C.rowBg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: "pointer", fontSize: 11 }}>
                        Annuleer
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(acc.id)}
                      style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#f43f5e" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,0.18)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(244,63,94,0.07)"}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add form */}
            {showAddAccount && (
              <div style={{ padding: "16px", border: "1px solid rgba(79,142,247,0.3)", borderRadius: 12, background: isDark ? "rgba(79,142,247,0.06)" : "#eff6ff", marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#4f8ef7", marginBottom: 12 }}>Nieuwe rekening</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={newAccName} onChange={e => setNewAccName(e.target.value)} placeholder="Naam (bijv. ING Betaalrekening)" autoFocus
                    style={{ padding: "10px 12px", background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none" }} />
                  <input value={newAccIban} onChange={e => setNewAccIban(e.target.value)} placeholder="IBAN (optioneel)"
                    style={{ padding: "10px 12px", background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "monospace" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setShowAddAccount(false); setNewAccName(""); setNewAccIban(""); }}
                      style={{ ...pillBtnGhost(isDark), flex: 1, padding: "9px 0", fontSize: 13 }}>{lang === "nl" ? "Annuleren" : "Cancel"}</button>
                    <button onClick={addAccount} style={{ ...pillBtn(), flex: 2, padding: "9px 0", fontSize: 13, opacity: newAccName.trim() ? 1 : 0.45 }}>
                      <Plus size={14} /> Toevoegen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Categorieën ── */}
        <div style={{ ...card(isDark) }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>{lang === "nl" ? "Categorieën" : "Categories"}</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>{lang === "nl" ? "✏️ naam aanpassen · × verwijderen · + nieuwe toevoegen" : "✏️ edit name · × remove · + add new"}</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {categories.map(cat => {
              const color = CATEGORY_COLORS[cat] || "#64748b";
              const isEditingThis = editCatName === cat;
              return (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5, padding: isEditingThis ? "4px 8px" : "6px 8px 6px 13px", borderRadius: 20, background: `${color}18`, fontSize: 12, color, fontWeight: 600, border: `1px solid ${isEditingThis ? color : color + "35"}` }}>
                  {isEditingThis ? (
                    <>
                      <input autoFocus value={editCatValue} onChange={e => setEditCatValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && editCatValue.trim()) {
                            const newKey = editCatValue.trim();
                            CATEGORY_COLORS[newKey] = CATEGORY_COLORS[cat];
                            setCategories(prev => prev.map(c => c === cat ? newKey : c));
                            setEditCatName(null);
                          }
                          if (e.key === "Escape") setEditCatName(null);
                        }}
                        style={{ width: 100, background: "transparent", border: "none", outline: "none", color, fontSize: 12, fontWeight: 600 }} />
                      <button onClick={() => {
                        const newKey = editCatValue.trim();
                        if (newKey) {
                          CATEGORY_COLORS[newKey] = CATEGORY_COLORS[cat];
                          setCategories(prev => prev.map(c => c === cat ? newKey : c));
                        }
                        setEditCatName(null);
                      }} style={{ background: "none", border: "none", cursor: "pointer", color, padding: "0 2px", display: "flex", alignItems: "center" }}>
                        <Check size={11} />
                      </button>
                      <button onClick={() => setEditCatName(null)} style={{ background: "none", border: "none", cursor: "pointer", color, opacity: 0.5, padding: "0 2px", display: "flex", alignItems: "center" }}>
                        <X size={11} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 6, height: 6, borderRadius: 2, background: "currentColor", opacity: 0.8, marginRight: 2 }} />
                      {t.categories[cat] || cat}
                      <button onClick={() => { setEditCatName(cat); setEditCatValue(cat); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "0 2px", lineHeight: 1, opacity: 0.4, display: "flex", alignItems: "center" }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}>
                        <Edit2 size={10} />
                      </button>
                      <button onClick={() => setCategories(prev => prev.filter(c => c !== cat))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "0 2px", lineHeight: 1, opacity: 0.4, display: "flex", alignItems: "center", marginLeft: -2 }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}>
                        <X size={11} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <input value={newCat} onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newCat.trim()) { setCategories(prev => [...prev, newCat.trim()]); setNewCat(""); }}}
              placeholder={t.calibrate.newCat}
              style={{ flex: 1, padding: "10px 14px", background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 13, outline: "none" }} />
            <button onClick={() => { if (newCat.trim()) { setCategories(prev => [...prev, newCat.trim()]); setNewCat(""); } }}
              style={{ ...pillBtn(), padding: "10px 18px", fontSize: 13 }}>
              <Plus size={14} /> Toevoegen
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function SettingsView({ lang, setLang, t, accounts, setAccounts, onDeleteAccount, theme, setTheme, isDark, onReset }) {
  const [newCat, setNewCat] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetSel, setResetSel] = useState([]);
  const C = { text: isDark ? "#f1f5f9" : "#0f172a", muted: isDark ? "#64748b" : "#64748b", border: isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed" };

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 20 }}>{t.settings.title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Theme */}
        <div style={{ ...card(isDark) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 4 }}>{t.settings.theme}</div>
          <div style={{ fontSize: 12, color: isDark ? "#64748b" : "#94a3b8", marginBottom: 14 }}>Kies je gewenste kleurstijl</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { id: "dark",  label: "Donker",  icon: "🌙", bg: "#080d18", sidebar: "#0d1424", accent: "#4f8ef7", desc: "Nachtmodus" },
              { id: "light", label: "Pearl",   icon: "🪨", bg: "#f5f4f0", sidebar: "#1c1917",  accent: "#d97706", desc: "Warm amber" },
              { id: "cloud", label: "Cloud",   icon: "☁️", bg: "#f0f4ff", sidebar: "#ffffff",  accent: "#4361ee", desc: "Indigo" },
            ].map(opt => {
              const active = theme === opt.id;
              return (
                <button key={opt.id} onClick={() => setTheme(opt.id)} style={{
                  padding: "14px 10px", borderRadius: 14, cursor: "pointer", transition: "all 0.15s",
                  border: active ? `2px solid ${opt.accent}` : isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e6ed",
                  background: active ? (isDark ? "rgba(79,142,247,0.08)" : `${opt.accent}0d`) : isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}>
                  {/* Mini preview */}
                  <div style={{ width: "100%", height: 52, borderRadius: 8, background: opt.bg, overflow: "hidden", display: "flex", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div style={{ width: "36%", background: opt.sidebar, borderRight: "1px solid rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 3, padding: "5px 4px" }}>
                      {[opt.accent + "22", opt.accent + "44", "transparent"].map((bg, i) => (
                        <div key={i} style={{ height: 7, borderRadius: 3, background: bg, width: i === 0 ? "100%" : "80%" }} />
                      ))}
                    </div>
                    <div style={{ flex: 1, padding: "5px 5px", display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ height: 9, borderRadius: 3, background: opt.accent + "30", width: "70%" }} />
                      <div style={{ height: 7, borderRadius: 2, background: "rgba(0,0,0,0.06)", width: "90%" }} />
                      <div style={{ height: 7, borderRadius: 2, background: "rgba(0,0,0,0.06)", width: "60%" }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? opt.accent : isDark ? "#94a3b8" : "#475569" }}>{opt.icon} {opt.label}</div>
                    <div style={{ fontSize: 10, color: isDark ? "#475569" : "#94a3b8", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  {active && <div style={{ width: 18, height: 18, borderRadius: "50%", background: opt.accent, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={10} color="#fff" /></div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Language */}
        <div style={{ ...card(isDark) }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 12 }}>{t.settings.language}</div>
          <div style={{ display: "flex", gap: 10 }}>
            {["en", "nl"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ flex: 1, padding: "10px", border: lang === l ? "1px solid #4f8ef7" : "1px solid rgba(255,255,255,0.08)", borderRadius: 10, background: lang === l ? "rgba(79,142,247,0.15)" : "rgba(255,255,255,0.04)", color: lang === l ? "#4f8ef7" : "#64748b", cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Globe size={14} />
                {l === "en" ? "English" : "Nederlands"}
                {lang === l && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Verwijder data ── */}
        <div style={{ ...card(isDark), border: "1px solid rgba(244,63,94,0.2)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f43f5e", marginBottom: 6 }}>🗑 Data verwijderen</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Selecteer wat je wil verwijderen. Dit kan niet ongedaan worden gemaakt.</div>
          {!confirmReset ? (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {[
                  { key: "transactions", label: lang === "nl" ? "Transacties & rekeningen" : "Transactions & accounts" },
                  { key: "investments",  label: lang === "nl" ? "Investeringen" : "Investments" },
                  { key: "goals",        label: lang === "nl" ? "Spaardoelen" : "Saving goals" },
                  { key: "debts",        label: lang === "nl" ? "Schulden" : "Debt" },
                  { key: "budgets",      label: "Budgetten" },
                  { key: "all",          label: "Alles (reset naar beginstand)" },
                ].map(opt => {
                  const checked = resetSel.includes(opt.key);
                  return (
                    <div key={opt.key} onClick={() => {
                      if (opt.key === "all") { setResetSel(checked ? [] : ["all"]); return; }
                      setResetSel(prev => checked ? prev.filter(x => x !== opt.key) : [...prev.filter(x => x !== "all"), opt.key]);
                    }} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? "#f43f5e" : C.border}`, background: checked ? "#f43f5e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                        {checked && <Check size={11} color="#fff"/>}
                      </div>
                      <span style={{ fontSize: 13, color: opt.key === "all" ? "#f43f5e" : C.text, fontWeight: opt.key === "all" ? 700 : 400 }}>{opt.label}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => resetSel.length > 0 && setConfirmReset(true)} disabled={resetSel.length === 0}
                style={{ padding: "10px 20px", borderRadius: 50, border: "1px solid rgba(244,63,94,0.4)", background: resetSel.length > 0 ? "rgba(244,63,94,0.1)" : "transparent", color: resetSel.length > 0 ? "#f43f5e" : C.muted, fontSize: 13, fontWeight: 700, cursor: resetSel.length > 0 ? "pointer" : "default" }}>
                {resetSel.length === 0 ? "Selecteer wat je wil verwijderen" : `Verwijder selectie (${resetSel.length})`}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f43f5e", marginBottom: 12 }}>
                Weet je het zeker? Je verwijdert: {resetSel.join(", ")}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: "10px", borderRadius: 50, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 13, cursor: "pointer" }}>{lang === "nl" ? "Annuleren" : "Cancel"}</button>
                <button onClick={() => { if (onReset) onReset(resetSel); setConfirmReset(false); setResetSel([]); }}
                  style={{ flex: 2, padding: "10px", borderRadius: 50, background: "#f43f5e", border: "none", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                  Ja, verwijder
                </button>
              </div>
            </div>
          )}
        </div>

        {/* About */}
        <div style={{ ...card(isDark), textAlign: "center" }}>
          <div style={{ fontSize: 13, color: isDark ? "#334155" : "#94a3b8" }}>Dynafy • MVP v1.0 • Built for ZZP'ers & freelancers in 🇳🇱</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "linear-gradient(135deg, rgba(79,142,247,0.2), rgba(99,102,241,0.2))", border: "1px solid rgba(79,142,247,0.3)", fontSize: 12, color: "#4f8ef7", fontWeight: 700 }}>
              ⚡ Upgrade to Pro — €9,99/month
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CALIBRATE VIEW ───────────────────────────────────────────
function Calibrate({ transactions, setTransactions, t, isDark, lang }) {
  const [search, setSearch] = useState("");
  const [pendingRules, setPendingRules] = useState({});
  const [applied, setApplied] = useState({});
  const [showOnlyUncategorized, setShowOnlyUncategorized] = useState(false);
  const [addingCatForGroup, setAddingCatForGroup] = useState(null);
  const [inlineNewCat, setInlineNewCat] = useState("");
  const [showCatManager, setShowCatManager] = useState(false);
  const [cats, setCats] = useState(Object.keys(CATEGORY_COLORS));
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState(null);
  const [editingCatVal, setEditingCatVal] = useState("");

  // Group transactions by normalized description, count frequency
  const groups = useMemo(() => {
    const map = {};
    transactions.forEach(tx => {
      const key = tx.description.trim().toLowerCase();
      if (!map[key]) {
        map[key] = {
          key,
          label: tx.description.trim(),
          count: 0,
          category: tx.category,
          categories: {},
          counterparty: tx.counterparty || null,
          paymentTypes: {},
        };
      }
      map[key].count++;
      map[key].categories[tx.category] = (map[key].categories[tx.category] || 0) + 1;
      if (tx.counterparty && !map[key].counterparty) map[key].counterparty = tx.counterparty;
      if (tx.paymentType) map[key].paymentTypes[tx.paymentType] = (map[key].paymentTypes[tx.paymentType] || 0) + 1;
    });

    return Object.values(map)
      .map(g => {
        const dominant = Object.entries(g.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || "other";
        const dominantType = Object.entries(g.paymentTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        return { ...g, category: dominant, paymentType: dominantType };
      })
      .sort((a, b) => b.count - a.count);
  }, [transactions]);

  const filtered = groups.filter(g => {
    const matchSearch = g.label.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !showOnlyUncategorized || g.category === "other";
    return matchSearch && matchFilter;
  });

  const setPending = (key, cat) => {
    setPendingRules(prev => ({ ...prev, [key]: cat }));
  };

  const applyRule = (key) => {
    const cat = pendingRules[key];
    if (!cat) return;
    setTransactions(prev =>
      prev.map(tx =>
        tx.description.trim().toLowerCase() === key ? { ...tx, category: cat } : tx
      )
    );
    setApplied(prev => ({ ...prev, [key]: true }));
    setPendingRules(prev => { const n = { ...prev }; delete n[key]; return n; });
    setTimeout(() => setApplied(prev => { const n = { ...prev }; delete n[key]; return n; }), 2000);
  };

  const applyAll = () => {
    if (!Object.keys(pendingRules).length) return;
    setTransactions(prev =>
      prev.map(tx => {
        const key = tx.description.trim().toLowerCase();
        return pendingRules[key] ? { ...tx, category: pendingRules[key] } : tx;
      })
    );
    const keys = Object.keys(pendingRules);
    const newApplied = {};
    keys.forEach(k => { newApplied[k] = true; });
    setApplied(newApplied);
    setPendingRules({});
    setTimeout(() => setApplied({}), 2000);
  };

  const pendingCount = Object.keys(pendingRules).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a" }}>{t.calibrate.title}</div>
          <div style={{ fontSize: 13, color: isDark ? "#64748b" : "#64748b", marginTop: 4 }}>
            {t.calibrate.subtitle}
          </div>
        </div>
        {pendingCount > 0 && (
          <button onClick={applyAll}
            style={{ ...pillBtn(), fontSize: 13 }}>
            <Check size={15} />
            Alles toepassen ({pendingCount})
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: t.calibrate.unique, value: groups.length, color: "#4f8ef7" },
          { label: t.calibrate.total, value: transactions.length, color: "#a855f7" },
          { label: t.calibrate.uncategorized, value: groups.filter(g => g.category === "other").length, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ ...card(isDark), flex: 1, minWidth: 130, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: isDark ? "#64748b" : "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Category manager */}
      <div style={{ ...card(isDark), marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showCatManager ? 14 : 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a" }}>🏷️ {t.calibrate.manage}</div>
          <button onClick={() => setShowCatManager(p => !p)}
            style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e6ed"}`, background: "transparent", color: isDark ? "#64748b" : "#94a3b8", cursor: "pointer" }}>
            {showCatManager ? (lang === "nl" ? "Sluiten" : "Close") : (lang === "nl" ? "Uitklappen" : "Expand")}
          </button>
        </div>
        {showCatManager && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
              {cats.map(cat => {
                const color = CATEGORY_COLORS[cat] || "#64748b";
                const isEditing = editingCat === cat;
                return (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 20, background: `${color}15`, border: `1px solid ${color}30`, fontSize: 12, color }}>
                    <div style={{ width: 6, height: 6, borderRadius: 2, background: "currentColor", flexShrink: 0 }}/>
                    {isEditing ? (
                      <>
                        <input autoFocus value={editingCatVal} onChange={e => setEditingCatVal(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && editingCatVal.trim()) {
                              const newKey = editingCatVal.trim();
                              CATEGORY_COLORS[newKey] = CATEGORY_COLORS[cat];
                              setCats(prev => prev.map(c => c === cat ? newKey : c));
                              setEditingCat(null);
                            }
                            if (e.key === "Escape") setEditingCat(null);
                          }}
                          style={{ width: 90, background: "transparent", border: "none", outline: "none", color, fontSize: 12, fontWeight: 600 }}/>
                        <button onClick={() => {
                          if (editingCatVal.trim()) {
                            const newKey = editingCatVal.trim();
                            CATEGORY_COLORS[newKey] = CATEGORY_COLORS[cat];
                            setCats(prev => prev.map(c => c === cat ? newKey : c));
                          }
                          setEditingCat(null);
                        }} style={{ background: "none", border: "none", cursor: "pointer", color, display: "flex", alignItems: "center" }}><Check size={10}/></button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontWeight: 600 }}>{t.categories[cat] || cat}</span>
                        <button onClick={() => { setEditingCat(cat); setEditingCatVal(cat); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color, opacity: 0.5, display: "flex", alignItems: "center", padding: "0 1px" }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}>
                          <Edit2 size={9}/>
                        </button>
                        <button onClick={() => setCats(prev => prev.filter(c => c !== cat))}
                          style={{ background: "none", border: "none", cursor: "pointer", color, opacity: 0.4, display: "flex", alignItems: "center", padding: "0 1px" }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}>
                          <X size={10}/>
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && newCatName.trim()) {
                    const key = newCatName.trim().toLowerCase().replace(/\s+/g, "_");
                    CATEGORY_COLORS[key] = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#14b8a6","#22c55e","#3b82f6"][Math.floor(Math.random()*8)];
                    setCats(prev => [...prev, key]);
                    setNewCatName("");
                  }
                }}
                placeholder={t.calibrate.newCat} style={{ flex: 1, padding: "8px 12px", background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed"}`, borderRadius: 10, color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 12, outline: "none" }}/>
              <button onClick={() => {
                if (newCatName.trim()) {
                  const key = newCatName.trim().toLowerCase().replace(/\s+/g, "_");
                  CATEGORY_COLORS[key] = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#14b8a6","#22c55e","#3b82f6"][Math.floor(Math.random()*8)];
                  setCats(prev => [...prev, key]);
                  setNewCatName("");
                }
              }} style={{ ...pillBtn(), fontSize: 12, padding: "8px 14px" }}><Plus size={12}/> Toevoegen</button>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t.calibrate.search}
            style={{ width: "100%", padding: "10px 16px 10px 38px", background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e6ed", borderRadius: 12, color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          <Search size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: isDark ? "#334155" : "#94a3b8" }} />
        </div>
        <button onClick={() => setShowOnlyUncategorized(p => !p)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 12, border: showOnlyUncategorized ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(255,255,255,0.08)", background: showOnlyUncategorized ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)", color: showOnlyUncategorized ? "#f59e0b" : "#64748b", cursor: "pointer", fontSize: 13, fontWeight: showOnlyUncategorized ? 700 : 500 }}>
          <AlertCircle size={14} />
          {t.calibrate.onlyOther}
        </button>
      </div>

      {/* Transaction groups list */}
      <div style={{ ...card(isDark), padding: 0, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 60px 160px 110px", gap: 0, padding: "12px 20px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e6ed" }}>
          {(lang === "nl" ? ["Omschrijving","Tegenpartij","Aantal","Categorie",""] : ["Description","Counterparty","Count","Category",""]).map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#334155" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: isDark ? "#334155" : "#94a3b8", fontSize: 13 }}>
            Geen transacties gevonden
          </div>
        )}

        {filtered.map((g, i) => {
          const pending = pendingRules[g.key];
          const currentCat = pending || g.category;
          const isApplied = applied[g.key];
          const hasChange = !!pending;

          return (
            <div key={g.key}
              style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 60px 160px 110px", gap: 0, padding: "12px 20px", borderBottom: i < filtered.length - 1 ? isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #f1f5f9" : "none", alignItems: "center", background: isApplied ? "rgba(34,197,94,0.06)" : hasChange ? "rgba(79,142,247,0.04)" : "transparent", transition: "background 0.3s" }}>

              {/* Description */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, paddingRight: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${CATEGORY_COLORS[currentCat] || "#334155"}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Tag size={13} color={CATEGORY_COLORS[currentCat] || "#475569"} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#f1f5f9" : "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.counterparty || g.label}</div>
                  {g.counterparty && <div style={{ fontSize: 11, color: isDark ? "#475569" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.label}</div>}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                    {g.paymentType && (
                      <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 5, background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", color: isDark ? "#64748b" : "#94a3b8", fontWeight: 600 }}>
                        {g.paymentType}
                      </span>
                    )}
                    {hasChange && !isApplied && <div style={{ fontSize: 11, color: "#4f8ef7" }}>Gewijzigd</div>}
                    {isApplied && <div style={{ fontSize: 11, color: "#22c55e" }}>✓ Toegepast op {g.count}</div>}
                  </div>
                </div>
              </div>

              {/* Counterparty */}
              <div style={{ paddingRight: 12, minWidth: 0 }}>
                {g.counterparty ? (
                  <div style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                    {g.counterparty}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: isDark ? "#334155" : "#cbd5e1" }}>—</div>
                )}
              </div>

              {/* Count badge */}
              <div>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 32, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.06)", fontSize: 12, fontWeight: 700, color: isDark ? "#64748b" : "#64748b", fontFamily: "'DM Mono', monospace" }}>
                  {g.count}×
                </span>
              </div>

              {/* Category selector */}
              <div>
                {addingCatForGroup === g.key ? (
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <input autoFocus value={inlineNewCat} onChange={e => setInlineNewCat(e.target.value)}
                      placeholder={t.calibrate.newCat}
                      onKeyDown={e => {
                        if (e.key === "Enter" && inlineNewCat.trim()) {
                          const key = inlineNewCat.trim().toLowerCase().replace(/\s+/g, "_");
                          CATEGORY_COLORS[key] = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#14b8a6","#22c55e","#3b82f6"][Math.floor(Math.random()*8)];
                          setCats(prev => prev.includes(key) ? prev : [...prev, key]);
                          setPending(g.key, key);
                          setAddingCatForGroup(null); setInlineNewCat("");
                        }
                        if (e.key === "Escape") { setAddingCatForGroup(null); setInlineNewCat(""); }
                      }}
                      style={{ flex: 1, minWidth: 0, padding: "6px 10px", background: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.2)" : "#cbd5e1"}`, borderRadius: 8, color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 12, outline: "none" }}/>
                    <button onClick={() => {
                      if (inlineNewCat.trim()) {
                        const key = inlineNewCat.trim().toLowerCase().replace(/\s+/g, "_");
                        CATEGORY_COLORS[key] = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#14b8a6","#22c55e","#3b82f6"][Math.floor(Math.random()*8)];
                        setCats(prev => prev.includes(key) ? prev : [...prev, key]);
                        setPending(g.key, key);
                      }
                      setAddingCatForGroup(null); setInlineNewCat("");
                    }} style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 7, background: "#22c55e", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</button>
                    <button onClick={() => { setAddingCatForGroup(null); setInlineNewCat(""); }}
                      style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 7, background: "transparent", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#e2e6ed"}`, color: isDark ? "#64748b" : "#94a3b8", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                ) : (
                  <select
                    value={currentCat}
                    onChange={e => {
                      if (e.target.value === "__new__") {
                        setAddingCatForGroup(g.key); setInlineNewCat("");
                      } else {
                        setPending(g.key, e.target.value);
                      }
                    }}
                    style={{ width: "100%", padding: "7px 10px", background: `${CATEGORY_COLORS[currentCat] || "#334155"}15`, border: `1px solid ${CATEGORY_COLORS[currentCat] || "#334155"}40`, borderRadius: 9, color: CATEGORY_COLORS[currentCat] || "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", outline: "none" }}>
                    {cats.map(k => (
                      <option key={k} value={k}>{t.categories[k] || k}</option>
                    ))}
                    <option disabled>──────────</option>
                    <option value="__new__">+ Nieuwe categorie...</option>
                  </select>
                )}
              </div>

              {/* Apply button */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {isApplied ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#22c55e", fontWeight: 600 }}>
                    <Check size={14} /> Klaar
                  </span>
                ) : (
                  <button
                    onClick={() => applyRule(g.key)}
                    disabled={!hasChange}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: hasChange ? "none" : "1px solid rgba(255,255,255,0.06)", background: hasChange ? "linear-gradient(135deg, #4f8ef7, #6366f1)" : "rgba(255,255,255,0.03)", color: hasChange ? "#fff" : "#334155", cursor: hasChange ? "pointer" : "default", fontSize: 12, fontWeight: 700, transition: "all 0.15s" }}>
                    <Check size={12} />
                    Toepassen
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: isDark ? "#334155" : "#94a3b8" }}>
          {filtered.length} unieke omschrijvingen · {transactions.length} transacties totaal
        </div>
      )}
    </div>
  );
}

// ─── AUTO-DETECT RECURRING ────────────────────────────────────
function detectRecurring(transactions) {
  const results = [];
  const usedTxIds = new Set(); // track which txs are already in a group

  // ── Pass 1: Group by counterparty (most reliable) ──────────────
  const byCounterparty = {};
  transactions.filter(tx => tx.amount < 0 && tx.category !== "income").forEach(tx => {
    if (!tx.counterparty || tx.counterparty.length < 3) return;
    const key = tx.counterparty.trim().toLowerCase();
    if (!byCounterparty[key]) byCounterparty[key] = [];
    byCounterparty[key].push(tx);
  });

  Object.entries(byCounterparty).forEach(([key, txs]) => {
    const months = new Set(txs.map(tx => tx.date.slice(0, 7)));
    if (months.size < 2) return;
    const amounts = txs.map(tx => Math.abs(tx.amount));
    const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    if (avgAmount > 5000) return;
    const allSimilar = amounts.every(a => Math.abs(a - avgAmount) / avgAmount < 0.25);
    if (!allSimilar) return;

    txs.forEach(tx => usedTxIds.add(tx.id));
    results.push({
      key: `cp:${key}`,
      label: txs[0].description.trim(),
      counterparty: txs[0].counterparty,
      avgAmount: parseFloat(avgAmount.toFixed(2)),
      count: txs.length,
      months: [...months].sort(),
      lastDate: txs.map(tx => tx.date).sort().pop(),
      category: txs[0].category,
      txIds: txs.map(tx => tx.id),
    });
  });

  // ── Pass 2: Group remaining txs by description ─────────────────
  const byDescription = {};
  transactions.filter(tx => tx.amount < 0 && tx.category !== "income" && !usedTxIds.has(tx.id)).forEach(tx => {
    const key = tx.description.trim().toLowerCase();
    if (!byDescription[key]) byDescription[key] = [];
    byDescription[key].push(tx);
  });

  Object.entries(byDescription).forEach(([key, txs]) => {
    const months = new Set(txs.map(tx => tx.date.slice(0, 7)));
    if (months.size < 2) return;
    const amounts = txs.map(tx => Math.abs(tx.amount));
    const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    if (avgAmount > 5000) return;
    const allSimilar = amounts.every(a => Math.abs(a - avgAmount) / avgAmount < 0.25);
    if (!allSimilar) return;

    const cpMap = {};
    txs.forEach(tx => { if (tx.counterparty) cpMap[tx.counterparty] = (cpMap[tx.counterparty]||0)+1; });
    const topCp = Object.entries(cpMap).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;

    results.push({
      key: `desc:${key}`,
      label: txs[0].description.trim(),
      counterparty: topCp,
      avgAmount: parseFloat(avgAmount.toFixed(2)),
      count: txs.length,
      months: [...months].sort(),
      lastDate: txs.map(tx => tx.date).sort().pop(),
      category: txs[0].category,
      txIds: txs.map(tx => tx.id),
    });
  });

  return results.sort((a, b) => b.avgAmount - a.avgAmount);
}

// ─── VASTE LASTEN VIEW ─────────────────────────────────────────
function VasteLasten({ transactions, recurringItems, setRecurringItems, isDark, t, lang }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState("search"); // "search" | "manual"
  const [searchQ, setSearchQ] = useState("");
  const [selectedTx, setSelectedTx] = useState(null);
  const [manualForm, setManualForm] = useState({ name: "", amount: "", category: "subscriptions" });
  const [editReminder, setEditReminder] = useState(null); // item id being edited
  const [reminderForm, setReminderForm] = useState({ date: "", note: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const detected = useMemo(() => detectRecurring(transactions), [transactions]);
  const today = new Date().toISOString().slice(0, 10);

  // Merge detected + manually added, deduplicate by key
  const allItems = useMemo(() => {
    const manual = recurringItems.filter(r => r.isManual);
    const autoItems = detected
      .filter(d => !recurringItems.find(r => r.key === d.key))
      .map(d => ({ ...d, isManual: false, remindDate: "", remindNote: "" }));
    const savedAuto = recurringItems.filter(r => !r.isManual && !r._removed);
    return [...savedAuto, ...autoItems, ...manual];
  }, [detected, recurringItems]);

  const totalMonthly = allItems.reduce((s, i) => s + i.avgAmount, 0);

  // Unique matching transactions for search
  const searchResults = useMemo(() => {
    if (!searchQ.trim()) return [];
    const q = searchQ.toLowerCase();
    const seen = new Set();
    return transactions
      .filter(tx => tx.amount < 0 && (tx.description.toLowerCase().includes(q)))
      .filter(tx => { const k = tx.description.trim().toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, 8);
  }, [searchQ, transactions]);

  const addFromTx = (tx) => {
    const key = tx.description.trim().toLowerCase();
    if (recurringItems.find(r => r.key === key)) return;
    setRecurringItems(prev => [...prev, {
      id: Date.now(), key, label: tx.description.trim(),
      avgAmount: Math.abs(tx.amount), category: tx.category,
      isManual: true, remindDate: "", remindNote: "",
      months: [tx.date.slice(0, 7)], lastDate: tx.date, count: 1, txIds: [tx.id],
    }]);
    setShowAddModal(false); setSearchQ(""); setSelectedTx(null);
  };

  const addManual = () => {
    if (!manualForm.name || !manualForm.amount) return;
    const key = manualForm.name.trim().toLowerCase();
    setRecurringItems(prev => [...prev, {
      id: Date.now(), key, label: manualForm.name.trim(),
      avgAmount: parseFloat(manualForm.amount), category: manualForm.category,
      isManual: true, remindDate: "", remindNote: "",
      months: [], lastDate: "", count: 0, txIds: [],
    }]);
    setManualForm({ name: "", amount: "", category: "subscriptions" });
    setShowAddModal(false);
  };

  const removeItem = (item) => {
    // If it was auto-detected and not in recurringItems, add it as "removed"
    setRecurringItems(prev => {
      const exists = prev.find(r => r.key === item.key);
      if (exists) return prev.filter(r => r.key !== item.key);
      // Mark auto-detected as explicitly removed
      return [...prev, { ...item, isManual: false, _removed: true }];
    });
    setDeleteConfirm(null);
  };

  const saveReminder = (item) => {
    setRecurringItems(prev => {
      const exists = prev.find(r => r.key === item.key);
      if (exists) {
        return prev.map(r => r.key === item.key ? { ...r, remindDate: reminderForm.date, remindNote: reminderForm.note } : r);
      }
      return [...prev, { ...item, isManual: false, remindDate: reminderForm.date, remindNote: reminderForm.note }];
    });
    setEditReminder(null);
  };

  const C = { // color shortcuts
    text: isDark ? "#f1f5f9" : "#0f172a",
    sub: isDark ? "#94a3b8" : "#475569",
    muted: isDark ? "#64748b" : "#64748b",
    faint: isDark ? "#334155" : "#94a3b8",
    border: isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed",
    rowBg: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    inputBg: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
    modalBg: isDark ? "#111827" : "#ffffff",
  };

  const iStyle = { width: "100%", padding: "11px 14px", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div>
      {/* Add Modal */}
      {showAddModal && (
        <div onClick={() => setShowAddModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.modalBg, border: `1px solid ${C.border}`, borderRadius: 24, padding: 28, width: "100%", maxWidth: 500, position: "relative" }}>
            <button onClick={() => setShowAddModal(false)} style={{ position: "absolute", top: 16, right: 16, width: 30, height: 30, borderRadius: 8, background: C.rowBg, border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>{t.recurring.addBtn}</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Zoek een transactie of maak een nieuwe aan</div>

            {/* Mode toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[["search", t.recurring.searchMode], ["manual", t.recurring.manualMode]].map(([mode, label]) => (
                <button key={mode} onClick={() => setAddMode(mode)}
                  style={{ flex: 1, padding: "9px", borderRadius: 50, border: addMode === mode ? "1px solid rgba(79,142,247,0.5)" : `1px solid ${C.border}`, background: addMode === mode ? "rgba(79,142,247,0.15)" : C.rowBg, color: addMode === mode ? "#4f8ef7" : C.muted, cursor: "pointer", fontSize: 13, fontWeight: addMode === mode ? 700 : 500 }}>
                  {label}
                </button>
              ))}
            </div>

            {addMode === "search" ? (
              <div>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Zoek op naam of omschrijving..." autoFocus style={{ ...iStyle, paddingLeft: 38 }} />
                  <Search size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.faint }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
                  {searchResults.length === 0 && searchQ && <div style={{ padding: "20px", textAlign: "center", color: C.faint, fontSize: 13 }}>Geen resultaten</div>}
                  {searchResults.map(tx => (
                    <div key={tx.id} onClick={() => addFromTx(tx)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, background: C.rowBg, border: `1px solid ${C.border}`, cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#4f8ef7"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{tx.counterparty || tx.description}</div>
                    {tx.counterparty && <div style={{ fontSize: 11, color: C.muted }}>{tx.description}</div>}
                        <div style={{ fontSize: 11, color: C.muted }}>{tx.date} · {tx.account}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f43f5e", fontFamily: "'DM Mono', monospace" }}>−{fmt(Math.abs(tx.amount))}</div>
                    </div>
                  ))}
                </div>
                {searchQ.length === 0 && <div style={{ textAlign: "center", color: C.faint, fontSize: 12, padding: "16px 0" }}>Typ een naam om transacties te zoeken</div>}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Naam</label>
                  <input value={manualForm.name} onChange={e => setManualForm(p => ({ ...p, name: e.target.value }))} placeholder="bijv. Netflix, Huur, Gym" style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Maandbedrag (€)</label>
                  <input type="number" value={manualForm.amount} onChange={e => setManualForm(p => ({ ...p, amount: e.target.value }))} placeholder="0,00" style={iStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Categorie</label>
                  <select value={manualForm.category} onChange={e => setManualForm(p => ({ ...p, category: e.target.value }))} style={{ ...iStyle, cursor: "pointer" }}>
                    {Object.entries(CATEGORY_COLORS).map(([k]) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <button onClick={addManual} disabled={!manualForm.name || !manualForm.amount}
                  style={{ ...pillBtn(), opacity: manualForm.name && manualForm.amount ? 1 : 0.4, marginTop: 4 }}>
                  <Plus size={15} /> Toevoegen
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {editReminder !== null && (
        <div onClick={() => setEditReminder(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.modalBg, border: `1px solid ${C.border}`, borderRadius: 24, padding: 28, width: "100%", maxWidth: 420, position: "relative" }}>
            <button onClick={() => setEditReminder(null)} style={{ position: "absolute", top: 16, right: 16, width: 30, height: 30, borderRadius: 8, background: C.rowBg, border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>🔔 Herinnering instellen</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Ontvang een melding in Inzichten op de ingestelde datum</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Datum (bijv. contract verloopdatum)</label>
                <input type="date" value={reminderForm.date} onChange={e => setReminderForm(p => ({ ...p, date: e.target.value }))} style={iStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Notitie (optioneel)</label>
                <input value={reminderForm.note} onChange={e => setReminderForm(p => ({ ...p, note: e.target.value }))} placeholder="bijv. 'Contract verlengen of opzeggen'" style={iStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditReminder(null)} style={{ ...pillBtnGhost(isDark), flex: 1, padding: "11px 0" }}>{lang === "nl" ? "Annuleren" : "Cancel"}</button>
              <button onClick={() => saveReminder(allItems.find(i => i.key === editReminder))}
                style={{ ...pillBtn(), flex: 2, padding: "11px 0" }}>
                <Bell size={14} /> Instellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Vaste Lasten</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{t.recurring.subtitle}</div>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ ...pillBtn(), fontSize: 13 }}>
          <Plus size={15} /> {t.recurring.addBtn}
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { label: t.recurring.totalMonth, value: fmt(totalMonthly), color: "#f43f5e", icon: "📅" },
          { label: t.recurring.totalYear, value: fmt(totalMonthly * 12), color: "#a855f7", icon: "📆" },
          { label: t.recurring.count, value: `${allItems.length}`, color: "#4f8ef7", icon: "🔁" },
          { label: t.recurring.withReminder, value: `${allItems.filter(i => i.remindDate).length}`, color: "#f59e0b", icon: "🔔" },
        ].map(s => (
          <div key={s.label} style={{ ...card(isDark), flex: 1, minWidth: 140, padding: "14px 18px", borderTop: isDark ? undefined : `2.5px solid ${s.color}` }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div style={{ ...card(isDark), padding: 0, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 140px 100px", gap: 0, padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
          {[lang === "nl" ? "Omschrijving" : "Description", lang === "nl" ? "Bedrag/mnd" : "Amount/mo", lang === "nl" ? "Categorie" : "Category", lang === "nl" ? "Herinnering" : "Reminder", ""].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>

        {allItems.filter(i => !i._removed).length === 0 && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔁</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{lang === "nl" ? "Geen vaste lasten gevonden" : "No liabilities found"}</div>
            <div style={{ fontSize: 13, color: C.muted }}>{lang === "nl" ? "Upload meer transacties of voeg handmatig een vaste last toe" : "Upload more transactions or add one manually"}</div>
          </div>
        )}

        {allItems.filter(i => !i._removed).map((item, idx, arr) => {
          const hasReminder = !!item.remindDate;
          const reminderPast = hasReminder && item.remindDate <= today;
          const daysLeft = hasReminder ? Math.ceil((new Date(item.remindDate) - new Date()) / 86400000) : null;
          const isLastRow = idx === arr.length - 1;

          return (
            <div key={item.key}
              style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 140px 100px", gap: 0, padding: "13px 20px", borderBottom: isLastRow ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9"}`, alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

              {/* Name + source */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${CATEGORY_COLORS[item.category] || "#64748b"}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Repeat size={14} color={CATEGORY_COLORS[item.category] || "#64748b"} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.counterparty || item.label}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.counterparty ? item.label : (item.isManual ? t.recurring.manual : `${item.count}× ${t.recurring.seen} ${item.lastDate}`)}
                  </div>
                  {item.counterparty && (
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {item.isManual ? t.recurring.manual : `${item.count}× ${t.recurring.seen} ${item.lastDate}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f43f5e", fontFamily: "'DM Mono', monospace" }}>−{fmt(item.avgAmount)}</div>

              {/* Category */}
              <div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 8, background: `${CATEGORY_COLORS[item.category] || "#64748b"}18`, fontSize: 11, fontWeight: 600, color: CATEGORY_COLORS[item.category] || "#64748b" }}>
                  <div style={{ width: 5, height: 5, borderRadius: 1, background: "currentColor" }} />
                  {item.category}
                </span>
              </div>

              {/* Reminder */}
              <div>
                {hasReminder ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ fontSize: 11, color: reminderPast ? "#f43f5e" : daysLeft <= 30 ? "#f59e0b" : "#22c55e", fontWeight: 600 }}>
                      {reminderPast ? "⚠ Verlopen" : daysLeft <= 30 ? `⏰ ${daysLeft}d` : `🔔 ${item.remindDate}`}
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: C.faint }}>—</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setEditReminder(item.key); setReminderForm({ date: item.remindDate || "", note: item.remindNote || "" }); }}
                  title="Herinnering instellen"
                  style={{ width: 28, height: 28, borderRadius: 8, background: hasReminder ? "rgba(245,158,11,0.12)" : C.rowBg, border: `1px solid ${hasReminder ? "rgba(245,158,11,0.3)" : C.border}`, cursor: "pointer", color: hasReminder ? "#f59e0b" : C.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bell size={12} />
                </button>
                <button onClick={() => removeItem(item)} title={t.recurring.removeTitle}
                  style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.15)", cursor: "pointer", color: "#f43f5e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: C.faint, textAlign: "center" }}>
        {t.recurring.removeNote}
      </div>
    </div>
  );
}

// ─── EXPORT VIEW ───────────────────────────────────────────────
function ExportView({ transactions, isDark }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [includeIncome, setIncludeIncome] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [exporting, setExporting] = useState(null);

  const C = {
    text: isDark ? "#f1f5f9" : "#0f172a",
    sub: isDark ? "#94a3b8" : "#475569",
    muted: isDark ? "#64748b" : "#64748b",
    faint: isDark ? "#334155" : "#94a3b8",
    border: isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed",
    rowBg: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    inputBg: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
  };
  const iStyle = { width: "100%", padding: "11px 14px", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
      if (!includeIncome && tx.amount > 0) return false;
      if (!includeExpenses && tx.amount < 0) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, dateFrom, dateTo, includeIncome, includeExpenses]);

  const totalIncome = filtered.filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const totalExpenses = filtered.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);

  const exportCSV = () => {
    setExporting("csv");
    const header = "Datum,Omschrijving,Categorie,Rekening,Bedrag\n";
    const rows = filtered.map(tx =>
      `"${tx.date}","${tx.description.replace(/"/g, '""')}","${tx.category}","${tx.account}","${tx.amount.toFixed(2)}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `dynafy-export-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    setTimeout(() => setExporting(null), 1500);
  };

  const exportPDF = () => {
    setExporting("pdf");
    const dateRange = dateFrom || dateTo ? `${dateFrom || "begin"} t/m ${dateTo || "nu"}` : "Alle transacties";

    // Build HTML for PDF print
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dynafy Export</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: system-ui, sans-serif; color: #0f172a; padding: 40px; font-size: 12px; }
      h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
      .meta { color: #64748b; font-size: 12px; margin-bottom: 28px; }
      .summary { display: flex; gap: 20px; margin-bottom: 28px; }
      .sum-card { flex: 1; padding: 16px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e6ed; }
      .sum-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 4px; }
      .sum-value { font-size: 18px; font-weight: 800; font-family: monospace; }
      .income { color: #16a34a; } .expense { color: #dc2626; } .balance { color: #2563eb; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; padding: 8px 12px; border-bottom: 1px solid #e2e6ed; }
      td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
      tr:last-child td { border-bottom: none; }
      .amount-pos { color: #16a34a; font-weight: 700; font-family: monospace; text-align: right; }
      .amount-neg { color: #dc2626; font-weight: 700; font-family: monospace; text-align: right; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <h1>Dynafy — Exportoverzicht</h1>
    <div class="meta">Gegenereerd op ${new Date().toLocaleDateString("nl-NL", { dateStyle: "long" })} · ${dateRange} · ${filtered.length} transacties</div>
    <div class="summary">
      <div class="sum-card"><div class="sum-label">Totaal inkomsten</div><div class="sum-value income">+${fmt(totalIncome)}</div></div>
      <div class="sum-card"><div class="sum-label">Totaal uitgaven</div><div class="sum-value expense">−${fmt(totalExpenses)}</div></div>
      <div class="sum-card"><div class="sum-label">Netto saldo</div><div class="sum-value balance">${fmt(totalIncome - totalExpenses)}</div></div>
    </div>
    <table>
      <thead><tr><th>Datum</th><th>Omschrijving</th><th>Categorie</th><th>Rekening</th><th style="text-align:right">Bedrag</th></tr></thead>
      <tbody>
        ${filtered.map(tx => `<tr>
          <td>${tx.date}</td>
          <td>${tx.description}</td>
          <td>${tx.category}</td>
          <td>${tx.account}</td>
          <td class="${tx.amount >= 0 ? "amount-pos" : "amount-neg"}">${tx.amount >= 0 ? "+" : "−"}${fmt(Math.abs(tx.amount))}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    <script>window.onload = () => { window.print(); }<\/script>
    </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) { win.focus(); }
    setTimeout(() => { URL.revokeObjectURL(url); setExporting(null); }, 2000);
  };

  const renderToggle = (checked, onChange, label) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
      <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{label}</span>
      <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 11, background: checked ? "#4f8ef7" : isDark ? "rgba(255,255,255,0.12)" : "#e2e6ed", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: 8, background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>Exporteren</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Exporteer je transacties naar CSV of PDF</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20 }}>
        {/* Filters */}
        <div style={{ ...card(isDark), display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Filters</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Van datum</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={iStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Tot datum</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={iStyle} />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, margin: "12px 0" }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Inhoudstype</div>
          {renderToggle(includeIncome, setIncludeIncome, "Inkomsten meenemen")}
          <div style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9"}` }} />
          {renderToggle(includeExpenses, setIncludeExpenses, "Uitgaven meenemen")}

          <div style={{ borderTop: `1px solid ${C.border}`, margin: "12px 0" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setDateFrom(""); setDateTo(""); setIncludeIncome(true); setIncludeExpenses(true); }}
              style={{ ...pillBtnGhost(isDark), flex: 1, padding: "10px 0", fontSize: 12 }}>Reset</button>
          </div>
        </div>

        {/* Preview + Export */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Summary */}
          <div style={{ ...card(isDark) }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>Overzicht selectie</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, padding: "12px", borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginBottom: 4 }}>INKOMSTEN</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#22c55e", fontFamily: "'DM Mono', monospace" }}>+{fmt(totalIncome)}</div>
              </div>
              <div style={{ flex: 1, padding: "12px", borderRadius: 12, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, marginBottom: 4 }}>UITGAVEN</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f43f5e", fontFamily: "'DM Mono', monospace" }}>−{fmt(totalExpenses)}</div>
              </div>
              <div style={{ flex: 1, padding: "12px", borderRadius: 12, background: "rgba(79,142,247,0.08)", border: isDark ? "1px solid rgba(79,142,247,0.2)" : "1px solid rgba(79,142,247,0.15)", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 700, marginBottom: 4 }}>NETTO</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#4f8ef7", fontFamily: "'DM Mono', monospace" }}>{fmt(totalIncome - totalExpenses)}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>{filtered.length} transacties geselecteerd{(dateFrom || dateTo) ? ` · ${dateFrom || "begin"} t/m ${dateTo || "nu"}` : " · alle data"}</div>
          </div>

          {/* Export buttons */}
          <div style={{ ...card(isDark) }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>Exporteer als</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={exportCSV} disabled={filtered.length === 0 || exporting === "csv"}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.rowBg, cursor: filtered.length === 0 ? "default" : "pointer", opacity: filtered.length === 0 ? 0.4 : 1, transition: "all 0.15s" }}
                onMouseEnter={e => { if (filtered.length > 0) e.currentTarget.style.borderColor = "#22c55e"; }}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileSpreadsheet size={20} color="#22c55e" />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>CSV Downloaden</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Excel, Google Sheets, boekhoudprogramma's</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "rgba(34,197,94,0.12)", color: "#22c55e", fontSize: 12, fontWeight: 700 }}>
                  {exporting === "csv" ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={13} />}
                  {exporting === "csv" ? "Bezig..." : "Download"}
                </div>
              </button>

              <button onClick={exportPDF} disabled={filtered.length === 0 || exporting === "pdf"}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.rowBg, cursor: filtered.length === 0 ? "default" : "pointer", opacity: filtered.length === 0 ? 0.4 : 1, transition: "all 0.15s" }}
                onMouseEnter={e => { if (filtered.length > 0) e.currentTarget.style.borderColor = "#f43f5e"; }}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={20} color="#f43f5e" />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>PDF Downloaden</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Print-klaar rapport voor boekhouder of belasting</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "rgba(244,63,94,0.1)", color: "#f43f5e", fontSize: 12, fontWeight: 700 }}>
                  {exporting === "pdf" ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={13} />}
                  {exporting === "pdf" ? "Openen..." : "Download"}
                </div>
              </button>
            </div>
          </div>

          {/* Preview rows */}
          <div style={{ ...card(isDark), padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700, color: C.text }}>
              Voorbeeld ({Math.min(5, filtered.length)} van {filtered.length})
            </div>
            {filtered.slice(0, 5).map((tx, i) => (
              <div key={tx.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: i < 4 && i < filtered.length - 1 ? `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9"}` : "none" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{tx.date}</div>
                  <div style={{ fontSize: 13, color: C.text }}>{(tx.counterparty || tx.description).slice(0, 28)}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tx.amount >= 0 ? "#22c55e" : "#f43f5e", fontFamily: "'DM Mono', monospace" }}>
                  {tx.amount >= 0 ? "+" : "−"}{fmt(Math.abs(tx.amount))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: "24px", textAlign: "center", color: C.faint, fontSize: 13 }}>Geen transacties met huidige filters</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GOALS VIEW ────────────────────────────────────────────────
function GoalsView({ transactions, isDark, useMockData = true, goals: appGoals, setGoals: setAppGoals, t, lang = "nl" }) {
  const [tab, setTab] = useState("savings");

  const C = {
    text: isDark ? "#f1f5f9" : "#0f172a",
    sub: isDark ? "#94a3b8" : "#475569",
    muted: isDark ? "#64748b" : "#64748b",
    faint: isDark ? "#334155" : "#94a3b8",
    border: isDark ? "rgba(255,255,255,0.08)" : "#e2e6ed",
    rowBg: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    inputBg: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
  };

  const iStyle = { width: "100%", padding: "10px 14px", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 };

  const tabs = [
    { id: "savings",  label: lang === "nl" ? "Spaardoelen" : "Saving goals",   icon: "🎯" },
    { id: "fire",     label: "FIRE",           icon: "🔥" },
    { id: "budget",   label: lang === "nl" ? "Budgetteren" : "Budget",    icon: "📊" },
    { id: "debt",     label: lang === "nl" ? "Schulden" : "Debt",       icon: "📉" },
  ];

  // ─────────────────────────────────── SPAARDOELEN ───────────────
  const SavingsTab = () => {
    // Use app-level goals if available, otherwise local state
    const [localGoals, setLocalGoals] = useState(useMockData ? [
      { id: 1, name: "Noodfonds", target: 10000, current: 3500, deadline: "2026-12-31", color: "#22c55e" },
      { id: 2, name: "Vakantie",  target: 3000,  current: 1200, deadline: "2026-07-01", color: "#4f8ef7" },
    ] : []);
    const goals = appGoals !== undefined ? appGoals : localGoals;
    const setGoals = appGoals !== undefined && setAppGoals ? setAppGoals : setLocalGoals;
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: "", target: "", current: "", deadline: "", color: "#4f8ef7" });
    const COLORS = ["#4f8ef7","#22c55e","#f59e0b","#a855f7","#f43f5e","#14b8a6","#d97706","#6366f1"];

    const addGoal = () => {
      if (!form.name || !form.target) return;
      setGoals(prev => [...prev, { id: Date.now(), name: form.name, target: parseFloat(form.target), current: parseFloat(form.current)||0, deadline: form.deadline, color: form.color }]);
      setForm({ name: "", target: "", current: "", deadline: "", color: "#4f8ef7" }); setShowAdd(false);
    };

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: C.muted }}>Stel doelen in en volg je voortgang</div>
          <button onClick={() => setShowAdd(p => !p)} style={{ ...pillBtn(), fontSize: 12, padding: "8px 16px" }}><Plus size={13} /> Nieuw doel</button>
        </div>

        {showAdd && (
          <div style={{ ...card(isDark), marginBottom: 16, border: `1px solid rgba(79,142,247,0.3)` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>Nieuw spaardoel</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>Naam</label><input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="bijv. Vakantie" style={iStyle}/></div>
              <div><label style={labelStyle}>Doelbedrag (€)</label><input type="number" value={form.target} onChange={e => setForm(p=>({...p,target:e.target.value}))} placeholder="5000" style={iStyle}/></div>
              <div><label style={labelStyle}>Huidig saldo (€)</label><input type="number" value={form.current} onChange={e => setForm(p=>({...p,current:e.target.value}))} placeholder="0" style={iStyle}/></div>
              <div><label style={labelStyle}>Deadline</label><input type="date" value={form.deadline} onChange={e => setForm(p=>({...p,deadline:e.target.value}))} style={iStyle}/></div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Kleur</label>
              <div style={{ display: "flex", gap: 8 }}>
                {COLORS.map(c => <div key={c} onClick={() => setForm(p=>({...p,color:c}))} style={{ width: 28, height: 28, borderRadius: 8, background: c, cursor: "pointer", border: form.color===c ? "3px solid #fff" : "2px solid transparent", boxSizing: "border-box" }}/>)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{ ...pillBtnGhost(isDark), flex: 1, padding: "9px 0", fontSize: 12 }}>{lang === "nl" ? "Annuleren" : "Cancel"}</button>
              <button onClick={addGoal} style={{ ...pillBtn(), flex: 2, padding: "9px 0", fontSize: 12, opacity: form.name&&form.target?1:0.45 }}><Plus size={13}/> Toevoegen</button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {goals.map(goal => {
            const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
            const remaining = goal.target - goal.current;
            const today = new Date();
            const deadline = goal.deadline ? new Date(goal.deadline) : null;
            const monthsLeft = deadline ? Math.max(1, Math.ceil((deadline - today) / (1000*60*60*24*30.44))) : null;
            const monthlyNeeded = monthsLeft ? Math.ceil(remaining / monthsLeft) : null;

            return (
              <div key={goal.id} style={{ ...card(isDark), borderTop: `3px solid ${goal.color}`, position: "relative" }}>
                <button onClick={() => setGoals(prev => prev.filter(g => g.id !== goal.id))} style={{ position: "absolute", top: 14, right: 14, width: 24, height: 24, borderRadius: 6, background: "transparent", border: `1px solid ${C.border}`, color: C.faint, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={11}/></button>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{goal.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: goal.color, fontFamily: "'DM Mono', monospace" }}>{Math.round(pct)}%</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>{fmt(goal.current)} / {fmt(goal.target)}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{fmt(remaining)} te gaan</div>
                  </div>
                </div>
                <div style={{ height: 8, background: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: goal.color, borderRadius: 4, transition: "width 0.5s" }}/>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {monthlyNeeded && <div style={{ flex: 1, padding: "8px", borderRadius: 8, background: C.rowBg, border: `1px solid ${C.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Per maand</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: goal.color, fontFamily: "'DM Mono', monospace" }}>{fmt(monthlyNeeded)}</div>
                  </div>}
                  {monthsLeft && <div style={{ flex: 1, padding: "8px", borderRadius: 8, background: C.rowBg, border: `1px solid ${C.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Maanden</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{monthsLeft}</div>
                  </div>}
                </div>
                {goal.deadline && <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>Deadline: {new Date(goal.deadline).toLocaleDateString("nl-NL",{day:"numeric",month:"long",year:"numeric"})}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────── FIRE ──────────────────────
  const FireTab = () => {
    const [step, setStep] = useState("intro"); // "intro" | "calc"
    const [monthlyExpenses, setMonthlyExpenses] = useState(3000);
    const [currentWealth, setCurrentWealth] = useState(50000);
    const [monthlyInvestment, setMonthlyInvestment] = useState(1000);
    const [returnRate, setReturnRate] = useState(7);
    const [inflationRate, setInflationRate] = useState(2.5);
    const [withdrawalRate, setWithdrawalRate] = useState(4);
    const [tooltip, setTooltip] = useState(null); // which tooltip is open

    // Close tooltip on any outside click
    useEffect(() => {
      if (!tooltip) return;
      const close = () => setTooltip(null);
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }, [tooltip]);

    const realReturn = (returnRate - inflationRate) / 100;
    const annualExpenses = monthlyExpenses * 12;
    const fireNumber = Math.round(annualExpenses / (withdrawalRate / 100));
    const remaining = Math.max(0, fireNumber - currentWealth);

    let yearsToFire = null;
    if (monthlyInvestment > 0 && realReturn > 0) {
      const r = realReturn / 12;
      let months = 0; let wealth = currentWealth;
      while (wealth < fireNumber && months < 600) { wealth = wealth * (1 + r) + monthlyInvestment; months++; }
      yearsToFire = months < 600 ? (months / 12).toFixed(1) : null;
    }
    const fireYear = yearsToFire ? new Date().getFullYear() + Math.ceil(parseFloat(yearsToFire)) : null;
    const pct = Math.min(100, Math.round((currentWealth / fireNumber) * 100));

    const TIPS = {
      expenses: "Hoeveel geef jij gemiddeld per maand uit? Dit is de basis voor je FIRE-berekening. Gebruik je gemiddelde uitgaven uit de transactie-overzichten.",
      wealth: "Alles wat je nu bezit: spaarrekening, beleggingen, crypto, pensioen. Huis telt alleen mee als je het zou verkopen.",
      investment: "Hoeveel leg je elke maand opzij om te investeren? Dit versnelt het moment dat je FIRE bereikt.",
      return: "Het gemiddelde jaarlijkse rendement op je beleggingen. De wereldwijde aandelenmarkt (MSCI World) gaf historisch ~7-10% per jaar.",
      inflation: "De jaarlijkse geldontwaarding. In Nederland was dit de afgelopen jaren ~3-5%. Reken conservatief met 2.5-3%.",
      swr: "Safe Withdrawal Rate: het percentage dat je elk jaar 'veilig' kunt opnemen zonder je vermogen op te maken. De klassieke 4% regel stelt dat je 25× je jaaruitgaven nodig hebt. Lager (3%) = zekerder maar je hebt meer nodig.",
    };

    const TooltipBtn = ({ id }) => (
      <div style={{ position: "relative", display: "inline-block" }}>
        <button onClick={(e) => { e.stopPropagation(); setTooltip(tooltip === id ? null : id); }}
          style={{ width: 16, height: 16, borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0", border: "none", color: isDark ? "#94a3b8" : "#64748b", cursor: "pointer", fontSize: 10, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", marginLeft: 6, flexShrink: 0, lineHeight: 1 }}>
          ?
        </button>
        {tooltip === id && (
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", left: 22, top: -4, zIndex: 50, width: 240, padding: "10px 12px", borderRadius: 10, background: isDark ? "#1e2d3d" : "#ffffff", border: isDark ? "1px solid rgba(79,142,247,0.4)" : "1px solid #93c5fd", fontSize: 12, color: isDark ? "#cbd5e1" : "#334155", lineHeight: 1.55, boxShadow: "0 4px 20px rgba(0,0,0,0.25)", cursor: "default" }}>
            {TIPS[id]}
            <div style={{ position: "absolute", left: -5, top: 10, width: 8, height: 8, background: isDark ? "#1e2d3d" : "#ffffff", border: isDark ? "1px solid rgba(79,142,247,0.4)" : "1px solid #93c5fd", borderRight: "none", borderTop: "none", transform: "rotate(45deg)" }}/>
          </div>
        )}
      </div>
    );

    const Slider = ({ id, label, value, onChange, min, max, step, suffix }) => (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>{label}</label>
            <TooltipBtn id={id} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b", fontFamily: "'DM Mono', monospace" }}>{suffix === "€" ? fmt(value) : `${value}${suffix}`}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "#f59e0b" }}/>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          <span style={{ fontSize: 10, color: C.faint }}>{suffix === "€" ? fmt(min) : `${min}${suffix}`}</span>
          <span style={{ fontSize: 10, color: C.faint }}>{suffix === "€" ? fmt(max) : `${max}${suffix}`}</span>
        </div>
      </div>
    );

    // ── INTRO SCREEN ────────────────────────────────────────────
    if (step === "intro") return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ ...card(isDark), borderTop: "3px solid #f59e0b", marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 12 }}>🔥 Wat is FIRE?</div>
          <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, marginBottom: 12 }}>
            <b style={{ color: C.text }}>FIRE</b> staat voor <b style={{ color: "#f59e0b" }}>Financial Independence, Retire Early</b> — financiële onafhankelijkheid en vroeg stoppen met werken.
          </p>
          <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, marginBottom: 12 }}>
            Het idee is simpel: als je genoeg vermogen hebt opgebouwd dat de <b style={{ color: C.text }}>beleggingsrendementen</b> je jaarlijkse uitgaven dekken, hoef je nooit meer te werken voor geld.
          </p>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: isDark ? "rgba(245,158,11,0.08)" : "#fffbeb", border: "1px solid rgba(245,158,11,0.25)", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 6 }}>De 4% regel</div>
            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
              Historisch gezien kun je elk jaar <b style={{ color: C.text }}>4% van je vermogen</b> opnemen zonder dat het ooit opraakt. Dit betekent dat je <b style={{ color: C.text }}>25× je jaarlijkse uitgaven</b> nodig hebt als FIRE-bedrag.
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Lean FIRE", desc: "Zuinig leven, €1.500/mnd", color: "#22c55e" },
              { label: "Regular FIRE", desc: "Comfortabel, €3.000/mnd", color: "#f59e0b" },
              { label: "Fat FIRE", desc: "Luxe levensstijl, €6.000+/mnd", color: "#f43f5e" },
            ].map(f => (
              <div key={f.label} style={{ padding: "10px 12px", borderRadius: 10, background: `${f.color}12`, border: `1px solid ${f.color}30`, textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: f.color, marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card(isDark) }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Wat zijn jouw maandelijkse uitgaven?</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Dit is het startpunt van je berekening. Gebruik je gemiddelde uit de transactieoverzichten.</div>
          <Slider id="expenses" label="Maandelijkse uitgaven" value={monthlyExpenses} onChange={setMonthlyExpenses} min={500} max={10000} step={100} suffix="€"/>
          <div style={{ padding: "12px 16px", borderRadius: 10, background: isDark ? "rgba(245,158,11,0.08)" : "#fffbeb", border: "1px solid rgba(245,158,11,0.2)", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.sub }}>Jouw FIRE-bedrag (4% regel)</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b", fontFamily: "'DM Mono', monospace" }}>{fmt(monthlyExpenses * 12 * 25)}</span>
            </div>
          </div>
          <button onClick={() => setStep("calc")} style={{ ...pillBtn(), width: "100%", padding: "13px 0", fontSize: 14, background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}>
            Bereken mijn FIRE-datum 🔥
          </button>
        </div>
      </div>
    );

    // ── CALCULATOR SCREEN ───────────────────────────────────────
    return (
      <div>
        <button onClick={() => setStep("intro")} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0 }}>
          ← Terug naar uitleg
        </button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ ...card(isDark) }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>Jouw situatie</div>
            <Slider id="expenses" label="Maandelijkse uitgaven" value={monthlyExpenses} onChange={setMonthlyExpenses} min={500} max={10000} step={100} suffix="€"/>
            <Slider id="wealth" label="Huidig vermogen" value={currentWealth} onChange={setCurrentWealth} min={0} max={500000} step={5000} suffix="€"/>
            <Slider id="investment" label="Maandelijkse investering" value={monthlyInvestment} onChange={setMonthlyInvestment} min={0} max={5000} step={50} suffix="€"/>
            <Slider id="return" label="Verwacht rendement" value={returnRate} onChange={setReturnRate} min={1} max={15} step={0.5} suffix="%"/>
            <Slider id="inflation" label="Inflatie" value={inflationRate} onChange={setInflationRate} min={0} max={6} step={0.5} suffix="%"/>
            <Slider id="swr" label="Opnamepercentage (SWR)" value={withdrawalRate} onChange={setWithdrawalRate} min={2} max={6} step={0.5} suffix="%"/>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ ...card(isDark), borderTop: "3px solid #f59e0b" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>🔥 FIRE bedrag</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.5px" }}>{fmt(fireNumber)}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{fmt(annualExpenses)}/jaar × {(100/withdrawalRate).toFixed(0)}× multiplicator</div>
            </div>

            <div style={{ ...card(isDark) }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Voortgang</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b" }}>{pct}%</span>
              </div>
              <div style={{ height: 10, background: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: 5, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #f59e0b, #ef4444)", borderRadius: 5 }}/>
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>{fmt(currentWealth)} van {fmt(fireNumber)}</div>
            </div>

            <div style={{ ...card(isDark), background: yearsToFire ? (isDark ? "rgba(34,197,94,0.08)" : "#f0fdf4") : undefined, border: yearsToFire ? "1px solid rgba(34,197,94,0.3)" : undefined }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#94a3b8" : "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>🗓 Stoppen met werken in</div>
              {yearsToFire ? (
                <>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#22c55e", letterSpacing: "-1px" }}>{fireYear}</div>
                  <div style={{ fontSize: 13, color: isDark ? "#86efac" : "#16a34a", marginTop: 4, fontWeight: 600 }}>{yearsToFire} jaar · {Math.round(parseFloat(yearsToFire)*12)} maanden</div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: isDark ? "#94a3b8" : "#64748b" }}>Verhoog je maandelijkse investering</div>
              )}
            </div>

            <div style={{ ...card(isDark) }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Samenvatting</div>
              {[
                ["Nog nodig", fmt(remaining)],
                ["Passief inkomen", fmt(fireNumber * (withdrawalRate/100) / 12) + "/mnd"],
                ["Reëel rendement", `${(realReturn*100).toFixed(1)}%/jr`],
              ].map(([k,v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────── BUDGET ────────────────────
  const BudgetTab = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const prevMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

    // Calculate spending this month and last month per category
    const thisMonthSpent = useMemo(() => {
      const map = {};
      transactions.filter(tx => tx.date.startsWith(currentMonth) && tx.amount < 0)
        .forEach(tx => { map[tx.category] = (map[tx.category] || 0) + Math.abs(tx.amount); });
      return map;
    }, [transactions, currentMonth]);

    const lastMonthSpent = useMemo(() => {
      const map = {};
      transactions.filter(tx => tx.date.startsWith(prevMonth) && tx.amount < 0)
        .forEach(tx => { map[tx.category] = (map[tx.category] || 0) + Math.abs(tx.amount); });
      return map;
    }, [transactions, prevMonth]);

    const [budgets, setBudgets] = useState([]); // [{cat, amount}]
    const [showPicker, setShowPicker] = useState(false);
    const [editingCat, setEditingCat] = useState(null); // cat being edited
    const [editAmount, setEditAmount] = useState("");
    const [pickerAmount, setPickerAmount] = useState("");
    const [pickerCat, setPickerCat] = useState(null);

    const usedCats = new Set(budgets.map(b => b.cat));
    const availableCats = Object.keys(CATEGORY_COLORS).filter(c => !usedCats.has(c));

    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = budgets.reduce((s, b) => s + (thisMonthSpent[b.cat] || 0), 0);
    const totalLeft = totalBudget - totalSpent;

    const addBudget = () => {
      if (!pickerCat || !pickerAmount) return;
      setBudgets(prev => [...prev, { cat: pickerCat, amount: parseFloat(pickerAmount) }]);
      setPickerCat(null); setPickerAmount(""); setShowPicker(false);
    };

    const removeBudget = (cat) => setBudgets(prev => prev.filter(b => b.cat !== cat));

    const saveEdit = (cat) => {
      setBudgets(prev => prev.map(b => b.cat === cat ? { ...b, amount: parseFloat(editAmount) || b.amount } : b));
      setEditingCat(null);
    };

    return (
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 13, color: C.muted }}>
            {budgets.length === 0 ? "Voeg budgetten toe per categorie om je uitgaven bij te houden" : `${new Date().toLocaleDateString("nl-NL", { month: "long", year: "numeric" })}`}
          </div>
          {availableCats.length > 0 && (
            <button onClick={() => { setShowPicker(p => !p); setPickerCat(null); setPickerAmount(""); }}
              style={{ ...pillBtn(), fontSize: 12, padding: "8px 16px" }}>
              <Plus size={13}/> Budget toevoegen
            </button>
          )}
        </div>

        {/* Category picker modal */}
        {showPicker && (
          <div style={{ ...card(isDark), marginBottom: 20, border: `1px solid rgba(79,142,247,0.35)` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>Kies een categorie</div>

            {!pickerCat ? (
              /* Step 1: pick category */
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {availableCats.map(cat => {
                  const lastSpent = lastMonthSpent[cat] || 0;
                  const thisSpent = thisMonthSpent[cat] || 0;
                  const color = CATEGORY_COLORS[cat] || "#64748b";
                  return (
                    <button key={cat} onClick={() => { setPickerCat(cat); setPickerAmount(Math.round(lastSpent || thisSpent || 0).toString()); }}
                      style={{ padding: "8px 14px", borderRadius: 12, border: `1px solid ${color}30`, background: `${color}12`, color, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, transition: "all 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = `${color}25`}
                      onMouseLeave={e => e.currentTarget.style.background = `${color}12`}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: color }}/>
                      {cat}
                      {lastSpent > 0 && <span style={{ fontSize: 10, opacity: 0.7 }}>· {fmt(lastSpent)} vorige mnd</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Step 2: set budget amount */
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_COLORS[pickerCat] || "#64748b" }}/>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{pickerCat}</span>
                  <button onClick={() => setPickerCat(null)} style={{ marginLeft: "auto", fontSize: 11, color: C.muted, background: "none", border: "none", cursor: "pointer" }}>← Andere categorie</button>
                </div>

                {/* Last month reference */}
                {(lastMonthSpent[pickerCat] || thisMonthSpent[pickerCat]) > 0 && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    {lastMonthSpent[pickerCat] > 0 && (
                      <button onClick={() => setPickerAmount(Math.round(lastMonthSpent[pickerCat]).toString())}
                        style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.rowBg, cursor: "pointer", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Vorige maand</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: "'DM Mono', monospace" }}>{fmt(lastMonthSpent[pickerCat])}</div>
                        <div style={{ fontSize: 10, color: "#4f8ef7", marginTop: 3 }}>Gebruik dit</div>
                      </button>
                    )}
                    {thisMonthSpent[pickerCat] > 0 && (
                      <button onClick={() => setPickerAmount(Math.round(thisMonthSpent[pickerCat]).toString())}
                        style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.rowBg, cursor: "pointer", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Deze maand</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: "'DM Mono', monospace" }}>{fmt(thisMonthSpent[pickerCat])}</div>
                        <div style={{ fontSize: 10, color: "#4f8ef7", marginTop: 3 }}>Gebruik dit</div>
                      </button>
                    )}
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Maandbudget (€)</label>
                  <input type="number" autoFocus value={pickerAmount} onChange={e => setPickerAmount(e.target.value)}
                    placeholder="bijv. 300" style={iStyle}/>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowPicker(false)} style={{ ...pillBtnGhost(isDark), flex: 1, padding: "9px 0", fontSize: 12 }}>{lang === "nl" ? "Annuleren" : "Cancel"}</button>
                  <button onClick={addBudget} style={{ ...pillBtn(), flex: 2, padding: "9px 0", fontSize: 12, opacity: pickerAmount ? 1 : 0.45 }}>
                    <Plus size={13}/> Toevoegen
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {budgets.length === 0 && !showPicker && (
          <div style={{ ...card(isDark), textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Nog geen budgetten</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, maxWidth: 360, margin: "0 auto 20px" }}>
              Klik op "Budget toevoegen" en kies een categorie. Je ziet direct hoeveel je vorige maand in die categorie hebt uitgegeven.
            </div>
            <button onClick={() => setShowPicker(true)} style={{ ...pillBtn(), fontSize: 13, padding: "10px 24px" }}>
              <Plus size={14}/> Budget toevoegen
            </button>
          </div>
        )}

        {/* Summary row */}
        {budgets.length > 0 && (
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ ...card(isDark), flex: 1, minWidth: 140, padding: "12px 16px", borderTop: "3px solid #4f8ef7" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Totaal budget</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'DM Mono', monospace" }}>{fmt(totalBudget)}</div>
            </div>
            <div style={{ ...card(isDark), flex: 1, minWidth: 140, padding: "12px 16px", borderTop: "3px solid #f43f5e" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Uitgegeven</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: totalSpent > totalBudget ? "#f43f5e" : "#22c55e", fontFamily: "'DM Mono', monospace" }}>{fmt(totalSpent)}</div>
            </div>
            <div style={{ ...card(isDark), flex: 1, minWidth: 140, padding: "12px 16px", borderTop: `3px solid ${totalLeft >= 0 ? "#22c55e" : "#f43f5e"}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Resterend</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: totalLeft >= 0 ? "#22c55e" : "#f43f5e", fontFamily: "'DM Mono', monospace" }}>{fmt(Math.abs(totalLeft))}{totalLeft < 0 ? " over" : ""}</div>
            </div>
          </div>
        )}

        {/* Budget cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {budgets.map(({ cat, amount }) => {
            const spent = thisMonthSpent[cat] || 0;
            const pct = amount > 0 ? Math.min(110, (spent / amount) * 100) : 0;
            const barPct = Math.min(100, pct);
            const isOver = spent > amount;
            const isWarn = !isOver && pct >= 80;
            const statusColor = isOver ? "#f43f5e" : isWarn ? "#f59e0b" : "#22c55e";
            const catColor = CATEGORY_COLORS[cat] || "#64748b";
            const lastSpent = lastMonthSpent[cat] || 0;

            return (
              <div key={cat} style={{ ...card(isDark), border: `1px solid ${isOver ? "rgba(244,63,94,0.3)" : isWarn ? "rgba(245,158,11,0.25)" : C.border}` }}>
                {editingCat === cat ? (
                  /* Edit mode */
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: catColor, flexShrink: 0 }}/>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, flex: 1 }}>{cat}</span>
                    <input type="number" autoFocus value={editAmount} onChange={e => setEditAmount(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(cat); if (e.key === "Escape") setEditingCat(null); }}
                      style={{ width: 100, padding: "6px 10px", background: C.inputBg, border: `1px solid #4f8ef7`, borderRadius: 9, color: C.text, fontSize: 13, outline: "none", fontFamily: "'DM Mono', monospace" }}/>
                    <button onClick={() => saveEdit(cat)} style={{ padding: "6px 12px", borderRadius: 9, background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.4)", color: "#4f8ef7", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                      <Check size={13}/>
                    </button>
                    <button onClick={() => setEditingCat(null)} style={{ padding: "6px 10px", borderRadius: 9, background: C.rowBg, border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", fontSize: 12 }}>
                      <X size={13}/>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${catColor}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: catColor }}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{cat}</div>
                        {lastSpent > 0 && <div style={{ fontSize: 11, color: C.faint }}>Vorige maand: {fmt(lastSpent)}</div>}
                      </div>
                      {/* Status + amounts */}
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: statusColor, fontFamily: "'DM Mono', monospace" }}>
                          {fmt(spent)} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>/ {fmt(amount)}</span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: statusColor, marginTop: 2 }}>
                          {isOver ? `⚠ ${fmt(spent - amount)} over budget` : isWarn ? `⚡ ${fmt(amount - spent)} resterend` : `✓ ${fmt(amount - spent)} resterend`}
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                        <button onClick={() => { setEditingCat(cat); setEditAmount(amount.toString()); }}
                          style={{ width: 28, height: 28, borderRadius: 8, background: C.rowBg, border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Edit2 size={12}/>
                        </button>
                        <button onClick={() => removeBudget(cat)}
                          style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.2)", color: "#f43f5e", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 8, background: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${barPct}%`, background: statusColor, borderRadius: 4, transition: "width 0.4s" }}/>
                    </div>
                    <div style={{ fontSize: 10, color: C.faint, marginTop: 4, textAlign: "right" }}>{Math.round(pct)}%</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────── SCHULDEN ──────────────────
  const DebtTab = () => {
    const [debts, setDebts] = useState(useMockData ? [
      { id: 1, name: "Studielening", balance: 12000, rate: 2.5, minPayment: 150 },
      { id: 2, name: "Creditcard",   balance: 2500,  rate: 18,  minPayment: 75  },
    ] : []);
    const [extraPayment, setExtraPayment] = useState(200);
    const [method, setMethod] = useState("avalanche"); // avalanche | snowball
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: "", balance: "", rate: "", minPayment: "" });

    const addDebt = () => {
      if (!form.name || !form.balance) return;
      setDebts(prev => [...prev, { id: Date.now(), name: form.name, balance: parseFloat(form.balance), rate: parseFloat(form.rate)||0, minPayment: parseFloat(form.minPayment)||0 }]);
      setForm({ name: "", balance: "", rate: "", minPayment: "" }); setShowAdd(false);
    };

    const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
    const totalMin = debts.reduce((s, d) => s + d.minPayment, 0);
    const totalPayment = totalMin + extraPayment;

    // Sort debts by method
    const sorted = [...debts].sort((a, b) =>
      method === "avalanche" ? b.rate - a.rate : a.balance - b.balance
    );

    // Simple months-to-payoff estimate per debt
    const monthsToPayoff = (balance, rate, payment) => {
      if (payment <= 0 || balance <= 0) return null;
      const r = rate / 100 / 12;
      if (r === 0) return Math.ceil(balance / payment);
      if (payment <= balance * r) return null; // will never pay off
      return Math.ceil(-Math.log(1 - (balance * r) / payment) / Math.log(1 + r));
    };

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const startEdit = (debt) => { setEditingId(debt.id); setEditForm({ name: debt.name, balance: debt.balance, rate: debt.rate, minPayment: debt.minPayment }); };
    const saveEdit = () => {
      setDebts(prev => prev.map(d => d.id === editingId ? { ...d, name: editForm.name, balance: parseFloat(editForm.balance)||0, rate: parseFloat(editForm.rate)||0, minPayment: parseFloat(editForm.minPayment)||0 } : d));
      setEditingId(null);
    };

    const totalMonthly = debts.length > 0 ? debts.reduce((s, d) => s + d.minPayment, 0) : 0;

    return (
      <div>
        {/* Summary */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ ...card(isDark), flex: 1, minWidth: 150, padding: "12px 16px", borderTop: "3px solid #f43f5e" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Totale schuld</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#f43f5e", fontFamily: "'DM Mono', monospace" }}>{fmt(totalDebt)}</div>
          </div>
          <div style={{ ...card(isDark), flex: 1, minWidth: 150, padding: "12px 16px", borderTop: "3px solid #4f8ef7" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Totaal per maand</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#4f8ef7", fontFamily: "'DM Mono', monospace" }}>{fmt(totalMonthly)}</div>
          </div>
        </div>

        {/* Method toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>Methode:</div>
          {[["avalanche","🏔 Avalanche (hoogste rente eerst)"],["snowball","⛄ Snowball (laagste schuld eerst)"]].map(([m,l]) => (
            <button key={m} onClick={() => setMethod(m)}
              style={{ padding: "7px 14px", borderRadius: 20, border: method===m ? "1px solid rgba(79,142,247,0.5)" : `1px solid ${C.border}`, background: method===m ? "rgba(79,142,247,0.12)" : "transparent", color: method===m ? "#4f8ef7" : C.muted, fontSize: 12, fontWeight: method===m ? 700 : 500, cursor: "pointer" }}>
              {l}
            </button>
          ))}
          <button onClick={() => setShowAdd(p=>!p)} style={{ ...pillBtn(), fontSize: 12, padding: "8px 14px", marginLeft: "auto" }}><Plus size={13}/> Schuld toevoegen</button>
        </div>

        {showAdd && (
          <div style={{ ...card(isDark), marginBottom: 14, border: "1px solid rgba(244,63,94,0.3)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Nieuwe schuld</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div><label style={labelStyle}>Naam</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="bijv. Hypotheek" style={iStyle}/></div>
              <div><label style={labelStyle}>Openstaand (€)</label><input type="number" value={form.balance} onChange={e=>setForm(p=>({...p,balance:e.target.value}))} placeholder="10000" style={iStyle}/></div>
              <div><label style={labelStyle}>Rente (%)</label><input type="number" value={form.rate} onChange={e=>setForm(p=>({...p,rate:e.target.value}))} placeholder="5" style={iStyle}/></div>
              <div><label style={labelStyle}>Min. betaling (€/mnd)</label><input type="number" value={form.minPayment} onChange={e=>setForm(p=>({...p,minPayment:e.target.value}))} placeholder="100" style={iStyle}/></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{ ...pillBtnGhost(isDark), flex: 1, padding: "9px 0", fontSize: 12 }}>{lang === "nl" ? "Annuleren" : "Cancel"}</button>
              <button onClick={addDebt} style={{ ...pillBtn(), flex: 2, padding: "9px 0", fontSize: 12, opacity: form.name&&form.balance?1:0.45 }}><Plus size={13}/> Toevoegen</button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((debt, idx) => {
            const isTarget = idx === 0;
            const payment = isTarget ? debt.minPayment + extraPayment : debt.minPayment;
            const months = monthsToPayoff(debt.balance, debt.rate, payment);
            const yearFree = months ? new Date().getFullYear() + Math.floor(months/12) : null;
            const interest = debt.balance * (debt.rate/100/12);
            const isEditing = editingId === debt.id;

            return (
              <div key={debt.id} style={{ ...card(isDark), border: isTarget ? "1px solid rgba(79,142,247,0.35)" : `1px solid ${C.border}`, position: "relative" }}>

                {isEditing ? (
                  /* ── Edit mode ── */
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#4f8ef7", marginBottom: 12 }}>Schuld aanpassen</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      <div><label style={labelStyle}>Naam</label><input value={editForm.name} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} style={iStyle}/></div>
                      <div><label style={labelStyle}>Openstaand (€)</label><input type="number" value={editForm.balance} onChange={e=>setEditForm(p=>({...p,balance:e.target.value}))} style={iStyle}/></div>
                      <div><label style={labelStyle}>Rente (%)</label><input type="number" value={editForm.rate} onChange={e=>setEditForm(p=>({...p,rate:e.target.value}))} style={iStyle}/></div>
                      <div><label style={labelStyle}>Min. betaling (€/mnd)</label><input type="number" value={editForm.minPayment} onChange={e=>setEditForm(p=>({...p,minPayment:e.target.value}))} style={iStyle}/></div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditingId(null)} style={{ ...pillBtnGhost(isDark), flex: 1, padding: "8px 0", fontSize: 12 }}>{lang === "nl" ? "Annuleren" : "Cancel"}</button>
                      <button onClick={saveEdit} style={{ ...pillBtn(), flex: 2, padding: "8px 0", fontSize: 12 }}><Check size={13}/> Opslaan</button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: isTarget ? "rgba(79,142,247,0.15)" : C.rowBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: isTarget ? "#4f8ef7" : C.muted }}>#{idx+1}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{debt.name}</span>
                          {isTarget && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(79,142,247,0.15)", color: "#4f8ef7", fontWeight: 700 }}>FOCUS</span>}
                        </div>
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: C.muted }}>Schuld: <b style={{ color: "#f43f5e", fontFamily: "monospace" }}>{fmt(debt.balance)}</b></span>
                          <span style={{ fontSize: 12, color: C.muted }}>Rente: <b style={{ color: C.text }}>{debt.rate}%</b></span>
                          <span style={{ fontSize: 12, color: C.muted }}>Rente/mnd: <b style={{ color: "#f59e0b", fontFamily: "monospace" }}>{fmt(interest)}</b></span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isTarget ? "#4f8ef7" : C.text, fontFamily: "'DM Mono', monospace" }}>{fmt(payment)}/mnd</div>
                        {months && <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 600, marginTop: 2 }}>Vrij in {months} mnd {yearFree ? `(${yearFree})` : ""}</div>}
                        {!months && <div style={{ fontSize: 11, color: "#f43f5e" }}>Verhoog betaling</div>}
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 10 }}>
                      <button onClick={() => startEdit(debt)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, background: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                        <Edit2 size={11}/> Aanpassen
                      </button>
                      <button onClick={() => setDebts(prev => prev.filter(d => d.id !== debt.id))} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#f43f5e", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                        <Trash2 size={11}/> Verwijderen
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>Goals</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Financiële doelen, budgetten en schuldenafbouw</div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "9px 16px", borderRadius: 50, border: tab === t.id ? "1px solid rgba(79,142,247,0.5)" : `1px solid ${C.border}`, background: tab === t.id ? "rgba(79,142,247,0.12)" : "transparent", color: tab === t.id ? "#4f8ef7" : C.muted, fontSize: 13, fontWeight: tab === t.id ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "savings" && <SavingsTab />}
      {tab === "fire"    && <FireTab />}
      {tab === "budget"  && <BudgetTab />}
      {tab === "debt"    && <DebtTab />}
    </div>
  );
}

// ─── ONBOARDING ────────────────────────────────────────────────
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState("nl");
  const [name, setName] = useState("");
  const [situation, setSituation] = useState(null);
  const [goals, setGoals] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [bank, setBank] = useState(null);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef();

  const T_OB = {
    nl: {
      next: "Volgende →", skip: "Sla over", back: "← Terug",
      steps: ["Taal", "Naam", "Situatie", "Doelen", "Thema", "Upload"],
    },
    en: {
      next: "Next →", skip: "Skip", back: "← Back",
      steps: ["Language", "Name", "Situation", "Goals", "Theme", "Upload"],
    },
  };
  const t = T_OB[lang];

  const THEMES = [
    { id: "dark",  label: "Donker",  icon: "🌙", bg: "#080d18", sidebar: "#0d1424", accent: "#4f8ef7", desc: "Nachtmodus" },
    { id: "light", label: "Pearl",   icon: "🪨", bg: "#f5f4f0", sidebar: "#1c1917", accent: "#d97706", desc: "Warm amber" },
    { id: "cloud", label: "Cloud",   icon: "☁️", bg: "#f0f4ff", sidebar: "#ffffff",  accent: "#4361ee", desc: "Indigo" },
  ];

  const SITUATIONS = [
    { id: "zzp",      label: lang === "nl" ? "ZZP'er / Freelancer" : "Freelancer",     icon: "💼" },
    { id: "employee", label: lang === "nl" ? "In loondienst"        : "Employed",       icon: "🏢" },
    { id: "student",  label: lang === "nl" ? "Student"              : "Student",        icon: "🎓" },
    { id: "other",    label: lang === "nl" ? "Anders"               : "Other",          icon: "✨" },
  ];

  const GOALS_LIST = [
    { id: "expenses",    label: lang === "nl" ? "Uitgaven bijhouden" : "Track expenses",     icon: "📊" },
    { id: "invest",      label: lang === "nl" ? "Investeren"          : "Investing",          icon: "📈" },
    { id: "fire",        label: "FIRE",                                                        icon: "🔥" },
    { id: "debt",        label: lang === "nl" ? "Schulden afbouwen"   : "Pay off debt",       icon: "📉" },
    { id: "save",        label: lang === "nl" ? "Sparen"              : "Save money",         icon: "🎯" },
    { id: "budget",      label: lang === "nl" ? "Budgetteren"         : "Budget",             icon: "💰" },
  ];

  const BANKS = [
    { id: "ing",     label: "ING",       logo: "🧡" },
    { id: "abn",     label: "ABN AMRO",  logo: "💚" },
    { id: "rabo",    label: "Rabobank",  logo: "🔴" },
    { id: "bunq",    label: "Bunq",      logo: "🟢" },
    { id: "n26",     label: "N26",       logo: "⚫" },
    { id: "other",   label: lang === "nl" ? "Anders" : "Other", logo: "🏦" },
  ];

  const BANK_INSTRUCTIONS = {
    ing:   lang === "nl" ? "Mijn ING → Budgetcoach → Exporteer → CSV" : "My ING → Budget coach → Export → CSV",
    abn:   lang === "nl" ? "Internetbankieren → Transactieoverzicht → Exporteer als CSV" : "Online banking → Transactions → Export as CSV",
    rabo:  lang === "nl" ? "Rabo App → Mijn overzichten → Download CSV" : "Rabo App → My overviews → Download CSV",
    bunq:  lang === "nl" ? "Bunq app → Rekening → Exporteer" : "Bunq app → Account → Export",
    n26:   lang === "nl" ? "N26 app → Statistieken → Exporteer CSV" : "N26 app → Statistics → Export CSV",
    other: lang === "nl" ? "Exporteer transacties als CSV uit je bank-app" : "Export transactions as CSV from your bank app",
  };

  const isDarkTheme = theme === "dark";
  const bg = isDarkTheme ? "#080d18" : theme === "cloud" ? "#f0f4ff" : "#f5f4f0";
  const cardBg = isDarkTheme ? "#111827" : "#ffffff";
  const textColor = isDarkTheme ? "#f1f5f9" : "#0f172a";
  const mutedColor = isDarkTheme ? "#64748b" : "#64748b";
  const borderColor = isDarkTheme ? "rgba(255,255,255,0.1)" : "#e2e6ed";
  const accentColor = THEMES.find(t => t.id === theme)?.accent || "#4f8ef7";

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const txs = parseCSVTransactions(e.target.result, bank ? BANKS.find(b => b.id === bank)?.label || "Import" : "Import");
      setParsed(txs);
    };
    reader.readAsText(file, "utf-8");
  };

  const completeOnboarding = (withUpload) => {
    if (withUpload && parsed?.length > 0) {
      const accName = bank ? BANKS.find(b => b.id === bank)?.label || "Geïmporteerd" : "Geïmporteerd";
      const acc = { id: Date.now(), name: accName, iban: "—" };
      const txs = parsed.map(tx => ({ ...tx, account: accName }));
      onComplete({ lang, theme, name, transactions: txs, accounts: [acc] });
    } else {
      onComplete({ lang, theme, name });
    }
  };

  const TOTAL_STEPS = 6;
  const progress = ((step) / (TOTAL_STEPS - 1)) * 100;

  const stepContainerStyle = {
    width: "100%", maxWidth: 560,
    background: cardBg,
    border: `1px solid ${borderColor}`,
    borderRadius: 24, padding: "40px 44px",
    fontFamily: "'Outfit', system-ui, sans-serif",
  };

  const renderStep = () => {
    switch (step) {
      // ── Step 0: Language ─────────────────────────────────────
      case 0: return (
        <div>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: textColor, marginBottom: 8 }}>
            {lang === "nl" ? "Welkom bij Dynafy" : "Welcome to Dynafy"}
          </div>
          <div style={{ fontSize: 14, color: mutedColor, marginBottom: 32, lineHeight: 1.6 }}>
            {lang === "nl" ? "Jouw persoonlijke financiële app. Kies eerst je taal." : "Your personal finance app. Choose your language first."}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[["nl", "🇳🇱", "Nederlands"], ["en", "🇬🇧", "English"]].map(([l, flag, label]) => (
              <button key={l} onClick={() => setLang(l)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderRadius: 14, border: lang === l ? `2px solid ${accentColor}` : `1px solid ${borderColor}`, background: lang === l ? `${accentColor}12` : "transparent", cursor: "pointer", transition: "all 0.15s" }}>
                <span style={{ fontSize: 24 }}>{flag}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: lang === l ? accentColor : textColor }}>{label}</span>
                {lang === l && <Check size={16} color={accentColor} style={{ marginLeft: "auto" }} />}
              </button>
            ))}
          </div>
        </div>
      );

      // ── Step 1: Name + ToS ──────────────────────────────────
      case 1: return (
        <div>
          <div style={{ fontSize: 32, marginBottom: 8 }}>😊</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: textColor, marginBottom: 8 }}>
            {lang === "nl" ? "Hoe heet je?" : "What's your name?"}
          </div>
          <div style={{ fontSize: 14, color: mutedColor, marginBottom: 20 }}>
            {lang === "nl" ? "We gebruiken dit om de app te personaliseren." : "We use this to personalize the app."}
          </div>
          <input
            autoFocus value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && name.trim() && tosAccepted && setStep(2)}
            placeholder={lang === "nl" ? "Jouw naam..." : "Your name..."}
            style={{ width: "100%", padding: "16px 20px", fontSize: 18, fontWeight: 600, background: isDarkTheme ? "rgba(255,255,255,0.05)" : "#f8fafc", border: `1.5px solid ${name ? accentColor : borderColor}`, borderRadius: 14, color: textColor, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s", marginBottom: 16 }}
          />
          {name && <div style={{ fontSize: 13, color: accentColor, marginBottom: 16, fontWeight: 600 }}>
            {lang === "nl" ? `Hoi ${name}! 👋` : `Hi ${name}! 👋`}
          </div>}
          <div style={{ padding: "14px 16px", borderRadius: 12, background: isDarkTheme ? "rgba(255,255,255,0.03)" : "#f8fafc", border: `1px solid ${tosAccepted ? accentColor + "50" : borderColor}`, transition: "border-color 0.2s" }}>
            <div style={{ fontSize: 12, color: mutedColor, lineHeight: 1.6, marginBottom: 12 }}>
              🔒 {lang === "nl"
                ? "Dynafy slaat al jouw financiële gegevens lokaal op in jouw browser. Er worden geen gegevens naar externe servers verzonden. Jouw data blijft altijd van jou."
                : "Dynafy stores all your financial data locally in your browser. No data is sent to external servers. Your data always stays yours."}
            </div>
            <div onClick={() => setTosAccepted(p => !p)} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${tosAccepted ? accentColor : borderColor}`, background: tosAccepted ? accentColor : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.15s" }}>
                {tosAccepted && <Check size={12} color="#fff" />}
              </div>
              <span style={{ fontSize: 13, color: textColor, lineHeight: 1.5 }}>
                {lang === "nl"
                  ? "Ik ga akkoord met de gebruiksvoorwaarden en het privacybeleid van Dynafy"
                  : "I agree to the Dynafy terms of service and privacy policy"}
              </span>
            </div>
          </div>
        </div>
      );

      // ── Step 2: Situation ────────────────────────────────────
      case 2: return (
        <div>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏷️</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: textColor, marginBottom: 8 }}>
            {lang === "nl" ? "Wat is jouw situatie?" : "What's your situation?"}
          </div>
          <div style={{ fontSize: 14, color: mutedColor, marginBottom: 28 }}>
            {lang === "nl" ? "Dit helpt ons de app beter op jou af te stemmen." : "This helps us tailor the app to you."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {SITUATIONS.map(s => (
              <button key={s.id} onClick={() => setSituation(s.id)}
                style={{ padding: "20px 16px", borderRadius: 14, border: situation === s.id ? `2px solid ${accentColor}` : `1px solid ${borderColor}`, background: situation === s.id ? `${accentColor}12` : "transparent", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: situation === s.id ? accentColor : textColor }}>{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      );

      // ── Step 3: Goals ────────────────────────────────────────
      case 3: return (
        <div>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: textColor, marginBottom: 8 }}>
            {lang === "nl" ? "Wat wil je bijhouden?" : "What do you want to track?"}
          </div>
          <div style={{ fontSize: 14, color: mutedColor, marginBottom: 28 }}>
            {lang === "nl" ? "Kies alles wat van toepassing is. Je kunt dit later aanpassen." : "Choose all that apply. You can change this later."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {GOALS_LIST.map(g => {
              const selected = goals.includes(g.id);
              return (
                <button key={g.id} onClick={() => setGoals(prev => selected ? prev.filter(x => x !== g.id) : [...prev, g.id])}
                  style={{ padding: "16px 14px", borderRadius: 12, border: selected ? `2px solid ${accentColor}` : `1px solid ${borderColor}`, background: selected ? `${accentColor}12` : "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}>
                  <span style={{ fontSize: 20 }}>{g.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: selected ? 700 : 500, color: selected ? accentColor : textColor, textAlign: "left" }}>{g.label}</span>
                  {selected && <Check size={14} color={accentColor} style={{ marginLeft: "auto", flexShrink: 0 }}/>}
                </button>
              );
            })}
          </div>
        </div>
      );

      // ── Step 4: Theme ────────────────────────────────────────
      case 4: return (
        <div>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎨</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: textColor, marginBottom: 8 }}>
            {lang === "nl" ? "Kies jouw thema" : "Choose your theme"}
          </div>
          <div style={{ fontSize: 14, color: mutedColor, marginBottom: 28 }}>
            {lang === "nl" ? "Je kunt dit altijd aanpassen in instellingen." : "You can always change this in settings."}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {THEMES.map(opt => {
              const active = theme === opt.id;
              return (
                <button key={opt.id} onClick={() => setTheme(opt.id)}
                  style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderRadius: 14, border: active ? `2px solid ${opt.accent}` : `1px solid ${borderColor}`, background: active ? `${opt.accent}12` : "transparent", cursor: "pointer", transition: "all 0.15s" }}>
                  {/* Mini preview */}
                  <div style={{ width: 72, height: 44, borderRadius: 10, background: opt.bg, overflow: "hidden", display: "flex", flexShrink: 0, border: "1px solid rgba(0,0,0,0.1)" }}>
                    <div style={{ width: "35%", background: opt.sidebar, display: "flex", flexDirection: "column", gap: 3, padding: "6px 5px" }}>
                      {[opt.accent + "33", opt.accent + "55", "rgba(255,255,255,0.08)"].map((bg2, i) => (
                        <div key={i} style={{ height: 6, borderRadius: 3, background: bg2, width: i === 0 ? "100%" : "75%" }}/>
                      ))}
                    </div>
                    <div style={{ flex: 1, padding: "6px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ height: 8, borderRadius: 3, background: opt.accent + "40", width: "70%" }}/>
                      <div style={{ height: 5, borderRadius: 2, background: "rgba(128,128,128,0.2)", width: "90%" }}/>
                      <div style={{ height: 5, borderRadius: 2, background: "rgba(128,128,128,0.15)", width: "55%" }}/>
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: active ? opt.accent : textColor }}>{opt.icon} {opt.label}</div>
                    <div style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  {active && <div style={{ width: 22, height: 22, borderRadius: "50%", background: opt.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={12} color="#fff"/></div>}
                </button>
              );
            })}
          </div>
        </div>
      );

      // ── Step 5: Upload ───────────────────────────────────────
      case 5: return (
        <div>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏦</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: textColor, marginBottom: 8 }}>
            {lang === "nl" ? "Upload je transacties" : "Upload your transactions"}
          </div>
          <div style={{ fontSize: 14, color: mutedColor, marginBottom: 24, lineHeight: 1.6 }}>
            {lang === "nl" ? "Kies je bank en upload een CSV-export. Alle data blijft lokaal in je browser — er wordt niets opgeslagen op een server. 🔒" : "Choose your bank and upload a CSV export. All data stays local in your browser — nothing is stored on a server. 🔒"}
          </div>

          {/* Bank picker */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              {lang === "nl" ? "Jouw bank" : "Your bank"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {BANKS.map(b => (
                <button key={b.id} onClick={() => setBank(b.id)}
                  style={{ padding: "8px 14px", borderRadius: 20, border: bank === b.id ? `1.5px solid ${accentColor}` : `1px solid ${borderColor}`, background: bank === b.id ? `${accentColor}12` : "transparent", cursor: "pointer", fontSize: 13, fontWeight: bank === b.id ? 700 : 500, color: bank === b.id ? accentColor : textColor, display: "flex", alignItems: "center", gap: 6 }}>
                  {b.logo} {b.label}
                </button>
              ))}
            </div>
            {bank && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: isDarkTheme ? "rgba(79,142,247,0.08)" : "#eff6ff", border: `1px solid ${accentColor}30`, fontSize: 12, color: mutedColor }}>
              📋 {BANK_INSTRUCTIONS[bank]}
            </div>}
          </div>

          {/* Upload area */}
          {!parsed ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? accentColor : borderColor}`, borderRadius: 16, padding: "32px 24px", textAlign: "center", cursor: "pointer", background: dragging ? `${accentColor}08` : "transparent", transition: "all 0.2s" }}>
              <input ref={inputRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])}/>
              <Upload size={28} color={dragging ? accentColor : mutedColor} style={{ marginBottom: 10 }}/>
              <div style={{ fontSize: 14, fontWeight: 600, color: textColor, marginBottom: 4 }}>
                {lang === "nl" ? "Drop CSV hier of klik om te bladeren" : "Drop CSV here or click to browse"}
              </div>
              <div style={{ fontSize: 12, color: mutedColor }}>
                {lang === "nl" ? "ING, ABN AMRO, Rabobank, Bunq, N26 · Automatisch herkend" : "ING, ABN AMRO, Rabobank, Bunq, N26 · Auto-detected"}
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px", borderRadius: 14, background: isDarkTheme ? "rgba(34,197,94,0.08)" : "#f0fdf4", border: "1px solid rgba(34,197,94,0.3)", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Check size={16} color="#22c55e"/>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>{fileName} — {parsed.length} {lang === "nl" ? t.overzicht.transactions : "transactions"}</span>
                <button onClick={() => { setParsed(null); setFileName(""); }} style={{ marginLeft: "auto", background: "none", border: "none", color: mutedColor, cursor: "pointer", fontSize: 12 }}>✕ {lang === "nl" ? "Verwijder" : "Remove"}</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 120, overflowY: "auto" }}>
                {parsed.slice(0, 4).map((tx, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: mutedColor, padding: "4px 0", borderBottom: `1px solid ${borderColor}` }}>
                    <span>{(tx.counterparty || tx.description)?.slice(0, 30)}</span>
                    <span style={{ color: tx.amount < 0 ? "#f43f5e" : "#22c55e", fontFamily: "monospace" }}>{fmt(tx.amount)}</span>
                  </div>
                ))}
                {parsed.length > 4 && <div style={{ fontSize: 11, color: mutedColor, textAlign: "center", paddingTop: 4 }}>+{parsed.length - 4} {lang === "nl" ? "meer" : "more"}</div>}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            {parsed?.length > 0 && (
              <button onClick={() => completeOnboarding(true)}
                style={{ width: "100%", padding: "15px", borderRadius: 50, background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, border: "none", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                🚀 {lang === "nl" ? `Start met ${parsed.length} transacties` : `Start with ${parsed.length} transactions`}
              </button>
            )}
            <button onClick={() => completeOnboarding(false)}
              style={{ width: "100%", padding: "13px", borderRadius: 50, background: "transparent", border: `1px solid ${borderColor}`, color: mutedColor, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {lang === "nl" ? "Sla over — gebruik voorbeelddata" : "Skip — use sample data"}
            </button>
          </div>
        </div>
      );

      default: return null;
    }
  };

  const canAdvance = [
    true,                    // lang: always ok
    name.trim().length > 0 && tosAccepted,  // name + ToS required
    situation !== null,      // situation: required
    true,                    // goals: optional
    true,                    // theme: always ok
    false,                   // upload: uses own buttons
  ][step];

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
        <DynafyLogo size={36} />
        <span style={{ fontSize: 20, fontWeight: 800, color: textColor, letterSpacing: "-0.3px" }}>Dynafy</span>
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 560, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: mutedColor, fontWeight: 600 }}>{t.steps[step]}</span>
          <span style={{ fontSize: 12, color: mutedColor }}>{step + 1} / {TOTAL_STEPS}</span>
        </div>
        <div style={{ height: 4, background: isDarkTheme ? "rgba(255,255,255,0.08)" : "#e2e6ed", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((step + 1) / TOTAL_STEPS) * 100}%`, background: accentColor, borderRadius: 2, transition: "width 0.35s ease" }}/>
        </div>
      </div>

      {/* Step card */}
      <div style={stepContainerStyle}>
        {renderStep()}

        {/* Nav buttons (not shown on upload step) */}
        {step < 5 && (
          <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ flex: 1, padding: "12px", borderRadius: 50, border: `1px solid ${borderColor}`, background: "transparent", color: mutedColor, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {t.back}
              </button>
            )}
            <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance}
              style={{ flex: 3, padding: "13px", borderRadius: 50, background: canAdvance ? accentColor : (isDarkTheme ? "rgba(255,255,255,0.06)" : "#e2e6ed"), border: "none", color: canAdvance ? "#fff" : mutedColor, fontSize: 15, fontWeight: 800, cursor: canAdvance ? "pointer" : "default", transition: "all 0.15s" }}>
              {t.next}
            </button>
          </div>
        )}
        {step === 5 && step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            style={{ width: "100%", padding: "10px", marginTop: 10, borderRadius: 50, border: `1px solid ${borderColor}`, background: "transparent", color: mutedColor, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {t.back}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [onboarded, setOnboarded] = useState(true); // TEMP: skip onboarding during testing
  const [userName, setUserName] = useState("");
  const [uncatAlert, setUncatAlert] = useState(null);
  const [showGlobalUpload, setShowGlobalUpload] = useState(false);

  const runAiCategorization = (txs) => {
    const uncatCount = txs.filter(tx => !tx.category || tx.category === "other").length;
    if (uncatCount > 0) setUncatAlert(uncatCount);
  };
  const [view, setView] = useState("dashboard");
  const [lang, setLang] = useState("en");
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [useMockData, setUseMockData] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accounts, setAccounts] = useState([
    { id: 1, name: "ING Betaalrekening", iban: "NL91 ABNA 0417 1643 00" },
    { id: 2, name: "ABN AMRO", iban: "NL91 ABNA 0417 1643 00" },
  ]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [recurringItems, setRecurringItems] = useState([]);
  const [appInvestments, setAppInvestments] = useState(MOCK_INVESTMENTS);
  const [appGoals, setAppGoals] = useState([
    { id: 1, name: "Noodfonds", target: 10000, current: 3500, deadline: "2026-12-31", color: "#22c55e" },
    { id: 2, name: "Vakantie",  target: 3000,  current: 1200, deadline: "2026-07-01", color: "#4f8ef7" },
  ]);
  const [resetKey, setResetKey] = useState(0);
  const isDark = theme === "dark";
  const isCloud = theme === "cloud";
  // Per-theme accent + surface colors threaded to key components
  const accent     = isDark ? "#4f8ef7" : isCloud ? "#4361ee" : "#d97706";
  const accentBg   = isDark ? "rgba(79,142,247,0.12)" : isCloud ? "#eef1ff" : "#fef3c7";
  const accentBorder = isDark ? "rgba(79,142,247,0.5)" : isCloud ? "rgba(67,97,238,0.5)" : "rgba(217,119,6,0.5)";
  const pageBg     = isDark ? "linear-gradient(145deg,#070c17 0%,#080d18 55%,#09101f 100%)" : isCloud ? "linear-gradient(145deg,#eef2ff 0%,#f0f4ff 60%,#e8eeff 100%)" : "linear-gradient(145deg,#f7f5f2 0%,#f5f4f0 60%,#f2f0ec 100%)";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : isCloud ? "#dde3f5" : theme === "light" ? "#e8e4de" : "#e2e6ed";
  const t = T[lang];

  const handleDeleteAccount = (id) => {
    const acc = accounts.find(a => a.id === id);
    if (acc) setTransactions(prev => prev.filter(tx => tx.account !== acc.name));
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (selectedAccount === id) setSelectedAccount(null);
  };

  // ── Hierarchical nav structure ──────────────────────────────
  const navStructure = [
    {
      id: "dashboard", icon: Home, label: t.nav.dashboard, type: "item"
    },
    {
      id: "rekeningen-group", icon: CreditCard, label: lang === "nl" ? "Rekeningen" : "Bank Accounts", type: "group",
      children: [
        { id: "overzicht",    icon: BarChart2,   label: lang === "nl" ? "Overzicht" : "Overview" },
        { id: "rekeningen",   icon: CreditCard,  label: lang === "nl" ? "Rekeningen" : "Bank Accounts" },
        { id: "transactions", icon: List,        label: t.nav.transactions },
        { id: "recurring",    icon: Repeat,      label: lang === "nl" ? t.recurring.title : "Monthly Liabilities" },
        { id: "calibrate",    icon: Sliders,     label: lang === "nl" ? "Categoriseren" : "Categorize" },
      ]
    },
    {
      id: "investments", icon: TrendingUp, label: t.nav.investments, type: "item"
    },
    {
      id: "goals", icon: Target, label: "Goals", type: "item"
    },
    {
      id: "insights", icon: Lightbulb, label: t.nav.insights, type: "item"
    },
    {
      id: "export", icon: Download, label: lang === "nl" ? "Exporteren" : "Export", type: "item"
    },
    {
      id: "settings", icon: Settings, label: t.nav.settings, type: "item"
    },
  ];

  // All view ids for topbar label lookup
  const allNavItems = navStructure.flatMap(n => n.type === "group" ? n.children : [n]);

  // Groups auto-expand when a child is active
  const activeGroupIds = navStructure
    .filter(n => n.type === "group" && n.children.some(c => c.id === view))
    .map(n => n.id);
  const [expandedGroups, setExpandedGroups] = useState(() => new Set(activeGroupIds));

  const toggleGroup = (id) => setExpandedGroups(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Show onboarding on first load
  if (!onboarded) {
    return (
      <Onboarding
        onComplete={(opts) => {
          setLang(opts.lang);
          setTheme(opts.theme);
          setUserName(opts.name);
          if (opts.transactions) {
            setTransactions(opts.transactions);
            setUseMockData(false);
            if (opts.accounts) setAccounts(opts.accounts);
            setAppInvestments([]);
            setAppGoals([]);
            runAiCategorization(opts.transactions);
          }
          setOnboarded(true);
        }}
      />
    );
  }

  return (
    <div data-theme={theme} style={{ display: "flex", minHeight: "100vh", background: pageBg, fontFamily: "'Outfit', 'Segoe UI', sans-serif", color: isDark ? "#f1f5f9" : "#0f172a", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
        [data-theme="dark"] ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        [data-theme="light"] ::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.15); border-radius: 3px; }
        [data-theme="light"] select option { background: #fff; color: #0f172a; }
        [data-theme="dark"] select option { background: #1a2235; color: #f1f5f9; }
        [data-theme="light"] input::placeholder { color: #94a3b8; }
        [data-theme="dark"] input::placeholder { color: #334155; }
        button[style*="border-radius: 50px"]:hover, button[style*="border-radius: 50"]:not([disabled]):hover { filter: brightness(1.12) saturate(1.1); transform: translateY(-1px); }
        button[style*="border-radius: 50px"]:active, button[style*="border-radius: 50"]:active { transform: translateY(0); filter: brightness(0.96); }

        @keyframes statReveal {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .premium-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease !important;
        }
        .premium-card:hover {
          transform: translateY(-4px) scale(1.008) !important;
        }
        [data-theme="dark"] .premium-card:hover {
          box-shadow: 0 20px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(79,142,247,0.15) !important;
        }
        [data-theme="light"] .premium-card:hover, [data-theme="cloud"] .premium-card:hover {
          box-shadow: 0 16px 40px rgba(0,0,0,0.12) !important;
        }

        .glass-modal {
          backdrop-filter: blur(12px) saturate(1.4);
          -webkit-backdrop-filter: blur(12px) saturate(1.4);
        }
      `}</style>

      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: isDark ? "radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)" : "radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: isDark ? "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" : "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 60%)" }} />
      </div>

      {/* SIDEBAR */}
      <div style={{ width: sidebarOpen ? 220 : 64, background: isDark ? "rgba(255,255,255,0.02)" : (theme === "light" ? "#1c1917" : "#ffffff"), borderRight: isDark ? "1px solid rgba(255,255,255,0.06)" : (theme === "light" ? "1px solid rgba(255,255,255,0.06)" : isCloud ? "1px solid #dde3f5" : "1px solid #e2e6ed"), display: "flex", flexDirection: "column", position: "relative", zIndex: 10, transition: "width 0.25s ease", flexShrink: 0, overflow: sidebarOpen ? "hidden" : "visible" }}>

        {/* ── Sidebar header with logo + toggle ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "space-between" : "center", padding: "16px 12px", borderBottom: isDark || theme === "light" ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e6ed", flexShrink: 0, minHeight: 60 }}>
          {sidebarOpen ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", minWidth: 0 }}>
              <DynafyLogo size={32} bg={theme === "light" ? "#d97706" : isCloud ? "#4361ee" : undefined} />
              <div style={{ fontSize: 17, fontWeight: 800, color: (isDark || theme === "light") ? "#f1f5f9" : isCloud ? "#4361ee" : "#0f172a", whiteSpace: "nowrap", letterSpacing: "-0.3px" }}>
                {t.appName}
              </div>
            </div>
          ) : (
            <DynafyLogo size={32} bg={theme === "light" ? "#d97706" : isCloud ? "#4361ee" : undefined} />
          )}
          {/* Toggle button */}
          <button
            onClick={() => setSidebarOpen(p => !p)}
            title={sidebarOpen ? "Inklappen" : "Uitklappen"}
            style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: isDark ? "#64748b" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(79,142,247,0.12)"; e.currentTarget.style.color = "#4f8ef7"; e.currentTarget.style.borderColor = "rgba(79,142,247,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
            <ChevronRight size={15} style={{ transform: sidebarOpen ? "rotate(180deg)" : "none", transition: "transform 0.25s" }} />
          </button>
        </div>

        {/* ── Nav items ── */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "12px 8px", overflowY: sidebarOpen ? "auto" : "visible", overflowX: sidebarOpen ? "hidden" : "visible" }}>
          <style>{`
            .nav-item { position: relative; }
            .nav-tooltip {
              visibility: hidden;
              opacity: 0;
              position: absolute;
              left: 58px;
              top: 50%;
              transform: translateY(-50%) translateX(-4px);
              background: ${isDark ? "#1a2235" : "#1e293b"};
              border: 1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"};
              border-radius: 9px;
              padding: 6px 12px;
              font-size: 12px;
              font-weight: 600;
              color: #f1f5f9;
              white-space: nowrap;
              pointer-events: none;
              z-index: 9999;
              box-shadow: 0 8px 24px rgba(0,0,0,0.35);
              transition: opacity 0.18s ease, visibility 0.18s ease, transform 0.18s ease;
            }
            .nav-tooltip::before {
              content: '';
              position: absolute;
              left: -5px;
              top: 50%;
              transform: translateY(-50%);
              width: 0; height: 0;
              border-top: 5px solid transparent;
              border-bottom: 5px solid transparent;
              border-right: 5px solid ${isDark ? "#1a2235" : "#1e293b"};
            }
            .nav-item:hover .nav-tooltip {
              visibility: visible;
              opacity: 1;
              transform: translateY(-50%) translateX(0);
            }

            .nav-btn { position: relative; overflow: hidden; }
            .nav-btn::after {
              content: '';
              position: absolute;
              inset: 0;
              border-radius: 12px;
              background: linear-gradient(105deg, rgba(79,142,247,0.10) 0%, rgba(99,102,241,0.06) 100%);
              opacity: 0;
              transform: translateX(-6px);
              transition: opacity 0.22s ease, transform 0.22s ease;
              pointer-events: none;
            }
            .nav-btn:not(.nav-btn-active):hover::after { opacity: 1; transform: translateX(0); }
            .nav-btn:not(.nav-btn-active):hover {
              color: ${isDark ? "#e2e8f0" : "#1e293b"} !important;
              transform: translateX(2px);
              box-shadow: inset 2px 0 0 rgba(79,142,247,0.5);
            }
            .nav-btn:not(.nav-btn-active):hover svg {
              filter: drop-shadow(0 0 5px rgba(79,142,247,0.55));
              transform: scale(1.12);
              transition: filter 0.2s, transform 0.2s;
            }
            .nav-btn svg { transition: filter 0.2s, transform 0.2s; }

            .submenu-btn { position: relative; overflow: hidden; }
            .submenu-btn::after {
              content: '';
              position: absolute;
              inset: 0;
              border-radius: 9px;
              background: linear-gradient(105deg, rgba(79,142,247,0.08), rgba(99,102,241,0.04));
              opacity: 0;
              transform: translateX(-4px);
              transition: opacity 0.18s ease, transform 0.18s ease;
              pointer-events: none;
            }
            .submenu-btn:not(.nav-btn-active):hover::after { opacity: 1; transform: translateX(0); }
            .submenu-btn:not(.nav-btn-active):hover {
              color: ${isDark ? "#cbd5e1" : "#1e293b"} !important;
              transform: translateX(2px);
            }
          `}</style>

          {navStructure.map(item => {
            if (item.type === "item") {
              const active = view === item.id;
              return (
                <div key={item.id} className="nav-item">
                  <button onClick={() => setView(item.id)} className={`nav-btn${active ? " nav-btn-active" : ""}`} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: sidebarOpen ? "10px 14px" : "10px",
                    justifyContent: sidebarOpen ? "flex-start" : "center",
                    width: "100%", borderRadius: 12, border: "none", cursor: "pointer", transition: "all 0.2s",
                    background: active ? (theme === "light" ? "rgba(217,119,6,0.15)" : accentBg) : "transparent",
                    color: active ? accent : (isDark || theme === "light") ? "#a8a29e" : "#64748b",
                    fontWeight: active ? 700 : 500, fontSize: 13,
                    boxShadow: active && sidebarOpen ? "inset 2px 0 0 #4f8ef7" : "none",
                    whiteSpace: "nowrap", overflow: "hidden",
                  }}>
                    <item.icon size={18} style={{ flexShrink: 0 }} />
                    {sidebarOpen && item.label}
                  </button>
                  {!sidebarOpen && <div className="nav-tooltip">{item.label}</div>}
                </div>
              );
            }

            // Group item
            const isGroupActive = item.children.some(c => c.id === view);
            const isExpanded = expandedGroups.has(item.id);

            return (
              <div key={item.id}>
                {/* Group header */}
                <div className="nav-item">
                  <button onClick={() => { if (sidebarOpen) { toggleGroup(item.id); setView("overzicht"); } else setView(item.children[0].id); }} className={`nav-btn${isGroupActive ? " nav-btn-active" : ""}`} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: sidebarOpen ? "10px 14px" : "10px",
                    justifyContent: sidebarOpen ? "flex-start" : "center",
                    width: "100%", borderRadius: 12, border: "none", cursor: "pointer", transition: "all 0.2s",
                    background: isGroupActive ? (theme === "light" ? "rgba(217,119,6,0.12)" : accentBg) : "transparent",
                    color: isGroupActive ? accent : (isDark || theme === "light") ? "#a8a29e" : "#64748b",
                    fontWeight: isGroupActive ? 700 : 500, fontSize: 13,
                    boxShadow: isGroupActive && sidebarOpen ? "inset 2px 0 0 #4f8ef7" : "none",
                    whiteSpace: "nowrap", overflow: "hidden",
                  }}>
                    <item.icon size={18} style={{ flexShrink: 0 }} />
                    {sidebarOpen && (
                      <>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        <ChevronRight size={14} style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s", opacity: 0.5 }} />
                      </>
                    )}
                  </button>
                  {!sidebarOpen && <div className="nav-tooltip">{item.label}</div>}
                </div>

                {/* Sub-items */}
                {sidebarOpen && isExpanded && (
                  <div style={{ marginLeft: 14, paddingLeft: 12, borderLeft: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #e2e6ed", marginBottom: 4, marginTop: 2 }}>
                    {item.children.map(child => {
                      const childActive = view === child.id;
                      return (
                        <div key={child.id} className="nav-item">
                          <button onClick={() => setView(child.id)} className={`submenu-btn${childActive ? " nav-btn-active" : ""}`} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "8px 12px", width: "100%", borderRadius: 9,
                            border: "none", cursor: "pointer", transition: "all 0.18s",
                            background: childActive ? (theme === "light" ? "rgba(217,119,6,0.15)" : accentBg) : "transparent",
                            color: childActive ? accent : (isDark || theme === "light") ? "#78716c" : "#64748b",
                            fontWeight: childActive ? 700 : 400, fontSize: 12,
                            whiteSpace: "nowrap", overflow: "hidden", textAlign: "left",
                          }}>
                            <child.icon size={14} style={{ flexShrink: 0 }} />
                            {child.label}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Upgrade badge ── */}
        {sidebarOpen ? (
          <div style={{ margin: "8px 12px 16px", padding: "14px", borderRadius: 14, background: (isDark || theme === "light") ? "rgba(217,119,6,0.12)" : "linear-gradient(135deg, rgba(67,97,238,0.08), rgba(99,102,241,0.08))", border: isDark ? "1px solid rgba(79,142,247,0.2)" : "1px solid rgba(79,142,247,0.15)", flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#4f8ef7", marginBottom: 4 }}>⚡ Upgrade to Pro</div>
            <div style={{ fontSize: 11, color: isDark ? "#64748b" : "#64748b", lineHeight: 1.5 }}>Unlimited accounts & AI insights</div>
            <div style={{ marginTop: 8, padding: "6px 12px", background: "linear-gradient(135deg, #4f8ef7, #6366f1)", borderRadius: 8, textAlign: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>€10 / month</div>
          </div>
        ) : (
          <div style={{ padding: "8px", flexShrink: 0 }}>
            <div title="Upgrade to Pro" style={{ width: "100%", padding: "10px 0", borderRadius: 12, background: "linear-gradient(135deg, rgba(79,142,247,0.2), rgba(99,102,241,0.2))", border: "1px solid rgba(79,142,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <span style={{ fontSize: 16 }}>⚡</span>
            </div>
          </div>
        )}

      </div>{/* end SIDEBAR */}

      {/* MAIN */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1 }}>
        {/* Top bar */}
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, borderBottom: isDark || theme === "light" ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e6ed", paddingBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a" }}>
              {allNavItems.find(n => n.id === view)?.label}
            </div>
            <div style={{ fontSize: 12, color: isDark ? "#334155" : "#94a3b8", marginTop: 2 }}>{t.tagline}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12, color: isDark ? "#334155" : "#94a3b8", fontFamily: "'DM Mono', monospace" }}>
              {(() => {
                const latest = transactions.reduce((best, tx) => tx.date > best ? tx.date : best, "");
                const locale = lang === "nl" ? "nl-NL" : "en-US";
                if (!latest) return new Date().toLocaleDateString(locale, { month: "long", year: "numeric" });
                const d = new Date(latest);
                return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
              })()}
            </div>

            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #4f8ef7, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>
              {userName ? userName[0].toUpperCase() : "F"}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "0 20px 32px", position: "relative" }}>
          {/* ── Global CSV Upload Modal ── */}
          {showGlobalUpload && <CSVModal onClose={() => setShowGlobalUpload(false)} onImport={(txs, importedAccounts) => {
            if (useMockData) {
              setTransactions(txs);
              setAccounts(importedAccounts || []);
              setUseMockData(false);
              setAppInvestments([]);
              setAppGoals([]);
              setRecurringItems([]);
            } else {
              setTransactions(prev => [...txs, ...prev]);
            }
            setShowGlobalUpload(false);
            const uncat = txs.filter(tx => !tx.category || tx.category === "other").length;
            if (uncat > 0) setUncatAlert(uncat);
          }} t={t} accounts={accounts} setAccounts={setAccounts} isDark={isDark} />}

          {/* ── Uncategorized alert ── */}
          {uncatAlert && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
              <div style={{ background: isDark ? "#111827" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e6ed", borderRadius: 24, padding: "36px 40px", maxWidth: 420, width: "100%", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: isDark ? "#f1f5f9" : "#0f172a", marginBottom: 10 }}>
                  {uncatAlert} ongecategoriseerde transacties
                </div>
                <div style={{ fontSize: 14, color: isDark ? "#94a3b8" : "#475569", lineHeight: 1.6, marginBottom: 28 }}>
                  We hebben <b style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>{uncatAlert} transacties</b> gevonden zonder categorie. Wil je ze nu handmatig categoriseren?
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={() => { setView("calibrate"); setUncatAlert(null); }}
                    style={{ ...pillBtn(), width: "100%", padding: "14px 0", fontSize: 14 }}>
                    {lang === "nl" ? "🏷️ Nu categoriseren" : "🏷️ Categorize now"}
                  </button>
                  <button onClick={() => setUncatAlert(null)}
                    style={{ ...pillBtnGhost(isDark), width: "100%", padding: "12px 0", fontSize: 13 }}>
                    Later doen
                  </button>
                </div>
              </div>
            </div>
          )}
          {view === "dashboard" && <WidgetDashboard transactions={transactions} t={t} isDark={isDark} accent={accent} accounts={accounts} investments={appInvestments} goals={appGoals} lang={lang} />}
          {view === "overzicht" && <Overzicht transactions={transactions} t={t} accounts={accounts} selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} isDark={isDark} accent={accent} accentBg={accentBg} setTransactions={setTransactions} onUploadClick={() => setShowGlobalUpload(true)} lang={lang} />}
          {view === "transactions" && <Transactions transactions={transactions} setTransactions={setTransactions} t={t} accounts={accounts} setAccounts={setAccounts} isDark={isDark} lang={lang} onImportDone={(txs, importedAccounts) => {
                if (useMockData) {
                  setTransactions(txs);
                  setAccounts(importedAccounts || accounts.filter(a => !["ING Betaalrekening","ABN AMRO"].includes(a.name)));
                  setUseMockData(false);
                  setAppInvestments([]);
                  setAppGoals([]);
                  setRecurringItems([]);
                } else {
                  setTransactions(prev => [...txs, ...prev]);
                }
                // Show popup with count, let user decide
                const uncat = txs.filter(tx => !tx.category || tx.category === "other").length;
                if (uncat > 0) setUncatAlert(uncat);
              }} />}
          {view === "recurring" && <VasteLasten transactions={transactions} recurringItems={recurringItems} setRecurringItems={setRecurringItems} isDark={isDark} t={t} lang={lang} />}
          {view === "investments" && <Investments key={resetKey} t={t} isDark={isDark} useMockData={useMockData} investments={appInvestments} setInvestments={setAppInvestments} lang={lang} allTransactions={transactions} goals={appGoals} setGoals={setAppGoals} />}
          {view === "goals" && <GoalsView key={resetKey} transactions={transactions} isDark={isDark} useMockData={useMockData} goals={appGoals} setGoals={setAppGoals} t={t} lang={lang} />}
          {view === "insights" && <Insights transactions={transactions} t={t} isDark={isDark} recurringItems={recurringItems} lang={lang} />}
          {view === "calibrate" && <Calibrate transactions={transactions} setTransactions={setTransactions} t={t} isDark={isDark} lang={lang} />}
          {view === "rekeningen" && <RekeningenView accounts={accounts} setAccounts={setAccounts} onDeleteAccount={handleDeleteAccount} isDark={isDark} t={t} onUploadClick={() => setShowGlobalUpload(true)} lang={lang} />}
          {view === "export" && <ExportView transactions={transactions} isDark={isDark} />}
          {view === "settings" && <SettingsView lang={lang} setLang={setLang} t={t} accounts={accounts} setAccounts={setAccounts} onDeleteAccount={handleDeleteAccount} theme={theme} setTheme={setTheme} isDark={isDark} onReset={(sel) => {
            const all = sel.includes("all");
            if (all || sel.includes("transactions")) {
              setTransactions([]);
              setAccounts([]);
              setUseMockData(false);
            }
            if (all || sel.includes("investments")) {
              setAppInvestments([]);
            }
            if (all || sel.includes("goals")) {
              setAppGoals([]);
            }
            if (all) {
              setRecurringItems([]);
              setResetKey(k => k + 1); // signal debt/budget tabs to reset
              setView("dashboard");
            }
          }} />}
        </div>
      </div>
    </div>
  );
}
