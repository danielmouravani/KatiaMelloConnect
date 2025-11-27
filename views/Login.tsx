import React, { useState } from 'react';
import { ViewState } from '../types';
import { Lock, User, ArrowRight } from 'lucide-react';

interface LoginProps {
  onNavigate: (view: ViewState) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple hardcoded auth as per requirements
    if (username === 'secretaria' && password === '1234') {
      onNavigate(ViewState.RECEPTION);
    } else if (username === 'recepcao' && password === '1234') {
      onNavigate(ViewState.RECEPTION);
    } else {
      setError('Usuário ou senha incorretos.');
    }
  };

  return (
    <div className="flex justify-center w-full py-6 sm:py-10">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-100 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-blue-50 text-blue-600 mb-4">
            <Lock size={24} className="sm:w-7 sm:h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Acesso Restrito</h2>
          <p className="text-slate-500 text-sm mt-2">Área exclusiva da secretária</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Usuário
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm sm:text-base"
                placeholder="secretaria"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm sm:text-base"
                placeholder="••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm"
          >
            Entrar
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate(ViewState.HOME)}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;