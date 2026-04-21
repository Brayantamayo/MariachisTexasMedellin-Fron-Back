import React, { useState, useRef } from 'react';
import { ArrowLeft, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../pages/authService';

interface Props {
  email: string;
  onVerified: (otp: string) => void;
  onNavigate: (path: string) => void;
}

export const VerifyOtpPage: React.FC<Props> = ({ email, onVerified, onNavigate }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Solo números
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Solo 1 dígito
    setOtp(newOtp);
    setError('');

    // Auto-focus al siguiente input
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Ingresa los 6 dígitos del código.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await authService.verificarOtp(email, code);
      onVerified(code); // Pasar el OTP verificado a ResetPasswordPage
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Código inválido o expirado.');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-32">
      <div className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden animate-fade-in-up">
        <div className="h-1 w-full bg-gradient-to-r from-primary-900 via-primary-600 to-primary-900"></div>

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-600/30">
              <ShieldCheck className="text-primary-500 h-8 w-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-2">Verificar Código</h3>
            <p className="text-gray-400 text-sm">
              Ingresa el código de 6 dígitos que enviamos a{' '}
              <span className="text-white font-bold">{email}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-primary-900/50 border border-primary-600/30 rounded-xl text-primary-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Inputs OTP */}
            <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-2xl font-black rounded-xl border bg-dark-800/50 text-white outline-none transition-all
                    ${digit ? 'border-primary-500 bg-primary-900/20' : 'border-white/10'}
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-600/30`}
                />
              ))}
            </div>

            <button type="submit" disabled={isLoading || otp.join('').length < 6}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] uppercase tracking-widest text-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
              {isLoading ? <><Loader2 size={18} className="animate-spin" /> Verificando...</> : 'Verificar Código'}
            </button>
          </form>

          <div className="mt-6 text-center pt-6 border-t border-white/5">
            <button onClick={() => onNavigate('/forgot-password')}
              className="text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center gap-2 mx-auto group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};