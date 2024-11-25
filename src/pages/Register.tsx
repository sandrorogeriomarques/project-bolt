import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { whatsappService } from '../services/whatsappService';
import { useUserStore } from '../stores/userStore';

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
        setTempUser({
          name: formData.name,
          whatsapp: formData.whatsapp,
          verificationCode
        });

        // Redirecionar para página de verificação
        console.log('Redirecionando para verificação...');
        navigate('/verify-code');
      } else {
        toast.error('Erro ao enviar código de verificação');
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      toast.error('Erro ao processar registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Criar nova conta
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Nome completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="whatsapp" className="sr-only">
                WhatsApp
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="WhatsApp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
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
              {loading ? 'Processando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}