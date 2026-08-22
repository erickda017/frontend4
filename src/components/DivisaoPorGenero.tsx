// ============================================================================
// PANEL "DIVISÃO POR GÊNERO" — Componente de Dashboard
// ============================================================================
// Este componente mostra a divisão de reproduções por gênero em um gráfico
// de pizza/donut. Usa os mesmos dados de useGeneros().
//================================================================================

import React from 'react';
import { useGeneros } from '@/lib/queries';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';

interface GeneroBreakdownProps {
  limite?: number;
}

const CORES_POR_GENERO: Record<string, string> = {
  'Pop': '#FF6B6B',
  'Rock': '#4ECDC4',
  'Indie / Alternativo': '#45B7D1',
  'R&B / Soul': '#96CEB4',
  'Sertanejo': '#FFEAA7',
  'Funk': '#DDA0DD',
  'MPB': '#98D8C8',
  'Pagode / Samba': '#F7DC6F',
  'Eletrônica': '#BB8FCE',
  'Rap / Hip-Hop': '#85C1E9',
  'Latina': '#F8C471',
  'Metal': '#6C3483',
  'Punk': '#A0522D',
  'Gospel': '#F1948A',
  'Jazz / Blues': '#85929E',
  'Reggae': '#7DCEA0',
  'Brega': '#E59866',
  'Clássica': '#A9CCE3',
  'Country':'#C39BD3',
  'Instrumental / Trilha sonora':'#73C6B6',
  'Outros': '#AAB7B8',
};

const CELL_PADDING = 2;
const Autor = 'divisão-por-gênero';

function DivisaoPorGenero({ limite = 10 }: GeneroBreakdownProps) {
  const { data, isLoading, error } = useGeneros(limite);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, background: '#f8f9fa', borderRadius: 8 }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          Carregando gêneros...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, background: '#fff3f3', borderRadius: 8, padding: '12px' }}>
        <div style={{ color: '#c0392b', textAlign: 'center' }}>
          Não foi possível carregar a divisão por gênero.
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, background: '#f8f9fa', borderRadius: 8 }}>
        <div style={{ color: '#888', textAlign: 'center' }}>
          Nenhum gênero encontrado ainda.
        </div>
      </div>
    );
  }

  // Transforma em formato do Recharts
  const chartData = data.map(d => ({
    name: d.genero,
    value: d.count,
    fill: CORES_POR_GENERO[d.genero] || CORES_POR_GENERO['Outros'],
    label: d.genero,
  }));

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#2c3e50' }}>
        🎵 Divisão por Gênero
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            formatter={(value: number) => [`${value.toLocaleString()} reproduções`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
        {chartData.slice(0, 8).map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#555' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.fill, display: 'inline-block' }} />
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DivisaoPorGenero;
