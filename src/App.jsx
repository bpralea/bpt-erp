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
const FIRMA    = { name:"BPT-Moulds Manufacturing SRL", sediu:"Dumbrava Roșie nr. 58, parter camera 2, Iași", lucru:"Calea Chișinăului nr. 132, Clădirea C10, Iași", cui:"RO41359487", reg:"J20/19002365226", iban:"RO29RZBR0000060028036557", banca:"Raiffeisen Bank", swift:"RZBRROBU", tel:"+40 755 925 964", email:"office@bpt-manufacturing.ro", web:"www.bpt-manufacturing.ro" };

// ─── CONFIG OFERTARE BPT ──────────────────────────────────────────────────────
const TARIFE_DEF = {
  frezare3:     45,   // €/h frezare CNC 3-axe
  strungCNC:    45,   // €/h strung CNC ax Y
  strungConv:   30,   // €/h strung convențional
  marja:        30,   // % marjă profit
  setupFrezare: 25,   // € fix programare + prindere
  setupStrung:  15,   // € fix prindere strung
};

const MATERIALE_DEF = [
  { id: 1, name: "Aluminiu 6061",     pret: 6.5,  um: "€/kg", densitate: 2.70, mrr: 1.0 },
  { id: 2, name: "Aluminiu 7075",     pret: 11.0, um: "€/kg", densitate: 2.81, mrr: 0.85 },
  { id: 3, name: "Oțel S235 / OL37",  pret: 1.8,  um: "€/kg", densitate: 7.85, mrr: 0.45 },
  { id: 4, name: "Oțel C45 / OLC45",  pret: 2.5,  um: "€/kg", densitate: 7.85, mrr: 0.40 },
  { id: 5, name: "Oțel aliat 42CrMo4",pret: 3.8,  um: "€/kg", densitate: 7.85, mrr: 0.30 },
  { id: 6, name: "Inox 304",          pret: 5.5,  um: "€/kg", densitate: 8.00, mrr: 0.25 },
  { id: 7, name: "Inox 316L",         pret: 7.2,  um: "€/kg", densitate: 8.00, mrr: 0.22 },
  { id: 8, name: "POM (Delrin)",      pret: 8.0,  um: "€/kg", densitate: 1.41, mrr: 1.4 },
  { id: 9, name: "PA6 (Nylon)",       pret: 6.5,  um: "€/kg", densitate: 1.14, mrr: 1.5 },
  { id:10, name: "PEEK",              pret: 95.0, um: "€/kg", densitate: 1.32, mrr: 1.2 },
];

// mrr = factor relativ rată îndepărtare material (1.0 = aluminiu de referință)

