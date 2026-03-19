import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY;
const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY;
const LANGFUSE_HOST = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';

async function traceToLangfuse(input: unknown, output: unknown, model: string, durationMs: number, usage: { prompt_tokens?: number; completion_tokens?: number }) {
  if (!LANGFUSE_SECRET_KEY || !LANGFUSE_PUBLIC_KEY) return;

  try {
    const traceId = crypto.randomUUID();
    const body = {
      batch: [
        {
          id: crypto.randomUUID(),
          type: 'trace-create',
          timestamp: new Date().toISOString(),
          body: {
            id: traceId,
            name: 'servicecore-chat',
            input,
            output,
            metadata: { model },
          },
        },
        {
          id: crypto.randomUUID(),
          type: 'generation-create',
          timestamp: new Date().toISOString(),
          body: {
            traceId,
            name: 'chat-completion',
            model,
            input,
            output,
            startTime: new Date(Date.now() - durationMs).toISOString(),
            endTime: new Date().toISOString(),
            usage: {
              input: usage.prompt_tokens || 0,
              output: usage.completion_tokens || 0,
            },
          },
        },
      ],
    };

    await fetch(`${LANGFUSE_HOST}/api/public/ingestion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`)}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Tracing is best-effort, don't fail the request
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const model = 'anthropic/claude-sonnet-4-5-20241022';
  const startTime = Date.now();

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://servicecore.vercel.app',
        'X-Title': 'ServiceCore Help Assistant',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', response.status, errText);
      return res.status(response.status).json({
        error: `AI service error (${response.status})`,
      });
    }

    const data = await response.json();
    const durationMs = Date.now() - startTime;

    // Trace to Langfuse (non-blocking)
    traceToLangfuse(
      messages,
      data.choices?.[0]?.message?.content,
      model,
      durationMs,
      data.usage || {},
    );

    return res.status(200).json(data);
  } catch (err) {
    console.error('Chat API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
