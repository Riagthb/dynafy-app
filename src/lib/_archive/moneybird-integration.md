# Moneybird koppeling — gearchiveerd

Gearchiveerd op **2026-09-15** op verzoek Ranny. De koppeling-toggle
in Mijn Bedrijf is weggehaald; back-end code (edge-functions,
`profiles.moneybird_enabled`, `MoneybirdView`, `MbFacturenView`,
`MbKostenView`, `moneybird-proxy` etc.) blijft bestaan zodat we het
later kunnen reactiveren zonder database-migratie.

**Terugzetten** = 1 UI-blok terug in `MijnBedrijfView` plakken (na
Machtiging-sectie). De sidebar-conditional (`zzpProfile.moneybird_enabled
? [{ id: "moneybird", ... }] : []`) op regel ~16274 blijft staan en
werkt automatisch zodra iemand de toggle weer aanzet.

## UI-blok (Moneybird koppeling toggle)

```jsx
{/* Moneybird koppeling — minst belangrijk, onderaan */}
<div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', borderRadius:12, border:`1px solid ${C.border}`, background:isDark?'rgba(255,255,255,0.02)':'#f8fafc' }}>
  <div>
    <div style={{ fontSize:14, fontWeight:700, color:C.text, display:'flex', alignItems:'center', gap:8 }}>
      <RefreshCw size={15} color="#4f8ef7" /> Moneybird koppeling
    </div>
    <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Synchroniseer facturen via Moneybird</div>
  </div>
  <button onClick={() => {
    const newVal = !(form.moneybird_enabled);
    set('moneybird_enabled', newVal);
    if (newVal) setMbPopup(true);
  }} style={{ width:46, height:26, borderRadius:13, border:'none', cursor:'pointer', background:form.moneybird_enabled?'#22c55e':'rgba(100,116,139,0.3)', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
    <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:form.moneybird_enabled?23:3, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
  </button>
</div>
```

Deze code stond in `src/App.jsx` MijnBedrijfView, na de Machtiging-sectie,
vóór de Opslaan-knop.