// ─── CATEGORII PIESE BPT cu coeficienți de estimare ───────────────────────────
// timpBaza = min/cm³ material îndepărtat | setup = min fix per piesă
const CATEGORII_DEF = [
  { id: 1, name: "Strunjit simplu (axe, bucșe, șuruburi)",     icon: "⟳",  tip: "strung",      timpBaza: 0.4, setup: 12, complexitate: 1.0, descriere: "Piese cilindrice simple cu operații de bază" },
  { id: 2, name: "Strunjit complex (cu operații ax Y)",        icon: "⊚",  tip: "strungCNC",   timpBaza: 0.9, setup: 25, complexitate: 1.4, descriere: "Piese cu frezări laterale, găuriri pe ax Y" },
  { id: 3, name: "Plăci frezate plane (găuriri/filetări)",     icon: "▭",  tip: "frezare",     timpBaza: 0.5, setup: 18, complexitate: 1.0, descriere: "Plăci cu operații pe o față, găuriri, filetări" },
  { id: 4, name: "Carcase frezate 3D (buzunare, contururi)",   icon: "◧",  tip: "frezare",     timpBaza: 1.2, setup: 35, complexitate: 1.5, descriere: "Piese complexe cu buzunare, contururi, prelucrate pe mai multe fețe" },
  { id: 5, name: "Dispozitive prindere / fixturi",             icon: "▤",  tip: "frezare",     timpBaza: 1.5, setup: 45, complexitate: 1.7, descriere: "Dispozitive personalizate cu tolerațe strânse" },
  { id: 6, name: "Piese combinate (strung + frezare)",         icon: "⊞",  tip: "combo",       timpBaza: 1.4, setup: 50, complexitate: 1.6, descriere: "Piese ce necesită ambele operații" },
];
const COMPLEXITATI = [
  { id: "simplu",  label: "Simplu",  mult: 0.85, color: "#10b981" },
  { id: "mediu",   label: "Mediu",   mult: 1.00, color: "#3b82f6" },
  { id: "complex", label: "Complex", mult: 1.40, color: "#f59e0b" },
  { id: "expert",  label: "Expert",  mult: 1.85, color: "#ef4444" },
];

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
          Sediu: ${FIRMA.sediu}<br>
          Punct de lucru: ${FIRMA.lucru}<br>
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
        <div class="det">CUI: ${FIRMA.cui}<br>IBAN: ${FIRMA.iban}<br>Banca: ${FIRMA.banca} | SWIFT: ${FIRMA.swift}</div>
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
      💳 Plata se efectuează în contul: <strong>${FIRMA.iban}</strong><br>
      Banca: ${FIRMA.banca} | SWIFT: ${FIRMA.swift}<br>
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
  const [tab,        setTab]        = useState("dashboard");
  const [clienti,    setClienti]    = usePersist("bpt_clienti",    CLIENTI_DEF);
  const [produse,    setProduse]    = usePersist("bpt_produse",    PRODUSE_DEF);
  const [comenzi,    setComenzi]    = usePersist("bpt_comenzi",    COMENZI_DEF);
  const [facturi,    setFacturi]    = usePersist("bpt_facturi",    FACTURI_DEF);
  const [oferte,     setOferte]     = usePersist("bpt_oferte",     []);
  const [tarife,     setTarife]     = usePersist("bpt_tarife",     TARIFE_DEF);
  const [materiale,  setMateriale]  = usePersist("bpt_materiale",  MATERIALE_DEF);
  const [categorii,  setCategorii]  = usePersist("bpt_categorii",  CATEGORII_DEF);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type="ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };

  const ctx = { clienti, setClienti, produse, setProduse, comenzi, setComenzi, facturi, setFacturi, oferte, setOferte, tarife, setTarife, materiale, setMateriale, categorii, setCategorii, showToast, generatePDF };
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
    { id:"ofertare",  icon:"€", label:"Ofertare"     },
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
          {tab==="ofertare"  && <TabOfertare  {...ctx} setTab={setTab} />}
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

// ─── OFERTARE — calculator automat ────────────────────────────────────────────
// Formula estimare timp:
//   volum_mm³ = L × l × h
//   masa_kg = volum_cm³ × densitate / 1000
//   timp_min = (volum_cm³ × cat.timpBaza × cat.complexitate × complexitate.mult) / material.mrr + cat.setup
//   cost_manopera = (timp_min/60) × tarif_orar(cat.tip)
//   cost_material = masa × pret_material × 1.4 (factor risipă)
//   pret_baza = cost_manopera + cost_material
//   pret_final = pret_baza × (1 + marja/100)  → per buc
function calcEstimare({ L, l, h, qty, catId, matId, complexId, categorii, materiale, tarife }) {
  const cat = categorii.find(c => c.id === catId); if (!cat) return null;
  const mat = materiale.find(m => m.id === matId); if (!mat) return null;
  const cpl = COMPLEXITATI.find(c => c.id === complexId) || COMPLEXITATI[1];

  const Ln = Number(L)||0, ln = Number(l)||0, hn = Number(h)||0, qtyn = Math.max(1, Number(qty)||1);
  const volMM3 = Ln * ln * hn;
  const volCM3 = volMM3 / 1000;
  const masaKg = volCM3 * mat.densitate / 1000;

  const timpMin    = volCM3 > 0 ? (volCM3 * cat.timpBaza * cat.complexitate * cpl.mult / mat.mrr) + cat.setup : cat.setup;
  const tarif      = cat.tip === "strung" ? tarife.strungConv : cat.tip === "strungCNC" || cat.tip === "combo" ? tarife.strungCNC : tarife.frezare3;
  const costMano   = (timpMin / 60) * tarif;
  const costMat    = masaKg * mat.pret * 1.4; // 40% risipă material
  const pretBaza   = costMano + costMat;
  const pretBuc    = pretBaza * (1 + tarife.marja / 100);
  const pretTotal  = pretBuc * qtyn;

  return { volCM3, masaKg, timpMin, tarif, costMano, costMat, pretBaza, pretBuc, pretTotal, qtyn };
}

