import { useState, useEffect, useCallback } from "react";

// ─── DATE INIȚIALE (folosite doar la primul rulaj) ────────────────────────────
const CLIENTI_DEF = [
  { id: 1, name: "TechMetal GmbH",     tara: "DE", contact: "Klaus Müller",  email: "k.muller@techmetal.de",        tel: "+49 221 4456789",  cui: "DE123456789"      },
  { id: 2, name: "Precision Parts NL", tara: "NL", contact: "Jan de Vries",  email: "j.devries@precisionparts.nl",  tel: "+31 20 5554433",   cui: "NL987654321B01"   },
  { id: 3, name: "AutoStanz GmbH",     tara: "AT", contact: "Hans Weber",    email: "h.weber@autostanz.at",         tel: "+43 1 23456789",   cui: "ATU12345678"      },
  { id: 4, name: "Plastex SRL",        tara: "RO", contact: "Ion Popescu",   email: "i.popescu@plastex.ro",         tel: "+40 232 123456",   cui: "RO12345678"       },
];
const PRODUSE_DEF = [
  { id: 1, cod: "FRZ-001", name: "Frezare 3-axe Al",          um: "buc", pret: 85,   cat: "Frezare CNC"   },
  { id: 2, cod: "FRZ-002", name: "Frezare 5-axe Oțel",        um: "buc", pret: 145,  cat: "Frezare CNC"   },
  { id: 3, cod: "STR-001", name: "Strunjire CNC ax-Y",         um: "buc", pret: 65,   cat: "Strunjire CNC" },
  { id: 4, cod: "MAT-001", name: "Matriță injecție plastic",   um: "buc", pret: 2800, cat: "Matrițe"       },
  { id: 5, cod: "STM-001", name: "Ștanță progresivă",          um: "buc", pret: 1650, cat: "Ștanțare"      },
  { id: 6, cod: "FIX-001", name: "Dispozitiv prindere CNC",    um: "buc", pret: 420,  cat: "Dispozitive"   },
  { id: 7, cod: "PRT-001", name: "Piesă custom oțel",          um: "buc", pret: 95,   cat: "Piese Custom"  },
];
const COMENZI_DEF = [
  { id: 1, nr: "CMD-2025-001", clientId: 1, data: "2025-04-10", termen: "2025-05-20", etapa: "Prelucrare",      prio: "normal", linii: [{ prodId: 1, qty: 12, pret: 85 }, { prodId: 2, qty: 3, pret: 145 }], obs: "Toleranțe ISO h6"         },
  { id: 2, nr: "CMD-2025-002", clientId: 2, data: "2025-04-18", termen: "2025-05-30", etapa: "Programare CNC",  prio: "urgent", linii: [{ prodId: 3, qty: 25, pret: 65  }],                                  obs: ""                          },
  { id: 3, nr: "CMD-2025-003", clientId: 3, data: "2025-04-22", termen: "2025-06-15", etapa: "Ofertă",          prio: "normal", linii: [{ prodId: 4, qty: 1,  pret: 2800 }],                                  obs: "Material: P20 Tool Steel"  },
  { id: 4, nr: "CMD-2025-004", clientId: 4, data: "2025-04-28", termen: "2025-05-15", etapa: "Control calitate",prio: "urgent", linii: [{ prodId: 7, qty: 50, pret: 95  }],                                  obs: ""                          },
  { id: 5, nr: "CMD-2025-005", clientId: 1, data: "2025-05-01", termen: "2025-06-01", etapa: "Comandă",         prio: "normal", linii: [{ prodId: 5, qty: 2,  pret: 1650 }, { prodId: 6, qty: 3, pret: 420 }], obs: "Desene tehnice atașate"  },
];
const FACTURI_DEF = [
  { id: 1, nr: "BPT-2025-001", clientId: 4, cmdId: null, data: "2025-04-15", scad: "2025-05-15", val: 4750, platita: true  },
  { id: 2, nr: "BPT-2025-002", clientId: 1, cmdId: 1,    data: "2025-05-01", scad: "2025-06-01", val: 1455, platita: false },
];

// ─── CONSTANTE ────────────────────────────────────────────────────────────────
const ETAPE    = ["Ofertă","Comandă","Programare CNC","Prelucrare","Control calitate","Livrare","Facturat"];
const ETPA_CLR = { "Ofertă":"#f59e0b","Comandă":"#3b82f6","Programare CNC":"#8b5cf6","Prelucrare":"#06b6d4","Control calitate":"#f97316","Livrare":"#10b981","Facturat":"#6b7280" };
const TARI     = { RO:"🇷🇴", DE:"🇩🇪", AT:"🇦🇹", NL:"🇳🇱", BE:"🇧🇪", DK:"🇩🇰" };
const FIRMA    = { name:"BPT-Moulds Manufacturing SRL", adresa:"Str. Industriei 14, Piatra Neamț, România", cui:"RO12345678", reg:"J27/123/2018", iban:"RO49 AAAA 1B31 0075 9384 0000", banca:"Banca Transilvania", tel:"+40 232 XXX XXX", email:"office@bpt-manufacturing.ro", web:"www.bpt-manufacturing.ro" };

let _uid = 20;
const uid   = () => ++_uid;
const fmtD  = (d) => d ? new Date(d).toLocaleDateString("ro-RO",{ day:"2-digit", month:"2-digit", year:"numeric" }) : "—";
const fmtE  = (n) => new Intl.NumberFormat("ro-RO",{ style:"currency", currency:"EUR", maximumFractionDigits:2 }).format(n||0);
const cmdVal= (c) => c.linii.reduce((s,l) => s + l.qty * l.pret, 0);

