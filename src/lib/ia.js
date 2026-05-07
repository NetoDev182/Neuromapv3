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

export async function gerarDiagnostico(aluno) {
  const prompt = buildPrompt(aluno);

  const res = await fetch('/api/diagnostico', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || `Erro HTTP ${res.status}`);
  }

  return data.result;
}
