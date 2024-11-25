import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { whatsappService } from '../services/whatsappService';
import { useUserStore } from '../stores/userStore';
import { WhatsAppInput } from '../components/WhatsAppInput';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BASEROW_TOKEN = '0lsB6U6zcpKt8W4f9pydlsvJnibOASeI';
const TABLE_ID = '396313';

export function Login() {
  const navigate = useNavigate();
  const setUser = useUserStore(state => state.setUser);
  const setTempUser = useUserStore(state => state.setTempUser);
  const [loading, setLoading] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Buscar usuário no Baserow pelo WhatsApp
      const response = await axios.get(
        `https://api.baserow.io/api/database/rows/table/${TABLE_ID}/`, {
          headers: {
            'Authorization': `Token ${BASEROW_TOKEN}`,
          },
          params: {
            'search': whatsapp,
            'user_field_names': true
          }
        }
      );

      const users = response.data.results;
      const user = users.find((u: any) => u.WhatsApp === whatsapp);

      if (user) {
        // Gerar código de verificação
        const verificationCode = whatsappService.generateVerificationCode();
        console.log('Código gerado:', verificationCode);

        // Enviar código por WhatsApp
        const sent = await whatsappService.sendVerificationCode(
          whatsapp,
          verificationCode
        );

        if (sent) {
          // Salvar dados temporários
          setTempUser({
            whatsapp,
            verificationCode
          });

          // Redirecionar para página de verificação
          console.log('Redirecionando para verificação...');
          navigate('/verify-code');
        } else {
          toast.error('Erro ao enviar código de verificação');
        }
      } else {
        toast.error('Usuário não encontrado');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao processar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Entrar
          </h1>
          <p className="mt-2 text-gray-600">
            Digite seu WhatsApp para receber o código de acesso
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-6">
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp
            </label>
            <WhatsAppInput
              value={whatsapp}
              onChange={setWhatsapp}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !whatsapp}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : 'Continuar'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Registre-se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}