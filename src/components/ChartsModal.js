'use client';
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ChartsModal({ isOpen, onClose, type, services }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    // Destroy previous instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    
    if (type === 'projection') {
      const datasets = [];
      const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
      ];
      let colorIndex = 0;

      // Group active unpaid expenses by name
      const itemNames = [
        ...new Set(
          services
            .filter((s) => s.type !== 'income' && !s.isPaid)
            .map((s) => s.name)
        )
      ];

      itemNames.forEach((name) => {
        const data = months.map((_, mIndex) => {
          const itemsInMonth = services.filter(
            (s) =>
              s.paymentMonth === mIndex &&
              s.name === name &&
              s.type !== 'income' &&
              !s.isPaid
          );
          return itemsInMonth.reduce((sum, item) => sum + item.amount, 0);
        });

        if (data.some((val) => val > 0)) {
          datasets.push({
            label: name,
            data: data,
            backgroundColor: colors[colorIndex % colors.length],
          });
          colorIndex++;
        }
      });

      chartInstanceRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: months.map((m) => m.substring(0, 3)),
          datasets: datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true },
            y: { stacked: true },
          },
          plugins: {
            legend: { labels: { color: '#f8fafc' } },
          },
        },
      });
    } else if (type === 'consumption') {
      const physicalServices = services.filter(
        (s) => s.consumptionUnit !== undefined && s.consumptionUnit !== null
      );

      const serviceNames = [...new Set(physicalServices.map((s) => s.name))];
      const datasets = [];
      const colors = ['#f59e0b', '#38bdf8', '#ef4444'];

      serviceNames.forEach((name, index) => {
        const data = months.map((_, mIndex) => {
          const item = physicalServices.find(
            (s) => s.paymentMonth === mIndex && s.name === name
          );
          return item ? item.consumptionUnit : null;
        });

        if (data.some((val) => val !== null)) {
          datasets.push({
            label: `${name} (Consumo Físico)`,
            data: data,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length],
            tension: 0.3,
            spanGaps: true,
          });
        }
      });

      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: months.map((m) => m.substring(0, 3)),
          datasets: datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#f8fafc' } },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255,255,255,0.1)' },
              ticks: { color: '#94a3b8' },
            },
            x: {
              grid: { color: 'rgba(255,255,255,0.1)' },
              ticks: { color: '#94a3b8' },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [isOpen, type, services]);

  if (!isOpen) return null;

  return (
    <div className="modal fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="backdrop-blur-md bg-slate-900/80 border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 max-w-4xl w-full relative">
        <button
          className="close-modal absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer transition-colors text-2xl"
          onClick={onClose}
          type="button"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold text-white mb-4">
          {type === 'projection' ? 'Proyección Anual de Gastos' : 'Historial de Consumo Físico (Luz / Gas)'}
        </h2>
        <div className="w-full h-[400px] mt-4">
          <canvas ref={canvasRef}></canvas>
        </div>
      </div>
    </div>
  );
}
