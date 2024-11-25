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
      // O número já deve vir formatado como "5541999999999" do componente WhatsAppInput
      // Apenas garantir que não há caracteres especiais
      const formattedNumber = phoneNumber.replace(/\D/g, '');

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

      // Verificar se a resposta foi bem sucedida
      if (response.data && response.data.error) {
        console.error('Erro na resposta da API:', response.data.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      return false;
    }
  }
};
