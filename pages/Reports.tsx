
import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const productivityData = [
  { name: 'Seg', rec: 400, exp: 240 },
  { name: 'Ter', rec: 300, exp: 139 },
  { name: 'Qua', rec: 200, exp: 980 },
  { name: 'Qui', rec: 278, exp: 390 },
  { name: 'Sex', rec: 189, exp: 480 },
  { name: 'Sab', rec: 239, exp: 380 },
  { name: 'Dom', rec: 349, exp: 430 },
];

export const Reports: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Relatórios e BI</h2>
          <p className="text-[#617589] font-medium">Análise de performance, acuracidade e throughput do armazém.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Ultimos 30 dias
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#1a222c] p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold">Produtividade de Operações</h3>
              <p className="text-xs text-gray-500 font-medium">Recebimento vs Expedição por dia</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary"></span><span className="text-[10px] font-black text-gray-500 uppercase">Recebimento</span></div>
              <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-purple-500"></span><span className="text-[10px] font-black text-gray-500 uppercase">Expedição</span></div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#137fec" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#617589" fontSize={11} fontWeight="bold" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="rec" stroke="#137fec" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" />
                <Area type="monotone" dataKey="exp" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a222c] p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Acuracidade de Inventário</h3>
          <div className="space-y-6">
            {[
              { label: 'Acuracidade Geral', value: '99.85%', color: 'bg-green-500', width: '99.85%' },
              { label: 'Setor A - Eletrônicos', value: '98.20%', color: 'bg-primary', width: '98.20%' },
              { label: 'Setor B - Alimentos', value: '99.95%', color: 'bg-green-500', width: '99.95%' },
              { label: 'Setor C - Ferramentas', value: '97.50%', color: 'bg-orange-500', width: '97.50%' },
            ].map((row, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">{row.label}</span>
                  <span className="text-sm font-black text-gray-700 dark:text-gray-300">{row.value}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${row.color}`} style={{ width: row.width }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 leading-relaxed italic">
              "A acuracidade geral está acima da meta (99.50%). O Setor C requer auditoria preventiva devido a divergências recorrentes no último trimestre."
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: 'Cycle Time Médio',
            value: '42 min',
            change: '-5min',
            color: 'text-blue-500',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="size-10 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            )
          },
          {
            label: 'Lead Time Médio',
            value: '2.4 dias',
            change: '+0.2d',
            color: 'text-purple-500',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="size-10 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            )
          },
          {
            label: 'Custo de Operação',
            value: 'R$ 1.42/un',
            change: '-R$ 0.12',
            color: 'text-green-500',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="size-10 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            )
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-[#1a222c] p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-[10px] font-black uppercase mb-1 tracking-widest">{kpi.label}</p>
              <p className="text-2xl font-black">{kpi.value}</p>
              <span className="text-xs font-black text-green-600">{kpi.change}</span>
            </div>
            <div className={kpi.color}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
