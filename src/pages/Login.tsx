import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useUserStore } from '../stores/userStore';
import { Link } from 'react-router-dom';

const BASEROW_TOKEN = '0lsB6U6zcpKt8W4f9pydlsvJnibOASeI';
const TABLE_ID = '396313';

export function Login() {
  const navigate = useNavigate();
  const setUser = useUserStore(state => state.setUser);
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
        setUser({
          id: user.id.toString(),
          name: user.Nome,
          whatsapp: user.WhatsApp,
          avatar: user.Avatar
        });
        
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard', { replace: true });
      } else {
        toast.error('Usuário não encontrado');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Entrar na sua conta
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="whatsapp" className="sr-only">
                WhatsApp
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="WhatsApp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="text-center mt-4">
            <Link to="/register" className="text-indigo-600 hover:text-indigo-500">
              Não tem uma conta? Cadastre-se
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}