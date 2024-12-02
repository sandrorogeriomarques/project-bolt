import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { whatsappService } from '../services/whatsappService';
import { useUserStore } from '../stores/userStore';
import { WhatsAppInput } from '../components/WhatsAppInput';
import axios from 'axios';

const TABLE_ID = '396313';
const BASEROW_TOKEN = '0lsB6U6zcpKt8W4f9pydlsvJnibOASeI';

export function Register() {
  const navigate = useNavigate();
  const setTempUser = useUserStore(state => state.setTempUser);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Tentando registrar usuário:', formData);

      // Verificar se o WhatsApp já existe
      const response = await axios.get(
        `https://api.baserow.io/api/database/rows/table/${TABLE_ID}/`,
        {
          headers: {
            'Authorization': `Token ${BASEROW_TOKEN}`,
          },
          params: {
            'filter__field_3016951__equal': formData.whatsapp,
          }
        }
      );

      console.log('Resposta da verificação:', response.data);

      if (response.data.results.length > 0) {
        toast.error('Este WhatsApp já está cadastrado. Por favor, faça login.');
        navigate('/login');
        return;
      }

      console.log('WhatsApp disponível, criando usuário...');

      // Criar novo usuário no Baserow
      const createResponse = await axios.post(
        `https://api.baserow.io/api/database/rows/table/${TABLE_ID}/`,
        {
          field_3016949: formData.name, // Nome
          field_3016951: formData.whatsapp, // WhatsApp
          field_3058061: 2286925, // Role - default como 'user' (2286925)
        },
        {
          headers: {
            'Authorization': `Token ${BASEROW_TOKEN}`,
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('Usuário criado:', createResponse.data);
      const newUser = createResponse.data;

      // Gerar código de verificação
      const verificationCode = whatsappService.generateVerificationCode();
      console.log('Código gerado:', verificationCode);

      // Enviar código por WhatsApp
      const sent = await whatsappService.sendVerificationCode(
        formData.whatsapp,
        verificationCode
      );

      if (sent) {
        // Salvar dados temporários
        const tempUser = {
          id: newUser.id,
          name: formData.name,
          whatsapp: formData.whatsapp,
          verificationCode,
          avatar: ''
        };

        console.log('Salvando dados temporários:', tempUser);
        setTempUser(tempUser);

        // Redirecionar para página de verificação
        console.log('Redirecionando para verificação...');
        navigate('/verify-code');
      } else {
        toast.error('Erro ao enviar código de verificação');
      }
    } catch (error) {
      console.error('Erro detalhado no registro:', error);
      toast.error('Erro ao processar registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Criar Conta
          </h1>
          <p className="mt-2 text-gray-600">
            Registre-se para começar a usar o sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={loading}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp
            </label>
            <WhatsAppInput
              value={formData.whatsapp}
              onChange={(value) => setFormData(prev => ({ ...prev, whatsapp: value }))}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !formData.name || !formData.whatsapp}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : 'Criar Conta'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Faça login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}