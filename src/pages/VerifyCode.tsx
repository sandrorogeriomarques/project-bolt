import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useUserStore } from '../stores/userStore';
import axios from 'axios';

const BASEROW_TOKEN = '0lsB6U6zcpKt8W4f9pydlsvJnibOASeI';
const TABLE_ID = '396313';

export function VerifyCode() {
  const navigate = useNavigate();
  const tempUser = useUserStore(state => state.tempUser);
  const setUser = useUserStore(state => state.setUser);
  
  const [code, setCode] = useState(['', '', '', '']);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    // Se não houver dados temporários, redirecionar para registro
    if (!tempUser) {
      navigate('/register');
      return;
    }

    // Focar no primeiro input
    refs[0].current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handleChange = (value: string, index: number) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 3) {
      refs[index + 1].current?.focus();
    }

    // Se todos os dígitos foram preenchidos
    if (index === 3 && value) {
      const enteredCode = newCode.join('');
      verifyCode(enteredCode);
    }
  };

  const verifyCode = async (enteredCode: string) => {
    if (!tempUser) {
      toast.error('Dados de registro não encontrados');
      navigate('/register');
      return;
    }

    if (enteredCode === tempUser.verificationCode) {
      try {
        // Criar usuário no Baserow
        const response = await axios.post(`https://api.baserow.io/api/database/rows/table/${TABLE_ID}/`, 
          {
            "field_3016949": tempUser.name, // Nome
            "field_3016950": "/uploads/avatars/default-avatar.png", // Avatar padrão
            "field_3016951": tempUser.whatsapp // WhatsApp
          },
          {
            headers: {
              'Authorization': `Token ${BASEROW_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Resposta do Baserow:', response.data);

        // Salvar usuário no estado global
        setUser({
          id: response.data.id.toString(),
          name: tempUser.name,
          whatsapp: tempUser.whatsapp,
          avatar: response.data.Avatar || '/uploads/avatars/default-avatar.png'
        });

        toast.success('Cadastro realizado com sucesso!');
        navigate('/dashboard');
      } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        if (axios.isAxiosError(error)) {
          console.error('Detalhes do erro:', error.response?.data);
        }
        toast.error('Erro ao finalizar cadastro');
      }
    } else {
      toast.error('Código inválido');
      // Limpar os campos
      setCode(['', '', '', '']);
      refs[0].current?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verificação de WhatsApp
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite o código de 4 dígitos enviado para seu WhatsApp
          </p>
        </div>

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
      </div>
    </div>
  );
}
