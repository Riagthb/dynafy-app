# Onboarding — gearchiveerde stappen

Gearchiveerd op **2026-09-08** (op verzoek Ranny): stappen "Herkomst",
"Situatie + Doelen" en "Upload transacties" uit de onboarding-flow gehaald
zodat nieuwe users direct naar het bedrijfsprofiel-registratie stap gaan
(ZZP-first, aansluitend op sidebar-refactor waar ZZP Modus bovenaan staat).

Deze code kan terug — bv. voor een A/B test of als de personal-finance
tool weer prominenter wordt. Alles hieronder is exact zoals het was
vóór de wijziging.

---

## Constants (bovenaan `Onboarding` component)

```js
const SITUATIONS = [
  { id: "zzp",      label: lang === "nl" ? "ZZP'er / Freelancer" : "Freelancer" },
  { id: "employee", label: lang === "nl" ? "In loondienst"        : "Employed"  },
  { id: "student",  label: lang === "nl" ? "Student"              : "Student"   },
  { id: "other",    label: lang === "nl" ? "Anders"               : "Other"     },
];

const GOALS_LIST = [
  { id: "expenses", label: lang === "nl" ? "Uitgaven bijhouden"      : "Track expenses"      },
  { id: "invest",   label: lang === "nl" ? "Investeren"              : "Investing"           },
  { id: "admin",    label: lang === "nl" ? "Bedrijfsadministratie"   : "Business admin"      },
  { id: "debt",     label: lang === "nl" ? "Schulden afbouwen"       : "Pay off debt"        },
  { id: "save",     label: lang === "nl" ? "Sparen"                  : "Save money"          },
  { id: "budget",   label: lang === "nl" ? "Budgetteren"             : "Budget"              },
];

const BANKS = [
  { id: "ing",   label: "ING"     },
  { id: "abn",   label: "ABN AMRO"},
  { id: "rabo",  label: "Rabobank"},
  { id: "bunq",  label: "Bunq"    },
  { id: "n26",   label: "N26"     },
  { id: "other", label: lang === "nl" ? "Anders" : "Other" },
];

const BANK_INSTRUCTIONS = {
  ing:   lang === "nl" ? "Mijn ING → Budgetcoach → Exporteer → CSV" : "My ING → Budget coach → Export → CSV",
  abn:   lang === "nl" ? "Internetbankieren → Transactieoverzicht → Exporteer als CSV" : "Online banking → Transactions → Export as CSV",
  rabo:  lang === "nl" ? "Rabo App → Mijn overzichten → Download CSV" : "Rabo App → My overviews → Download CSV",
  bunq:  lang === "nl" ? "Bunq app → Rekening → Exporteer" : "Bunq app → Account → Export",
  n26:   lang === "nl" ? "N26 app → Statistieken → Exporteer CSV" : "N26 app → Statistics → Export CSV",
  other: lang === "nl" ? "Exporteer transacties als CSV uit je bank-app" : "Export transactions as CSV from your bank app",
};

const REFERRAL_OPTIONS = [
  { id: "google",    label: lang === "nl" ? "Google"                        : "Google"                    },
  { id: "ai",        label: lang === "nl" ? "ChatGPT of ander AI"           : "ChatGPT or other AI"       },
  { id: "news",      label: lang === "nl" ? "Nieuws artikel"                : "News article"              },
  { id: "social",    label: lang === "nl" ? "Familie, vrienden of kennissen": "Family, friends or peers"  },
  { id: "employer",  label: lang === "nl" ? "Werkgever of collega's"        : "Employer or colleagues"    },
  { id: "podcast",   label: lang === "nl" ? "Podcast"                       : "Podcast"                   },
  { id: "influencer",label: lang === "nl" ? "Influencer"                    : "Influencer"                },
];
```

## State (`useState` declarations)

```js
const [situation, setSituation] = useState(null);
const [goals, setGoals] = useState([]);
const [bank, setBank] = useState(null);
const [referral, setReferral] = useState(null);
const [dragging, setDragging] = useState(false);
const [parsed, setParsed] = useState(null);
const [fileName, setFileName] = useState("");
const [showMockConfirm, setShowMockConfirm] = useState(false);
const inputRef = useRef();
```

