import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import toast from 'react-hot-toast';

export function VerifyCode() {
  const navigate = useNavigate();
  const { tempUser, setUser } = useUserStore();
  
  const [code, setCode] = useState(['', '', '', '']);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Se não houver dados temporários, redirecionar para login
    if (!tempUser) {
      console.log('Sem dados temporários, redirecionando para login');
      navigate('/login');
    }
  }, [tempUser, navigate]);

  const handleChange = (value: string, index: number) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Se digitou um número e não é o último campo, move para o próximo
      if (value.length === 1 && index < 3) {
        refs[index + 1]?.current?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Se pressionar backspace em um campo vazio, volta para o anterior
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      refs[index - 1]?.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const storedCode = localStorage.getItem('verificationCode');
      const expiryTime = Number(localStorage.getItem('verificationExpiry'));

      if (!storedCode || !expiryTime) {
        toast.error('Código de verificação expirado');
        navigate('/login');
        return;
      }

      if (Date.now() > expiryTime) {
        toast.error('Código de verificação expirado');
        navigate('/login');
        return;
      }

      if (code.join('') !== storedCode) {
        toast.error('Código inválido');
        return;
      }

      if (!tempUser) {
        toast.error('Dados do usuário não encontrados');
        navigate('/login');
        return;
      }

      // Limpar dados temporários
      localStorage.removeItem('verificationCode');
      localStorage.removeItem('verificationExpiry');

      // Autenticar usuário
      setUser(tempUser);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');

    } catch (error) {
      console.error('Erro ao verificar código:', error);
      toast.error('Erro ao verificar código');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verificação
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Digite o código enviado para seu WhatsApp
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center space-x-4">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={refs[index]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-12 text-center text-2xl border-2 border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={isLoading || code.some(digit => !digit)}
            className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
      </div>
    </div>
  );
}