function TabOfertare({ oferte, setOferte, clienti, materiale, setMateriale, categorii, tarife, setTarife, setComenzi, comenzi, showToast, setTab }) {
  const [view, setView] = useState("lista"); // lista | nou | tarife
  const [editOferta, setEditOferta] = useState(null);

  if (view === "tarife") return <SubTarife tarife={tarife} setTarife={setTarife} materiale={materiale} setMateriale={setMateriale} onBack={()=>setView("lista")} showToast={showToast} />;
  if (view === "nou" || editOferta) return <SubOfertaNou oferta={editOferta} clienti={clienti} materiale={materiale} categorii={categorii} tarife={tarife}
    onSave={(o) => {
      if (o.id) { setOferte(p => p.map(x => x.id === o.id ? o : x)); showToast("Ofertă actualizată ✓"); }
      else { setOferte(p => [...p, { ...o, id: uid(), nr: `OF-${new Date().getFullYear()}-${String(p.length+1).padStart(3,"0")}`, data: new Date().toISOString().slice(0,10), status: "draft" }]); showToast("Ofertă salvată ✓"); }
      setView("lista"); setEditOferta(null);
    }}
    onClose={() => { setView("lista"); setEditOferta(null); }}
  />;

  // LISTA OFERTE
  const stats = {
    total: oferte.length,
    draft: oferte.filter(o => o.status === "draft").length,
    trimise: oferte.filter(o => o.status === "trimisa").length,
    acceptate: oferte.filter(o => o.status === "acceptata").length,
    valoare: oferte.reduce((s,o) => s + (o.pretTotal||0), 0),
  };

  const convertToComanda = (o) => {
    if (!confirm(`Convertești oferta ${o.nr} în comandă fermă?`)) return;
    const cl = clienti.find(c => c.id === o.clientId);
    setComenzi(p => [...p, {
      id: uid(),
      nr: `CMD-${new Date().getFullYear()}-${String(p.length+1).padStart(3,"0")}`,
      clientId: o.clientId,
      data: new Date().toISOString().slice(0,10),
      termen: "",
      etapa: "Comandă",
      prio: "normal",
      linii: [{ prodId: 1, qty: o.qty, pret: o.pretBuc }],
      obs: `Din oferta ${o.nr} · ${o.numePiesa || "piesă"} · ${o.material}`,
    }]);
    setOferte(p => p.map(x => x.id === o.id ? { ...x, status: "acceptata" } : x));
    showToast(`Comandă creată din ${o.nr} ✓`);
    setTab("comenzi");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PH title="Ofertare" sub="Calculator automat de preț pentru piese custom">
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn" onClick={()=>setView("tarife")} style={{ background:"#1a2035", color:"#94a3b8", padding:"8px 14px", borderRadius:6, fontSize:12 }}>⚙ Tarife & Materiale</button>
          <button className="btn" onClick={()=>setView("nou")} style={{ background:"#2563eb", color:"#fff", padding:"8px 16px", borderRadius:6, fontSize:12, fontWeight:600 }}>+ Ofertă nouă</button>
        </div>
      </PH>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
        {[
          { l:"Total oferte",   v:stats.total,        c:"#3b82f6" },
          { l:"Draft",          v:stats.draft,        c:"#64748b" },
          { l:"Trimise",        v:stats.trimise,      c:"#f59e0b" },
          { l:"Acceptate",      v:stats.acceptate,    c:"#10b981" },
          { l:"Valoare totală", v:fmtE(stats.valoare),c:"#8b5cf6" },
        ].map(k=>(
          <div key={k.l} className="card" style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:10, color:"#475569", letterSpacing:".5px", marginBottom:6 }}>{k.l.toUpperCase()}</div>
            <div style={{ fontSize:18, fontWeight:700, color:k.c, fontFamily:"'IBM Plex Sans',sans-serif" }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ borderBottom:"1px solid #1a2035" }}>
            {["Nr. Ofertă","Client","Piesă","Material","Buc.","Preț/buc","Total","Status",""].map(h=>
              <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, color:"#475569", letterSpacing:".6px", fontWeight:600 }}>{h.toUpperCase()}</th>
            )}
          </tr></thead>
          <tbody>
            {oferte.length===0 && <tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:"#334155", fontSize:12 }}>Nicio ofertă încă. Click <b style={{ color:"#60a5fa" }}>+ Ofertă nouă</b> ca să generezi prima estimare automată.</td></tr>}
            {oferte.map(o => {
              const cl = clienti.find(x=>x.id===o.clientId)||{};
              const statusColor = { draft:"#64748b", trimisa:"#f59e0b", acceptata:"#10b981", refuzata:"#ef4444" }[o.status]||"#64748b";
              return (
                <tr key={o.id} className="tr" style={{ borderBottom:"1px solid #0f1117" }}>
                  <td style={{ padding:"10px 14px", color:"#60a5fa", fontWeight:600 }}>{o.nr}</td>
                  <td style={{ padding:"10px 14px", color:"#94a3b8" }}>{cl.name||"—"}</td>
                  <td style={{ padding:"10px 14px", color:"#94a3b8" }}>{o.numePiesa||"piesă custom"}</td>
                  <td style={{ padding:"10px 14px", color:"#64748b", fontSize:11 }}>{o.material||"—"}</td>
                  <td style={{ padding:"10px 14px", color:"#94a3b8" }}>{o.qty}</td>
                  <td style={{ padding:"10px 14px", color:"#94a3b8" }}>{fmtE(o.pretBuc||0)}</td>
                  <td style={{ padding:"10px 14px", color:"#10b981", fontWeight:600 }}>{fmtE(o.pretTotal||0)}</td>
                  <td style={{ padding:"10px 14px" }}>
                    <span className="tag" style={{ background:statusColor+"18", color:statusColor, border:`1px solid ${statusColor}35` }}>{(o.status||"draft").toUpperCase()}</span>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="btn" onClick={()=>setEditOferta(o)} style={{ background:"#1a2035", color:"#94a3b8", padding:"5px 9px", borderRadius:5, fontSize:11 }}>✎</button>
                      {o.status!=="acceptata" && <button className="btn" onClick={()=>convertToComanda(o)} title="Convertește în comandă" style={{ background:"rgba(16,185,129,.1)", color:"#34d399", padding:"5px 9px", borderRadius:5, fontSize:11, border:"1px solid rgba(16,185,129,.2)" }}>→ CMD</button>}
                      <button className="btn" onClick={()=>{ if(confirm("Ștergi oferta?")){ setOferte(p=>p.filter(x=>x.id!==o.id)); showToast("Ofertă ștearsă"); }}} style={{ background:"rgba(239,68,68,.1)", color:"#f87171", padding:"5px 9px", borderRadius:5, fontSize:11 }}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SUB: Formular Ofertă Nouă cu calcul în timp real ────────────────────────
function SubOfertaNou({ oferta, clienti, materiale, categorii, tarife, onSave, onClose }) {
  const [f, setF] = useState(oferta || {
    clientId: clienti[0]?.id || 1,
    numePiesa: "",
    catId: categorii[0]?.id || 1,
    matId: materiale[0]?.id || 1,
    complexId: "mediu",
    L: 100, l: 50, h: 25,
    qty: 1,
    obs: "",
    overridePret: null,
  });
  const s = (k,v) => setF(p => ({ ...p, [k]: v }));

  const est = calcEstimare({ L:f.L, l:f.l, h:f.h, qty:f.qty, catId:f.catId, matId:f.matId, complexId:f.complexId, categorii, materiale, tarife });
  const cat = categorii.find(c => c.id === f.catId);
  const mat = materiale.find(m => m.id === f.matId);
  const cpl = COMPLEXITATI.find(c => c.id === f.complexId);

  const pretFinal = f.overridePret != null ? f.overridePret : (est?.pretBuc || 0);
  const totalFinal = pretFinal * (f.qty || 1);

  const save = () => {
    const o = {
      ...f,
      pretBuc: pretFinal,
      pretTotal: totalFinal,
      material: mat?.name,
      categorie: cat?.name,
      timpMin: est?.timpMin,
      masaKg: est?.masaKg,
    };
    onSave(o);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PH title={oferta ? `Editare ${oferta.nr}` : "Ofertă nouă"} sub="Calculatorul estimează automat preț pe baza dimensiunilor și materialului">
        <button className="btn" onClick={onClose} style={{ background:"#1a2035", color:"#94a3b8", padding:"8px 14px", borderRadius:6, fontSize:12 }}>← Înapoi</button>
      </PH>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:18 }}>
        {/* STÂNGA — input */}
        <div className="card" style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ fontSize:11, color:"#64748b", letterSpacing:".5px", fontWeight:600, marginBottom:-6 }}>1. INFORMAȚII GENERALE</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><Lbl>Client</Lbl><select className="inp" value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clienti.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><Lbl>Cantitate (buc.)</Lbl><input className="inp" type="number" min={1} value={f.qty} onChange={e=>s("qty",Number(e.target.value)||1)} /></div>
            <div style={{ gridColumn:"1 / -1" }}><Lbl>Denumire piesă</Lbl><input className="inp" value={f.numePiesa} onChange={e=>s("numePiesa",e.target.value)} placeholder="ex: Flanșă oțel Ø80×15" /></div>
          </div>

          <div style={{ fontSize:11, color:"#64748b", letterSpacing:".5px", fontWeight:600, marginTop:8, marginBottom:-6 }}>2. CATEGORIE PIESĂ</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {categorii.map(c => (
              <div key={c.id} onClick={()=>s("catId",c.id)} style={{ cursor:"pointer", padding:"10px 12px", background: f.catId===c.id ? "rgba(59,130,246,.12)" : "#0a0d13", border: `1px solid ${f.catId===c.id ? "#3b82f6" : "#1a2035"}`, borderRadius:6, transition:"all .15s" }}>
                <div style={{ fontSize:13, fontWeight:600, color: f.catId===c.id ? "#60a5fa" : "#94a3b8", display:"flex", alignItems:"center", gap:6 }}><span style={{ fontSize:16 }}>{c.icon}</span>{c.name}</div>
                <div style={{ fontSize:10, color:"#475569", marginTop:3 }}>{c.descriere}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize:11, color:"#64748b", letterSpacing:".5px", fontWeight:600, marginTop:8, marginBottom:-6 }}>3. DIMENSIUNI BRUT (mm)</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <div><Lbl>Lungime (L)</Lbl><input className="inp" type="number" min={1} value={f.L} onChange={e=>s("L",Number(e.target.value)||0)} /></div>
            <div><Lbl>Lățime / Ø</Lbl><input className="inp" type="number" min={1} value={f.l} onChange={e=>s("l",Number(e.target.value)||0)} /></div>
            <div><Lbl>Înălțime / lungime ax</Lbl><input className="inp" type="number" min={1} value={f.h} onChange={e=>s("h",Number(e.target.value)||0)} /></div>
          </div>

          <div style={{ fontSize:11, color:"#64748b", letterSpacing:".5px", fontWeight:600, marginTop:8, marginBottom:-6 }}>4. MATERIAL & COMPLEXITATE</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><Lbl>Material</Lbl><select className="inp" value={f.matId} onChange={e=>s("matId",Number(e.target.value))}>{materiale.map(m=><option key={m.id} value={m.id}>{m.name} ({m.pret}€/kg)</option>)}</select></div>
            <div><Lbl>Complexitate execuție</Lbl>
              <div style={{ display:"flex", gap:5 }}>
                {COMPLEXITATI.map(c=>(
                  <button key={c.id} className="btn" onClick={()=>s("complexId",c.id)} style={{ flex:1, padding:"7px 0", borderRadius:5, fontSize:11, justifyContent:"center", background: f.complexId===c.id ? c.color+"22" : "#0a0d13", color: f.complexId===c.id ? c.color : "#475569", border:`1px solid ${f.complexId===c.id ? c.color+"66" : "#1a2035"}`, fontWeight:600 }}>{c.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div><Lbl>Observații / specificații (toleranțe, finisaj, etc.)</Lbl>
            <textarea className="inp" rows={3} value={f.obs} onChange={e=>s("obs",e.target.value)} placeholder="ex: Toleranțe ISO h7, finisaj Ra 1.6, găuriri filetate M8..." style={{ resize:"vertical", fontFamily:"inherit" }} />
          </div>
        </div>

        {/* DREAPTA — calcul în timp real */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div className="card" style={{ padding:18, background:"linear-gradient(180deg,#0f1117,#0c1622)", border:"1px solid #1d4ed8" }}>
            <div style={{ fontSize:11, color:"#60a5fa", letterSpacing:".7px", fontWeight:700, marginBottom:14 }}>📊 ESTIMARE AUTOMATĂ</div>
            {est && est.volCM3 > 0 ? <>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                <Row label="Volum piesă"     val={`${est.volCM3.toFixed(1)} cm³`} />
                <Row label="Masă material"   val={`${est.masaKg.toFixed(3)} kg`} />
                <Row label="Timp estimat"    val={`${Math.round(est.timpMin)} min · ${(est.timpMin/60).toFixed(2)} h`} highlight />
                <Row label="Tarif aplicat"   val={`${est.tarif} €/h (${cat?.name.split(" ")[0]})`} />
                <Row label="Complexitate"    val={`×${cpl?.mult.toFixed(2)} (${cpl?.label})`} />
              </div>
              <div style={{ height:1, background:"#1a2035", margin:"10px -18px 14px" }} />
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                <Row label="Cost manoperă"      val={fmtE(est.costMano)} />
                <Row label="Cost material (+40% risipă)" val={fmtE(est.costMat)} />
                <Row label={`Marjă profit ${tarife.marja}%`} val={fmtE(est.pretBaza * tarife.marja/100)} />
              </div>
              <div style={{ height:1, background:"#1a2035", margin:"12px -18px" }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:"#94a3b8" }}>PREȚ ESTIMAT / BUC:</span>
                <span style={{ fontSize:20, fontWeight:700, color:"#10b981", fontFamily:"'IBM Plex Sans',sans-serif" }}>{fmtE(est.pretBuc)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
                <span style={{ fontSize:11, color:"#64748b" }}>Total {f.qty} buc:</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#3b82f6" }}>{fmtE(est.pretTotal)}</span>
              </div>
            </> : <div style={{ fontSize:12, color:"#64748b", textAlign:"center", padding:"20px 0" }}>Introduceți dimensiuni pentru estimare</div>}
          </div>

          {/* OVERRIDE PRET */}
          <div className="card" style={{ padding:16 }}>
            <Lbl>Ajustare manuală preț/buc (opțional)</Lbl>
            <div style={{ display:"flex", gap:6 }}>
              <input className="inp" type="number" min={0} value={f.overridePret ?? ""} onChange={e=>s("overridePret", e.target.value === "" ? null : Number(e.target.value))} placeholder={`Auto: ${(est?.pretBuc||0).toFixed(2)} €`} />
              {f.overridePret != null && <button className="btn" onClick={()=>s("overridePret",null)} style={{ background:"#1a2035", color:"#94a3b8", padding:"0 10px", borderRadius:5, fontSize:11 }}>↻</button>}
            </div>
            {f.overridePret != null && est && (
              <div style={{ fontSize:11, color: f.overridePret > est.pretBuc ? "#10b981" : "#f59e0b", marginTop:6 }}>
                Diferență: {f.overridePret > est.pretBuc ? "+" : ""}{((f.overridePret/est.pretBuc-1)*100).toFixed(1)}% față de auto
              </div>
            )}
          </div>

          <div style={{ background:"#0f1117", border:"1px solid #1a2035", borderRadius:8, padding:14, fontSize:11, color:"#64748b", lineHeight:1.7 }}>
            💡 <b style={{ color:"#94a3b8" }}>Cum funcționează:</b> Calculatorul folosește volumul piesei × coeficient categorie ÷ MRR material pentru a estima timpul, apoi aplică tariful tău, costul materialului și marja de profit.
          </div>

          <button className="btn" onClick={save} style={{ background:"#2563eb", color:"#fff", padding:"12px 18px", borderRadius:8, fontSize:13, fontWeight:600, justifyContent:"center" }}>
            {oferta ? "💾 Salvează modificări" : "✓ Salvează oferta"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, val, highlight }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ fontSize:11, color:"#64748b" }}>{label}:</span>
      <span style={{ fontSize:12, color: highlight ? "#60a5fa" : "#94a3b8", fontWeight: highlight ? 700 : 500 }}>{val}</span>
    </div>
  );
}

// ─── SUB: Setări tarife și materiale ──────────────────────────────────────────
function SubTarife({ tarife, setTarife, materiale, setMateriale, onBack, showToast }) {
  const [t, setT] = useState(tarife);
  const updMat = (id, k, v) => setMateriale(p => p.map(m => m.id === id ? { ...m, [k]: ["pret","densitate","mrr"].includes(k) ? Number(v) : v } : m));
  const saveTarife = () => { setTarife(t); showToast("Tarife salvate ✓"); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PH title="Tarife & Materiale" sub="Configurează prețurile orare și costul materialelor">
        <button className="btn" onClick={onBack} style={{ background:"#1a2035", color:"#94a3b8", padding:"8px 14px", borderRadius:6, fontSize:12 }}>← Înapoi</button>
      </PH>

      <div className="card" style={{ padding:20 }}>
        <div style={{ fontSize:11, color:"#64748b", letterSpacing:".5px", fontWeight:600, marginBottom:14 }}>TARIFE ORARE & MARJĂ</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {[
            { k:"frezare3",     l:"Frezare CNC 3-axe",    s:"€/h" },
            { k:"strungCNC",    l:"Strung CNC ax Y",      s:"€/h" },
            { k:"strungConv",   l:"Strung convențional",  s:"€/h" },
            { k:"setupFrezare", l:"Setup frezare (fix)",  s:"€" },
            { k:"setupStrung",  l:"Setup strung (fix)",   s:"€" },
            { k:"marja",        l:"Marjă profit",         s:"%" },
          ].map(({k,l,s})=>(
            <div key={k}>
              <Lbl>{l} <span style={{ color:"#475569" }}>({s})</span></Lbl>
              <input className="inp" type="number" min={0} value={t[k]} onChange={e=>setT(p=>({...p,[k]:Number(e.target.value)||0}))} />
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
          <button className="btn" onClick={saveTarife} style={{ background:"#2563eb", color:"#fff", padding:"9px 20px", borderRadius:6, fontSize:12, fontWeight:600 }}>Salvează tarife</button>
        </div>
      </div>

      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #1a2035", fontSize:11, color:"#64748b", letterSpacing:".5px", fontWeight:600 }}>BAZĂ MATERIALE (preț, densitate, factor MRR)</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ borderBottom:"1px solid #1a2035" }}>
            {["Material","Preț (€/kg)","Densitate (g/cm³)","Factor MRR"].map(h=><th key={h} style={{ padding:"9px 14px", textAlign:"left", fontSize:10, color:"#475569", letterSpacing:".6px" }}>{h.toUpperCase()}</th>)}
          </tr></thead>
          <tbody>
            {materiale.map(m=>(
              <tr key={m.id} className="tr" style={{ borderBottom:"1px solid #0f1117" }}>
                <td style={{ padding:"8px 14px", color:"#94a3b8" }}>{m.name}</td>
                <td style={{ padding:"4px 14px" }}><input className="inp" type="number" step="0.1" min={0} value={m.pret} onChange={e=>updMat(m.id,"pret",e.target.value)} style={{ maxWidth:100, padding:"5px 8px", fontSize:12 }} /></td>
                <td style={{ padding:"4px 14px" }}><input className="inp" type="number" step="0.01" min={0} value={m.densitate} onChange={e=>updMat(m.id,"densitate",e.target.value)} style={{ maxWidth:100, padding:"5px 8px", fontSize:12 }} /></td>
                <td style={{ padding:"4px 14px" }}><input className="inp" type="number" step="0.05" min={0} value={m.mrr} onChange={e=>updMat(m.id,"mrr",e.target.value)} style={{ maxWidth:100, padding:"5px 8px", fontSize:12 }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding:"10px 20px", borderTop:"1px solid #1a2035", fontSize:10, color:"#475569", lineHeight:1.6 }}>
          💡 <b>Factor MRR</b> (Material Removal Rate): 1.0 = aluminiu referință. Materiale mai grele se prelucrează mai lent (MRR mai mic). Aluminiu = 1.0, Inox = 0.25 (de 4× mai lent).
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
