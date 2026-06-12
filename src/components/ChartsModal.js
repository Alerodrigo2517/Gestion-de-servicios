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
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Focus management when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      setTimeout(() => {
        if (modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]'
          );
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 50);
    } else {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  // Trap focus inside modal & Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll(
            'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]'
          )
        ).filter(el => el.tabIndex !== -1 && el.offsetParent !== null);

        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !focusableElements.includes(document.activeElement)) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement || !focusableElements.includes(document.activeElement)) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
            borderRadius: 4,
            borderSkipped: false
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
            x: { 
              stacked: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8', font: { family: 'var(--font-inter)', size: 10, weight: '500' } }
            },
            y: { 
              stacked: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8', font: { family: 'var(--font-inter)', size: 10, weight: '500' } }
            },
          },
          plugins: {
            legend: { 
              labels: { 
                color: '#cbd5e1', 
                boxWidth: 10, 
                boxHeight: 10,
                font: { family: 'var(--font-inter)', size: 11, weight: '600' } 
              } 
            },
            tooltip: {
              backgroundColor: 'rgba(9, 13, 22, 0.95)',
              titleFont: { family: 'var(--font-inter)', size: 12, weight: 'bold' },
              bodyFont: { family: 'var(--font-inter)', size: 11 },
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8
            }
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
          // Gradient fill under lines
          const colorHex = colors[index % colors.length];
          const fillGradient = ctx.createLinearGradient(0, 0, 0, 320);
          fillGradient.addColorStop(0, `${colorHex}25`); // 15% opacity
          fillGradient.addColorStop(1, `${colorHex}00`); // Transparent

          datasets.push({
            label: `${name} (Consumo Físico)`,
            data: data,
            borderColor: colorHex,
            backgroundColor: fillGradient,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: colorHex,
            pointBorderColor: '#090d16',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
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
            legend: { 
              labels: { 
                color: '#cbd5e1', 
                boxWidth: 10,
                boxHeight: 10,
                font: { family: 'var(--font-inter)', size: 11, weight: '600' } 
              } 
            },
            tooltip: {
              backgroundColor: 'rgba(9, 13, 22, 0.95)',
              titleFont: { family: 'var(--font-inter)', size: 12, weight: 'bold' },
              bodyFont: { family: 'var(--font-inter)', size: 11 },
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#94a3b8', font: { family: 'var(--font-inter)', size: 10 } },
            },
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#94a3b8', font: { family: 'var(--font-inter)', size: 10 } },
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
    <div className="modal fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fade-in">
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="charts-title"
        aria-describedby="charts-description"
        className="glass-premium border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 max-w-4xl w-full relative animate-slide-up"
      >
        <button
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer transition-colors text-2xl"
          onClick={onClose}
          aria-label="Cerrar modal"
          type="button"
        >
          &times;
        </button>
        <h2 id="charts-title" className="text-lg font-black text-white mb-2 tracking-tight">
          {type === 'projection' ? 'Proyección Anual de Gastos' : 'Historial de Consumo Físico'}
        </h2>
        <p id="charts-description" className="text-[11px] text-slate-400 mb-4 font-semibold">
          {type === 'projection' 
            ? 'Gráfico de barras que proyecta los montos a pagar mensualmente de tus servicios regulares.' 
            : 'Gráfico de líneas que ilustra la tendencia de tus consumos medidos en unidades físicas a lo largo del año.'}
        </p>
        <div className="w-full h-[380px] mt-4">
          <canvas ref={canvasRef}></canvas>
        </div>
      </div>
    </div>
  );
}
