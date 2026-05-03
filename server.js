import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app  = express();
const PORT = 3001;

app.use(cors({ origin: ['http://localhost:5177', 'http://localhost:5173'] }));
app.use(express.json());

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

/* ── POST /api/tip ───────────────────────────────────────────────────────── */
app.post('/api/tip', async (req, res) => {
  const { distance, intensity, phase, userName } = req.body;

  if (!distance || !intensity) {
    return res.status(400).json({ error: 'distance and intensity required' });
  }

  const paceLabel = { easy: '12 min/mi easy pace', moderate: '10 min/mi moderate pace', high: '8 min/mi race effort' }[intensity] || intensity;

  const prompt = `You are an elite running coach and sports nutritionist. Give ONE sharp, specific, personalized tip for ${userName || 'this runner'} who is planning a ${distance}-mile run at ${paceLabel}.

Current fueling phase: ${phase || 'pre-run preparation'}

Rules:
- Exactly 1–2 sentences. No more.
- Be specific — name actual foods, times, or metrics where relevant.
- Sound like a real coach talking to an athlete, not a generic disclaimer.
- Motivating but grounded in sports science.
- Do NOT start with "Great!" or similar filler.`;

  try {
    const message = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages:   [{ role: 'user', content: prompt }],
    });
    res.json({ tip: message.content[0].text.trim() });
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
    const message = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages:   [{ role: 'user', content: prompt }],
    });
    res.json({ tip: message.content[0].text.trim() });
  } catch (err) {
    res.status(500).json({ error: 'AI tip unavailable' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🔥 RunFuel AI server → http://localhost:${PORT}`);
  console.log('   Claude Haiku wired for AI tips\n');
});
