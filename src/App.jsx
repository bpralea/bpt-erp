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

// ─── TEME (CSS variables) ─────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:          "#0a0c12",        // fundal principal
    bgPanel:     "#11141c",        // carduri, sidebar
    bgInput:     "#0d1018",        // inputuri
    bgHover:     "#1a2030",        // hover state
    border:      "#1f2638",        // borduri normale
    borderLight: "#2a3245",        // borduri evidențiate
    text:        "#e2e8f0",        // text principal
    textMuted:   "#94a3b8",        // text secundar
    textDim:     "#64748b",        // text estompat
    textFaint:   "#475569",        // text foarte estompat
    accent:      "#3b82f6",        // albastru BPT
    accentHover: "#2563eb",
    success:     "#10b981",
    warning:     "#f59e0b",
    danger:      "#ef4444",
    purple:      "#8b5cf6",
  },
  light: {
    bg:          "#f7f8fa",
    bgPanel:     "#ffffff",
    bgInput:     "#f4f5f8",
    bgHover:     "#eef0f4",
    border:      "#e2e6ed",
    borderLight: "#cbd2dc",
    text:        "#1e293b",
    textMuted:   "#475569",
    textDim:     "#64748b",
    textFaint:   "#94a3b8",
    accent:      "#2563eb",
    accentHover: "#1d4ed8",
    success:     "#059669",
    warning:     "#d97706",
    danger:      "#dc2626",
    purple:      "#7c3aed",
  },
};

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
  const [themeName,  setThemeName]  = usePersist("bpt_theme",      "dark");
  const [toast,      setToast]      = useState(null);
  const T = THEMES[themeName] || THEMES.dark;

  const showToast = (msg, type="ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };

  const ctx = { clienti, setClienti, produse, setProduse, comenzi, setComenzi, facturi, setFacturi, oferte, setOferte, tarife, setTarife, materiale, setMateriale, categorii, setCategorii, showToast, generatePDF, T, themeName };
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
    <div style={{ fontFamily:"'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background:T.bg, minHeight:"100vh", color:T.text, transition:"background .2s, color .2s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        :root{
          --bg:${T.bg};--bgp:${T.bgPanel};--bgi:${T.bgInput};--bgh:${T.bgHover};
          --br:${T.border};--brl:${T.borderLight};
          --tx:${T.text};--txm:${T.textMuted};--txd:${T.textDim};--txf:${T.textFaint};
          --ac:${T.accent};--ach:${T.accentHover};
          --ok:${T.success};--wn:${T.warning};--dn:${T.danger};--pu:${T.purple};
        }
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
        ::-webkit-scrollbar{width:8px;height:8px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--br);border-radius:4px;border:2px solid var(--bg)}
        ::-webkit-scrollbar-thumb:hover{background:var(--brl)}

        .btn{cursor:pointer;border:none;transition:all .15s ease;font-family:inherit;font-weight:500;display:inline-flex;align-items:center;gap:6px;letter-spacing:-.01em}
        .btn:hover{filter:brightness(${themeName==="dark"?"1.15":"0.96"});transform:translateY(-1px)}
        .btn:active{transform:translateY(0)}

        .card{background:var(--bgp);border:1px solid var(--br);border-radius:10px;transition:background .2s,border-color .2s}

        .inp{background:var(--bgi);border:1px solid var(--br);border-radius:7px;color:var(--tx);font-family:inherit;font-size:13px;font-weight:500;padding:9px 12px;width:100%;outline:none;transition:all .15s ease;letter-spacing:-.005em}
        .inp:hover{border-color:var(--brl)}
        .inp:focus{border-color:var(--ac);box-shadow:0 0 0 3px ${T.accent}22}
        .inp::placeholder{color:var(--txf);font-weight:400}
        select.inp{cursor:pointer}
        select.inp option{background:var(--bgp);color:var(--tx)}

        .tag{display:inline-flex;align-items:center;padding:3px 9px;border-radius:5px;font-size:11px;font-weight:600;letter-spacing:-.005em}

        .mbg{position:fixed;inset:0;background:rgba(0,0,0,${themeName==="dark"?".82":".55"});backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
        .mbox{background:var(--bgp);border:1px solid var(--br);border-radius:14px;width:100%;max-width:640px;max-height:92vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,${themeName==="dark"?".5":".25"})}

        .nl{cursor:pointer;display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:8px;font-size:13.5px;transition:all .15s ease;color:var(--txd);border:1px solid transparent;font-weight:600;letter-spacing:-.01em}
        .nl:hover{color:var(--tx);background:var(--bgh)}
        .nl.on{color:var(--ac);background:${T.accent}15;border-color:${T.accent}33}
        .nl-ico{font-size:14px;opacity:.85}

        .tr:hover td{background:${T.accent}06!important}

        @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fi{animation:fi .25s cubic-bezier(.16,1,.3,1)}
        @keyframes tst{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

        .kol{background:var(--bgi);border:1px solid var(--br);border-radius:10px;min-width:190px;flex-shrink:0}
        .kc{background:var(--bgp);border:1px solid var(--br);border-radius:8px;padding:11px;margin:8px;cursor:pointer;transition:all .15s ease}
        .kc:hover{border-color:var(--ac);transform:translateY(-1px);box-shadow:0 4px 12px ${T.accent}15}

        h1,h2,h3,h4{font-family:inherit;font-weight:700;letter-spacing:-.02em;color:var(--tx)}
        table{font-family:inherit}
        th{font-weight:600;letter-spacing:-.005em}
        td{font-weight:500}
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background:toast.type==="err"?(themeName==="dark"?"#7f1d1d":"#fef2f2"):(themeName==="dark"?"#052e16":"#f0fdf4"), border:`1px solid ${toast.type==="err"?T.danger:T.success}`, borderRadius:10, padding:"13px 18px", fontSize:13, fontWeight:600, color:toast.type==="err"?T.danger:T.success, animation:"tst .2s ease", boxShadow:`0 10px 28px rgba(0,0,0,${themeName==="dark"?".5":".15"})`, maxWidth:340 }}>
          {toast.type==="err"?"✕ ":"✓ "}{toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{ borderBottom:`1px solid ${T.border}`, padding:"0 22px", display:"flex", alignItems:"center", gap:16, height:58, background:T.bgPanel, position:"sticky", top:0, zIndex:50, transition:"background .2s, border-color .2s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:34, height:34, background:`linear-gradient(135deg,${T.accent},${T.accentHover})`, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800, color:"#fff", flexShrink:0, boxShadow:`0 4px 12px ${T.accent}30` }}>B</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:T.text, lineHeight:1.2, letterSpacing:"-.015em" }}>BPT-Moulds Manufacturing</div>
            <div style={{ fontSize:10.5, color:T.textFaint, letterSpacing:"1.5px", fontWeight:600, marginTop:1 }}>ATELIER · ERP v1.2</div>
          </div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:7, alignItems:"center" }}>
          {urgent>0 && <div style={{ background:`${T.danger}18`, border:`1px solid ${T.danger}40`, borderRadius:6, padding:"5px 11px", fontSize:11.5, color:T.danger, fontWeight:600 }}>⚡ {urgent} URGENT{urgent>1?"E":""}</div>}
          <button className="btn" onClick={exportData} title="Export backup JSON" style={{ background:T.bgHover, color:T.textDim, padding:"6px 11px", borderRadius:6, fontSize:11.5, fontWeight:600 }}>↓ Backup</button>
          <label title="Import backup JSON" style={{ cursor:"pointer", background:T.bgHover, color:T.textDim, padding:"6px 11px", borderRadius:6, fontSize:11.5, display:"inline-flex", alignItems:"center", gap:6, fontFamily:"inherit", fontWeight:600 }}>
            ↑ Import <input type="file" accept=".json" onChange={importData} style={{ display:"none" }} />
          </label>
          <button className="btn" onClick={resetAll} title="Reset date demo" style={{ background:`${T.danger}15`, color:T.danger, padding:"6px 11px", borderRadius:6, fontSize:11.5, fontWeight:600 }}>⟳ Reset</button>
          <button
            className="btn"
            onClick={() => setThemeName(themeName === "dark" ? "light" : "dark")}
            title={themeName === "dark" ? "Comută la temă luminoasă" : "Comută la temă întunecată"}
            style={{ background:T.bgHover, color:T.textMuted, padding:"6px 11px", borderRadius:6, fontSize:14, fontWeight:600, minWidth:34, justifyContent:"center" }}
          >
            {themeName === "dark" ? "☀" : "🌙"}
          </button>
          <div style={{ background:`${T.success}15`, border:`1px solid ${T.success}30`, borderRadius:6, padding:"5px 11px", fontSize:11.5, color:T.success, fontWeight:600 }}>● ACTIV</div>
        </div>
      </div>

      <div style={{ display:"flex", height:"calc(100vh - 58px)" }}>
        {/* SIDEBAR */}
        <div style={{ width:200, borderRight:`1px solid ${T.border}`, padding:"16px 10px", background:T.bgPanel, flexShrink:0, display:"flex", flexDirection:"column", gap:3, transition:"background .2s, border-color .2s" }}>
          {NAV.map(n => <div key={n.id} className={`nl${tab===n.id?" on":""}`} onClick={()=>setTab(n.id)}><span className="nl-ico">{n.icon}</span>{n.label}</div>)}
          <div style={{ marginTop:"auto", padding:"12px 14px", borderTop:`1px solid ${T.border}`, fontSize:11, color:T.textFaint, lineHeight:1.7, fontWeight:500 }}>
            bpt-manufacturing.ro<br />© 2025 BPT-Moulds SRL<br/>
            <span style={{ color:T.success, opacity:.85, fontWeight:600 }}>💾 Auto-salvare activă</span>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex:1, overflow:"auto", padding:26 }} className="fi">
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
function TabDashboard({ comenzi, clienti, facturi, setTab, T }) {
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
        <div style={{ fontSize:18, fontWeight:700, color:T.text, fontFamily:"'IBM Plex Sans',sans-serif" }}>Dashboard</div>
        <div style={{ fontSize:12, color:T.textFaint, marginTop:2 }}>Situație generală atelier · {new Date().toLocaleDateString("ro-RO",{ weekday:"long", day:"numeric", month:"long", year:"numeric" })}</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[
          { label:"Comenzi active",   val:active,          color:T.accent, sub:`${urgent} urgente`,                                          icon:"◻" },
          { label:"Pipeline valoare", val:fmtE(pipeline),  color:T.success, sub:"comenzi nefacturate",                                        icon:"◈" },
          { label:"De încasat",       val:fmtE(neplatite), color:neplatite>0?T.warning:T.success, sub:`${facturi.filter(f=>!f.platita).length} facturi`, icon:"◇" },
          { label:"Clienți activi",   val:clienti.length,  color:T.purple, sub:"în baza de date",                                           icon:"◎" },
        ].map(k=>(
          <div key={k.label} className="card" style={{ padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ fontSize:11, color:T.textFaint, marginBottom:8, letterSpacing:".5px" }}>{k.label.toUpperCase()}</div>
              <span style={{ fontSize:16, color:k.color, opacity:.45 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize:22, fontWeight:700, color:k.color, fontFamily:"'IBM Plex Sans',sans-serif", lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:11, color:T.textFaint, marginTop:6 }}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div className="card" style={{ padding:18 }}>
          <div style={{ fontSize:11, color:T.textDim, marginBottom:14, letterSpacing:".5px", fontWeight:600 }}>DISTRIBUȚIE PE ETAPE</div>
          {etapeData.map(({e,n})=>(
            <div key={e} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
              <div style={{ width:130, fontSize:11, color:T.textDim, flexShrink:0, textAlign:"right" }}>{e}</div>
              <div style={{ flex:1, height:6, background:T.border, borderRadius:3, overflow:"hidden" }}>
                <div style={{ width:`${(n/maxN)*100}%`, height:"100%", background:ETPA_CLR[e], borderRadius:3, transition:"width .5s ease" }} />
              </div>
              <div style={{ width:20, fontSize:12, color:T.textMuted, fontWeight:600 }}>{n}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:11, color:T.textDim, letterSpacing:".5px", fontWeight:600 }}>COMENZI RECENTE</div>
            <button className="btn" onClick={()=>setTab("comenzi")} style={{ fontSize:11, color:T.accent, background:"none", padding:0 }}>Vezi toate →</button>
          </div>
          {recent.map(c=>{
            const cl=clienti.find(x=>x.id===c.clientId)||{};
            return (
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:T.bgInput, borderRadius:6, border:"1px solid #1a2035", marginBottom:7 }}>
                {c.prio==="urgent"&&<span style={{ color:T.danger, fontSize:11 }}>⚡</span>}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:T.textMuted, fontWeight:500 }}>{c.nr}</div>
                  <div style={{ fontSize:11, color:T.textFaint, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cl.name}</div>
                </div>
                <EtapaTag etapa={c.etapa} T={T} />
              </div>
            );
          })}
        </div>
      </div>
      {scadente.length>0&&(
        <div style={{ background:"rgba(249,115,22,.06)", border:"1px solid rgba(249,115,22,.25)", borderRadius:8, padding:"14px 18px" }}>
          <div style={{ fontSize:12, color:T.warning, fontWeight:600, marginBottom:10 }}>⚠ FACTURI SCADENTE ÎN 7 ZILE</div>
          {scadente.map(f=>{ const cl=clienti.find(x=>x.id===f.clientId)||{};
            return <div key={f.id} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:T.textMuted, marginBottom:4 }}>
              <span>{f.nr} · {cl.name}</span>
              <span style={{ color:T.warning, fontWeight:600 }}>{fmtE(f.val)} · scadent {fmtD(f.scad)}</span>
            </div>;
          })}
        </div>
      )}
    </div>
  );
}

