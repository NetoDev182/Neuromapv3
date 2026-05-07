'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Settings, Loader2 } from 'lucide-react';
import RadarChart from '@/components/RadarChart';
import { DIMENSOES, NIVEIS, getNivel, getNivelMedia } from '@/lib/config';
import { listarAlunos, criarAluno, atualizarAluno, excluirAluno } from '@/lib/supabase';
import { gerarDiagnostico } from '@/lib/ia';

const DEMO_DATA = [
  { id: 'd1', nome: 'Lucas Silva',     idade: 14, escola: 'E.E. Amazonas', assimilacao: 4, tratamento: 4, conversao: 1, relacoes: 1, mobilizacao: 2 },
  { id: 'd2', nome: 'Maria Oliveira',  idade: 15, escola: 'E.E. Amazonas', assimilacao: 3, tratamento: 3, conversao: 3, relacoes: 3, mobilizacao: 3 },
  { id: 'd3', nome: 'Valentina Luz',   idade: 14, escola: 'E.E. Amazonas', assimilacao: 4, tratamento: 4, conversao: 4, relacoes: 4, mobilizacao: 4 },
  { id: 'd4', nome: 'Gabriel Souza',   idade: 16, escola: 'E.E. Amazonas', assimilacao: 3, tratamento: 4, conversao: 2, relacoes: 2, mobilizacao: 2 },
  { id: 'd5', nome: 'Beatriz Costa',   idade: 15, escola: 'E.E. Amazonas', assimilacao: 4, tratamento: 2, conversao: 4, relacoes: 3, mobilizacao: 3 },
  { id: 'd6', nome: 'Rafael Mello',    idade: 14, escola: 'E.E. Amazonas', assimilacao: 2, tratamento: 2, conversao: 2, relacoes: 2, mobilizacao: 2 },
  { id: 'd7', nome: 'Sofia Rocha',     idade: 15, escola: 'E.E. Amazonas', assimilacao: 4, tratamento: 4, conversao: 4, relacoes: 3, mobilizacao: 4 },
  { id: 'd8', nome: 'Thiago Lima',     idade: 16, escola: 'E.E. Amazonas', assimilacao: 3, tratamento: 3, conversao: 2, relacoes: 1, mobilizacao: 2 },
];

function calcMedia(a) {
  return DIMENSOES.reduce((s, d) => s + (parseInt(a[d.key]) || 1), 0) / DIMENSOES.length;
}

