import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { whatsappService } from '../services/whatsappService';
import { useUserStore } from '../stores/userStore';
import { WhatsAppInput } from '../components/WhatsAppInput';
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
      console.log('Tentando login com WhatsApp:', whatsapp);

      // Buscar usuário no Baserow
      const response = await axios.get(
        `https://api.baserow.io/api/database/rows/table/${TABLE_ID}/`,
        {
          headers: {
            'Authorization': `Token ${BASEROW_TOKEN}`
          },
          params: {
            'filter__field_3016951__equal': whatsapp
          }
        }
      );

      console.log('Resposta do Baserow:', response.data);

      const users = response.data.results;
      
      if (users && users.length > 0) {
        const user = users[0];
        console.log('Usuário encontrado (dados brutos do Baserow):', user);
        console.log('Role do Baserow:', user.field_3058061);

        // Mapear os campos do Baserow para o formato da aplicação
        const mappedUser = {
          id: user.id,
          name: user.field_3016949,
          whatsapp: user.field_3016951,
          avatar: user.field_3016950 || '', // Agora field_3016950 é o caminho completo com /uploads/
          role: user.field_3058061?.id === 2286924 ? 'admin' : 'user'
        };

        console.log('Usuário mapeado:', {
          rawUser: user,
          mappedUser,
          avatarField: user.field_3016950,
          roleFromBaserow: user.field_3058061,
          isAdmin: user.field_3058061?.id === 2286924
        });

        // Salvar usuário temporário para verificação
        setTempUser(mappedUser);

        // Gerar código de verificação
        const verificationCode = whatsappService.generateVerificationCode();
        console.log('Código gerado:', verificationCode);

        // Enviar código por WhatsApp
        await whatsappService.sendVerificationCode(whatsapp, verificationCode);

        // Salvar código para verificação
        localStorage.setItem('verificationCode', verificationCode);
        localStorage.setItem('verificationExpiry', (Date.now() + 5 * 60 * 1000).toString());

        console.log('Redirecionando para verificação...');
        navigate('/verify-code');
      } else {
        toast.error('Usuário não encontrado');
        navigate('/register');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast.error('Erro ao fazer login. Tente novamente.');
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