// ─── COMENZI ──────────────────────────────────────────────────────────────────
function TabComenzi({ comenzi, setComenzi, clienti, produse, showToast, generatePDF, T }) {
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
      <PH title="Comenzi" sub={`${comenzi.length} total`} T={T}>
        <button className="btn" onClick={()=>setModal("new")} style={{ background:T.accentHover, color:"#fff", padding:"8px 16px", borderRadius:6, fontSize:12, fontWeight:600 }}>+ Comandă nouă</button>
      </PH>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <input className="inp" placeholder="Caută număr / client…" value={flt.q} onChange={e=>setFlt(p=>({...p,q:e.target.value}))} style={{ maxWidth:260 }} />
        <select className="inp" value={flt.etapa} onChange={e=>setFlt(p=>({...p,etapa:e.target.value}))} style={{ maxWidth:180 }}>
          <option value="">Toate etapele</option>{ETAPE.map(e=><option key={e}>{e}</option>)}
        </select>
        <select className="inp" value={flt.prio} onChange={e=>setFlt(p=>({...p,prio:e.target.value}))} style={{ maxWidth:150 }}>
          <option value="">Orice prioritate</option><option value="normal">Normal</option><option value="urgent">Urgent</option>
        </select>
        {(flt.q||flt.etapa||flt.prio)&&<button className="btn" onClick={()=>setFlt({q:"",etapa:"",prio:""})} style={{ background:T.border, color:T.textMuted, padding:"8px 12px", borderRadius:6, fontSize:11 }}>✕ Reset</button>}
      </div>
      <div className="card" style={{ overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ borderBottom:"1px solid #1a2035" }}>
            {["Nr. Comandă","Client","Data","Termen","Valoare","Etapă","Prior.",""].map(h=><th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, color:T.textFaint, letterSpacing:".6px", fontWeight:600 }}>{h.toUpperCase()}</th>)}
          </tr></thead>
          <tbody>
            {list.length===0&&<tr><td colSpan={8} style={{ padding:30, textAlign:"center", color:T.textFaint }}>Nicio comandă găsită</td></tr>}
            {list.map(c=>{
              const cl=clienti.find(x=>x.id===c.clientId)||{};
              const exp=new Date(c.termen)<new Date()&&c.etapa!=="Facturat";
              return (
                <tr key={c.id} className="tr" style={{ borderBottom:"1px solid #0f1117" }}>
                  <td style={{ padding:"10px 14px" }}><div style={{ display:"flex", alignItems:"center", gap:6 }}>{c.prio==="urgent"&&<span style={{ color:T.danger }}>⚡</span>}<span style={{ color:T.accent, fontWeight:600 }}>{c.nr}</span></div></td>
                  <td style={{ padding:"10px 14px" }}><div style={{ color:T.textMuted, fontWeight:500 }}>{cl.name||"—"}</div><div style={{ fontSize:10, color:T.textFaint }}>{TARI[cl.tara]||""} {cl.tara}</div></td>
                  <td style={{ padding:"10px 14px", color:T.textDim }}>{fmtD(c.data)}</td>
                  <td style={{ padding:"10px 14px" }}><span style={{ color:exp?T.danger:T.textDim }}>{fmtD(c.termen)}{exp?" ⚠":""}</span></td>
                  <td style={{ padding:"10px 14px", color:T.success, fontWeight:600 }}>{fmtE(cmdVal(c))}</td>
                  <td style={{ padding:"10px 14px" }}><EtapaTag etapa={c.etapa} T={T} /></td>
                  <td style={{ padding:"10px 14px" }}><span style={{ fontSize:10, color:c.prio==="urgent"?T.danger:T.textFaint, textTransform:"uppercase", letterSpacing:".5px" }}>{c.prio}</span></td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="btn" onClick={()=>generatePDF("oferta",{...c,data:c.data},clienti,produse)} title="Export PDF Ofertă" style={{ background:"rgba(59,130,246,.1)", color:T.accent, padding:"5px 9px", borderRadius:5, fontSize:11, border:"1px solid rgba(59,130,246,.2)" }}>📄 PDF</button>
                      <button className="btn" onClick={()=>setModal(c)} style={{ background:T.border, color:T.textMuted, padding:"5px 9px", borderRadius:5, fontSize:11 }}>✎</button>
                      <button className="btn" onClick={()=>{ if(confirm("Ștergi?")){ setComenzi(p=>p.filter(x=>x.id!==c.id)); showToast("Comandă ștearsă"); }}} style={{ background:"rgba(239,68,68,.1)", color:T.danger, padding:"5px 9px", borderRadius:5, fontSize:11 }}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal&&<ModalCmd cmd={modal==="new"?null:modal} clienti={clienti} produse={produse} onSave={save} onClose={()=>setModal(null)} T={T} />}
    </div>
  );
}

function ModalCmd({ cmd, clienti, produse, onSave, onClose, T }) {
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
          <div style={{ fontSize:15, fontWeight:700, color:T.text, fontFamily:"'IBM Plex Sans',sans-serif" }}>{cmd?`Editare ${cmd.nr}`:"Comandă nouă"}</div>
          <button className="btn" onClick={onClose} style={{ background:"none", color:T.textFaint, fontSize:18, padding:0 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div><Lbl T={T}>Client</Lbl><select className="inp" value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clienti.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><Lbl T={T}>Etapă</Lbl><select className="inp" value={f.etapa} onChange={e=>s("etapa",e.target.value)}>{ETAPE.map(e=><option key={e}>{e}</option>)}</select></div>
          <div><Lbl T={T}>Data</Lbl><input className="inp" type="date" value={f.data} onChange={e=>s("data",e.target.value)} /></div>
          <div><Lbl T={T}>Termen livrare</Lbl><input className="inp" type="date" value={f.termen} onChange={e=>s("termen",e.target.value)} /></div>
          <div><Lbl T={T}>Prioritate</Lbl><select className="inp" value={f.prio} onChange={e=>s("prio",e.target.value)}><option value="normal">Normal</option><option value="urgent">Urgent ⚡</option></select></div>
          <div><Lbl T={T}>Observații / Specificații</Lbl><input className="inp" value={f.obs} onChange={e=>s("obs",e.target.value)} placeholder="Toleranțe, material…" /></div>
        </div>
        <div style={{ borderTop:"1px solid #1a2035", paddingTop:14, marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
            <Lbl style={{ marginBottom:0 }} T={T}>Linii comandă</Lbl>
            <button className="btn" onClick={addL} style={{ background:T.border, color:T.accent, padding:"5px 12px", borderRadius:5, fontSize:11 }}>+ Adaugă linie</button>
          </div>
          {f.linii.length===0&&<div style={{ fontSize:12, color:T.textFaint, textAlign:"center", padding:"14px 0" }}>Nicio linie adăugată</div>}
          {f.linii.map((l,i)=>(
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 75px 85px 34px", gap:8, marginBottom:8, alignItems:"center" }}>
              <select className="inp" value={l.prodId} onChange={e=>{ const p=produse.find(x=>x.id===Number(e.target.value)); updL(i,"prodId",Number(e.target.value)); if(p) updL(i,"pret",p.pret); }}>
                {produse.map(p=><option key={p.id} value={p.id}>{p.cod} · {p.name}</option>)}
              </select>
              <input className="inp" type="number" min={1} value={l.qty} onChange={e=>updL(i,"qty",e.target.value)} placeholder="Qty" />
              <input className="inp" type="number" min={0} value={l.pret} onChange={e=>updL(i,"pret",e.target.value)} placeholder="€/buc" />
              <button className="btn" onClick={()=>delL(i)} style={{ background:"rgba(239,68,68,.1)", color:T.danger, padding:"7px", borderRadius:5, fontSize:12, justifyContent:"center" }}>✕</button>
            </div>
          ))}
          {f.linii.length>0&&<div style={{ textAlign:"right", fontSize:13, color:T.success, fontWeight:700, marginTop:6 }}>TOTAL: {fmtE(tot)}</div>}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button className="btn" onClick={onClose} style={{ background:T.border, color:T.textDim, padding:"9px 18px", borderRadius:6, fontSize:12 }}>Anulează</button>
          <button className="btn" onClick={()=>onSave(f)} style={{ background:T.accentHover, color:"#fff", padding:"9px 20px", borderRadius:6, fontSize:12, fontWeight:600 }}>Salvează</button>
        </div>
      </div>
    </div>
  );
}

// ─── FLUX LUCRU ───────────────────────────────────────────────────────────────
function TabFlux({ comenzi, setComenzi, clienti, showToast, T }) {
  const [det,setDet]=useState(null);
  const move=(c,d)=>{ const i=ETAPE.indexOf(c.etapa); const nx=ETAPE[i+d]; if(nx){ setComenzi(p=>p.map(x=>x.id===c.id?{...x,etapa:nx}:x)); showToast(`${c.nr} → ${nx}`); }};
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PH title="Flux de Lucru" sub="Avansați comenzile între etapele de producție" T={T} />
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
                        <span style={{ fontSize:11, color:T.accent, fontWeight:600 }}>{c.nr}</span>
                        {c.prio==="urgent"&&<span style={{ fontSize:10, color:T.danger }}>⚡</span>}
                      </div>
                      <div style={{ fontSize:12, color:T.textMuted, marginBottom:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cl.name}</div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:10, color:exp?T.danger:T.textFaint }}>↯ {fmtD(c.termen)}</span>
                        <span style={{ fontSize:11, color:T.success, fontWeight:600 }}>{fmtE(cmdVal(c))}</span>
                      </div>
                      <div style={{ display:"flex", gap:4, marginTop:8 }}>
                        {ETAPE.indexOf(etapa)>0&&<button className="btn" onClick={e=>{e.stopPropagation();move(c,-1);}} style={{ flex:1, background:T.bgInput, color:T.textFaint, padding:"4px 0", borderRadius:4, fontSize:10, justifyContent:"center", border:"1px solid #1a2035" }}>← Înapoi</button>}
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
                <div style={{ fontSize:15, fontWeight:700, color:T.text, fontFamily:"'IBM Plex Sans',sans-serif" }}>{det.nr}</div>
                <div style={{ fontSize:12, color:T.textFaint, marginTop:2 }}>{clienti.find(x=>x.id===det.clientId)?.name}</div>
              </div>
              <button className="btn" onClick={()=>setDet(null)} style={{ background:"none", color:T.textFaint, fontSize:18, padding:0 }}>✕</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              {[["Etapă",<EtapaTag etapa={det.etapa} T={T} />],["Prioritate",det.prio],["Data",fmtD(det.data)],["Termen",fmtD(det.termen)],["Valoare",fmtE(cmdVal(det))],["Obs.",det.obs||"—"]].map(([k,v])=>(
                <div key={k} style={{ background:T.bgInput, borderRadius:6, padding:"10px 12px", border:"1px solid #1a2035" }}>
                  <div style={{ fontSize:10, color:T.textFaint, marginBottom:4 }}>{k.toUpperCase()}</div>
                  <div style={{ fontSize:12, color:T.textMuted }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:T.textFaint, marginBottom:8 }}>LINII</div>
            {det.linii.map((l,i)=>{ const p=PRODUSE_DEF.find(x=>x.id===l.prodId)||{};
              return <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 10px", background:T.bgInput, borderRadius:5, marginBottom:5, fontSize:12, color:T.textMuted }}>
                <span>{p.name}</span><span>{l.qty} × {fmtE(l.pret)} = <b style={{ color:T.success }}>{fmtE(l.qty*l.pret)}</b></span>
              </div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CLIENȚI ──────────────────────────────────────────────────────────────────
function TabClienti({ clienti, setClienti, comenzi, showToast, T }) {
  const [modal,setModal]=useState(null);
  const [q,setQ]=useState("");
  const list=clienti.filter(c=>!q||c.name.toLowerCase().includes(q.toLowerCase())||c.contact.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PH title="Clienți" sub={`${clienti.length} înregistrați`} T={T}>
        <button className="btn" onClick={()=>setModal({})} style={{ background:T.accentHover, color:"#fff", padding:"8px 16px", borderRadius:6, fontSize:12, fontWeight:600 }}>+ Client nou</button>
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
                  <div style={{ fontSize:14, fontWeight:700, color:T.text, fontFamily:"'IBM Plex Sans',sans-serif" }}>{c.name}</div>
                  <div style={{ fontSize:12, color:T.textFaint, marginTop:2 }}>{TARI[c.tara]||""} {c.tara} · {c.cui}</div>
                </div>
                <div style={{ display:"flex", gap:5 }}>
                  <button className="btn" onClick={()=>setModal(c)} style={{ background:T.border, color:T.textMuted, padding:"5px 9px", borderRadius:5, fontSize:11 }}>✎</button>
                  <button className="btn" onClick={()=>{ if(confirm("Ștergi clientul?")){ setClienti(p=>p.filter(x=>x.id!==c.id)); showToast("Client șters"); }}} style={{ background:"rgba(239,68,68,.1)", color:T.danger, padding:"5px 9px", borderRadius:5, fontSize:11 }}>✕</button>
                </div>
              </div>
              <div style={{ fontSize:12, color:T.textDim, display:"flex", flexDirection:"column", gap:5 }}>
                <div>👤 {c.contact}</div><div>✉ {c.email}</div><div>📞 {c.tel}</div>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:12, paddingTop:12, borderTop:"1px solid #1a2035" }}>
                <div style={{ flex:1, textAlign:"center" }}>
                  <div style={{ fontSize:16, fontWeight:700, color:T.accent }}>{nrC}</div>
                  <div style={{ fontSize:10, color:T.textFaint }}>COMENZI</div>
                </div>
                <div style={{ flex:1, textAlign:"center" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:T.success }}>{fmtE(valC)}</div>
                  <div style={{ fontSize:10, color:T.textFaint }}>VALOARE TOTALĂ</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {modal!==null&&<ModalCl cl={Object.keys(modal).length===0?null:modal}
        onSave={cl=>{ if(!cl.id){ setClienti(p=>[...p,{...cl,id:uid()}]); showToast("Client adăugat ✓"); } else { setClienti(p=>p.map(x=>x.id===cl.id?cl:x)); showToast("Client actualizat ✓"); } setModal(null); }}
        onClose={()=>setModal(null)} T={T} />}
    </div>
  );
}

function ModalCl({ cl, onSave, onClose, T }) {
  const [f,setF]=useState(cl||{ name:"", tara:"RO", contact:"", email:"", tel:"", cui:"" });
  const s=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  return (
    <div className="mbg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mbox" style={{ padding:24, maxWidth:480 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:T.text, fontFamily:"'IBM Plex Sans',sans-serif" }}>{cl?"Editare client":"Client nou"}</div>
          <button className="btn" onClick={onClose} style={{ background:"none", color:T.textFaint, fontSize:18, padding:0 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[["name","Denumire firmă",true],["cui","CUI / VAT Nr.",false],["tara","Țara",false],["contact","Persoană contact",false],["email","Email",false],["tel","Telefon",false]].map(([k,lbl,full])=>(
            <div key={k} style={{ gridColumn:full?"1 / -1":undefined }}>
              <Lbl T={T}>{lbl}</Lbl>
              {k==="tara"
                ? <select className="inp" value={f[k]} onChange={s(k)}>{Object.entries(TARI).map(([code,flag])=><option key={code} value={code}>{flag} {code}</option>)}</select>
                : <input className="inp" value={f[k]} onChange={s(k)} placeholder={lbl} />}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button className="btn" onClick={onClose} style={{ background:T.border, color:T.textDim, padding:"9px 18px", borderRadius:6, fontSize:12 }}>Anulează</button>
          <button className="btn" onClick={()=>onSave(f)} style={{ background:T.accentHover, color:"#fff", padding:"9px 20px", borderRadius:6, fontSize:12, fontWeight:600 }}>Salvează</button>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUSE ──────────────────────────────────────────────────────────────────
function TabProduse({ produse, setProduse, showToast, T }) {
  const [modal,setModal]=useState(null);
  const [q,setQ]=useState("");
  const cats=[...new Set(produse.map(p=>p.cat))];
  const list=produse.filter(p=>!q||p.name.toLowerCase().includes(q.toLowerCase())||p.cod.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PH title="Produse & Servicii" sub={`${produse.length} înregistrate`} T={T}>
        <button className="btn" onClick={()=>setModal({})} style={{ background:T.accentHover, color:"#fff", padding:"8px 16px", borderRadius:6, fontSize:12, fontWeight:600 }}>+ Produs nou</button>
      </PH>
      <input className="inp" placeholder="Caută cod / denumire…" value={q} onChange={e=>setQ(e.target.value)} style={{ maxWidth:300 }} />
      {cats.map(cat=>{
        const items=list.filter(p=>p.cat===cat); if(!items.length) return null;
        return (
          <div key={cat}>
            <div style={{ fontSize:11, color:T.textFaint, letterSpacing:".7px", marginBottom:8, fontWeight:600 }}>{cat.toUpperCase()}</div>
            <div className="card" style={{ overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead><tr style={{ borderBottom:"1px solid #1a2035" }}>{["Cod","Denumire","U.M.","Preț (€)",""].map(h=><th key={h} style={{ padding:"9px 14px", textAlign:"left", fontSize:10, color:T.textFaint, letterSpacing:".6px" }}>{h.toUpperCase()}</th>)}</tr></thead>
                <tbody>
                  {items.map(p=>(
                    <tr key={p.id} className="tr" style={{ borderBottom:"1px solid #0f1117" }}>
                      <td style={{ padding:"9px 14px", color:T.accent, fontWeight:600 }}>{p.cod}</td>
                      <td style={{ padding:"9px 14px", color:T.textMuted }}>{p.name}</td>
                      <td style={{ padding:"9px 14px", color:T.textDim }}>{p.um}</td>
                      <td style={{ padding:"9px 14px", color:T.success, fontWeight:600 }}>{fmtE(p.pret)}</td>
                      <td style={{ padding:"9px 14px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="btn" onClick={()=>setModal(p)} style={{ background:T.border, color:T.textMuted, padding:"4px 10px", borderRadius:5, fontSize:11 }}>✎</button>
                          <button className="btn" onClick={()=>{ if(confirm("Ștergi?")){ setProduse(pr=>pr.filter(x=>x.id!==p.id)); showToast("Produs șters"); }}} style={{ background:"rgba(239,68,68,.1)", color:T.danger, padding:"4px 10px", borderRadius:5, fontSize:11 }}>✕</button>
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
        onClose={()=>setModal(null)} T={T} />}
    </div>
  );
}

function ModalProd({ prod, cats, onSave, onClose, T }) {
  const [f,setF]=useState(prod||{ cod:"", name:"", um:"buc", pret:0, cat:cats[0]||"General" });
  const s=k=>e=>setF(p=>({...p,[k]:k==="pret"?Number(e.target.value):e.target.value}));
  return (
    <div className="mbg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mbox" style={{ padding:24, maxWidth:440 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:T.text, fontFamily:"'IBM Plex Sans',sans-serif" }}>{prod?"Editare produs":"Produs / serviciu nou"}</div>
          <button className="btn" onClick={onClose} style={{ background:"none", color:T.textFaint, fontSize:18, padding:0 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[["cod","Cod (ex: FRZ-003)",false],["name","Denumire",true],["cat","Categorie",true],["um","U.M.",false],["pret","Preț (€)",false]].map(([k,lbl,full])=>(
            <div key={k} style={{ gridColumn:full?"1 / -1":undefined }}>
              <Lbl T={T}>{lbl}</Lbl>
              {k==="cat"
                ?<><input className="inp" value={f[k]} onChange={s(k)} list="cats"/><datalist id="cats">{cats.map(c=><option key={c} value={c}/>)}</datalist></>
                :<input className="inp" type={k==="pret"?"number":"text"} value={f[k]} onChange={s(k)} placeholder={lbl} min={0} />}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button className="btn" onClick={onClose} style={{ background:T.border, color:T.textDim, padding:"9px 18px", borderRadius:6, fontSize:12 }}>Anulează</button>
          <button className="btn" onClick={()=>onSave(f)} style={{ background:T.accentHover, color:"#fff", padding:"9px 20px", borderRadius:6, fontSize:12, fontWeight:600 }}>Salvează</button>
        </div>
      </div>
    </div>
  );
}

// ─── FACTURI ──────────────────────────────────────────────────────────────────
function TabFacturi({ facturi, setFacturi, clienti, comenzi, showToast, generatePDF, produse, T }) {
  const [modal,setModal]=useState(null);
  const total   = facturi.reduce((s,f)=>s+f.val,0);
  const platite = facturi.filter(f=>f.platita).reduce((s,f)=>s+f.val,0);
  const neplt   = facturi.filter(f=>!f.platita).reduce((s,f)=>s+f.val,0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PH title="Facturi" sub={`${facturi.length} emise`} T={T}>
        <button className="btn" onClick={()=>setModal({})} style={{ background:T.accentHover, color:"#fff", padding:"8px 16px", borderRadius:6, fontSize:12, fontWeight:600 }}>+ Factură nouă</button>
      </PH>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[["Total emis",total,T.accent],["Încasat",platite,T.success],["Restant",neplt,neplt>0?T.warning:T.textFaint]].map(([l,v,c])=>(
          <div key={l} className="card" style={{ padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:11, color:T.textFaint, letterSpacing:".5px" }}>{l.toUpperCase()}</div>
            <div style={{ fontSize:18, fontWeight:700, color:c, fontFamily:"'IBM Plex Sans',sans-serif" }}>{fmtE(v)}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ borderBottom:"1px solid #1a2035" }}>
            {["Nr. Factură","Client","Data","Scadentă","Valoare","Status",""].map(h=><th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, color:T.textFaint, letterSpacing:".6px" }}>{h.toUpperCase()}</th>)}
          </tr></thead>
          <tbody>
            {facturi.length===0&&<tr><td colSpan={7} style={{ padding:30, textAlign:"center", color:T.textFaint }}>Nicio factură</td></tr>}
            {facturi.map(f=>{
              const cl=clienti.find(x=>x.id===f.clientId)||{};
              const exp=!f.platita&&new Date(f.scad)<new Date();
              return (
                <tr key={f.id} className="tr" style={{ borderBottom:"1px solid #0f1117" }}>
                  <td style={{ padding:"10px 14px", color:T.accent, fontWeight:600 }}>{f.nr}</td>
                  <td style={{ padding:"10px 14px", color:T.textMuted }}>{cl.name||"—"}</td>
                  <td style={{ padding:"10px 14px", color:T.textDim }}>{fmtD(f.data)}</td>
                  <td style={{ padding:"10px 14px" }}><span style={{ color:exp?T.danger:T.textDim }}>{fmtD(f.scad)}{exp?" ⚠":""}</span></td>
                  <td style={{ padding:"10px 14px", color:T.text, fontWeight:600 }}>{fmtE(f.val)}</td>
                  <td style={{ padding:"10px 14px" }}>
                    {f.platita
                      ?<span className="tag" style={{ background:"rgba(16,185,129,.12)", color:T.success, border:"1px solid rgba(16,185,129,.25)" }}>✓ Plătită</span>
                      :<span className="tag" style={{ background:exp?"rgba(239,68,68,.1)":"rgba(249,115,22,.1)", color:exp?T.danger:T.warning, border:`1px solid ${exp?"rgba(239,68,68,.25)":"rgba(249,115,22,.25)"}` }}>{exp?"⚠ Restantă":"⏳ Neplatită"}</span>}
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="btn" onClick={()=>generatePDF("factura",f,clienti,produse)} title="Export PDF Factură" style={{ background:"rgba(59,130,246,.1)", color:T.accent, padding:"5px 9px", borderRadius:5, fontSize:11, border:"1px solid rgba(59,130,246,.2)" }}>📄 PDF</button>
                      {!f.platita&&<button className="btn" onClick={()=>{ setFacturi(p=>p.map(x=>x.id===f.id?{...x,platita:true}:x)); showToast("Factură marcată plătită ✓"); }} style={{ background:"rgba(16,185,129,.1)", color:T.success, padding:"5px 9px", borderRadius:5, fontSize:11, border:"1px solid rgba(16,185,129,.2)" }}>✓ Plătită</button>}
                      <button className="btn" onClick={()=>{ if(confirm("Ștergi factura?")){ setFacturi(p=>p.filter(x=>x.id!==f.id)); showToast("Factură ștearsă"); }}} style={{ background:"rgba(239,68,68,.1)", color:T.danger, padding:"5px 9px", borderRadius:5, fontSize:11 }}>✕</button>
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
        onClose={()=>setModal(null)} T={T} />}
    </div>
  );
}

function ModalFact({ fact, clienti, comenzi, onSave, onClose, T }) {
  const [f,setF]=useState(fact||{ clientId:clienti[0]?.id||1, cmdId:null, data:new Date().toISOString().slice(0,10), scad:"", val:0, platita:false, obs:"" });
  const s=k=>e=>setF(p=>({...p,[k]:k==="val"?Number(e.target.value):k==="clientId"||k==="cmdId"?Number(e.target.value)||null:e.target.value}));
  const cC=comenzi.filter(c=>c.clientId===f.clientId);
  return (
    <div className="mbg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mbox" style={{ padding:24, maxWidth:460 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:T.text, fontFamily:"'IBM Plex Sans',sans-serif" }}>{fact?"Editare factură":"Factură nouă"}</div>
          <button className="btn" onClick={onClose} style={{ background:"none", color:T.textFaint, fontSize:18, padding:0 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div style={{ gridColumn:"1 / -1" }}><Lbl T={T}>Client</Lbl><select className="inp" value={f.clientId} onChange={s("clientId")}>{clienti.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div style={{ gridColumn:"1 / -1" }}><Lbl T={T}>Comandă asociată (opțional)</Lbl><select className="inp" value={f.cmdId||""} onChange={s("cmdId")}><option value="">— Fără comandă —</option>{cC.map(c=><option key={c.id} value={c.id}>{c.nr} · {fmtE(cmdVal(c))}</option>)}</select></div>
          <div><Lbl T={T}>Data emitere</Lbl><input className="inp" type="date" value={f.data} onChange={s("data")} /></div>
          <div><Lbl T={T}>Scadentă</Lbl><input className="inp" type="date" value={f.scad} onChange={s("scad")} /></div>
          <div><Lbl T={T}>Valoare (€, fără TVA)</Lbl><input className="inp" type="number" min={0} value={f.val} onChange={s("val")} /></div>
          <div style={{ display:"flex", alignItems:"flex-end", paddingBottom:2 }}>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:12, color:T.textDim }}>
              <input type="checkbox" checked={f.platita} onChange={e=>setF(p=>({...p,platita:e.target.checked}))} />Marcată ca plătită
            </label>
          </div>
          <div style={{ gridColumn:"1 / -1" }}><Lbl T={T}>Descriere servicii</Lbl><input className="inp" value={f.obs||""} onChange={s("obs")} placeholder="Ex: Prelucrare CNC conform comandă CMD-2025-001" /></div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
          <button className="btn" onClick={onClose} style={{ background:T.border, color:T.textDim, padding:"9px 18px", borderRadius:6, fontSize:12 }}>Anulează</button>
          <button className="btn" onClick={()=>onSave(f)} style={{ background:T.accentHover, color:"#fff", padding:"9px 20px", borderRadius:6, fontSize:12, fontWeight:600 }}>Salvează</button>
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

function TabOfertare({ oferte, setOferte, clienti, materiale, setMateriale, categorii, tarife, setTarife, setComenzi, comenzi, showToast, setTab, T }) {
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
      <PH title="Ofertare" sub="Calculator automat de preț pentru piese custom" T={T}>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn" onClick={()=>setView("tarife")} style={{ background:T.border, color:T.textMuted, padding:"8px 14px", borderRadius:6, fontSize:12 }}>⚙ Tarife & Materiale</button>
          <button className="btn" onClick={()=>setView("nou")} style={{ background:T.accentHover, color:"#fff", padding:"8px 16px", borderRadius:6, fontSize:12, fontWeight:600 }}>+ Ofertă nouă</button>
        </div>
      </PH>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
        {[
          { l:"Total oferte",   v:stats.total,        c:T.accent },
          { l:"Draft",          v:stats.draft,        c:T.textDim },
          { l:"Trimise",        v:stats.trimise,      c:T.warning },
          { l:"Acceptate",      v:stats.acceptate,    c:T.success },
          { l:"Valoare totală", v:fmtE(stats.valoare),c:T.purple },
        ].map(k=>(
          <div key={k.l} className="card" style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:10, color:T.textFaint, letterSpacing:".5px", marginBottom:6 }}>{k.l.toUpperCase()}</div>
            <div style={{ fontSize:18, fontWeight:700, color:k.c, fontFamily:"'IBM Plex Sans',sans-serif" }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ borderBottom:"1px solid #1a2035" }}>
            {["Nr. Ofertă","Client","Piesă","Material","Buc.","Preț/buc","Total","Status",""].map(h=>
              <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, color:T.textFaint, letterSpacing:".6px", fontWeight:600 }}>{h.toUpperCase()}</th>
            )}
          </tr></thead>
          <tbody>
            {oferte.length===0 && <tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:T.textFaint, fontSize:12 }}>Nicio ofertă încă. Click <b style={{ color:T.accent }}>+ Ofertă nouă</b> ca să generezi prima estimare automată.</td></tr>}
            {oferte.map(o => {
              const cl = clienti.find(x=>x.id===o.clientId)||{};
              const statusColor = { draft:T.textDim, trimisa:T.warning, acceptata:T.success, refuzata:T.danger }[o.status]||T.textDim;
              return (
                <tr key={o.id} className="tr" style={{ borderBottom:"1px solid #0f1117" }}>
                  <td style={{ padding:"10px 14px", color:T.accent, fontWeight:600 }}>{o.nr}</td>
                  <td style={{ padding:"10px 14px", color:T.textMuted }}>{cl.name||"—"}</td>
                  <td style={{ padding:"10px 14px", color:T.textMuted }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span>{o.numePiesa||"piesă custom"}</span>
                      {o.atasamente && o.atasamente.length > 0 && (
                        <span title={`${o.atasamente.length} atașamente`} style={{ fontSize:10, background:"rgba(139,92,246,.12)", color:T.purple, padding:"1px 6px", borderRadius:3, fontWeight:600 }}>📎 {o.atasamente.length}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:"10px 14px", color:T.textDim, fontSize:11 }}>{o.material||"—"}</td>
                  <td style={{ padding:"10px 14px", color:T.textMuted }}>{o.qty}</td>
                  <td style={{ padding:"10px 14px", color:T.textMuted }}>{fmtE(o.pretBuc||0)}</td>
                  <td style={{ padding:"10px 14px", color:T.success, fontWeight:600 }}>{fmtE(o.pretTotal||0)}</td>
                  <td style={{ padding:"10px 14px" }}>
                    <span className="tag" style={{ background:statusColor+"18", color:statusColor, border:`1px solid ${statusColor}35` }}>{(o.status||"draft").toUpperCase()}</span>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="btn" onClick={()=>setEditOferta(o)} style={{ background:T.border, color:T.textMuted, padding:"5px 9px", borderRadius:5, fontSize:11 }}>✎</button>
                      {o.status!=="acceptata" && <button className="btn" onClick={()=>convertToComanda(o)} title="Convertește în comandă" style={{ background:"rgba(16,185,129,.1)", color:T.success, padding:"5px 9px", borderRadius:5, fontSize:11, border:"1px solid rgba(16,185,129,.2)" }}>→ CMD</button>}
                      <button className="btn" onClick={()=>{ if(confirm("Ștergi oferta?")){ setOferte(p=>p.filter(x=>x.id!==o.id)); showToast("Ofertă ștearsă"); }}} style={{ background:"rgba(239,68,68,.1)", color:T.danger, padding:"5px 9px", borderRadius:5, fontSize:11 }}>✕</button>
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
function SubOfertaNou({ oferta, clienti, materiale, categorii, tarife, onSave, onClose, T }) {
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
    atasamente: [],
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
      <PH title={oferta ? `Editare ${oferta.nr}` : "Ofertă nouă"} sub="Calculatorul estimează automat preț pe baza dimensiunilor și materialului" T={T}>
        <button className="btn" onClick={onClose} style={{ background:T.border, color:T.textMuted, padding:"8px 14px", borderRadius:6, fontSize:12 }}>← Înapoi</button>
      </PH>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:18 }}>
        {/* STÂNGA — input */}
        <div className="card" style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ fontSize:11, color:T.textDim, letterSpacing:".5px", fontWeight:600, marginBottom:-6 }}>1. INFORMAȚII GENERALE</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><Lbl T={T}>Client</Lbl><select className="inp" value={f.clientId} onChange={e=>s("clientId",Number(e.target.value))}>{clienti.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><Lbl T={T}>Cantitate (buc.)</Lbl><input className="inp" type="number" min={1} value={f.qty} onChange={e=>s("qty",Number(e.target.value)||1)} /></div>
            <div style={{ gridColumn:"1 / -1" }}><Lbl T={T}>Denumire piesă</Lbl><input className="inp" value={f.numePiesa} onChange={e=>s("numePiesa",e.target.value)} placeholder="ex: Flanșă oțel Ø80×15" /></div>
          </div>

          <div style={{ fontSize:11, color:T.textDim, letterSpacing:".5px", fontWeight:600, marginTop:8, marginBottom:-6 }}>2. CATEGORIE PIESĂ</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {categorii.map(c => (
              <div key={c.id} onClick={()=>s("catId",c.id)} style={{ cursor:"pointer", padding:"10px 12px", background: f.catId===c.id ? "rgba(59,130,246,.12)" : T.bgInput, border: `1px solid ${f.catId===c.id ? T.accent : T.border}`, borderRadius:6, transition:"all .15s" }}>
                <div style={{ fontSize:13, fontWeight:600, color: f.catId===c.id ? T.accent : T.textMuted, display:"flex", alignItems:"center", gap:6 }}><span style={{ fontSize:16 }}>{c.icon}</span>{c.name}</div>
                <div style={{ fontSize:10, color:T.textFaint, marginTop:3 }}>{c.descriere}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize:11, color:T.textDim, letterSpacing:".5px", fontWeight:600, marginTop:8, marginBottom:-6 }}>3. DIMENSIUNI BRUT (mm)</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <div><Lbl T={T}>Lungime (L)</Lbl><input className="inp" type="number" min={1} value={f.L} onChange={e=>s("L",Number(e.target.value)||0)} /></div>
            <div><Lbl T={T}>Lățime / Ø</Lbl><input className="inp" type="number" min={1} value={f.l} onChange={e=>s("l",Number(e.target.value)||0)} /></div>
            <div><Lbl T={T}>Înălțime / lungime ax</Lbl><input className="inp" type="number" min={1} value={f.h} onChange={e=>s("h",Number(e.target.value)||0)} /></div>
          </div>

          <div style={{ fontSize:11, color:T.textDim, letterSpacing:".5px", fontWeight:600, marginTop:8, marginBottom:-6 }}>4. MATERIAL & COMPLEXITATE</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><Lbl T={T}>Material</Lbl><select className="inp" value={f.matId} onChange={e=>s("matId",Number(e.target.value))}>{materiale.map(m=><option key={m.id} value={m.id}>{m.name} ({m.pret}€/kg)</option>)}</select></div>
            <div><Lbl T={T}>Complexitate execuție</Lbl>
              <div style={{ display:"flex", gap:5 }}>
                {COMPLEXITATI.map(c=>(
                  <button key={c.id} className="btn" onClick={()=>s("complexId",c.id)} style={{ flex:1, padding:"7px 0", borderRadius:5, fontSize:11, justifyContent:"center", background: f.complexId===c.id ? c.color+"22" : T.bgInput, color: f.complexId===c.id ? c.color : T.textFaint, border:`1px solid ${f.complexId===c.id ? c.color+"66" : T.border}`, fontWeight:600 }}>{c.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div><Lbl T={T}>Observații / specificații (toleranțe, finisaj, etc.)</Lbl>
            <textarea className="inp" rows={3} value={f.obs} onChange={e=>s("obs",e.target.value)} placeholder="ex: Toleranțe ISO h7, finisaj Ra 1.6, găuriri filetate M8..." style={{ resize:"vertical", fontFamily:"inherit" }} />
          </div>

          <div style={{ fontSize:11, color:T.textDim, letterSpacing:".5px", fontWeight:600, marginTop:4, marginBottom:-6 }}>5. ATAȘAMENTE (desene 2D/3D, imagini)</div>
          <Atasamente atasamente={f.atasamente||[]} setAtasamente={(a)=>s("atasamente",a)} T={T} />
        </div>

        {/* DREAPTA — calcul în timp real */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div className="card" style={{ padding:18, background:"linear-gradient(180deg,#0f1117,#0c1622)", border:"1px solid #1d4ed8" }}>
            <div style={{ fontSize:11, color:T.accent, letterSpacing:".7px", fontWeight:700, marginBottom:14 }}>📊 ESTIMARE AUTOMATĂ</div>
            {est && est.volCM3 > 0 ? <>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                <Row label="Volum piesă"     val={`${est.volCM3.toFixed(1)} cm³`} T={T} />
                <Row label="Masă material"   val={`${est.masaKg.toFixed(3)} kg`} T={T} />
                <Row label="Timp estimat"    val={`${Math.round(est.timpMin)} min · ${(est.timpMin/60).toFixed(2)} h`} highlight T={T} />
                <Row label="Tarif aplicat"   val={`${est.tarif} €/h (${cat?.name.split(" ")[0]})`} T={T} />
                <Row label="Complexitate"    val={`×${cpl?.mult.toFixed(2)} (${cpl?.label})`} T={T} />
              </div>
              <div style={{ height:1, background:T.border, margin:"10px -18px 14px" }} />
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                <Row label="Cost manoperă"      val={fmtE(est.costMano)} T={T} />
                <Row label="Cost material (+40% risipă)" val={fmtE(est.costMat)} T={T} />
                <Row label={`Marjă profit ${tarife.marja}%`} val={fmtE(est.pretBaza * tarife.marja/100)} T={T} />
              </div>
              <div style={{ height:1, background:T.border, margin:"12px -18px" }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:T.textMuted }}>PREȚ ESTIMAT / BUC:</span>
                <span style={{ fontSize:20, fontWeight:700, color:T.success, fontFamily:"'IBM Plex Sans',sans-serif" }}>{fmtE(est.pretBuc)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
                <span style={{ fontSize:11, color:T.textDim }}>Total {f.qty} buc:</span>
                <span style={{ fontSize:13, fontWeight:600, color:T.accent }}>{fmtE(est.pretTotal)}</span>
              </div>
            </> : <div style={{ fontSize:12, color:T.textDim, textAlign:"center", padding:"20px 0" }}>Introduceți dimensiuni pentru estimare</div>}
          </div>

          {/* OVERRIDE PRET */}
          <div className="card" style={{ padding:16 }}>
            <Lbl T={T}>Ajustare manuală preț/buc (opțional)</Lbl>
            <div style={{ display:"flex", gap:6 }}>
              <input className="inp" type="number" min={0} value={f.overridePret ?? ""} onChange={e=>s("overridePret", e.target.value === "" ? null : Number(e.target.value))} placeholder={`Auto: ${(est?.pretBuc||0).toFixed(2)} €`} />
              {f.overridePret != null && <button className="btn" onClick={()=>s("overridePret",null)} style={{ background:T.border, color:T.textMuted, padding:"0 10px", borderRadius:5, fontSize:11 }}>↻</button>}
            </div>
            {f.overridePret != null && est && (
              <div style={{ fontSize:11, color: f.overridePret > est.pretBuc ? T.success : T.warning, marginTop:6 }}>
                Diferență: {f.overridePret > est.pretBuc ? "+" : ""}{((f.overridePret/est.pretBuc-1)*100).toFixed(1)}% față de auto
              </div>
            )}
          </div>

          <div style={{ background:T.bgPanel, border:"1px solid #1a2035", borderRadius:8, padding:14, fontSize:11, color:T.textDim, lineHeight:1.7 }}>
            💡 <b style={{ color:T.textMuted }}>Cum funcționează:</b> Calculatorul folosește volumul piesei × coeficient categorie ÷ MRR material pentru a estima timpul, apoi aplică tariful tău, costul materialului și marja de profit.
          </div>

          <button className="btn" onClick={save} style={{ background:T.accentHover, color:"#fff", padding:"12px 18px", borderRadius:8, fontSize:13, fontWeight:600, justifyContent:"center" }}>
            {oferta ? "💾 Salvează modificări" : "✓ Salvează oferta"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, val, highlight, T }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ fontSize:11, color:T.textDim }}>{label}:</span>
      <span style={{ fontSize:12, color: highlight ? T.accent : T.textMuted, fontWeight: highlight ? 700 : 500 }}>{val}</span>
    </div>
  );
}

// ─── SUB: Setări tarife și materiale ──────────────────────────────────────────
function SubTarife({ tarife, setTarife, materiale, setMateriale, onBack, showToast, T }) {
  const [t, setT] = useState(tarife);
  const updMat = (id, k, v) => setMateriale(p => p.map(m => m.id === id ? { ...m, [k]: ["pret","densitate","mrr"].includes(k) ? Number(v) : v } : m));
  const saveTarife = () => { setTarife(t); showToast("Tarife salvate ✓"); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <PH title="Tarife & Materiale" sub="Configurează prețurile orare și costul materialelor" T={T}>
        <button className="btn" onClick={onBack} style={{ background:T.border, color:T.textMuted, padding:"8px 14px", borderRadius:6, fontSize:12 }}>← Înapoi</button>
      </PH>

      <div className="card" style={{ padding:20 }}>
        <div style={{ fontSize:11, color:T.textDim, letterSpacing:".5px", fontWeight:600, marginBottom:14 }}>TARIFE ORARE & MARJĂ</div>
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
              <Lbl T={T}>{l} <span style={{ color:T.textFaint }}>({s})</span></Lbl>
              <input className="inp" type="number" min={0} value={t[k]} onChange={e=>setT(p=>({...p,[k]:Number(e.target.value)||0}))} />
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
          <button className="btn" onClick={saveTarife} style={{ background:T.accentHover, color:"#fff", padding:"9px 20px", borderRadius:6, fontSize:12, fontWeight:600 }}>Salvează tarife</button>
        </div>
      </div>

      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #1a2035", fontSize:11, color:T.textDim, letterSpacing:".5px", fontWeight:600 }}>BAZĂ MATERIALE (preț, densitate, factor MRR)</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ borderBottom:"1px solid #1a2035" }}>
            {["Material","Preț (€/kg)","Densitate (g/cm³)","Factor MRR"].map(h=><th key={h} style={{ padding:"9px 14px", textAlign:"left", fontSize:10, color:T.textFaint, letterSpacing:".6px" }}>{h.toUpperCase()}</th>)}
          </tr></thead>
          <tbody>
            {materiale.map(m=>(
              <tr key={m.id} className="tr" style={{ borderBottom:"1px solid #0f1117" }}>
                <td style={{ padding:"8px 14px", color:T.textMuted }}>{m.name}</td>
                <td style={{ padding:"4px 14px" }}><input className="inp" type="number" step="0.1" min={0} value={m.pret} onChange={e=>updMat(m.id,"pret",e.target.value)} style={{ maxWidth:100, padding:"5px 8px", fontSize:12 }} /></td>
                <td style={{ padding:"4px 14px" }}><input className="inp" type="number" step="0.01" min={0} value={m.densitate} onChange={e=>updMat(m.id,"densitate",e.target.value)} style={{ maxWidth:100, padding:"5px 8px", fontSize:12 }} /></td>
                <td style={{ padding:"4px 14px" }}><input className="inp" type="number" step="0.05" min={0} value={m.mrr} onChange={e=>updMat(m.id,"mrr",e.target.value)} style={{ maxWidth:100, padding:"5px 8px", fontSize:12 }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding:"10px 20px", borderTop:"1px solid #1a2035", fontSize:10, color:T.textFaint, lineHeight:1.6 }}>
          💡 <b>Factor MRR</b> (Material Removal Rate): 1.0 = aluminiu referință. Materiale mai grele se prelucrează mai lent (MRR mai mic). Aluminiu = 1.0, Inox = 0.25 (de 4× mai lent).
        </div>
      </div>
    </div>
  );
}

// ─── MICRO COMPONENTE ─────────────────────────────────────────────────────────

// Atașamente cu base64 încărcare/preview/download/șterge
function Atasamente({ atasamente, setAtasamente, T }) {
  const MAX_INLINE = 5 * 1024 * 1024; // 5MB
  const MAX_TOTAL  = 8 * 1024 * 1024; // 8MB pe ofertă
  const [drag, setDrag] = useState(false);
  const [previewing, setPreviewing] = useState(null);

  const totalBytes = atasamente.reduce((s,a) => s + (a.size||0), 0);

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (atasamente.length + 1 > 15) { alert("Maxim 15 fișiere per ofertă"); return; }

      // Verifică spațiul disponibil
      if (totalBytes + file.size > MAX_TOTAL && file.size > MAX_INLINE) {
        // Fișier prea mare → salvăm doar metadata (referință)
        const ata = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          ext: file.name.split(".").pop().toLowerCase(),
          dataUrl: null, // mare → nu salvăm conținutul
          stored: false,
          note: "Fișier prea mare pentru stocare în browser. Păstrează-l pe calculator.",
          addedAt: new Date().toISOString(),
        };
        setAtasamente([...atasamente, ata]);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const ata = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          ext: file.name.split(".").pop().toLowerCase(),
          dataUrl: e.target.result,
          stored: true,
          addedAt: new Date().toISOString(),
        };
        setAtasamente([...atasamente, ata]);
      };
      reader.onerror = () => alert(`Eroare la citirea ${file.name}`);
      reader.readAsDataURL(file);
    });
  };

  const removeAt = (id) => {
    if (!confirm("Ștergi acest atașament?")) return;
    setAtasamente(atasamente.filter(a => a.id !== id));
  };

  const download = (a) => {
    if (!a.dataUrl) { alert("Acest fișier nu a fost stocat în aplicație. Caută-l pe calculator."); return; }
    const link = document.createElement("a");
    link.href = a.dataUrl;
    link.download = a.name;
    link.click();
  };

  const preview = (a) => {
    if (!a.dataUrl) { alert("Acest fișier nu poate fi previzualizat."); return; }
    setPreviewing(a);
  };

  const formatSize = (b) => b < 1024 ? `${b} B` : b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024/1024).toFixed(2)} MB`;
  const getIcon = (ext) => ({
    pdf: "📄", dwg: "📐", dxf: "📐", step: "🧊", stp: "🧊", iges: "🧊", igs: "🧊", stl: "🧊", sldprt: "🔧", sldasm: "🔧",
    jpg: "🖼", jpeg: "🖼", png: "🖼", gif: "🖼", webp: "🖼", svg: "🖼",
    doc: "📝", docx: "📝", txt: "📝", xls: "📊", xlsx: "📊", csv: "📊", zip: "🗜", rar: "🗜",
  }[ext] || "📎");
  const isImage = (a) => ["jpg","jpeg","png","gif","webp","svg"].includes(a.ext);
  const isPDF = (a) => a.ext === "pdf";
  const is3D = (a) => ["step","stp","iges","igs","stl","sldprt","sldasm","obj","3ds"].includes(a.ext);
  const is2D = (a) => ["dwg","dxf","pdf"].includes(a.ext);

  return (
    <>
      {/* DROP ZONE */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${drag ? T.accent : T.border}`,
          borderRadius: 8,
          padding: "16px 18px",
          background: drag ? "rgba(59,130,246,.05)" : T.bgInput,
          transition: "all .15s",
          textAlign: "center",
          cursor: "pointer",
        }}
        onClick={() => document.getElementById("atasament-input")?.click()}
      >
        <input id="atasament-input" type="file" multiple onChange={e => handleFiles(e.target.files)} style={{ display: "none" }}
          accept=".pdf,.dwg,.dxf,.step,.stp,.iges,.igs,.stl,.sldprt,.sldasm,.jpg,.jpeg,.png,.gif,.webp,.svg,.doc,.docx,.xls,.xlsx,.zip" />
        <div style={{ fontSize: 22, marginBottom: 4, opacity: .6 }}>📎</div>
        <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>
          {drag ? "Eliberează aici" : "Click sau trage fișiere aici"}
        </div>
        <div style={{ fontSize: 10, color: T.textFaint, marginTop: 4 }}>
          PDF, DWG, DXF, STEP, STL, JPG, PNG · max 5MB inline · max 8MB total
        </div>
      </div>

      {/* LIST ATAȘAMENTE */}
      {atasamente.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop: 10 }}>
          {atasamente.map(a => (
            <div key={a.id} style={{
              display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
              background:T.bgInput, border:`1px solid ${a.stored ? T.border : "rgba(249,115,22,.3)"}`,
              borderRadius:6
            }}>
              <span style={{ fontSize:18 }}>{getIcon(a.ext)}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, color:T.text, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {a.name}
                  {is2D(a) && <span style={{ marginLeft:8, fontSize:9, background:"rgba(59,130,246,.15)", color:T.accent, padding:"1px 6px", borderRadius:3, letterSpacing:".5px" }}>2D</span>}
                  {is3D(a) && <span style={{ marginLeft:8, fontSize:9, background:"rgba(139,92,246,.15)", color:T.purple, padding:"1px 6px", borderRadius:3, letterSpacing:".5px" }}>3D</span>}
                  {isImage(a) && <span style={{ marginLeft:8, fontSize:9, background:"rgba(16,185,129,.15)", color:T.success, padding:"1px 6px", borderRadius:3, letterSpacing:".5px" }}>IMG</span>}
                </div>
                <div style={{ fontSize:10, color: a.stored ? T.textFaint : T.warning, marginTop:2 }}>
                  {formatSize(a.size)}
                  {!a.stored && " · ⚠ nestocat (fișier prea mare)"}
                </div>
              </div>
              <div style={{ display:"flex", gap:4 }}>
                {a.stored && (isImage(a) || isPDF(a)) && (
                  <button className="btn" onClick={(e)=>{ e.stopPropagation(); preview(a); }} title="Preview" style={{ background:T.border, color:T.textMuted, padding:"5px 9px", borderRadius:5, fontSize:11 }}>👁</button>
                )}
                {a.stored && (
                  <button className="btn" onClick={(e)=>{ e.stopPropagation(); download(a); }} title="Download" style={{ background:"rgba(59,130,246,.1)", color:T.accent, padding:"5px 9px", borderRadius:5, fontSize:11 }}>↓</button>
                )}
                <button className="btn" onClick={(e)=>{ e.stopPropagation(); removeAt(a.id); }} title="Șterge" style={{ background:"rgba(239,68,68,.1)", color:T.danger, padding:"5px 9px", borderRadius:5, fontSize:11 }}>✕</button>
              </div>
            </div>
          ))}
          <div style={{ fontSize:10, color:T.textFaint, textAlign:"right", marginTop:2 }}>
            Total: {formatSize(totalBytes)} · {atasamente.length} fișier{atasamente.length>1?"e":""}
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewing && (
        <div className="mbg" onClick={e => e.target===e.currentTarget && setPreviewing(null)} style={{ zIndex: 300 }}>
          <div style={{ background:T.bgPanel, border:"1px solid #1a2035", borderRadius:10, width:"95vw", maxWidth:1100, height:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"12px 18px", borderBottom:"1px solid #1a2035", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{previewing.name}</div>
                <div style={{ fontSize:11, color:T.textFaint, marginTop:2 }}>{formatSize(previewing.size)} · adăugat {fmtD(previewing.addedAt)}</div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn" onClick={()=>download(previewing)} style={{ background:"rgba(59,130,246,.15)", color:T.accent, padding:"6px 14px", borderRadius:5, fontSize:12 }}>↓ Download</button>
                <button className="btn" onClick={()=>setPreviewing(null)} style={{ background:T.border, color:T.textMuted, padding:"6px 14px", borderRadius:5, fontSize:12 }}>✕ Închide</button>
              </div>
            </div>
            <div style={{ flex:1, background:"#000", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {isImage(previewing) && <img src={previewing.dataUrl} alt={previewing.name} style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />}
              {isPDF(previewing) && <iframe src={previewing.dataUrl} title={previewing.name} style={{ width:"100%", height:"100%", border:"none", background:"#fff" }} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EtapaTag({ etapa, T }) {
  const c=ETPA_CLR[etapa]||T.textFaint;
  return <span className="tag" style={{ background:c+"18", color:c, border:`1px solid ${c}35` }}>{etapa}</span>;
}
function Lbl({ children, style, T }) {
  return <div style={{ fontSize:11, color:T.textFaint, marginBottom:5, letterSpacing:".4px", ...style }}>{children}</div>;
}
function PH({ title, sub, children, T }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
      <div>
        <div style={{ fontSize:18, fontWeight:700, color:T.text, fontFamily:"'IBM Plex Sans',sans-serif" }}>{title}</div>
        {sub&&<div style={{ fontSize:12, color:T.textFaint, marginTop:2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}
