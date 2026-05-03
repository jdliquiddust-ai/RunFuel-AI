import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app  = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok', app: 'RunFuel AI' }));

async function claudeTip(prompt, maxTokens = 120) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content[0].text.trim();
}

/* ── POST /api/tip ───────────────────────────────────────────────────────── */
app.post('/api/tip', async (req, res) => {
  const { distance, intensity, phase, userName } = req.body;

  if (!distance || !intensity) {
    return res.status(400).json({ error: 'distance and intensity required' });
  }

  const paceLabel = {
    easy: '12 min/mi easy pace',
    moderate: '10 min/mi moderate pace',
    high: '8 min/mi race effort',
  }[intensity] || intensity;

  const prompt = `You are an elite running coach and sports nutritionist. Give ONE sharp, specific, personalized tip for ${userName || 'this runner'} who is planning a ${distance}-mile run at ${paceLabel}.

Current fueling phase: ${phase || 'pre-run preparation'}

Rules:
- Exactly 1–2 sentences. No more.
- Be specific — name actual foods, times, or metrics where relevant.
- Sound like a real coach talking to an athlete, not a generic disclaimer.
- Motivating but grounded in sports science.
- Do NOT start with "Great!" or similar filler.`;

  try {
    res.json({ tip: await claudeTip(prompt, 120) });
  } catch (err) {
    console.error('Claude error:', err.message);
    res.status(500).json({ error: 'AI tip unavailable' });
  }
});

/* ── POST /api/daily-tip ─────────────────────────────────────────────────── */
app.post('/api/daily-tip', async (req, res) => {
  const { totalRuns, totalMiles, userName } = req.body;

  const prompt = `You are a running coach. Give ${userName || 'this runner'} one quick motivational or tactical running tip for today.
They have logged ${totalRuns || 0} runs and ${totalMiles || 0} total miles.
1 sentence only. Be specific and punchy. No filler.`;

  try {
    res.json({ tip: await claudeTip(prompt, 80) });
  } catch (err) {
    res.status(500).json({ error: 'AI tip unavailable' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🔥 RunFuel AI server → http://localhost:${PORT}`);
});