export default function Dashboard() {
  const [alunos, setAlunos] = useState([]);
  const [alunoAtual, setAlunoAtual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '');
  const [iaCache, setIaCache] = useState({});
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('new'); // 'new' | 'edit'
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Toast
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const data = await listarAlunos();
        setAlunos(data);
        if (data.length > 0) setAlunoAtual(data[0]);
      } catch (e) {
        if (e.message !== 'DEMO_MODE') {
          addToast('Erro ao conectar ao Supabase. Usando dados de demonstração.', 'error');
        } else {
          addToast('Modo demonstração ativo. Configure o Supabase no .env.local para persistência.', 'success');
        }
        setAlunos(DEMO_DATA);
        setAlunoAtual(DEMO_DATA[0]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSliderChange = (key, val) => {
    if (!alunoAtual) return;
    const valNum = parseInt(val);
    const updated = { ...alunoAtual, [key]: valNum };
    setAlunoAtual(updated);
    
    // Update locally immediately
    setAlunos(prev => prev.map(a => a.id === updated.id ? updated : a));
    
    // Invalidate IA cache
    const newCache = { ...iaCache };
    delete newCache[updated.id];
    setIaCache(newCache);
    setIaError('');

    // Debounce save to Supabase
    if (window.saveTimeout) clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(async () => {
      try {
        await atualizarAluno(updated.id, updated);
      } catch (e) {
        addToast('Erro ao salvar alteração: ' + e.message, 'error');
      }
    }, 800);
  };

  const handlePedirIA = async () => {
    if (!alunoAtual) return;
    if (!apiKey) {
      addToast('Cole sua chave DeepSeek API na barra de configuração.', 'error');
      return;
    }
    
    setIaLoading(true);
    setIaError('');
    try {
      const markdown = await gerarDiagnostico(alunoAtual, apiKey);
      
      // Simple markdown to HTML conversion
      const html = markdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n{2,}/g, '</p><p>')
        .replace(/\n/g, '<br>');
        
      setIaCache(prev => ({ ...prev, [alunoAtual.id]: `<p>${html}</p>` }));
    } catch (e) {
      setIaError(e.message);
      addToast(e.message, 'error');
    } finally {
      setIaLoading(false);
    }
  };

  const openNewModal = () => {
    setModalMode('new');
    setFormData({
      nome: '', idade: '', escola: '',
      assimilacao: 1, tratamento: 1, conversao: 1, relacoes: 1, mobilizacao: 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (!alunoAtual) return;
    setModalMode('edit');
    setFormData({ ...alunoAtual });
    setIsModalOpen(true);
  };

  const saveAluno = async () => {
    if (!formData.nome?.trim()) {
      addToast('Nome é obrigatório.', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      if (modalMode === 'edit') {
        const saved = await atualizarAluno(alunoAtual.id, formData);
        setAlunos(prev => prev.map(a => a.id === saved.id ? saved : a));
        setAlunoAtual(saved);
        addToast('Aluno atualizado com sucesso!');
      } else {
        const saved = await criarAluno(formData);
        setAlunos(prev => [...prev, saved]);
        setAlunoAtual(saved);
        addToast('Aluno cadastrado com sucesso!');
      }
      setIsModalOpen(false);
    } catch (e) {
      addToast('Erro: ' + e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!alunoAtual) return;
    if (!window.confirm(`Excluir o aluno "${alunoAtual.nome}"? Esta ação não pode ser desfeita.`)) return;
    
    try {
      await excluirAluno(alunoAtual.id);
      setAlunos(prev => prev.filter(a => a.id !== alunoAtual.id));
      setAlunoAtual(null);
      
      const newCache = { ...iaCache };
      delete newCache[alunoAtual.id];
      setIaCache(newCache);
      
      addToast('Aluno removido.');
    } catch (e) {
      addToast('Erro ao excluir: ' + e.message, 'error');
    }
  };

  return (
    <>
      {/* ─── HEADER ─── */}
      <header className="app-header">
        <div className="header-brand">
          <Image 
            src="/NeuroMap.png" 
            alt="NeuroMap Logo" 
            width={42} 
            height={42} 
            style={{ borderRadius: '10px', objectFit: 'cover' }} 
            priority
          />
          <div>
            <h1>NeuroMap</h1>
            <span>Diagnóstico Semiótico · TRRS · Duval</span>
          </div>
        </div>
        <nav className="header-meta">
          <span>Trabalho de Conclusão de Curso</span>
          <span className="separator">·</span>
          <span>Licenciatura em Matemática</span>
        </nav>
      </header>

      {/* ─── CONFIG BAR ─── */}
      <div className="config-bar">
        <span className={`status-dot ${apiKey ? 'ok' : 'idle'}`}></span>
        <label htmlFor="deepseekKey">
          <Settings size={14} /> DeepSeek API:
        </label>
        <input 
          type="password" 
          id="deepseekKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Cole sua chave sk-... aqui (usada apenas no seu navegador)"
        />
      </div>

      <div className="app-body">
        {/* ─── SIDEBAR ─── */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>📚 Lista de Alunos</h2>
            <button className="btn btn-primary btn-full" onClick={openNewModal}>
              <Plus size={16} /> Novo Aluno
            </button>
          </div>
          <div className="student-list">
            {loading ? (
              <div className="empty-state"><Loader2 className="icon animate-spin mx-auto" /></div>
            ) : alunos.length === 0 ? (
              <div className="empty-state"><div className="icon">📋</div><p>Nenhum aluno cadastrado.</p></div>
            ) : (
              alunos.map(a => {
                const media = calcMedia(a);
                const nivel = getNivelMedia(media);
                return (
                  <div 
                    key={a.id}
                    className={`student-item ${alunoAtual?.id === a.id ? 'active' : ''}`}
                    onClick={() => setAlunoAtual(a)}
                  >
                    <div>
                      <div className="s-name">{a.nome}</div>
                      <div className="s-school">{a.escola || '—'} {a.idade ? `· ${a.idade} anos` : ''}</div>
                    </div>
                    <span className={`s-avg pill ${nivel.cls}`}>{media.toFixed(1)}</span>
                  </div>
                );
              })
            )}
          </div>
          <div className="sidebar-footer">
            <button 
              className="btn btn-outline btn-full btn-sm" 
              disabled={!alunoAtual} 
              onClick={openEditModal}
            >
              <Edit2 size={14} /> Editar Selecionado
            </button>
            <button 
              className="btn btn-danger btn-full btn-sm mt-2" 
              disabled={!alunoAtual} 
              onClick={confirmDelete}
            >
              <Trash2 size={14} /> Excluir
            </button>
          </div>
        </aside>

        {/* ─── MAIN PANEL ─── */}
        <main className="main-panel">
          <div className="top-grid">
            {/* ─── CONTROLS CARD ─── */}
            <div className="card">
              <div style={{ marginBottom: '12px' }}>
                <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: '1.4rem', color: 'var(--navy)' }}>
                  {alunoAtual ? alunoAtual.nome : 'Selecione um aluno'}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {alunoAtual ? [alunoAtual.escola, alunoAtual.idade ? `${alunoAtual.idade} anos` : null].filter(Boolean).join(' · ') || 'Dados não informados' : ''}
                </p>
              </div>

              <div className="card-title">
                Dimensões TRRS
                <span className="badge">5 Categorias · 4 Níveis</span>
              </div>

              <div>
                {alunoAtual && DIMENSOES.map(d => {
                  const v = parseInt(alunoAtual[d.key]) || 1;
                  const nivel = getNivel(v);
                  const pct = ((v - 1) / 3 * 100).toFixed(0);
                  
                  return (
                    <div className="dim-group" key={d.key}>
                      <div className="dim-header">
                        <span className="dim-label" title={d.desc}>{d.label}</span>
                        <span className={`dim-val ${nivel.cls}`}>{nivel.label}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" max="4" 
                        value={v} 
                        style={{ '--pct': `${pct}%` }}
                        onChange={(e) => handleSliderChange(d.key, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* ─── IA SECTION ─── */}
              <div className="ia-section">
                <div className="ia-header">
                  <div className="ia-label">🔬 Diagnóstico Pedagógico IA <span>DeepSeek</span></div>
                  <button 
                    className="btn btn-success" 
                    disabled={!alunoAtual || iaLoading} 
                    onClick={handlePedirIA}
                  >
                    {iaLoading ? <><Loader2 size={14} className="animate-spin" /> Analisando...</> : 'Gerar Diagnóstico'}
                  </button>
                </div>
                <div className={`ia-output ${alunoAtual && iaCache[alunoAtual.id] ? 'ready' : ''}`}>
                  {!alunoAtual ? (
                    'Selecione um aluno e clique em Gerar Diagnóstico para que a IA analise o perfil semiótico.'
                  ) : iaLoading ? (
                    <span className="pulse">Gerando diagnóstico pedagógico para <strong>{alunoAtual.nome}</strong>…</span>
                  ) : iaError ? (
                    <span style={{ color: 'var(--ins)' }}>⚠ {iaError}</span>
                  ) : iaCache[alunoAtual.id] ? (
                    <div dangerouslySetInnerHTML={{ __html: iaCache[alunoAtual.id] }} />
                  ) : (
                    'Clique em Gerar Diagnóstico para que a IA analise o perfil semiótico deste aluno com base na Teoria de Duval.'
                  )}
                </div>
              </div>
            </div>

            {/* ─── RADAR CHART CARD ─── */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-title">
                Mapa Cognitivo — Gráfico Radar
                <span className="badge">TRRS</span>
              </div>
              <div className="chart-box">
                <RadarChart aluno={alunoAtual} />
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px', justifyContent: 'center' }}>
                <span className="pill ins">Insuficiente (1)</span>
                <span className="pill reg">Regular (2)</span>
                <span className="pill bom">Bom (3)</span>
                <span className="pill otm">Ótimo (4)</span>
              </div>
            </div>
          </div>

          {/* ─── HEATMAP CARD ─── */}
          <div className="card">
            <div className="card-title">
              📊 Mapa de Desempenho da Turma
              <span className="badge">Visão Global</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Escola</th>
                    <th>Assimilação</th>
                    <th>Tratamento</th>
                    <th>Conversão</th>
                    <th>Relações</th>
                    <th>Mobilização</th>
                    <th>Média</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}><Loader2 className="animate-spin mx-auto" /></td></tr>
                  ) : alunos.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Nenhum dado disponível</td></tr>
                  ) : (
                    alunos.map(a => {
                      const scores = DIMENSOES.map(d => parseInt(a[d.key]) || 1);
                      const media = scores.reduce((s, v) => s + v, 0) / scores.length;
                      const mNivel = getNivelMedia(media);
                      return (
                        <tr key={a.id} onClick={() => setAlunoAtual(a)} style={{ cursor: 'pointer' }}>
                          <td><strong>{a.nome}</strong></td>
                          <td><small style={{ color: 'var(--text-muted)' }}>{a.escola || '—'}</small></td>
                          {scores.map((v, i) => { 
                            const n = getNivel(v); 
                            return <td key={i} style={{ textAlign: 'center' }}><span className={`pill ${n.cls}`}>{n.label}</span></td>; 
                          })}
                          <td style={{ textAlign: 'center' }}><span className={`pill ${mNivel.cls}`}>{media.toFixed(1)}</span></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <footer style={{ textAlign: 'center', padding: '16px 0 8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            NeuroMap · TCC · Teoria dos Registros de Representação Semiótica (TRRS) de Raymond Duval · Licenciatura em Matemática
          </footer>
        </main>
      </div>

      {/* ─── MODAL ─── */}
      <div className={`modal-overlay ${isModalOpen ? 'open' : ''}`} onClick={(e) => { if(e.target === e.currentTarget) setIsModalOpen(false) }}>
        <div className="modal">
          <h2 className="modal-title">{modalMode === 'new' ? 'Novo Aluno' : 'Editar Aluno'}</h2>
          
          <div className="form-row">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Nome completo *</label>
              <input 
                type="text" 
                value={formData.nome || ''} 
                onChange={e => setFormData({...formData, nome: e.target.value})} 
                placeholder="Ex.: Ana Paula Ferreira" 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Idade</label>
              <input 
                type="number" 
                min="5" max="99" 
                value={formData.idade || ''} 
                onChange={e => setFormData({...formData, idade: e.target.value})} 
                placeholder="Ex.: 14" 
              />
            </div>
            <div className="form-group">
              <label>Escola / Instituição</label>
              <input 
                type="text" 
                value={formData.escola || ''} 
                onChange={e => setFormData({...formData, escola: e.target.value})} 
                placeholder="Ex.: E.E. Amazonas" 
              />
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
            <strong>Avaliação TRRS:</strong> Selecione o nível de desempenho em cada dimensão. 1 = Insuficiente · 2 = Regular · 3 = Bom · 4 = Ótimo
          </p>

          <div className="form-row">
            {DIMENSOES.map(d => (
              <div className="form-group" key={d.key}>
                <label>{d.label}</label>
                <select 
                  value={formData[d.key] || 1} 
                  onChange={e => setFormData({...formData, [d.key]: e.target.value})}
                >
                  <option value="1">1 — Insuficiente</option>
                  <option value="2">2 — Regular</option>
                  <option value="3">3 — Bom</option>
                  <option value="4">4 — Ótimo</option>
                </select>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" disabled={isSaving} onClick={saveAluno}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── TOASTS ─── */}
      <div id="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`} style={{ animation: 'slideIn 0.3s ease' }}>
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}
