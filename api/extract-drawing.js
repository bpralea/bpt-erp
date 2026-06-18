// Vercel Serverless Function — Claude Vision pentru desene tehnice
// Primește o imagine PNG (base64) și returnează date structurate din desen

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 30,
};

const SYSTEM_PROMPT = `Ești un expert în citirea desenelor tehnice CAD pentru atelier CNC. Analizezi un desen 2D și extragi datele cu maximă precizie.

REGULI DE EXTRAGERE:
1. Identifică TOATE dimensiunile cu valori numerice și clasifică-le în:
   - "diametre" → cele cu simbol Ø, ø, ⌀ sau D (cilindrice)
   - "lineare" → lungimi, lățimi, înălțimi, distanțe (fără Ø)
   - "unghiulare" → cu simbol ° (chamfere, conuri)
   - "raze" → cu prefix R
2. Pentru fiecare dimensiune, include TOLERANȚA dacă există (H7, h6, ±0.05, +0.025/0, etc)
3. Identifică TOATE filetele (M5, M6, M8, M10, M12, etc.) și CÂTE găuri sunt din fiecare
4. Identifică materialul: oțel S235/St37/OL37, C45, aluminiu 6061/7075, inox 304/316, POM, PA6, PEEK, etc.
5. Identifică cantitatea (Aantal/Stück/Anzahl/Buc/Qty)
6. Identifică număr desen și denumire piesă
7. Identifică scala (1:1, 1:2)
8. Decide tipul piesei: "cilindric" (strunjit) sau "prismatic" (frezat)
9. Estimează % de material îndepărtat (5-90%) pe baza geometriei
10. Recomandă categoria din lista: strunjit_simplu, strunjit_complex, placa_frezata, carcasa_3d, dispozitiv, combinata

RĂSPUNS: returnezi DOAR JSON valid, fără text suplimentar, fără markdown, fără backticks. Format:
{
  "denumire": "STEUN",
  "nrDesen": "RA-001-02",
  "material": "Oțel S235 / OL37",
  "cantitate": 2,
  "scara": "1:1",
  "tipPiesa": "cilindric",
  "categoria": "combinata",
  "procIndepartat": 35,
  "diametre": [
    {"valoare": 80, "toleranta": null, "rol": "exterior"},
    {"valoare": 60, "toleranta": "±0.2", "rol": "trecere"},
    {"valoare": 40, "toleranta": "+0.025/0 H7", "rol": "alezaj_precis"}
  ],
  "lineare": [
    {"valoare": 60, "rol": "lungime_piesa"},
    {"valoare": 33, "rol": "adancime_gauri"},
    {"valoare": 25, "rol": "filetare_adanca"}
  ],
  "unghiulare": [
    {"valoare": 30, "rol": "chamfer", "x": 25}
  ],
  "raze": [],
  "filete": [
    {"tip": "M10", "nr": 4, "adancime": 25}
  ],
  "tolerantaStransa": true,
  "alezajPrecis": true,
  "complexitate": "mediu",
  "barRecomandata": {"diametru": 90, "lungime": 65},
  "observatii": "4 găuri filetate M10 la 45°, alezaj central Ø40 H7"
}

Dacă o informație NU se vede clar în desen, pune null (NU inventa). Pentru piese cilindrice include "barRecomandata". Fii precis pe toleranțe — sunt critice pentru cost.`;

export default async function handler(req, res) {
  // CORS pentru dezvoltare
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Doar metoda POST este acceptată' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY lipsă în Vercel Environment Variables' });
  }

  try {
    const { imageBase64, model = 'claude-haiku-4-5' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Lipsește imageBase64 din request' });
    }

    // Curăță prefixul "data:image/png;base64," dacă există
    const cleanBase64 = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    // Verifică mărimea (max ~5MB după base64 decoding)
    const sizeBytes = (cleanBase64.length * 3) / 4;
    if (sizeBytes > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Imagine prea mare (max 5MB)' });
    }

    // Apel Claude API
    const startTime = Date.now();
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: cleanBase64,
                },
              },
              {
                type: 'text',
                text: 'Analizează acest desen tehnic și returnează JSON-ul cerut.',
              },
            ],
          },
        ],
      }),
    });

    const claudeData = await claudeResponse.json();

    if (!claudeResponse.ok) {
      console.error('Claude API error:', claudeData);
      return res.status(claudeResponse.status).json({
        error: 'Eroare Claude API',
        details: claudeData.error?.message || 'Necunoscut',
      });
    }

    const responseText = claudeData.content?.[0]?.text || '';
    const duration = Date.now() - startTime;

    // Parsează JSON-ul din răspuns
    let extracted;
    try {
      // Curăță eventuale markdown fences sau text înainte/după JSON
      let cleanText = responseText.trim();
      cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
      cleanText = cleanText.replace(/\s*```$/i, '');
      // Găsește primul { și ultimul }
      const start = cleanText.indexOf('{');
      const end = cleanText.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        cleanText = cleanText.substring(start, end + 1);
      }
      extracted = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('Parse error:', parseErr, 'Text:', responseText);
      return res.status(500).json({
        error: 'Răspuns Claude invalid (nu e JSON)',
        rawResponse: responseText.slice(0, 500),
      });
    }

    // Calculează cost aproximativ
    const usage = claudeData.usage || {};
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    // Haiku: $0.80/MTok input, $4/MTok output (aprox.)
    const costUSD = (inputTokens * 0.0000008) + (outputTokens * 0.000004);

    return res.status(200).json({
      success: true,
      extracted,
      meta: {
        model,
        durationMs: duration,
        inputTokens,
        outputTokens,
        costUSD: parseFloat(costUSD.toFixed(5)),
      },
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      error: 'Eroare server',
      details: err.message,
    });
  }
}
