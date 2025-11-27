import React, { useEffect, useState } from 'react';
import { ViewState, Referral, SurgeryType, ReferralStatus, SURGERY_CHECKLIST_STEPS } from '../types';
import { getReferrals, updateReferralStatus, updateReferralChecklist, updateReferralInsurance, updateReferralChecklistNotes } from '../services/storage';
import { LogOut, Search, Activity, RefreshCcw, Check, X, AlertCircle, Filter, ClipboardList, Save, CreditCard, LayoutDashboard, List, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import Dashboard from './Dashboard';

interface ReceptionProps {
  onNavigate: (view: ViewState) => void;
}

const Reception: React.FC<ReceptionProps> = ({ onNavigate }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'dashboard'>('list');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSurgery, setFilterSurgery] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  // Modal State for "Not Operated"
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Modal State for "Checklist & Insurance"
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [selectedReferralForChecklist, setSelectedReferralForChecklist] = useState<Referral | null>(null);
  const [insuranceInput, setInsuranceInput] = useState('');
  
  // Checklist Note State
  const [activeNoteStep, setActiveNoteStep] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const data = await getReferrals();
    setReferrals(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- HANDLERS STATUS ---
  const handleStatusChange = async (id: string, status: ReferralStatus, note: string = '') => {
    setIsUpdating(true);
    try {
      await updateReferralStatus(id, status, note);
      setReferrals(prev => prev.map(r => 
        r.id === id ? { ...r, status, note } : r
      ));
    } catch (error) {
      alert("Erro ao atualizar status.");
    } finally {
      setIsUpdating(false);
      setCancellationModalOpen(false);
      setCancellationReason('');
      setSelectedReferralId(null);
    }
  };

  const openCancellationModal = (id: string) => {
    setSelectedReferralId(id);
    setCancellationModalOpen(true);
  };

  // --- HANDLERS CHECKLIST & INSURANCE ---
  const openChecklistModal = (referral: Referral) => {
    setSelectedReferralForChecklist(referral);
    setInsuranceInput(referral.insurance || '');
    setChecklistModalOpen(true);
    setActiveNoteStep(null);
    setCurrentNote('');
  };

  const saveInsurance = async () => {
    if (!selectedReferralForChecklist) return;
    
    try {
      await updateReferralInsurance(selectedReferralForChecklist.id, insuranceInput);
      
      // Update local state
      setReferrals(prev => prev.map(r => 
        r.id === selectedReferralForChecklist.id ? { ...r, insurance: insuranceInput } : r
      ));
      
      setSelectedReferralForChecklist({
        ...selectedReferralForChecklist,
        insurance: insuranceInput
      });

      alert("Convênio salvo com sucesso!");
    } catch (e) {
      alert("Erro ao salvar convênio.");
    }
  };

  const toggleChecklistItem = async (stepName: string) => {
    if (!selectedReferralForChecklist) return;

    const currentChecklist = selectedReferralForChecklist.checklist || {};
    const newValue = !currentChecklist[stepName];
    
    const newChecklist = {
      ...currentChecklist,
      [stepName]: newValue
    };

    // Optimistic Update
    setSelectedReferralForChecklist({
      ...selectedReferralForChecklist,
      checklist: newChecklist
    });

    // Update Main List State
    setReferrals(prev => prev.map(r => 
        r.id === selectedReferralForChecklist.id 
        ? { ...r, checklist: newChecklist } 
        : r
    ));

    try {
      await updateReferralChecklist(selectedReferralForChecklist.id, newChecklist);
    } catch (e) {
      console.error("Erro ao salvar checklist", e);
      alert("Erro ao salvar item do checklist.");
    }
  };

  // --- HANDLERS CHECKLIST NOTES ---
  const toggleNoteInput = (stepName: string) => {
    if (activeNoteStep === stepName) {
      setActiveNoteStep(null);
      setCurrentNote('');
    } else {
      const savedNote = selectedReferralForChecklist?.checklistNotes?.[stepName] || '';
      setActiveNoteStep(stepName);
      setCurrentNote(savedNote);
    }
  };

  const saveChecklistNote = async (stepName: string) => {
    if (!selectedReferralForChecklist) return;

    const currentNotes = selectedReferralForChecklist.checklistNotes || {};
    const newNotes = {
      ...currentNotes,
      [stepName]: currentNote
    };

    // Optimistic Update
    setSelectedReferralForChecklist({
      ...selectedReferralForChecklist,
      checklistNotes: newNotes
    });

    // Update Main List State
    setReferrals(prev => prev.map(r => 
        r.id === selectedReferralForChecklist.id 
        ? { ...r, checklistNotes: newNotes } 
        : r
    ));

    try {
      await updateReferralChecklistNotes(selectedReferralForChecklist.id, newNotes);
      setActiveNoteStep(null);
    } catch (e) {
      console.error("Erro ao salvar nota", e);
      alert("Erro ao salvar observação.");
    }
  };

  const calculateProgress = (checklist: Record<string, boolean>) => {
    if (!checklist) return 0;
    const total = SURGERY_CHECKLIST_STEPS.length;
    const completed = SURGERY_CHECKLIST_STEPS.filter(step => checklist[step]).length;
    return Math.round((completed / total) * 100);
  };

  const handleLogout = () => {
    onNavigate(ViewState.HOME);
  };

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.surgeryType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.referringDoctor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSurgery = filterSurgery ? r.surgeryType === filterSurgery : true;
    
    let matchesDate = true;
    if (filterDate) {
      const referralDate = new Date(r.timestamp).toISOString().split('T')[0];
      matchesDate = referralDate === filterDate;
    }

    return matchesSearch && matchesSurgery && matchesDate;
  });

  return (
    <div className="w-full max-w-7xl space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Painel da Secretária</h2>
          <p className="text-slate-500 text-sm">Gerencie a lista, convênios e status dos pacientes.</p>
        </div>
        <div className="flex gap-3 self-start md:self-auto w-full md:w-auto">
           <button
            onClick={loadData}
            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors"
            title="Atualizar lista"
          >
            <RefreshCcw size={18} className={isLoading ? "animate-spin" : ""} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-medium rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row p-1 bg-slate-200 rounded-xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center justify-center gap-2 px-4 py-3 sm:py-2 rounded-lg text-sm font-semibold transition-all flex-1 sm:flex-initial ${
            activeTab === 'list' 
              ? 'bg-white text-slate-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <List size={18} />
          Lista Operacional
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center justify-center gap-2 px-4 py-3 sm:py-2 rounded-lg text-sm font-semibold transition-all flex-1 sm:flex-initial ${
            activeTab === 'dashboard' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutDashboard size={18} />
          Dashboard Gerencial (BI)
        </button>
      </div>

      {/* MAIN CONTENT */}
      {activeTab === 'dashboard' ? (
        <Dashboard data={referrals} />
      ) : (
        <>
          {/* Stats Card & Filters - ONLY IN LIST VIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stats Card */}
            <div className="bg-blue-600 text-white p-5 rounded-xl shadow-md flex flex-row lg:flex-col justify-between items-center lg:items-start gap-4">
              <div className="flex justify-between items-start w-full">
                 <p className="text-blue-100 text-sm font-medium">Total na Lista</p>
                 <div className="bg-blue-500 p-2 rounded-lg bg-opacity-50 hidden lg:block">
                   <Activity size={20} />
                 </div>
              </div>
              <div className="text-right lg:text-left">
                <p className="text-3xl font-bold">{referrals.length}</p>
                <p className="text-xs text-blue-200 mt-1">
                  {referrals.filter(r => r.status === 'pending').length} pendentes
                </p>
              </div>
            </div>

            {/* Filters Area */}
            <div className="lg:col-span-3 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4 text-slate-700 font-semibold">
                <Filter size={18} />
                <h3>Filtros de Busca</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Text Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={18} />
                  </div>
                  <input 
                    type="text"
                    placeholder="Buscar paciente, médico..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Surgery Dropdown */}
                <div>
                  <select
                    value={filterSurgery}
                    onChange={(e) => setFilterSurgery(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700"
                  >
                    <option value="">Todas as Cirurgias</option>
                    {Object.values(SurgeryType).map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div>
                  <input 
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700"
                  />
                </div>
              </div>
              
              {(filterSurgery || filterDate || searchTerm) && (
                <div className="mt-3 flex justify-end">
                  <button 
                    onClick={() => { setFilterSurgery(''); setFilterDate(''); setSearchTerm(''); }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 w-64">Paciente / Convênio</th>
                    <th className="p-4">Cirurgia / Médico</th>
                    <th className="p-4 w-48">Progresso</th>
                    <th className="p-4">Data</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                     <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400">
                        <div className="flex justify-center items-center gap-2">
                          <RefreshCcw className="animate-spin" size={24} />
                          <span>Carregando dados...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredReferrals.length > 0 ? (
                    filteredReferrals.map((referral) => {
                      const progress = calculateProgress(referral.checklist || {});
                      return (
                      <tr key={referral.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                              referral.status === 'operated' ? 'bg-green-500' : 
                              referral.status === 'cancelled' ? 'bg-red-400' : 'bg-slate-300'
                            }`}>
                              {referral.patientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{referral.patientName}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1">
                                <CreditCard size={10} />
                                {referral.insurance ? (
                                  <span className="font-semibold text-blue-600">{referral.insurance}</span>
                                ) : (
                                  <span className="italic text-slate-400">Sem convênio</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-700 font-medium">{referral.surgeryType}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Ind.: {referral.referringDoctor}</div>
                        </td>
                        <td className="p-4">
                           <div 
                             className="cursor-pointer group"
                             onClick={() => openChecklistModal(referral)}
                           >
                             <div className="flex justify-between items-center mb-1">
                               <span className="text-xs font-medium text-slate-600">{progress}%</span>
                               <ClipboardList size={14} className="text-slate-400 group-hover:text-blue-600" />
                             </div>
                             <div className="w-full bg-slate-200 rounded-full h-2">
                               <div 
                                 className={`h-2 rounded-full transition-all duration-500 ${
                                   progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                 }`} 
                                 style={{ width: `${progress}%` }}
                               ></div>
                             </div>
                             <div className="mt-1 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                               Gerenciar convênio e etapas
                             </div>
                           </div>
                        </td>
                        <td className="p-4 text-slate-500 text-sm">
                          <div className="flex flex-col">
                            <span className="text-slate-700 font-medium">
                              {new Date(referral.timestamp).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(referral.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {referral.status === 'operated' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              Operado
                            </span>
                          )}
                          {referral.status === 'cancelled' && (
                            <div className="flex flex-col items-center">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                Cancelado
                              </span>
                            </div>
                          )}
                          {referral.status === 'pending' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {referral.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleStatusChange(referral.id, 'operated')}
                                  disabled={isUpdating}
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-sm border border-green-200"
                                  title="Marcar como Operado"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => openCancellationModal(referral.id)}
                                  disabled={isUpdating}
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-200"
                                  title="Marcar como Não Operou"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            ) : (
                              <div className="text-xs text-slate-400 text-center max-w-[150px]">
                                {referral.status === 'cancelled' ? (
                                  <span title={referral.note}>
                                    {referral.note ? `Motivo: ${referral.note}` : 'Sem motivo registrado'}
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center gap-1 text-green-600">
                                    <Check size={14} /> Concluído
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )})
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Search size={32} className="text-slate-300 mb-2" />
                          <p className="font-medium">Nenhum resultado encontrado.</p>
                          <p className="text-sm">Tente ajustar os filtros de busca.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal for Cancellation Reason */}
      {cancellationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in mx-4">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-xl font-bold text-slate-800">Registrar Motivo</h3>
            </div>
            
            <p className="text-slate-600 mb-4">
              Por favor, informe o motivo pelo qual o paciente não realizou a cirurgia.
            </p>
            
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none h-32 resize-none text-slate-700"
              placeholder="Ex: Paciente desistiu, problema financeiro, contraindicação médica..."
              autoFocus
            />
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setCancellationModalOpen(false);
                  setCancellationReason('');
                  setSelectedReferralId(null);
                }}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedReferralId) {
                    handleStatusChange(selectedReferralId, 'cancelled', cancellationReason);
                  }
                }}
                disabled={!cancellationReason.trim()}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Checklist & Insurance */}
      {checklistModalOpen && selectedReferralForChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-0 flex flex-col max-h-[95vh] animate-fade-in overflow-hidden">
            
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">Processo</h3>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">Paciente: <span className="font-medium text-slate-700">{selectedReferralForChecklist.patientName}</span></p>
              </div>
              <button 
                onClick={() => setChecklistModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              
              {/* Insurance Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="block text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <CreditCard size={16} />
                  Convênio do Paciente
                </label>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={insuranceInput}
                    onChange={(e) => setInsuranceInput(e.target.value)}
                    placeholder="Digite o convênio (ex: Unimed...)"
                    className="flex-1 px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                  <button
                    onClick={saveInsurance}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-sm font-medium shadow-sm"
                  >
                    <Save size={16} />
                    Salvar
                  </button>
                </div>
              </div>

              {/* Checklist Grid */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Etapas do Processo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SURGERY_CHECKLIST_STEPS.map((step, index) => {
                    const isChecked = selectedReferralForChecklist.checklist?.[step] || false;
                    const hasNote = !!selectedReferralForChecklist.checklistNotes?.[step];
                    const isEditingNote = activeNoteStep === step;

                    return (
                      <div key={index} className="flex flex-col">
                        <div 
                          className={`
                            flex items-center justify-between p-3 rounded-lg border transition-all
                            ${isChecked 
                              ? 'bg-green-50 border-green-200 shadow-sm' 
                              : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                            }
                          `}
                        >
                          <div 
                            className="flex items-center flex-1 cursor-pointer select-none"
                            onClick={() => toggleChecklistItem(step)}
                          >
                            <div className={`
                              w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors shrink-0
                              ${isChecked
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'bg-white border-slate-300'
                              }
                            `}>
                              {isChecked && <Check size={14} strokeWidth={3} />}
                            </div>
                            <span className={`text-sm font-medium ${isChecked ? 'text-green-800' : 'text-slate-600'}`}>
                              {step}
                            </span>
                          </div>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleNoteInput(step);
                            }}
                            className={`p-2 rounded-full transition-colors ml-2 ${
                              hasNote 
                                ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
                                : 'text-slate-300 hover:text-blue-500 hover:bg-blue-50'
                            }`}
                            title="Adicionar/Ver Observação"
                          >
                            <MessageSquare size={18} fill={hasNote ? "currentColor" : "none"} />
                          </button>
                        </div>
                        
                        {/* Inline Note Input */}
                        {isEditingNote && (
                           <div className="mt-2 ml-4 p-3 bg-amber-50 border border-amber-200 rounded-lg rounded-tl-none animate-fade-in relative before:content-[''] before:absolute before:top-[-6px] before:right-6 before:w-3 before:h-3 before:bg-amber-50 before:border-t before:border-l before:border-amber-200 before:rotate-45">
                              <label className="text-xs font-bold text-amber-800 mb-1 block">Observação para: {step}</label>
                              <textarea 
                                className="w-full p-2 border border-amber-200 rounded text-sm text-slate-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none min-h-[80px]"
                                placeholder="Digite detalhes sobre esta etapa..."
                                value={currentNote}
                                onChange={(e) => setCurrentNote(e.target.value)}
                                autoFocus
                              ></textarea>
                              <div className="flex justify-end gap-2 mt-2">
                                <button 
                                  onClick={() => setActiveNoteStep(null)}
                                  className="px-3 py-1 text-xs font-medium text-slate-500 hover:bg-amber-100 rounded transition-colors"
                                >
                                  Cancelar
                                </button>
                                <button 
                                  onClick={() => saveChecklistNote(step)}
                                  className="px-3 py-1 text-xs font-bold bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors shadow-sm"
                                >
                                  Salvar Nota
                                </button>
                              </div>
                           </div>
                        )}
                        
                        {/* Note Preview (if exists and not editing) */}
                        {hasNote && !isEditingNote && (
                          <div className="mt-1 ml-9 text-xs text-slate-500 italic flex items-start gap-1">
                             <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                             <span>{selectedReferralForChecklist.checklistNotes?.[step]}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
               <div className="text-xs sm:text-sm text-slate-500">
                 {calculateProgress(selectedReferralForChecklist.checklist || {})}% concluído
               </div>
               <button
                onClick={() => setChecklistModalOpen(false)}
                className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors text-sm"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Reception;