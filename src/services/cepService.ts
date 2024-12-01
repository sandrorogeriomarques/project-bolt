import axios from 'axios';
import { ViaCepResponse } from '../types';

export async function searchCEP(cep: string): Promise<ViaCepResponse> {
  try {
    const formattedCEP = cep.replace(/\D/g, '');
    
    if (formattedCEP.length !== 8) {
      throw new Error('CEP inválido');
    }

    const response = await axios.get(`https://viacep.com.br/ws/${formattedCEP}/json/`);
    const data = response.data;

    // Verifica se o ViaCEP retornou erro
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    // Mapeia os campos do ViaCEP para os campos em inglês
    return {
      ...data,
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Erro na requisição do CEP:', error.message);
      throw new Error('Erro ao conectar com o serviço de CEP');
    }
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
}
