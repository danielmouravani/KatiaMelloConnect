import React, { useState } from 'react';
import { ViewState, SurgeryType, Referral, DOCTORS_LIST } from '../types';
import { saveReferral } from '../services/storage';
import { Send, CheckCircle2, User, Loader2, AlertTriangle, Stethoscope } from 'lucide-react';

interface DoctorProps {
  onNavigate: (view: ViewState) => void;
}

const Doctor: React.FC<DoctorProps> = ({ onNavigate }) => {
  const [patientName, setPatientName] = useState('');
  const [surgeryType, setSurgeryType] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!patientName.trim()) {
      setError('Por favor, digite o nome do paciente.');
      return;
    }
    if (!surgeryType) {
      setError('Por favor, selecione um tipo de cirurgia.');
      return;
    }
    if (!selectedDoctor) {
      setError('Por favor, identifique-se (Selecione seu nome).');
      return;
    }

    setIsLoading(true);

    try {
      const newReferral: Referral = {
        id: 'temp-id', // Será gerado pelo Firebase
        patientName: patientName.trim(),
        surgeryType,
        referringDoctor: selectedDoctor,
        timestamp: Date.now(),
        status: 'pending',
        checklist: {} // Inicializa checklist vazio
      };

      await saveReferral(newReferral);

      // Show success and reset (keep doctor selected for convenience)
      setShowSuccess(true);
      setPatientName('');
      setSurgeryType('');
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao conectar. Verifique a internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center w-full">
      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-lg border border-slate-100 w-full max-w-lg relative overflow-hidden">
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-medical-400 to-medical-600"></div>

        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Nova Indicação</h2>
          <p className="text-sm sm:text-base text-slate-500">Preencha os dados abaixo para encaminhar o paciente.</p>
        </div>

        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 animate-pulse">
            <CheckCircle2 size={24} className="shrink-0" />
            <span className="font-medium text-sm sm:text-base">Indicação enviada com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          
          {/* Seleção do Médico */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Médico(a) Solicitante
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Stethoscope size={18} />
              </div>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                disabled={isLoading}
                className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all text-slate-700 disabled:bg-slate-50 text-sm sm:text-base"
              >
                <option value="" disabled>Quem está indicando?</option>
                {DOCTORS_LIST.map((docName) => (
                  <option key={docName} value={docName}>
                    {docName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome do Paciente
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nome completo"
                disabled={isLoading}
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all disabled:bg-slate-50 text-sm sm:text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Cirurgia
            </label>
            <div className="relative">
              <select
                value={surgeryType}
                onChange={(e) => setSurgeryType(e.target.value)}
                disabled={isLoading}
                className="block w-full pl-3 pr-10 py-3 border border-slate-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all text-slate-700 disabled:bg-slate-50 text-sm sm:text-base"
              >
                <option value="" disabled>Selecione uma opção...</option>
                {Object.values(SurgeryType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex gap-2 items-start">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-medical-600 hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            {isLoading ? 'Enviando...' : 'Enviar Indicação'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Doctor;