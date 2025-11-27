import React, { useState } from 'react';
import { ViewState } from './types';
import Home from './views/Home';
import Doctor from './views/Doctor';
import Login from './views/Login';
import Reception from './views/Reception';
import { Stethoscope } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <Home onNavigate={setCurrentView} />;
      case ViewState.DOCTOR:
        return <Doctor onNavigate={setCurrentView} />;
      case ViewState.LOGIN:
        return <Login onNavigate={setCurrentView} />;
      case ViewState.RECEPTION:
        return <Reception onNavigate={setCurrentView} />;
      default:
        return <Home onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setCurrentView(ViewState.HOME)}
          >
            <div className="bg-medical-600 p-1.5 sm:p-2 rounded-lg text-white">
              <Stethoscope size={20} className="sm:w-5 sm:h-5 w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight truncate">
              KatiaMello<span className="text-medical-600">Connect</span>
            </h1>
          </div>
          
          {currentView !== ViewState.HOME && (
            <button 
              onClick={() => setCurrentView(ViewState.HOME)}
              className="text-xs sm:text-sm text-slate-500 hover:text-medical-600 transition-colors font-medium whitespace-nowrap"
            >
              Voltar ao Início
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-5xl animate-fade-in">
          {renderView()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-xs sm:text-sm">
          &copy; {new Date().getFullYear()} TechVani - Sistema de Gestão Cirúrgica.
        </div>
      </footer>
    </div>
  );
};

export default App;