## File-upload handler

```js
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
```

## Steps-labels

```js
steps: ["Welkom", "Naam", "Herkomst", "Jouw profiel", "Upload"]
```

## renderStep cases (2, 3, 4)

```jsx
// ── Step 2: Referral ─────────────────────────────────────
case 2: return (
  <div>
    <div style={{ fontSize: 24, fontWeight: 800, color: textColor, marginBottom: 6 }}>
      {lang === "nl" ? "Hoe ben je bij ons terecht gekomen?" : "How did you find us?"}
    </div>
    <div style={{ fontSize: 14, color: mutedColor, marginBottom: 24 }}>
      {lang === "nl" ? "Dit helpt ons te begrijpen hoe mensen ons vinden." : "This helps us understand how people discover us."}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {REFERRAL_OPTIONS.map(opt => (
        <button key={opt.id} onClick={() => setReferral(opt.id)}
          style={{ padding: "14px 18px", borderRadius: 12, border: referral === opt.id ? `2px solid ${accentColor}` : `1px solid ${borderColor}`, background: referral === opt.id ? `${accentColor}12` : "transparent", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s" }}>
          <span style={{ fontSize: 14, fontWeight: referral === opt.id ? 700 : 500, color: referral === opt.id ? accentColor : textColor }}>{opt.label}</span>
          {referral === opt.id && <Check size={14} color={accentColor} />}
        </button>
      ))}
    </div>
  </div>
);

// ── Step 3: Situation + Goals + ToS ──────────────────────
case 3: return (
  <div>
    <div style={{ fontSize: 24, fontWeight: 800, color: textColor, marginBottom: 6 }}>
      {lang === "nl" ? "Wat is jouw situatie?" : "What's your situation?"}
    </div>
    <div style={{ fontSize: 14, color: mutedColor, marginBottom: 20 }}>
      {lang === "nl" ? "Dit helpt ons de app beter op jou af te stemmen." : "This helps us tailor the app to you."}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
      {SITUATIONS.map(s => (
        <button key={s.id} onClick={() => setSituation(s.id)}
          style={{ padding: "16px 14px", borderRadius: 12, border: situation === s.id ? `2px solid ${accentColor}` : `1px solid ${borderColor}`, background: situation === s.id ? `${accentColor}12` : "transparent", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: situation === s.id ? accentColor : textColor }}>{s.label}</div>
        </button>
      ))}
    </div>

    <div style={{ fontSize: 11, fontWeight: 700, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
      {lang === "nl" ? "Waar ga je Dynafy voor gebruiken?" : "What will you use Dynafy for?"}
    </div>
    <div style={{ fontSize: 12, color: mutedColor, marginBottom: 12 }}>
      {lang === "nl" ? "Meerdere keuzes mogelijk" : "Multiple choices allowed"}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {GOALS_LIST.map(g => {
        const selected = goals.includes(g.id);
        return (
          <button key={g.id} onClick={() => setGoals(prev => selected ? prev.filter(x => x !== g.id) : [...prev, g.id])}
            style={{ padding: "12px 14px", borderRadius: 10, border: selected ? `2px solid ${accentColor}` : `1px solid ${borderColor}`, background: selected ? `${accentColor}12` : "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}>
            <span style={{ fontSize: 13, fontWeight: selected ? 700 : 500, color: selected ? accentColor : textColor, textAlign: "left" }}>{g.label}</span>
            {selected && <Check size={13} color={accentColor} style={{ marginLeft: "auto", flexShrink: 0 }}/>}
          </button>
        );
      })}
    </div>
    <TosRow />
  </div>
);

// ── Step 4: Upload ───────────────────────────────────────
case 4: return (
  <div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: textColor }}>
        {lang === "nl" ? "Upload je transacties" : "Upload your transactions"}
      </div>
      <div style={{ position: "relative", display: "inline-flex" }} className="csv-info-wrap">
        <button
          onMouseEnter={e => e.currentTarget.nextSibling.style.display = "block"}
          onMouseLeave={e => e.currentTarget.nextSibling.style.display = "none"}
          onClick={e => { const t = e.currentTarget.nextSibling; t.style.display = t.style.display === "block" ? "none" : "block"; }}
          style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${mutedColor}`, background: "transparent", color: mutedColor, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 }}>
          i
        </button>
        <div style={{ display: "none", position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)", background: isDarkTheme ? "#1e293b" : "#fff", border: `1px solid ${borderColor}`, borderRadius: 12, padding: "12px 16px", width: 240, fontSize: 13, color: textColor, lineHeight: 1.6, zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          {lang === "nl"
            ? "Download via jouw bankportaal jouw transacties in een CSV-bestand en upload dit hier."
            : "Download your transactions as a CSV file from your bank portal and upload it here."}
        </div>
      </div>
    </div>
    <div style={{ fontSize: 14, color: mutedColor, marginBottom: 24, lineHeight: 1.6 }}>
      {lang === "nl" ? "Kies je bank en upload een CSV-export." : "Choose your bank and upload a CSV export."}
    </div>

    {/* Bank picker */}
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: mutedColor, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        {lang === "nl" ? "Jouw bank" : "Your bank"}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {BANKS.map(b => (
          <button key={b.id} onClick={() => setBank(b.id)}
            style={{ padding: "8px 14px", borderRadius: 20, border: bank === b.id ? `1.5px solid ${accentColor}` : `1px solid ${borderColor}`, background: bank === b.id ? `${accentColor}12` : "transparent", cursor: "pointer", fontSize: 13, fontWeight: bank === b.id ? 700 : 500, color: bank === b.id ? accentColor : textColor }}>
            {b.label}
          </button>
        ))}
      </div>
      {bank && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: isDarkTheme ? "rgba(79,142,247,0.08)" : "#eff6ff", border: `1px solid ${accentColor}30`, fontSize: 12, color: mutedColor }}>
        {BANK_INSTRUCTIONS[bank]}
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
          <span style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>{fileName} — {parsed.length} {lang === "nl" ? "transacties" : "transactions"}</span>
          <button onClick={() => { setParsed(null); setFileName(""); }} style={{ marginLeft: "auto", background: "none", border: "none", color: mutedColor, cursor: "pointer", fontSize: 12 }}>x {lang === "nl" ? "Verwijder" : "Remove"}</button>
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
          {lang === "nl" ? `Start met ${parsed.length} transacties` : `Start with ${parsed.length} transactions`}
        </button>
      )}
      <button onClick={() => setShowMockConfirm(true)}
        style={{ width: "100%", padding: "13px", borderRadius: 50, background: "transparent", border: `1px solid ${borderColor}`, color: mutedColor, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
        {lang === "nl" ? "Sla over — gebruik voorbeelddata" : "Skip — use sample data"}
      </button>
    </div>
  </div>
);
```

## canAdvance array (nu 3 items ipv 5)

```js
const canAdvance = [
  true,                                        // step 0: lang + theme, always ok
  name.trim().length > 0,                      // step 1: name required
  referral !== null,                           // step 2: referral required
  situation !== null && tosAccepted,           // step 3: situation + ToS required
  false,                                       // step 4: upload uses own buttons
][step];
```

## Mock-data confirmation modal (na renderStep-block)

```jsx
{showMockConfirm && (
  <MockDataConfirmModal
    lang={lang}
    isDark={isDarkTheme}
    onConfirm={() => { setShowMockConfirm(false); completeOnboarding(false); }}
    onCancel={() => setShowMockConfirm(false)}
  />
)}
```

## Terugzetten — hoe

1. In `Onboarding` component (in `src/App.jsx`):
   - Voeg constants + state + `handleFile` terug op de plek waar ze stonden
   - Voeg cases 2, 3, 4 terug in de `renderStep` switch
   - Update `canAdvance` array naar 5-item versie
   - Zet `TOTAL_STEPS` naar 5
   - Update `t.steps` naar 5-item array
   - Voeg `{showMockConfirm && ...}` modal terug
   - Verwijder de nieuwe stap 2 (bedrijf-registratie)
2. In `completeOnboarding`: gebruik weer de oude `withUpload` versie met `parsed` transactions
3. In App.jsx onboarding-handler: verwijder de company-fields van de save
