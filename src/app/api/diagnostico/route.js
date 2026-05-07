import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave da API não configurada no servidor (Variável DEEPSEEK_API_KEY ausente).' },
        { status: 500 }
      );
    }

    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt ausente na requisição.' }, { status: 400 });
    }

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Responda sempre em português do Brasil. Use markdown (negrito com **) para termos técnicos.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.35,
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message || `Erro HTTP da API DeepSeek: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ result: data.choices?.[0]?.message?.content || '' });
    
  } catch (error) {
    console.error('Erro no endpoint de diagnóstico:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