// ─── HOOK: localStorage persistence ──────────────────────────────────────────
function usePersist(key, defaultVal) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch { return defaultVal; }
  });
  const set = useCallback((val) => {
    setState(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [state, set];
}

// ─── PDF GENERATOR (print-to-PDF via browser) ─────────────────────────────────
function generatePDF(type, doc, clienti, produse) {
  const cl = clienti.find(x => x.id === doc.clientId) || {};
  const isFactura = type === "factura";
  const titlu = isFactura ? `FACTURĂ FISCALĂ` : `OFERTĂ DE PREȚ`;
  const nr    = doc.nr;

  const linii = (isFactura
    ? [{ name: doc.obs || "Servicii de prelucrare CNC", qty: 1, pret: doc.val, um: "buc" }]
    : doc.linii.map(l => { const p = produse.find(x => x.id === l.prodId)||{}; return { name: p.name||"Serviciu", qty: l.qty, pret: l.pret, um: p.um||"buc" }; })
  );

  const subtotal = linii.reduce((s,l) => s + l.qty * l.pret, 0);
  const tva      = subtotal * 0.19;
  const total    = subtotal + tva;

  const rows = linii.map((l,i) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${i+1}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${l.name}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">${l.um}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${l.qty}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmtE(l.pret)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${fmtE(l.qty * l.pret)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8">
  <title>${titlu} ${nr}</title>
  <style>
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1e293b;margin:0;padding:0}
    .page{max-width:800px;margin:0 auto;padding:40px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #1d4ed8}
    .logo-block .company{font-size:18px;font-weight:700;color:#1d4ed8;margin-bottom:4px}
    .logo-block .sub{font-size:11px;color:#64748b;line-height:1.6}
    .doc-title{text-align:right}
    .doc-title .type{font-size:22px;font-weight:800;color:#1d4ed8;letter-spacing:1px}
    .doc-title .nr{font-size:14px;color:#475569;margin-top:4px}
    .doc-title .data{font-size:12px;color:#94a3b8;margin-top:2px}
    .parties{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px}
    .party{background:#f8fafc;border-radius:8px;padding:14px 16px;border:1px solid #e2e8f0}
    .party .label{font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1px;margin-bottom:8px}
    .party .name{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:4px}
    .party .det{font-size:12px;color:#64748b;line-height:1.6}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    thead tr{background:#1d4ed8;color:#fff}
    thead th{padding:10px 10px;text-align:left;font-size:11px;letter-spacing:.5px}
    thead th:nth-child(3),thead th:nth-child(4){text-align:center}
    thead th:nth-child(5),thead th:nth-child(6){text-align:right}
    tbody tr:nth-child(even){background:#f8fafc}
    .totals{margin-left:auto;width:280px;margin-bottom:28px}
    .totals table{margin-bottom:0}
    .totals td{padding:6px 10px;font-size:13px}
    .totals .total-row td{font-weight:700;font-size:15px;color:#1d4ed8;border-top:2px solid #1d4ed8;padding-top:10px}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:11px;color:#94a3b8}
    .sign{text-align:right}
    .sign .label{font-size:11px;color:#64748b;margin-bottom:30px}
    .sign .line{border-top:1px solid #cbd5e1;padding-top:6px;font-size:12px;color:#475569}
    .validity{background:#fefce8;border:1px solid #fde047;border-radius:6px;padding:10px 14px;font-size:12px;color:#713f12;margin-bottom:20px}
    @media print{body{margin:0}@page{margin:15mm}}
  </style></head><body>
  <div class="page">
    <div class="header">
      <div class="logo-block">
        <div class="company">BPT-MOULDS MANUFACTURING</div>
        <div class="sub">
          ${FIRMA.adresa}<br>
          CUI: ${FIRMA.cui} | Reg. Com.: ${FIRMA.reg}<br>
          Tel: ${FIRMA.tel} | ${FIRMA.email}
        </div>
      </div>
      <div class="doc-title">
        <div class="type">${titlu}</div>
        <div class="nr">Nr. ${nr}</div>
        <div class="data">Data: ${fmtD(doc.data || new Date().toISOString().slice(0,10))}</div>
        ${!isFactura ? `<div class="data">Valabilitate: 30 zile</div>` : `<div class="data">Scadentă: ${fmtD(doc.scad)}</div>`}
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="label">FURNIZOR</div>
        <div class="name">${FIRMA.name}</div>
        <div class="det">CUI: ${FIRMA.cui}<br>IBAN: ${FIRMA.iban}<br>Banca: ${FIRMA.banca}</div>
      </div>
      <div class="party">
        <div class="label">CLIENT</div>
        <div class="name">${cl.name || "—"}</div>
        <div class="det">
          ${cl.cui ? `CUI/VAT: ${cl.cui}<br>` : ""}
          ${cl.contact ? `Contact: ${cl.contact}<br>` : ""}
          ${cl.email || ""}${cl.tel ? `<br>${cl.tel}` : ""}
        </div>
      </div>
    </div>

    ${!isFactura && doc.obs ? `<div class="validity">📋 Specificații: ${doc.obs}</div>` : ""}

    <table>
      <thead><tr>
        <th style="width:40px">#</th>
        <th>Denumire produs / serviciu</th>
        <th style="width:60px">U.M.</th>
        <th style="width:70px">Cant.</th>
        <th style="width:110px">Preț unitar</th>
        <th style="width:120px">Valoare</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <table>
        <tr><td style="color:#64748b">Subtotal (fără TVA):</td><td style="text-align:right">${fmtE(subtotal)}</td></tr>
        <tr><td style="color:#64748b">TVA 19%:</td><td style="text-align:right">${fmtE(tva)}</td></tr>
        <tr class="total-row"><td>TOTAL DE PLATĂ:</td><td style="text-align:right">${fmtE(total)}</td></tr>
      </table>
    </div>

    ${isFactura ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px 16px;font-size:12px;color:#1e40af;margin-bottom:20px">
      💳 Plata se efectuează în contul: <strong>${FIRMA.iban}</strong> (${FIRMA.banca})<br>
      Vă rugăm să menționați numărul facturii în descrierea transferului.
    </div>` : `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;font-size:12px;color:#166534;margin-bottom:20px">
      ✅ Această ofertă este valabilă 30 de zile de la data emiterii. Prețurile sunt exprimate în EUR, fără TVA.<br>
      Pentru confirmare, vă rugăm să ne contactați la: ${FIRMA.email} sau ${FIRMA.tel}
    </div>`}

    <div class="footer">
      <div>
        <div style="font-size:12px;color:#475569;margin-bottom:4px">BPT-Moulds Manufacturing SRL</div>
        <div>${FIRMA.web}</div>
        <div style="margin-top:8px;font-size:10px">Document generat electronic · ${new Date().toLocaleString("ro-RO")}</div>
      </div>
      <div class="sign">
        <div class="label">Semnătură și ștampilă</div>
        <div class="line">Director General</div>
      </div>
    </div>
  </div>
  <script>window.onload=()=>{ window.print(); }<\/script>
  </body></html>`;

  const w = window.open("","_blank","width=900,height=700");
  if (w) { w.document.write(html); w.document.close(); }
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,      setTab]      = useState("dashboard");
  const [clienti,  setClienti]  = usePersist("bpt_clienti",  CLIENTI_DEF);
  const [produse,  setProduse]  = usePersist("bpt_produse",  PRODUSE_DEF);
  const [comenzi,  setComenzi]  = usePersist("bpt_comenzi",  COMENZI_DEF);
  const [facturi,  setFacturi]  = usePersist("bpt_facturi",  FACTURI_DEF);
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type="ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };

  const ctx = { clienti, setClienti, produse, setProduse, comenzi, setComenzi, facturi, setFacturi, showToast, generatePDF };
  const urgent = comenzi.filter(c => c.prio==="urgent" && c.etapa!=="Facturat").length;

  const resetAll = () => {
    if (!confirm("Resetezi TOATE datele la valorile inițiale? Această acțiune nu poate fi anulată.")) return;
    setClienti(CLIENTI_DEF); setProduse(PRODUSE_DEF); setComenzi(COMENZI_DEF); setFacturi(FACTURI_DEF);
    showToast("Date resetate la valorile inițiale");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ clienti, produse, comenzi, facturi }, null, 2)], { type:"application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `bpt-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
    showToast("Backup exportat cu succes ✓");
  };

  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.clienti) setClienti(d.clienti); if (d.produse) setProduse(d.produse);
        if (d.comenzi) setComenzi(d.comenzi); if (d.facturi) setFacturi(d.facturi);
        showToast("Backup importat cu succes ✓");
      } catch { showToast("Fișier invalid!", "err"); }
    };
    r.readAsText(file); e.target.value = "";
  };

  const NAV = [
    { id:"dashboard", icon:"◈", label:"Dashboard"    },
    { id:"comenzi",   icon:"◻", label:"Comenzi"      },
    { id:"flux",      icon:"⟳", label:"Flux Lucru"   },
    { id:"clienti",   icon:"◎", label:"Clienți"      },
    { id:"produse",   icon:"▣", label:"Produse"      },
    { id:"facturi",   icon:"◇", label:"Facturi"      },
  ];

  return (
    <div style={{ fontFamily:"'IBM Plex Mono','Courier New',monospace", background:"#090b0f", minHeight:"100vh", color:"#cbd5e1" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:#090b0f}::-webkit-scrollbar-thumb{background:#1e2535;border-radius:2px}
        .btn{cursor:pointer;border:none;transition:all .15s;font-family:inherit;display:inline-flex;align-items:center;gap:6px}
        .btn:hover{filter:brightness(1.2);transform:translateY(-1px)}.btn:active{transform:translateY(0)}
        .card{background:#0f1117;border:1px solid #1a2035;border-radius:8px}
        .inp{background:#0a0d13;border:1px solid #1a2035;border-radius:6px;color:#cbd5e1;font-family:inherit;font-size:13px;padding:8px 10px;width:100%;outline:none;transition:border-color .15s}
        .inp:focus{border-color:#3b82f6} select.inp option{background:#0f1117}
        .tag{display:inline-flex;align-items:center;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:500;letter-spacing:.4px}
        .mbg{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
        .mbox{background:#0f1117;border:1px solid #1a2035;border-radius:10px;width:100%;max-width:640px;max-height:92vh;overflow-y:auto}
        .nl{cursor:pointer;display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:6px;font-size:13px;transition:all .15s;color:#475569;border:1px solid transparent;font-family:'IBM Plex Sans',sans-serif;font-weight:500}
        .nl:hover{color:#94a3b8;background:rgba(255,255,255,.02)}.nl.on{color:#60a5fa;background:rgba(59,130,246,.09);border-color:rgba(59,130,246,.22)}
        .tr:hover td{background:rgba(59,130,246,.03)!important}
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.fi{animation:fi .22s ease}
        @keyframes tst{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .kol{background:#0a0d13;border:1px solid #1a2035;border-radius:8px;min-width:185px;flex-shrink:0}
        .kc{background:#0f1117;border:1px solid #1a2035;border-radius:6px;padding:10px;margin:8px;cursor:pointer;transition:border-color .15s}.kc:hover{border-color:#3b82f6}
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background:toast.type==="err"?"#7f1d1d":"#052e16", border:`1px solid ${toast.type==="err"?"#dc2626":"#16a34a"}`, borderRadius:8, padding:"12px 18px", fontSize:13, color:toast.type==="err"?"#fca5a5":"#86efac", animation:"tst .2s ease", boxShadow:"0 8px 24px rgba(0,0,0,.5)", maxWidth:320 }}>
          {toast.type==="err"?"✕ ":"✓ "}{toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{ borderBottom:"1px solid #1a2035", padding:"0 20px", display:"flex", alignItems:"center", gap:16, height:54, background:"#0a0d13", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, background:"linear-gradient(135deg,#2563eb,#1e40af)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", fontFamily:"'IBM Plex Sans',sans-serif", flexShrink:0 }}>B</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0", fontFamily:"'IBM Plex Sans',sans-serif", lineHeight:1.2 }}>BPT-Moulds Manufacturing</div>
            <div style={{ fontSize:10, color:"#334155", letterSpacing:"1.2px" }}>ATELIER · ERP v1.1</div>
          </div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          {urgent>0 && <div style={{ background:"rgba(239,68,68,.12)", border:"1px solid rgba(239,68,68,.3)", borderRadius:4, padding:"3px 10px", fontSize:11, color:"#f87171", fontWeight:500 }}>⚡ {urgent} URGENT{urgent>1?"E":""}</div>}
          {/* EXPORT / IMPORT / RESET */}
          <button className="btn" onClick={exportData} title="Export backup JSON" style={{ background:"#1a2035", color:"#64748b", padding:"5px 10px", borderRadius:5, fontSize:11 }}>↓ Backup</button>
          <label title="Import backup JSON" style={{ cursor:"pointer", background:"#1a2035", color:"#64748b", padding:"5px 10px", borderRadius:5, fontSize:11, display:"inline-flex", alignItems:"center", gap:6, fontFamily:"inherit" }}>
            ↑ Import <input type="file" accept=".json" onChange={importData} style={{ display:"none" }} />
          </label>
          <button className="btn" onClick={resetAll} title="Reset date demo" style={{ background:"rgba(239,68,68,.08)", color:"#f87171", padding:"5px 10px", borderRadius:5, fontSize:11 }}>⟳ Reset</button>
          <div style={{ background:"rgba(16,185,129,.08)", border:"1px solid rgba(16,185,129,.2)", borderRadius:4, padding:"3px 10px", fontSize:11, color:"#34d399" }}>● ACTIV</div>
        </div>
      </div>

      <div style={{ display:"flex", height:"calc(100vh - 54px)" }}>
        {/* SIDEBAR */}
        <div style={{ width:185, borderRight:"1px solid #1a2035", padding:"14px 8px", background:"#0a0d13", flexShrink:0, display:"flex", flexDirection:"column", gap:3 }}>
          {NAV.map(n => <div key={n.id} className={`nl${tab===n.id?" on":""}`} onClick={()=>setTab(n.id)}><span style={{ fontSize:13, opacity:.8 }}>{n.icon}</span>{n.label}</div>)}
          <div style={{ marginTop:"auto", padding:"10px 12px", borderTop:"1px solid #1a2035", fontSize:10, color:"#263248", lineHeight:1.7 }}>
            bpt-manufacturing.ro<br />© 2025 BPT-Moulds SRL<br/>
            <span style={{ color:"#10b981", opacity:.6 }}>💾 Auto-salvare activ</span>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex:1, overflow:"auto", padding:22 }} className="fi">
          {tab==="dashboard" && <TabDashboard {...ctx} setTab={setTab} />}
          {tab==="comenzi"   && <TabComenzi   {...ctx} />}
          {tab==="flux"      && <TabFlux      {...ctx} />}
          {tab==="clienti"   && <TabClienti   {...ctx} />}
          {tab==="produse"   && <TabProduse   {...ctx} />}
          {tab==="facturi"   && <TabFacturi   {...ctx} />}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function TabDashboard({ comenzi, clienti, facturi, setTab }) {
  const pipeline  = comenzi.filter(c=>c.etapa!=="Facturat").reduce((s,c)=>s+cmdVal(c),0);
  const neplatite = facturi.filter(f=>!f.platita).reduce((s,f)=>s+f.val,0);
  const active    = comenzi.filter(c=>!["Facturat","Livrare"].includes(c.etapa)).length;
  const urgent    = comenzi.filter(c=>c.prio==="urgent"&&c.etapa!=="Facturat").length;
  const etapeData = ETAPE.slice(0,-1).map(e=>({ e, n:comenzi.filter(c=>c.etapa===e).length }));
  const maxN      = Math.max(...etapeData.map(x=>x.n),1);
  const recent    = [...comenzi].sort((a,b)=>b.id-a.id).slice(0,5);
  const scadente  = facturi.filter(f=>!f.platita&&new Date(f.scad)<new Date(Date.now()+7*86400000));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div>
        <div style={{ fontSize:18, fontWeight:700, color:"#e2e8f0", fontFamily:"'IBM Plex Sans',sans-serif" }}>Dashboard</div>
        <div style={{ fontSize:12, color:"#475569", marginTop:2 }}>Situație generală atelier · {new Date().toLocaleDateString("ro-RO",{ weekday:"long", day:"numeric", month:"long", year:"numeric" })}</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[
          { label:"Comenzi active",   val:active,          color:"#3b82f6", sub:`${urgent} urgente`,                                          icon:"◻" },
          { label:"Pipeline valoare", val:fmtE(pipeline),  color:"#10b981", sub:"comenzi nefacturate",                                        icon:"◈" },
          { label:"De încasat",       val:fmtE(neplatite), color:neplatite>0?"#f97316":"#10b981", sub:`${facturi.filter(f=>!f.platita).length} facturi`, icon:"◇" },
          { label:"Clienți activi",   val:clienti.length,  color:"#8b5cf6", sub:"în baza de date",                                           icon:"◎" },
        ].map(k=>(
          <div key={k.label} className="card" style={{ padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ fontSize:11, color:"#475569", marginBottom:8, letterSpacing:".5px" }}>{k.label.toUpperCase()}</div>
              <span style={{ fontSize:16, color:k.color, opacity:.45 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize:22, fontWeight:700, color:k.color, fontFamily:"'IBM Plex Sans',sans-serif", lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:11, color:"#334155", marginTop:6 }}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div className="card" style={{ padding:18 }}>
          <div style={{ fontSize:11, color:"#64748b", marginBottom:14, letterSpacing:".5px", fontWeight:600 }}>DISTRIBUȚIE PE ETAPE</div>
          {etapeData.map(({e,n})=>(
            <div key={e} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
              <div style={{ width:130, fontSize:11, color:"#64748b", flexShrink:0, textAlign:"right" }}>{e}</div>
              <div style={{ flex:1, height:6, background:"#1a2035", borderRadius:3, overflow:"hidden" }}>
                <div style={{ width:`${(n/maxN)*100}%`, height:"100%", background:ETPA_CLR[e], borderRadius:3, transition:"width .5s ease" }} />
              </div>
              <div style={{ width:20, fontSize:12, color:"#94a3b8", fontWeight:600 }}>{n}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#64748b", letterSpacing:".5px", fontWeight:600 }}>COMENZI RECENTE</div>
            <button className="btn" onClick={()=>setTab("comenzi")} style={{ fontSize:11, color:"#3b82f6", background:"none", padding:0 }}>Vezi toate →</button>
          </div>
          {recent.map(c=>{
            const cl=clienti.find(x=>x.id===c.clientId)||{};
            return (
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:"#0a0d13", borderRadius:6, border:"1px solid #1a2035", marginBottom:7 }}>
                {c.prio==="urgent"&&<span style={{ color:"#ef4444", fontSize:11 }}>⚡</span>}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:"#94a3b8", fontWeight:500 }}>{c.nr}</div>
                  <div style={{ fontSize:11, color:"#475569", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cl.name}</div>
                </div>
                <EtapaTag etapa={c.etapa} />
              </div>
            );
          })}
        </div>
      </div>
      {scadente.length>0&&(
        <div style={{ background:"rgba(249,115,22,.06)", border:"1px solid rgba(249,115,22,.25)", borderRadius:8, padding:"14px 18px" }}>
          <div style={{ fontSize:12, color:"#fb923c", fontWeight:600, marginBottom:10 }}>⚠ FACTURI SCADENTE ÎN 7 ZILE</div>
          {scadente.map(f=>{ const cl=clienti.find(x=>x.id===f.clientId)||{};
            return <div key={f.id} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#94a3b8", marginBottom:4 }}>
              <span>{f.nr} · {cl.name}</span>
              <span style={{ color:"#fb923c", fontWeight:600 }}>{fmtE(f.val)} · scadent {fmtD(f.scad)}</span>
            </div>;
          })}
        </div>
      )}
    </div>
  );
}

// ─── COMENZI ──────────────────────────────────────────────────────────────────
function TabComenzi({ comenzi, setComenzi, clienti, produse, showToast, generatePDF }) {
  const [modal, setModal] = useState(null);
  const [flt,   setFlt]   = useState({ q:"", etapa:"", prio:"" });

  const list = comenzi.filter(c=>{
    const cl=clienti.find(x=>x.id===c.clientId)||{};
    const q=flt.q.toLowerCase();
    if(q&&!c.nr.toLowerCase().includes(q)&&!(cl.name||"").toLowerCase().includes(q)) return false;
    if(flt.etapa&&c.etapa!==flt.etapa) return false;
    if(flt.prio&&c.prio!==flt.prio) return false;
    return true;
  });

  const save = (cmd) => {
    if(!cmd.id) { setComenzi(p=>[...p,{...cmd,id:uid(),nr:`CMD-${new Date().getFullYear()}-${String(p.length+1).padStart(3,"0")}`}]); showToast("Comandă adăugată ✓"); }
    else { setComenzi(p=>p.map(c=>c.id===cmd.id?cmd:c)); showToast("Comandă actualizată ✓"); }
    setModal(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PH title="Comenzi" sub={`${comenzi.length} total`}>
        <button className="btn" onClick={()=>setModal("new")} style={{ background:"#2563eb", color:"#fff", padding:"8px 16px", borderRadius:6, fontSize:12, fontWeight:600 }}>+ Comandă nouă</button>
      </PH>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <input className="inp" placeholder="Caută număr / client…" value={flt.q} onChange={e=>setFlt(p=>({...p,q:e.target.value}))} style={{ maxWidth:260 }} />
        <select className="inp" value={flt.etapa} onChange={e=>setFlt(p=>({...p,etapa:e.target.value}))} style={{ maxWidth:180 }}>
          <option value="">Toate etapele</option>{ETAPE.map(e=><option key={e}>{e}</option>)}
        </select>
        <select className="inp" value={flt.prio} onChange={e=>setFlt(p=>({...p,prio:e.target.value}))} style={{ maxWidth:150 }}>
          <option value="">Orice prioritate</option><option value="normal">Normal</option><option value="urgent">Urgent</option>
        </select>
        {(flt.q||flt.etapa||flt.prio)&&<button className="btn" onClick={()=>setFlt({q:"",etapa:"",prio:""})} style={{ background:"#1a2035", color:"#94a3b8", padding:"8px 12px", borderRadius:6, fontSize:11 }}>✕ Reset</button>}
      </div>
      <div className="card" style={{ overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ borderBottom:"1px solid #1a2035" }}>
            {["Nr. Comandă","Client","Data","Termen","Valoare","Etapă","Prior.",""].map(h=><th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, color:"#475569", letterSpacing:".6px", fontWeight:600 }}>{h.toUpperCase()}</th>)}
          </tr></thead>
          <tbody>
            {list.length===0&&<tr><td colSpan={8} style={{ padding:30, textAlign:"center", color:"#334155" }}>Nicio comandă găsită</td></tr>}
            {list.map(c=>{
              const cl=clienti.find(x=>x.id===c.clientId)||{};
              const exp=new Date(c.termen)<new Date()&&c.etapa!=="Facturat";
              return (
                <tr key={c.id} className="tr" style={{ borderBottom:"1px solid #0f1117" }}>
                  <td style={{ padding:"10px 14px" }}><div style={{ display:"flex", alignItems:"center", gap:6 }}>{c.prio==="urgent"&&<span style={{ color:"#ef4444" }}>⚡</span>}<span style={{ color:"#60a5fa", fontWeight:600 }}>{c.nr}</span></div></td>
                  <td style={{ padding:"10px 14px" }}><div style={{ color:"#94a3b8", fontWeight:500 }}>{cl.name||"—"}</div><div style={{ fontSize:10, color:"#334155" }}>{TARI[cl.tara]||""} {cl.tara}</div></td>
                  <td style={{ padding:"10px 14px", color:"#64748b" }}>{fmtD(c.data)}</td>
                  <td style={{ padding:"10px 14px" }}><span style={{ color:exp?"#f87171":"#64748b" }}>{fmtD(c.termen)}{exp?" ⚠":""}</span></td>
                  <td style={{ padding:"10px 14px", color:"#10b981", fontWeight:600 }}>{fmtE(cmdVal(c))}</td>
                  <td style={{ padding:"10px 14px" }}><EtapaTag etapa={c.etapa} /></td>
                  <td style={{ padding:"10px 14px" }}><span style={{ fontSize:10, color:c.prio==="urgent"?"#f87171":"#475569", textTransform:"uppercase", letterSpacing:".5px" }}>{c.prio}</span></td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="btn" onClick={()=>generatePDF("oferta",{...c,data:c.data},clienti,produse)} title="Export PDF Ofertă" style={{ background:"rgba(59,130,246,.1)", color:"#60a5fa", padding:"5px 9px", borderRadius:5, fontSize:11, border:"1px solid rgba(59,130,246,.2)" }}>📄 PDF</button>
                      <button className="btn" onClick={()=>setModal(c)} style={{ background:"#1a2035", color:"#94a3b8", padding:"5px 9px", borderRadius:5, fontSize:11 }}>✎</button>
                      <button className="btn" onClick={()=>{ if(confirm("Ștergi?")){ setComenzi(p=>p.filter(x=>x.id!==c.id)); showToast("Comandă ștearsă"); }}} style={{ background:"rgba(239,68,68,.1)", color:"#f87171", padding:"5px 9px", borderRadius:5, fontSize:11 }}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal&&<ModalCmd cmd={modal==="new"?null:modal} clienti={clienti} produse={produse} onSave={save} onClose={()=>setModal(null)} />}
    </div>
  );
}

function ModalCmd({ cmd, clienti, produse, onSave, onClose }) {
  const [f,setF]=useState(cmd||{ clientId:clienti[0]?.id||1, data:new Date().toISOString().slice(0,10), termen:"", etapa:"Ofertă", prio:"normal", linii:[], obs:"" });
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const addL=()=>setF(p=>({...p,linii:[...p.linii,{prodId:produse[0]?.id||1,qty:1,pret:produse[0]?.pret||0}]}));
  const updL=(i,k,v)=>setF(p=>({...p,linii:p.linii.map((l,j)=>j===i?{...l,[k]:["qty","pret"].includes(k)?Number(v):v}:l)}));
  const delL=(i)=>setF(p=>({...p,linii:p.linii.filter((_,j)=>j!==i)}));
  const tot=f.linii.reduce((s,l)=>s+l.qty*l.pret,0);
  return (
    <div className="mbg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mbox" style={{ padding:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#e2e8f0", fontFamily:"'IBM Plex Sans',sans-serif" }}>{cmd?`Editare ${cmd.nr}`:"Comandă nouă"}</div>
          <button className="btn" onClick={onClose} style={{ background:"none", color:"#475569", fontSize:18, padding:0 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div><Lbl>Client</Lbl><select className="inp" value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clienti.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><Lbl>Etapă</Lbl><select className="inp" value={f.etapa} onChange={e=>s("etapa",e.target.value)}>{ETAPE.map(e=><option key={e}>{e}</option>)}</select></div>
          <div><Lbl>Data</Lbl><input className="inp" type="date" value={f.data} onChange={e=>s("data",e.target.value)} /></div>
          <div><Lbl>Termen livrare</Lbl><input className="inp" type="date" value={f.termen} onChange={e=>s("termen",e.target.value)} /></div>
          <div><Lbl>Prioritate</Lbl><select className="inp" value={f.prio} onChange={e=>s("prio",e.target.value)}><option value="normal">Normal</option><option value="urgent">Urgent ⚡</option></select></div>
          <div><Lbl>Observații / Specificații</Lbl><input className="inp" value={f.obs} onChange={e=>s("obs",e.target.value)} placeholder="Toleranțe, material…" /></div>
        </div>
        <div style={{ borderTop:"1px solid #1a2035", paddingTop:14, marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
            <Lbl style={{ marginBottom:0 }}>Linii comandă</Lbl>
            <button className="btn" onClick={addL} style={{ background:"#1a2035", color:"#60a5fa", padding:"5px 12px", borderRadius:5, fontSize:11 }}>+ Adaugă linie</button>
          </div>
          {f.linii.length===0&&<div style={{ fontSize:12, color:"#334155", textAlign:"center", padding:"14px 0" }}>Nicio linie adăugată</div>}
          {f.linii.map((l,i)=>(
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 75px 85px 34px", gap:8, marginBottom:8, alignItems:"center" }}>
              <select className="inp" value={l.prodId} onChange={e=>{ const p=produse.find(x=>x.id===Number(e.target.value)); updL(i,"prodId",Number(e.target.value)); if(p) updL(i,"pret",p.pret); }}>
                {produse.map(p=><option key={p.id} value={p.id}>{p.cod} · {p.name}</option>)}
              </select>
              <input className="inp" type="number" min={1} value={l.qty} onChange={e=>updL(i,"qty",e.target.value)} placeholder="Qty" />
              <input className="inp" type="number" min={0} value={l.pret} onChange={e=>updL(i,"pret",e.target.value)} placeholder="€/buc" />
              <button className="btn" onClick={()=>delL(i)} style={{ background:"rgba(239,68,68,.1)", color:"#f87171", padding:"7px", borderRadius:5, fontSize:12, justifyContent:"center" }}>✕</button>
            </div>
          ))}
          {f.linii.length>0&&<div style={{ textAlign:"right", fontSize:13, color:"#10b981", fontWeight:700, marginTop:6 }}>TOTAL: {fmtE(tot)}</div>}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button className="btn" onClick={onClose} style={{ background:"#1a2035", color:"#64748b", padding:"9px 18px", borderRadius:6, fontSize:12 }}>Anulează</button>
          <button className="btn" onClick={()=>onSave(f)} style={{ background:"#2563eb", color:"#fff", padding:"9px 20px", borderRadius:6, fontSize:12, fontWeight:600 }}>Salvează</button>
        </div>
      </div>
    </div>
  );
}

// ─── FLUX LUCRU ───────────────────────────────────────────────────────────────
function TabFlux({ comenzi, setComenzi, clienti, showToast }) {
  const [det,setDet]=useState(null);
  const move=(c,d)=>{ const i=ETAPE.indexOf(c.etapa); const nx=ETAPE[i+d]; if(nx){ setComenzi(p=>p.map(x=>x.id===c.id?{...x,etapa:nx}:x)); showToast(`${c.nr} → ${nx}`); }};
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PH title="Flux de Lucru" sub="Avansați comenzile între etapele de producție" />
      <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:12 }}>
        {ETAPE.map(etapa=>{
          const cols=comenzi.filter(c=>c.etapa===etapa);
          const clr=ETPA_CLR[etapa];
          return (
            <div key={etapa} className="kol" style={{ width:200 }}>
              <div style={{ padding:"10px 12px", borderBottom:"1px solid #1a2035", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:10, fontWeight:600, color:clr, letterSpacing:".6px" }}>{etapa.toUpperCase()}</div>
                <div style={{ background:clr+"22", color:clr, borderRadius:10, fontSize:11, padding:"1px 7px", fontWeight:700 }}>{cols.length}</div>
              </div>
              <div style={{ minHeight:60 }}>
                {cols.map(c=>{
                  const cl=clienti.find(x=>x.id===c.clientId)||{};
                  const exp=new Date(c.termen)<new Date()&&c.etapa!=="Facturat";
                  return (
                    <div key={c.id} className="kc" onClick={()=>setDet(c)} style={{ borderColor:c.prio==="urgent"?"rgba(239,68,68,.4)":exp?"rgba(248,113,113,.3)":undefined }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontSize:11, color:"#60a5fa", fontWeight:600 }}>{c.nr}</span>
                        {c.prio==="urgent"&&<span style={{ fontSize:10, color:"#f87171" }}>⚡</span>}
                      </div>
                      <div style={{ fontSize:12, color:"#94a3b8", marginBottom:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cl.name}</div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:10, color:exp?"#f87171":"#475569" }}>↯ {fmtD(c.termen)}</span>
                        <span style={{ fontSize:11, color:"#10b981", fontWeight:600 }}>{fmtE(cmdVal(c))}</span>
                      </div>
                      <div style={{ display:"flex", gap:4, marginTop:8 }}>
                        {ETAPE.indexOf(etapa)>0&&<button className="btn" onClick={e=>{e.stopPropagation();move(c,-1);}} style={{ flex:1, background:"#0a0d13", color:"#475569", padding:"4px 0", borderRadius:4, fontSize:10, justifyContent:"center", border:"1px solid #1a2035" }}>← Înapoi</button>}
                        {ETAPE.indexOf(etapa)<ETAPE.length-1&&<button className="btn" onClick={e=>{e.stopPropagation();move(c,1);}} style={{ flex:1, background:clr+"22", color:clr, padding:"4px 0", borderRadius:4, fontSize:10, justifyContent:"center", border:`1px solid ${clr}44` }}>Avansează →</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {det&&(
        <div className="mbg" onClick={e=>e.target===e.currentTarget&&setDet(null)}>
          <div className="mbox" style={{ padding:24, maxWidth:460 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:"#e2e8f0", fontFamily:"'IBM Plex Sans',sans-serif" }}>{det.nr}</div>
                <div style={{ fontSize:12, color:"#475569", marginTop:2 }}>{clienti.find(x=>x.id===det.clientId)?.name}</div>
              </div>
              <button className="btn" onClick={()=>setDet(null)} style={{ background:"none", color:"#475569", fontSize:18, padding:0 }}>✕</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              {[["Etapă",<EtapaTag etapa={det.etapa}/>],["Prioritate",det.prio],["Data",fmtD(det.data)],["Termen",fmtD(det.termen)],["Valoare",fmtE(cmdVal(det))],["Obs.",det.obs||"—"]].map(([k,v])=>(
                <div key={k} style={{ background:"#0a0d13", borderRadius:6, padding:"10px 12px", border:"1px solid #1a2035" }}>
                  <div style={{ fontSize:10, color:"#475569", marginBottom:4 }}>{k.toUpperCase()}</div>
                  <div style={{ fontSize:12, color:"#94a3b8" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:"#475569", marginBottom:8 }}>LINII</div>
            {det.linii.map((l,i)=>{ const p=PRODUSE_DEF.find(x=>x.id===l.prodId)||{};
              return <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 10px", background:"#0a0d13", borderRadius:5, marginBottom:5, fontSize:12, color:"#94a3b8" }}>
                <span>{p.name}</span><span>{l.qty} × {fmtE(l.pret)} = <b style={{ color:"#10b981" }}>{fmtE(l.qty*l.pret)}</b></span>
              </div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CLIENȚI ──────────────────────────────────────────────────────────────────
function TabClienti({ clienti, setClienti, comenzi, showToast }) {
  const [modal,setModal]=useState(null);
  const [q,setQ]=useState("");
  const list=clienti.filter(c=>!q||c.name.toLowerCase().includes(q.toLowerCase())||c.contact.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PH title="Clienți" sub={`${clienti.length} înregistrați`}>
        <button className="btn" onClick={()=>setModal({})} style={{ background:"#2563eb", color:"#fff", padding:"8px 16px", borderRadius:6, fontSize:12, fontWeight:600 }}>+ Client nou</button>
      </PH>
      <input className="inp" placeholder="Caută client…" value={q} onChange={e=>setQ(e.target.value)} style={{ maxWidth:300 }} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
        {list.map(c=>{
          const nrC=comenzi.filter(x=>x.clientId===c.id).length;
          const valC=comenzi.filter(x=>x.clientId===c.id).reduce((s,x)=>s+cmdVal(x),0);
          return (
            <div key={c.id} className="card" style={{ padding:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#e2e8f0", fontFamily:"'IBM Plex Sans',sans-serif" }}>{c.name}</div>
                  <div style={{ fontSize:12, color:"#475569", marginTop:2 }}>{TARI[c.tara]||""} {c.tara} · {c.cui}</div>
                </div>
                <div style={{ display:"flex", gap:5 }}>
                  <button className="btn" onClick={()=>setModal(c)} style={{ background:"#1a2035", color:"#94a3b8", padding:"5px 9px", borderRadius:5, fontSize:11 }}>✎</button>
                  <button className="btn" onClick={()=>{ if(confirm("Ștergi clientul?")){ setClienti(p=>p.filter(x=>x.id!==c.id)); showToast("Client șters"); }}} style={{ background:"rgba(239,68,68,.1)", color:"#f87171", padding:"5px 9px", borderRadius:5, fontSize:11 }}>✕</button>
                </div>
              </div>
              <div style={{ fontSize:12, color:"#64748b", display:"flex", flexDirection:"column", gap:5 }}>
                <div>👤 {c.contact}</div><div>✉ {c.email}</div><div>📞 {c.tel}</div>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:12, paddingTop:12, borderTop:"1px solid #1a2035" }}>
                <div style={{ flex:1, textAlign:"center" }}>
                  <div style={{ fontSize:16, fontWeight:700, color:"#3b82f6" }}>{nrC}</div>
                  <div style={{ fontSize:10, color:"#475569" }}>COMENZI</div>
                </div>
                <div style={{ flex:1, textAlign:"center" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#10b981" }}>{fmtE(valC)}</div>
                  <div style={{ fontSize:10, color:"#475569" }}>VALOARE TOTALĂ</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {modal!==null&&<ModalCl cl={Object.keys(modal).length===0?null:modal}
        onSave={cl=>{ if(!cl.id){ setClienti(p=>[...p,{...cl,id:uid()}]); showToast("Client adăugat ✓"); } else { setClienti(p=>p.map(x=>x.id===cl.id?cl:x)); showToast("Client actualizat ✓"); } setModal(null); }}
        onClose={()=>setModal(null)} />}
    </div>
  );
}

function ModalCl({ cl, onSave, onClose }) {
  const [f,setF]=useState(cl||{ name:"", tara:"RO", contact:"", email:"", tel:"", cui:"" });
  const s=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  return (
    <div className="mbg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mbox" style={{ padding:24, maxWidth:480 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#e2e8f0", fontFamily:"'IBM Plex Sans',sans-serif" }}>{cl?"Editare client":"Client nou"}</div>
          <button className="btn" onClick={onClose} style={{ background:"none", color:"#475569", fontSize:18, padding:0 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[["name","Denumire firmă",true],["cui","CUI / VAT Nr.",false],["tara","Țara",false],["contact","Persoană contact",false],["email","Email",false],["tel","Telefon",false]].map(([k,lbl,full])=>(
            <div key={k} style={{ gridColumn:full?"1 / -1":undefined }}>
              <Lbl>{lbl}</Lbl>
              {k==="tara"
                ? <select className="inp" value={f[k]} onChange={s(k)}>{Object.entries(TARI).map(([code,flag])=><option key={code} value={code}>{flag} {code}</option>)}</select>
                : <input className="inp" value={f[k]} onChange={s(k)} placeholder={lbl} />}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button className="btn" onClick={onClose} style={{ background:"#1a2035", color:"#64748b", padding:"9px 18px", borderRadius:6, fontSize:12 }}>Anulează</button>
          <button className="btn" onClick={()=>onSave(f)} style={{ background:"#2563eb", color:"#fff", padding:"9px 20px", borderRadius:6, fontSize:12, fontWeight:600 }}>Salvează</button>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUSE ──────────────────────────────────────────────────────────────────
function TabProduse({ produse, setProduse, showToast }) {
  const [modal,setModal]=useState(null);
  const [q,setQ]=useState("");
  const cats=[...new Set(produse.map(p=>p.cat))];
  const list=produse.filter(p=>!q||p.name.toLowerCase().includes(q.toLowerCase())||p.cod.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PH title="Produse & Servicii" sub={`${produse.length} înregistrate`}>
        <button className="btn" onClick={()=>setModal({})} style={{ background:"#2563eb", color:"#fff", padding:"8px 16px", borderRadius:6, fontSize:12, fontWeight:600 }}>+ Produs nou</button>
      </PH>
      <input className="inp" placeholder="Caută cod / denumire…" value={q} onChange={e=>setQ(e.target.value)} style={{ maxWidth:300 }} />
      {cats.map(cat=>{
        const items=list.filter(p=>p.cat===cat); if(!items.length) return null;
        return (
          <div key={cat}>
            <div style={{ fontSize:11, color:"#475569", letterSpacing:".7px", marginBottom:8, fontWeight:600 }}>{cat.toUpperCase()}</div>
            <div className="card" style={{ overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead><tr style={{ borderBottom:"1px solid #1a2035" }}>{["Cod","Denumire","U.M.","Preț (€)",""].map(h=><th key={h} style={{ padding:"9px 14px", textAlign:"left", fontSize:10, color:"#475569", letterSpacing:".6px" }}>{h.toUpperCase()}</th>)}</tr></thead>
                <tbody>
                  {items.map(p=>(
                    <tr key={p.id} className="tr" style={{ borderBottom:"1px solid #0f1117" }}>
                      <td style={{ padding:"9px 14px", color:"#60a5fa", fontWeight:600 }}>{p.cod}</td>
                      <td style={{ padding:"9px 14px", color:"#94a3b8" }}>{p.name}</td>
                      <td style={{ padding:"9px 14px", color:"#64748b" }}>{p.um}</td>
                      <td style={{ padding:"9px 14px", color:"#10b981", fontWeight:600 }}>{fmtE(p.pret)}</td>
                      <td style={{ padding:"9px 14px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="btn" onClick={()=>setModal(p)} style={{ background:"#1a2035", color:"#94a3b8", padding:"4px 10px", borderRadius:5, fontSize:11 }}>✎</button>
                          <button className="btn" onClick={()=>{ if(confirm("Ștergi?")){ setProduse(pr=>pr.filter(x=>x.id!==p.id)); showToast("Produs șters"); }}} style={{ background:"rgba(239,68,68,.1)", color:"#f87171", padding:"4px 10px", borderRadius:5, fontSize:11 }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {modal!==null&&<ModalProd prod={Object.keys(modal).length===0?null:modal} cats={cats}
        onSave={p=>{ if(!p.id){ setProduse(pr=>[...pr,{...p,id:uid()}]); showToast("Produs adăugat ✓"); } else { setProduse(pr=>pr.map(x=>x.id===p.id?p:x)); showToast("Produs actualizat ✓"); } setModal(null); }}
        onClose={()=>setModal(null)} />}
    </div>
  );
}

function ModalProd({ prod, cats, onSave, onClose }) {
  const [f,setF]=useState(prod||{ cod:"", name:"", um:"buc", pret:0, cat:cats[0]||"General" });
  const s=k=>e=>setF(p=>({...p,[k]:k==="pret"?Number(e.target.value):e.target.value}));
  return (
    <div className="mbg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mbox" style={{ padding:24, maxWidth:440 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#e2e8f0", fontFamily:"'IBM Plex Sans',sans-serif" }}>{prod?"Editare produs":"Produs / serviciu nou"}</div>
          <button className="btn" onClick={onClose} style={{ background:"none", color:"#475569", fontSize:18, padding:0 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[["cod","Cod (ex: FRZ-003)",false],["name","Denumire",true],["cat","Categorie",true],["um","U.M.",false],["pret","Preț (€)",false]].map(([k,lbl,full])=>(
            <div key={k} style={{ gridColumn:full?"1 / -1":undefined }}>
              <Lbl>{lbl}</Lbl>
              {k==="cat"
                ?<><input className="inp" value={f[k]} onChange={s(k)} list="cats"/><datalist id="cats">{cats.map(c=><option key={c} value={c}/>)}</datalist></>
                :<input className="inp" type={k==="pret"?"number":"text"} value={f[k]} onChange={s(k)} placeholder={lbl} min={0} />}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button className="btn" onClick={onClose} style={{ background:"#1a2035", color:"#64748b", padding:"9px 18px", borderRadius:6, fontSize:12 }}>Anulează</button>
          <button className="btn" onClick={()=>onSave(f)} style={{ background:"#2563eb", color:"#fff", padding:"9px 20px", borderRadius:6, fontSize:12, fontWeight:600 }}>Salvează</button>
        </div>
      </div>
    </div>
  );
}

// ─── FACTURI ──────────────────────────────────────────────────────────────────
function TabFacturi({ facturi, setFacturi, clienti, comenzi, showToast, generatePDF, produse }) {
  const [modal,setModal]=useState(null);
  const total   = facturi.reduce((s,f)=>s+f.val,0);
  const platite = facturi.filter(f=>f.platita).reduce((s,f)=>s+f.val,0);
  const neplt   = facturi.filter(f=>!f.platita).reduce((s,f)=>s+f.val,0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PH title="Facturi" sub={`${facturi.length} emise`}>
        <button className="btn" onClick={()=>setModal({})} style={{ background:"#2563eb", color:"#fff", padding:"8px 16px", borderRadius:6, fontSize:12, fontWeight:600 }}>+ Factură nouă</button>
      </PH>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[["Total emis",total,"#3b82f6"],["Încasat",platite,"#10b981"],["Restant",neplt,neplt>0?"#f97316":"#475569"]].map(([l,v,c])=>(
          <div key={l} className="card" style={{ padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:11, color:"#475569", letterSpacing:".5px" }}>{l.toUpperCase()}</div>
            <div style={{ fontSize:18, fontWeight:700, color:c, fontFamily:"'IBM Plex Sans',sans-serif" }}>{fmtE(v)}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ borderBottom:"1px solid #1a2035" }}>
            {["Nr. Factură","Client","Data","Scadentă","Valoare","Status",""].map(h=><th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, color:"#475569", letterSpacing:".6px" }}>{h.toUpperCase()}</th>)}
          </tr></thead>
          <tbody>
            {facturi.length===0&&<tr><td colSpan={7} style={{ padding:30, textAlign:"center", color:"#334155" }}>Nicio factură</td></tr>}
            {facturi.map(f=>{
              const cl=clienti.find(x=>x.id===f.clientId)||{};
              const exp=!f.platita&&new Date(f.scad)<new Date();
              return (
                <tr key={f.id} className="tr" style={{ borderBottom:"1px solid #0f1117" }}>
                  <td style={{ padding:"10px 14px", color:"#60a5fa", fontWeight:600 }}>{f.nr}</td>
                  <td style={{ padding:"10px 14px", color:"#94a3b8" }}>{cl.name||"—"}</td>
                  <td style={{ padding:"10px 14px", color:"#64748b" }}>{fmtD(f.data)}</td>
                  <td style={{ padding:"10px 14px" }}><span style={{ color:exp?"#f87171":"#64748b" }}>{fmtD(f.scad)}{exp?" ⚠":""}</span></td>
                  <td style={{ padding:"10px 14px", color:"#e2e8f0", fontWeight:600 }}>{fmtE(f.val)}</td>
                  <td style={{ padding:"10px 14px" }}>
                    {f.platita
                      ?<span className="tag" style={{ background:"rgba(16,185,129,.12)", color:"#34d399", border:"1px solid rgba(16,185,129,.25)" }}>✓ Plătită</span>
                      :<span className="tag" style={{ background:exp?"rgba(239,68,68,.1)":"rgba(249,115,22,.1)", color:exp?"#f87171":"#fb923c", border:`1px solid ${exp?"rgba(239,68,68,.25)":"rgba(249,115,22,.25)"}` }}>{exp?"⚠ Restantă":"⏳ Neplatită"}</span>}
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="btn" onClick={()=>generatePDF("factura",f,clienti,produse)} title="Export PDF Factură" style={{ background:"rgba(59,130,246,.1)", color:"#60a5fa", padding:"5px 9px", borderRadius:5, fontSize:11, border:"1px solid rgba(59,130,246,.2)" }}>📄 PDF</button>
                      {!f.platita&&<button className="btn" onClick={()=>{ setFacturi(p=>p.map(x=>x.id===f.id?{...x,platita:true}:x)); showToast("Factură marcată plătită ✓"); }} style={{ background:"rgba(16,185,129,.1)", color:"#34d399", padding:"5px 9px", borderRadius:5, fontSize:11, border:"1px solid rgba(16,185,129,.2)" }}>✓ Plătită</button>}
                      <button className="btn" onClick={()=>{ if(confirm("Ștergi factura?")){ setFacturi(p=>p.filter(x=>x.id!==f.id)); showToast("Factură ștearsă"); }}} style={{ background:"rgba(239,68,68,.1)", color:"#f87171", padding:"5px 9px", borderRadius:5, fontSize:11 }}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal!==null&&<ModalFact fact={Object.keys(modal).length===0?null:modal} clienti={clienti} comenzi={comenzi}
        onSave={f=>{ if(!f.id){ setFacturi(p=>[...p,{...f,id:uid(),nr:`BPT-${new Date().getFullYear()}-${String(p.length+1).padStart(3,"0")}`}]); showToast("Factură emisă ✓"); } else { setFacturi(p=>p.map(x=>x.id===f.id?f:x)); showToast("Factură actualizată ✓"); } setModal(null); }}
        onClose={()=>setModal(null)} />}
    </div>
  );
}

function ModalFact({ fact, clienti, comenzi, onSave, onClose }) {
  const [f,setF]=useState(fact||{ clientId:clienti[0]?.id||1, cmdId:null, data:new Date().toISOString().slice(0,10), scad:"", val:0, platita:false, obs:"" });
  const s=k=>e=>setF(p=>({...p,[k]:k==="val"?Number(e.target.value):k==="clientId"||k==="cmdId"?Number(e.target.value)||null:e.target.value}));
  const cC=comenzi.filter(c=>c.clientId===f.clientId);
  return (
    <div className="mbg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mbox" style={{ padding:24, maxWidth:460 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#e2e8f0", fontFamily:"'IBM Plex Sans',sans-serif" }}>{fact?"Editare factură":"Factură nouă"}</div>
          <button className="btn" onClick={onClose} style={{ background:"none", color:"#475569", fontSize:18, padding:0 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div style={{ gridColumn:"1 / -1" }}><Lbl>Client</Lbl><select className="inp" value={f.clientId} onChange={s("clientId")}>{clienti.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div style={{ gridColumn:"1 / -1" }}><Lbl>Comandă asociată (opțional)</Lbl><select className="inp" value={f.cmdId||""} onChange={s("cmdId")}><option value="">— Fără comandă —</option>{cC.map(c=><option key={c.id} value={c.id}>{c.nr} · {fmtE(cmdVal(c))}</option>)}</select></div>
          <div><Lbl>Data emitere</Lbl><input className="inp" type="date" value={f.data} onChange={s("data")} /></div>
          <div><Lbl>Scadentă</Lbl><input className="inp" type="date" value={f.scad} onChange={s("scad")} /></div>
          <div><Lbl>Valoare (€, fără TVA)</Lbl><input className="inp" type="number" min={0} value={f.val} onChange={s("val")} /></div>
          <div style={{ display:"flex", alignItems:"flex-end", paddingBottom:2 }}>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:12, color:"#64748b" }}>
              <input type="checkbox" checked={f.platita} onChange={e=>setF(p=>({...p,platita:e.target.checked}))} />Marcată ca plătită
            </label>
          </div>
          <div style={{ gridColumn:"1 / -1" }}><Lbl>Descriere servicii</Lbl><input className="inp" value={f.obs||""} onChange={s("obs")} placeholder="Ex: Prelucrare CNC conform comandă CMD-2025-001" /></div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button className="btn" onClick={onClose} style={{ background:"#1a2035", color:"#64748b", padding:"9px 18px", borderRadius:6, fontSize:12 }}>Anulează</button>
          <button className="btn" onClick={()=>onSave(f)} style={{ background:"#2563eb", color:"#fff", padding:"9px 20px", borderRadius:6, fontSize:12, fontWeight:600 }}>Salvează</button>
        </div>
      </div>
    </div>
  );
}

// ─── MICRO COMPONENTE ─────────────────────────────────────────────────────────
function EtapaTag({ etapa }) {
  const c=ETPA_CLR[etapa]||"#475569";
  return <span className="tag" style={{ background:c+"18", color:c, border:`1px solid ${c}35` }}>{etapa}</span>;
}
function Lbl({ children, style }) {
  return <div style={{ fontSize:11, color:"#475569", marginBottom:5, letterSpacing:".4px", ...style }}>{children}</div>;
}
function PH({ title, sub, children }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
      <div>
        <div style={{ fontSize:18, fontWeight:700, color:"#e2e8f0", fontFamily:"'IBM Plex Sans',sans-serif" }}>{title}</div>
        {sub&&<div style={{ fontSize:12, color:"#475569", marginTop:2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}
