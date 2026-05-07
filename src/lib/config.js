// src/lib/config.js
export const DIMENSOES = [
  { key: 'assimilacao', label: 'Assimilação',  desc: 'Capacidade de identificar e reconhecer representações semióticas.' },
  { key: 'tratamento',  label: 'Tratamento',   desc: 'Transformações dentro de um mesmo registro de representação.' },
  { key: 'conversao',   label: 'Conversão',    desc: 'Mudança de um registro para outro mantendo o referente.' },
  { key: 'relacoes',    label: 'Relações',     desc: 'Articulação entre diferentes registros semióticos.' },
  { key: 'mobilizacao', label: 'Mobilização',  desc: 'Uso autônomo e coordenado de múltiplos registros (Noésis).' },
];

export const NIVEIS = [
  { val: 1, label: 'Insuficiente', cls: 'ins' },
  { val: 2, label: 'Regular',      cls: 'reg' },
  { val: 3, label: 'Bom',          cls: 'bom' },
  { val: 4, label: 'Ótimo',        cls: 'otm' },
];

export function getNivel(v) { 
  return NIVEIS.find(n => n.val === parseInt(v)) || NIVEIS[0]; 
}

export function getNivelMedia(v) {
  if (v >= 3.5) return { cls: 'otm' };
  if (v >= 2.5) return { cls: 'bom' };
  if (v >= 1.5) return { cls: 'reg' };
  return { cls: 'ins' };
}

export const CHART_COLORS = {
  border: '#2e7df7',
  fill:   'rgba(46,125,247,0.12)',
  point:  '#2e7df7',
};

// Supabase Environment variables
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
