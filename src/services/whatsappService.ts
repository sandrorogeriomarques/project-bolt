import axios from 'axios';

const BASE_URL = 'https://evolutionapi.promovers.club';
const INSTANCE = 'meuvivo';
const API_KEY = 'b340495c6ddfac7e9b385c07d4df5e89';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'apikey': API_KEY
  }
});

export const whatsappService = {
  generateVerificationCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  },

  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      // Formatar o número do WhatsApp (remover caracteres especiais)
      const formattedNumber = phoneNumber.replace(/\D/g, '');
      
      console.log('Enviando código para:', formattedNumber);

      const response = await api.post(`/message/sendText/${INSTANCE}`, {
        number: formattedNumber,
        options: {
          delay: 1200,
          presence: "composing",
          linkPreview: false
        },
        textMessage: {
          text: `Seu código de verificação é: ${code}`
        }
      });

      console.log('Resposta da API:', response.data);

      // A API retorna sucesso mesmo sem o status 200
      return true;
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      return false;
    }
  }
};
