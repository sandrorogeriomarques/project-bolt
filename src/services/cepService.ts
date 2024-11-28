import axios from 'axios';
import { ViaCepResponse } from '../types';

export async function searchCEP(cep: string): Promise<ViaCepResponse> {
  try {
    const formattedCEP = cep.replace(/\D/g, '');
    const response = await axios.get(`https://viacep.com.br/ws/${formattedCEP}/json/`);
    const data = response.data;

    // Mapeia os campos do ViaCEP para os campos em inglês
    return {
      ...data,
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
}
