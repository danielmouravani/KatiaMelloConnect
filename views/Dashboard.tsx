import React, { useMemo, useState } from 'react';
import { Referral, SurgeryType } from '../types';
import { 
  TrendingUp, 
  Users, 
  Award, 
  AlertCircle, 
  PieChart,
  Wallet,
  Calendar,
  Activity,
  Printer,
  Filter,
  Stethoscope,
  CheckCircle2
} from 'lucide-react';

interface DashboardProps {
  data: Referral[];
}

type DateFilter = 'today' | 'month' | '30days' | 'all' | 'custom';

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  
  // --- ESTADO DOS FILTROS ---
  const [filterType, setFilterType] = useState<DateFilter>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // --- FILTRAGEM DE DADOS ---
  const filteredData = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).getTime();

    return data.filter(item => {
      const itemDate = item.timestamp;
      
      switch (filterType) {
        case 'today':
          return itemDate >= startOfDay;
        case 'month':
          return itemDate >= startOfMonth;
        case '30days':
          return itemDate >= thirtyDaysAgo;
        case 'custom':
          if (customStart && customEnd) {
            // Ajustar fuso para garantir comparação correta do dia
            const start = new Date(customStart).getTime(); // 00:00 do dia
            const end = new Date(customEnd).setHours(23, 59, 59, 999); // Final do dia
            return itemDate >= start && itemDate <= end;
          }
          return true;
        case 'all':
        default:
          return true;
      }
    });
  }, [data, filterType, customStart, customEnd]);

  // --- CÁLCULOS ESTATÍSTICOS (BI) ---
  const stats = useMemo(() => {
    const total = filteredData.length;
    const pending = filteredData.filter(r => r.status === 'pending').length;
    const operated = filteredData.filter(r => r.status === 'operated').length;
    const cancelled = filteredData.filter(r => r.status === 'cancelled').length;
    
    // Taxas
    const conversionRate = total > 0 ? Math.round((operated / total) * 100) : 0;
    const cancelRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
    const pendingRate = total > 0 ? Math.round((pending / total) * 100) : 0;

    // Ranking de Médicos
    const doctorCounts: Record<string, { total: number; operated: number }> = {};
    filteredData.forEach(r => {
      const docName = r.referringDoctor || 'Desconhecido';
      if (!doctorCounts[docName]) {
        doctorCounts[docName] = { total: 0, operated: 0 };
      }
      doctorCounts[docName].total += 1;
      if (r.status === 'operated') {
        doctorCounts[docName].operated += 1;
      }
    });

    const sortedDoctors = Object.entries(doctorCounts)
      .map(([name, stats]) => ({ 
        name, 
        ...stats, 
        rate: stats.total > 0 ? Math.round((stats.operated / stats.total) * 100) : 0 
      }))
      .sort((a, b) => b.total - a.total); // Pegar todos para o relatório

    // Mix de Cirurgias para Donut Chart
    const surgeryCounts: Record<string, number> = {};
    Object.values(SurgeryType).forEach(t => surgeryCounts[t] = 0);
    
    filteredData.forEach(r => {
      const type = r.surgeryType || 'Outros';
      surgeryCounts[type] = (surgeryCounts[type] || 0) + 1;
    });

    let sortedSurgeries = Object.entries(surgeryCounts)
      .sort((a, b) => b[1] - a[1])
      .filter(item => item[1] > 0);
    
    const totalSurgeries = sortedSurgeries.reduce((acc, curr) => acc + curr[1], 0);
    const surgeryData = sortedSurgeries.map(([name, value], index) => {
      const colors = ['#3b82f6', '#0ea5e9', '#6366f1', '#8b5cf6', '#cbd5e1'];
      return {
        name,
        value,
        percent: totalSurgeries > 0 ? Math.round((value / totalSurgeries) * 100) : 0,
        color: colors[index % colors.length]
      };
    });

    // Convênios
    const insuranceCounts: Record<string, number> = {};
    filteredData.forEach(r => {
      const ins = r.insurance ? r.insurance.trim() : 'Não Informado';
      insuranceCounts[ins] = (insuranceCounts[ins] || 0) + 1;
    });

    const sortedInsurance = Object.entries(insuranceCounts)
      .sort((a, b) => b[1] - a[1]); // Pegar todos para o relatório

    return {
      total,
      pending,
      operated,
      cancelled,
      conversionRate,
      cancelRate,
      pendingRate,
      sortedDoctors, // Todos os médicos
      topDoctors: sortedDoctors.slice(0, 6), // Top 6 para o dashboard visual
      surgeryData,
      sortedInsurance, // Todos convênios
      topInsurance: sortedInsurance.slice(0, 5) // Top 5 para dashboard
    };
  }, [filteredData]);

  // Helper para Conic Gradient (Gráfico de Rosca)
  const donutGradient = useMemo(() => {
    if (stats.total === 0) return '#e2e8f0 0deg 360deg';
    
    let currentDeg = 0;
    return stats.surgeryData.map(item => {
      const deg = (item.value / stats.total) * 360;
      const str = `${item.color} ${currentDeg}deg ${currentDeg + deg}deg`;
      currentDeg += deg;
      return str;
    }).join(', ');
  }, [stats]);

  const handlePrint = () => {
    try {
      window.focus();
      setTimeout(() => {
        window.print();
      }, 200);
    } catch (e) {
      console.error("Erro ao imprimir:", e);
      alert("Pressione Ctrl+P para imprimir.");
    }
  };

  // Títulos de Período para Exibição
  const periodLabel = {
    'today': 'Hoje',
    'month': 'Este Mês',
    '30days': 'Últimos 30 Dias',
    'all': 'Todo o Período',
    'custom': 'Período Personalizado'
  }[filterType];

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="p-4 bg-slate-50 rounded-full mb-4">
          <Activity size={48} className="text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Aguardando Dados</h3>
        <p className="text-slate-500 mt-2">O dashboard será gerado assim que houver indicações.</p>
      </div>
    );
  }

  return (
    <>
      {/* ==================================================================================
          VIEW 1: TELA INTERATIVA (Dashboard Glassmorphism)
          Escondido na impressão (print:hidden)
         ================================================================================== */}
      <div className="space-y-6 animate-fade-in pb-10 print:hidden">
        
        {/* --- CONTROL BAR --- */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 hidden sm:block">
              <Filter size={20} />
            </div>
            <span className="font-bold text-slate-700 hidden sm:block">Período:</span>
            <div className="flex flex-wrap bg-slate-100 rounded-lg p-1 w-full sm:w-auto">
              {(['today', 'month', '30days', 'all'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    filterType === type 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {{
                    'today': 'Hoje',
                    'month': 'Mês',
                    '30days': '30 Dias',
                    'all': 'Tudo'
                  }[type]}
                </button>
              ))}
              <button
                  onClick={() => setFilterType('custom')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    filterType === 'custom' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Personalizado
              </button>
            </div>
          </div>

          {filterType === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200 animate-fade-in w-full sm:w-auto">
               <input 
                 type="date" 
                 value={customStart}
                 onChange={(e) => setCustomStart(e.target.value)}
                 className="bg-white border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
               />
               <span className="text-slate-400">-</span>
               <input 
                 type="date" 
                 value={customEnd}
                 onChange={(e) => setCustomEnd(e.target.value)}
                 className="bg-white border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
               />
            </div>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="w-full lg:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors shadow-md hover:shadow-lg ml-auto cursor-pointer relative z-10"
          >
            <Printer size={18} />
            Imprimir Relatório
          </button>
        </div>

        {/* Header Display */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-2 md:gap-4 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard Gerencial</h2>
            <p className="text-slate-500 text-xs sm:text-sm flex items-center gap-2 mt-1">
              <Calendar size={14} />
              Exibindo dados de: <span className="font-bold text-slate-700">{periodLabel}</span>
            </p>
          </div>
        </div>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-600 text-white rounded-xl shadow-blue-200 shadow-lg">
                <Users size={22} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Total de Indicações</p>
            <h3 className="text-4xl font-black text-slate-800 mt-1 tracking-tight">{stats.total}</h3>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-lg transition-shadow">
             <div className="flex justify-between items-center h-full">
               <div>
                  <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-indigo-200 shadow-lg mb-4 w-fit">
                    <TrendingUp size={22} />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Conversão</p>
                  <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.conversionRate}%</h3>
               </div>
               <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4f46e5" strokeWidth="4" strokeDasharray={`${stats.conversionRate}, 100`} />
                  </svg>
               </div>
             </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-500 text-white rounded-xl shadow-amber-200 shadow-lg">
                <Activity size={22} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Fila de Espera</p>
            <h3 className="text-4xl font-black text-slate-800 mt-1">{stats.pending}</h3>
            <p className="text-xs text-slate-400 mt-2">{stats.pendingRate}% do total</p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-lg transition-shadow">
             <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-rose-500 text-white rounded-xl shadow-rose-200 shadow-lg">
                <AlertCircle size={22} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Perdas</p>
            <h3 className="text-4xl font-black text-slate-800 mt-1">{stats.cancelled}</h3>
            <p className="text-xs text-slate-400 mt-2">{stats.cancelRate}% do total</p>
          </div>
        </div>

        {/* --- MAIN CHARTS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEADERBOARD */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Award size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Ranking de Médicos</h3>
            </div>

            <div className="space-y-4">
              {stats.topDoctors.length === 0 ? (
                 <p className="text-slate-400 italic">Sem dados para exibir</p>
              ) : (
                stats.topDoctors.map((doc, index) => {
                  const maxVal = stats.topDoctors[0].total;
                  const widthPercent = (doc.total / maxVal) * 100;
                  
                  let rankColor = "bg-slate-100 text-slate-600";
                  let barGradient = "from-slate-400 to-slate-500";
                  if (index === 0) { rankColor = "bg-yellow-100 text-yellow-700"; barGradient = "from-yellow-400 to-amber-500"; }
                  if (index === 1) { rankColor = "bg-slate-200 text-slate-700"; barGradient = "from-slate-400 to-slate-500"; }
                  if (index === 2) { rankColor = "bg-orange-100 text-orange-700"; barGradient = "from-orange-400 to-orange-500"; }
                  
                  return (
                    <div key={doc.name} className="relative">
                      <div className="flex justify-between items-end mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${rankColor}`}>
                            {index + 1}
                          </div>
                          <span className="font-semibold text-slate-700 text-sm truncate max-w-[150px]">{doc.name}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          <strong className="text-slate-800">{doc.operated}</strong> op. / {doc.total}
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-100">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
                          style={{ width: `${widthPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DONUT CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <PieChart size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Mix Cirúrgico</h3>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center">
                {stats.total === 0 ? (
                  <p className="text-slate-400 italic">Sem dados</p>
                ) : (
                  <>
                    <div 
                      className="relative w-40 h-40 rounded-full"
                      style={{ 
                        background: `conic-gradient(${donutGradient})` 
                      }}
                    >
                      <div className="absolute inset-0 m-auto w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                        <span className="text-2xl font-black text-slate-800">{stats.total}</span>
                      </div>
                    </div>
                    <div className="w-full mt-6 space-y-1">
                      {stats.surgeryData.map((item) => (
                        <div key={item.name} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-slate-600 font-medium truncate w-28">{item.name}</span>
                          </div>
                          <span className="font-bold text-slate-700">{item.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
          </div>
        </div>

        {/* --- ROW 3: BOTTOM INFO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Insurance */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <Wallet size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Principais Convênios</h3>
            </div>
            
            <div className="space-y-3">
               {stats.topInsurance.length === 0 ? (
                 <p className="text-slate-400 italic">Sem dados para exibir</p>
               ) : (
                 stats.topInsurance.map(([ins, count], index) => {
                   const maxCount = stats.topInsurance[0][1];
                   const percentage = Math.round((count / maxCount) * 100);

                   let rankClass = "bg-slate-50 text-slate-500 border-slate-100";
                   if (index === 0) rankClass = "bg-yellow-50 text-yellow-700 border-yellow-100";
                   if (index === 1) rankClass = "bg-slate-100 text-slate-700 border-slate-200";
                   if (index === 2) rankClass = "bg-orange-50 text-orange-800 border-orange-100";

                   return (
                    <div key={ins} className="relative flex flex-col p-3 rounded-xl border border-slate-50 hover:border-slate-200 hover:bg-slate-50 transition-all group">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${rankClass}`}>
                               {index + 1}º
                             </div>
                             <span className="font-bold text-slate-700 text-sm">{ins || 'Não Informado'}</span>
                          </div>
                          <div className="text-right">
                             <span className="text-lg font-black text-slate-800">{count}</span>
                             <span className="text-[10px] text-slate-400 ml-1 font-medium uppercase">Pac.</span>
                          </div>
                       </div>
                       <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full transition-all duration-700 ${
                              index === 0 ? 'bg-yellow-500' : 'bg-green-500'
                           }`}
                           style={{ width: `${percentage}%` }}
                         ></div>
                       </div>
                    </div>
                   );
                 })
               )}
            </div>
          </div>

          {/* Funnel */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100">
             <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                <Stethoscope size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Funil de Conversão</h3>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-blue-600 text-white p-2 rounded flex justify-between items-center">
                 <span className="font-bold text-xs uppercase ml-2">Recebidos</span>
                 <span className="bg-blue-700 px-2 rounded text-xs font-bold">{stats.total}</span>
              </div>
              <div className="w-[85%] mx-auto bg-amber-500 text-white p-2 rounded flex justify-between items-center">
                 <span className="font-bold text-xs uppercase ml-2">Em Andamento</span>
                 <span className="bg-amber-600 px-2 rounded text-xs font-bold">{stats.pending}</span>
              </div>
              <div className="w-[70%] mx-auto bg-green-600 text-white p-2 rounded flex justify-between items-center">
                 <span className="font-bold text-xs uppercase ml-2">Realizados</span>
                 <span className="bg-green-700 px-2 rounded text-xs font-bold">{stats.operated}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- DETAILED DATA TABLE PREVIEW --- */}
        <div className="mt-8 pt-8 border-t border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Detalhamento Analítico (Últimos Registros)
          </h3>
          
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
                  <th className="p-3 border-b border-slate-200">Data</th>
                  <th className="p-3 border-b border-slate-200">Paciente</th>
                  <th className="p-3 border-b border-slate-200">Médico</th>
                  <th className="p-3 border-b border-slate-200">Cirurgia</th>
                  <th className="p-3 border-b border-slate-200 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.slice(0, 5).map(row => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="p-3 whitespace-nowrap text-slate-600">{new Date(row.timestamp).toLocaleDateString()}</td>
                    <td className="p-3 font-medium">{row.patientName}</td>
                    <td className="p-3 text-slate-600">{row.referringDoctor}</td>
                    <td className="p-3 text-slate-600">{row.surgeryType}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        row.status === 'operated' ? 'bg-green-50 text-green-700 border-green-200' :
                        row.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {row.status === 'operated' ? 'OPERADO' : row.status === 'cancelled' ? 'CANCELADO' : 'PENDENTE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center italic">Para o relatório completo, clique em "Imprimir Relatório".</p>
        </div>
      </div>


      {/* ==================================================================================
          VIEW 2: LAYOUT DE IMPRESSÃO (Relatório Formal)
          Visível apenas na impressão (print:block)
         ================================================================================== */}
      <div className="hidden print:block print:w-full font-sans text-black p-4">
        
        {/* Header do Relatório */}
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
             <h1 className="text-2xl font-bold uppercase tracking-wide">Relatório Operacional</h1>
             <h2 className="text-lg font-medium text-slate-700">Centro da Saúde Ocular Katia Mello</h2>
          </div>
          <div className="text-right text-sm">
            <p>Período: <span className="font-bold">{periodLabel}</span></p>
            {filterType === 'custom' && <p className="text-xs">{new Date(customStart).toLocaleDateString()} - {new Date(customEnd).toLocaleDateString()}</p>}
            <p className="text-xs mt-1 text-slate-500">Gerado em: {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Resumo Executivo (KPI Table) */}
        <div className="mb-8">
           <h3 className="text-sm font-bold uppercase border-b border-slate-400 mb-2 pb-1">Resumo Executivo</h3>
           <table className="w-full border-collapse border border-slate-300 text-sm">
             <thead className="bg-slate-100">
               <tr>
                 <th className="border border-slate-300 p-2 text-center">Total Indicações</th>
                 <th className="border border-slate-300 p-2 text-center">Realizadas</th>
                 <th className="border border-slate-300 p-2 text-center">Pendentes</th>
                 <th className="border border-slate-300 p-2 text-center">Taxa Conversão</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td className="border border-slate-300 p-3 text-center font-bold text-lg">{stats.total}</td>
                 <td className="border border-slate-300 p-3 text-center text-lg">{stats.operated}</td>
                 <td className="border border-slate-300 p-3 text-center text-lg">{stats.pending}</td>
                 <td className="border border-slate-300 p-3 text-center font-bold text-lg">{stats.conversionRate}%</td>
               </tr>
             </tbody>
           </table>
        </div>

        {/* Tabelas Lado a Lado */}
        <div className="grid grid-cols-2 gap-8 mb-8 break-inside-avoid">
          
          {/* Tabela Médicos */}
          <div>
             <h3 className="text-sm font-bold uppercase border-b border-slate-400 mb-2 pb-1">Performance por Médico</h3>
             <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-1 text-left border-b border-slate-300">Médico</th>
                    <th className="p-1 text-center border-b border-slate-300">Total</th>
                    <th className="p-1 text-center border-b border-slate-300">Op.</th>
                    <th className="p-1 text-center border-b border-slate-300">%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.sortedDoctors.map(doc => (
                    <tr key={doc.name} className="border-b border-slate-200">
                      <td className="p-1 truncate max-w-[120px]">{doc.name}</td>
                      <td className="p-1 text-center">{doc.total}</td>
                      <td className="p-1 text-center">{doc.operated}</td>
                      <td className="p-1 text-center font-bold">{doc.rate}%</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>

          {/* Tabela Mix Cirúrgico & Convênios */}
          <div>
             <h3 className="text-sm font-bold uppercase border-b border-slate-400 mb-2 pb-1">Convênios (Top 10)</h3>
             <table className="w-full text-xs border border-slate-300 mb-6">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-1 text-left border-b border-slate-300">Convênio</th>
                    <th className="p-1 text-center border-b border-slate-300">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.sortedInsurance.slice(0, 10).map(([name, val]) => (
                    <tr key={name} className="border-b border-slate-200">
                      <td className="p-1 truncate">{name || 'Não Informado'}</td>
                      <td className="p-1 text-center">{val}</td>
                    </tr>
                  ))}
                </tbody>
             </table>

             <h3 className="text-sm font-bold uppercase border-b border-slate-400 mb-2 pb-1">Tipos de Cirurgia</h3>
             <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-1 text-left border-b border-slate-300">Procedimento</th>
                    <th className="p-1 text-center border-b border-slate-300">Qtd</th>
                    <th className="p-1 text-center border-b border-slate-300">%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.surgeryData.map(item => (
                    <tr key={item.name} className="border-b border-slate-200">
                      <td className="p-1 truncate">{item.name}</td>
                      <td className="p-1 text-center">{item.value}</td>
                      <td className="p-1 text-center">{item.percent}%</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* Listagem Detalhada */}
        <div className="break-before-page">
           <h3 className="text-sm font-bold uppercase border-b border-slate-400 mb-2 pb-1">Detalhamento Analítico</h3>
           <table className="w-full text-xs text-left border border-slate-300">
             <thead className="bg-slate-100">
               <tr>
                 <th className="p-2 border border-slate-300">Data</th>
                 <th className="p-2 border border-slate-300">Paciente</th>
                 <th className="p-2 border border-slate-300">Médico</th>
                 <th className="p-2 border border-slate-300">Cirurgia</th>
                 <th className="p-2 border border-slate-300">Convênio</th>
                 <th className="p-2 border border-slate-300 text-center">Status</th>
               </tr>
             </thead>
             <tbody>
               {filteredData.map((row, index) => (
                 <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                   <td className="p-2 border border-slate-200">{new Date(row.timestamp).toLocaleDateString()}</td>
                   <td className="p-2 border border-slate-200 font-medium">{row.patientName}</td>
                   <td className="p-2 border border-slate-200">{row.referringDoctor}</td>
                   <td className="p-2 border border-slate-200">{row.surgeryType}</td>
                   <td className="p-2 border border-slate-200">{row.insurance || '-'}</td>
                   <td className="p-2 border border-slate-200 text-center">
                      {row.status === 'operated' ? 'OPERADO' : row.status === 'cancelled' ? 'CANCELADO' : 'PENDENTE'}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
        
        {/* Footer Relatório */}
        <div className="mt-8 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500">
          <p>© {new Date().getFullYear()} Katia Mello Connect - Documento Confidencial de Uso Interno.</p>
        </div>

      </div>
    </>
  );
};

export default Dashboard;