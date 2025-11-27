import React from 'react';
import { UserRound, Stethoscope } from 'lucide-react';
import { ViewState } from '../types';

interface HomeProps {
  onNavigate: (view: ViewState) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 py-6 sm:py-10">
      <div className="text-center space-y-3 sm:space-y-4 max-w-2xl px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
          Bem-vindo ao Sistema
        </h2>
        <p className="text-slate-500 text-base sm:text-lg">
          Por favor, selecione seu perfil para continuar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl mt-4 sm:mt-8 px-2 sm:px-0">
        {/* Doctor Card */}
        <button
          onClick={() => onNavigate(ViewState.DOCTOR)}
          className="group relative flex flex-col items-center p-6 sm:p-8 bg-white rounded-2xl shadow-md border border-slate-100 hover:shadow-xl hover:border-medical-200 hover:-translate-y-1 transition-all duration-300 w-full"
        >
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-medical-50 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-medical-100 transition-colors">
            <Stethoscope size={32} className="text-medical-600 sm:w-10 sm:h-10" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Sou Médico</h3>
          <p className="text-slate-500 text-center text-sm">
            Acessar área de indicação de cirurgias e procedimentos.
          </p>
          <div className="mt-4 sm:mt-6 px-6 py-2 rounded-full bg-slate-100 text-slate-600 text-sm font-medium group-hover:bg-medical-600 group-hover:text-white transition-colors w-full sm:w-auto text-center">
            Entrar como Médico
          </div>
        </button>

        {/* Secretary Card */}
        <button
          onClick={() => onNavigate(ViewState.LOGIN)}
          className="group relative flex flex-col items-center p-6 sm:p-8 bg-white rounded-2xl shadow-md border border-slate-100 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 w-full"
        >
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-blue-100 transition-colors">
            <UserRound size={32} className="text-blue-600 sm:w-10 sm:h-10" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Sou Secretária</h3>
          <p className="text-slate-500 text-center text-sm">
            Acessar painel administrativo e lista de pacientes.
          </p>
          <div className="mt-4 sm:mt-6 px-6 py-2 rounded-full bg-slate-100 text-slate-600 text-sm font-medium group-hover:bg-blue-600 group-hover:text-white transition-colors w-full sm:w-auto text-center">
            Entrar como Secretária
          </div>
        </button>
      </div>
    </div>
  );
};

export default Home;