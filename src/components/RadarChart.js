'use client';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { DIMENSOES, NIVEIS, CHART_COLORS } from '@/lib/config';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
);

const LABELS = DIMENSOES.map(d => d.label);

export default function RadarChart({ aluno }) {
  const dataValues = DIMENSOES.map(d => parseInt(aluno?.[d.key] || 0));

  const data = {
    labels: LABELS,
    datasets: [
      {
        data: dataValues,
        borderColor: CHART_COLORS.border,
        borderWidth: 2.5,
        pointBackgroundColor: CHART_COLORS.point,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        fill: true,
        backgroundColor: CHART_COLORS.fill,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400, easing: 'easeInOutQuart' },
    scales: {
      r: {
        min: 0,
        max: 4,
        ticks: {
          stepSize: 1,
          display: true,
          callback: (v) => ['', 'Ins', 'Reg', 'Bom', 'Ótm'][v] || '',
          font: { size: 9 },
          color: '#94a3b8',
          backdropColor: 'transparent',
        },
        grid: { color: 'rgba(26,45,74,0.08)' },
        angleLines: { color: 'rgba(26,45,74,0.12)' },
        pointLabels: {
          font: { size: 12, weight: '600', family: 'Inter, sans-serif' },
          color: '#1a2d4a',
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.raw;
            const nivel = NIVEIS.find(n => n.val === v);
            return ` ${nivel ? nivel.label : v}`;
          },
        },
      },
    },
  };

  const plugins = [
    {
      id: 'radarGradient',
      beforeDatasetsDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        const cx = (chartArea.left + chartArea.right) / 2;
        const cy = (chartArea.top + chartArea.bottom) / 2;
        const r = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(46,125,247,0.15)');
        g.addColorStop(0.6, 'rgba(62,207,142,0.10)');
        g.addColorStop(1, 'rgba(46,125,247,0.04)');
        chart.data.datasets[0].backgroundColor = g;
      },
    },
  ];

  return <Radar data={data} options={options} plugins={plugins} />;
}
