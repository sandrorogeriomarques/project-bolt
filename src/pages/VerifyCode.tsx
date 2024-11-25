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
        // Se tiver nome, é registro. Se não tiver, é login
        if (tempUser.name) {
          // Criar usuário no Baserow
          const response = await axios.post(
            `https://api.baserow.io/api/database/rows/table/${TABLE_ID}/`,
            {
              "field_3016949": tempUser.name,
              "field_3016951": tempUser.whatsapp
            },
            {
              headers: {
                'Authorization': `Token ${BASEROW_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );

          // Salvar usuário no estado global
          setUser({
            id: response.data.id.toString(),
            name: tempUser.name,
            whatsapp: tempUser.whatsapp
          });

          toast.success('Cadastro realizado com sucesso!');
        } else {
          // Buscar usuário existente no Baserow
          const response = await axios.get(
            `https://api.baserow.io/api/database/rows/table/${TABLE_ID}/`,
            {
              headers: {
                'Authorization': `Token ${BASEROW_TOKEN}`,
              },
              params: {
                'search': tempUser.whatsapp,
                'user_field_names': true
              }
            }
          );

          const user = response.data.results.find((u: any) => u.WhatsApp === tempUser.whatsapp);
          
          if (user) {
            // Salvar usuário no estado global
            setUser({
              id: user.id.toString(),
              name: user.Nome,
              whatsapp: user.WhatsApp
            });

            toast.success('Login realizado com sucesso!');
          } else {
            toast.error('Usuário não encontrado');
            navigate('/login');
            return;
          }
        }

        navigate('/dashboard');
      } catch (error) {
        console.error('Erro ao processar operação:', error);
        if (axios.isAxiosError(error)) {
          console.error('Detalhes do erro:', error.response?.data);
        }
        toast.error(tempUser.name ? 'Erro ao finalizar cadastro' : 'Erro ao fazer login');
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
