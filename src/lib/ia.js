import { DIMENSOES, NIVEIS } from './config';

function buildPrompt(aluno) {
  const dims = DIMENSOES.map(d => {
    const nivel = NIVEIS.find(n => n.val === parseInt(aluno[d.key]));
    return `- ${d.label}: ${nivel?.label || '?'} (${aluno[d.key]}/4) — ${d.desc}`;
  }).join('\n');

  return `Você é um especialista em Didática da Matemática com profundo conhecimento na Teoria dos Registros de Representação Semiótica (TRRS) de Raymond Duval.

Analise o perfil cognitivo do(a) aluno(a) abaixo e gere um **diagnóstico pedagógico estruturado** (máximo 250 palavras) com:
1. **Síntese do perfil** — identificar padrões de força e dificuldade
2. **Análise por dimensão** — comentar os registros críticos
3. **Recomendações pedagógicas** — sugestões concretas de intervenção
4. **Indicador de Noésis** — nível de coordenação entre registros

Use terminologia técnica de Duval. Seja preciso, claro e útil para o professor.

Aluno(a): ${aluno.nome}
Escola: ${aluno.escola || 'não informada'}
Idade: ${aluno.idade || 'não informada'}

Dimensões TRRS avaliadas:
${dims}`;
}

export async function gerarDiagnostico(aluno, apiKey) {
  if (!apiKey) throw new Error('Insira a chave DeepSeek API na barra de configuração.');

  const prompt = buildPrompt(aluno);

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
        { role: 'user',   content: prompt }
      ],
      temperature: 0.35,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro HTTP ${res.status}`);
  }

  const data = await res.json();
  let raw = data.choices?.[0]?.message?.content || '';

  // Return raw markdown, will be rendered in component
  return raw;
}
