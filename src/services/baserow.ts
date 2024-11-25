import axios from 'axios';

const BASEROW_API = 'https://api.baserow.io/api/database/rows/table/396313/';
const TOKEN = '0lsB6U6zcpKt8W4f9pydlsvJnibOASeI';

const baserowApi = axios.create({
  baseURL: BASEROW_API,
  headers: {
    Authorization: `Token ${TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export interface User {
  id?: number;
  Nome: string;
  Avatar: string;
  WhatsApp: string;
}

export const baserowService = {
  async createUser(user: User) {
    const baserowData = {
      field_3016949: user.Nome,      // Nome
      field_3016950: user.Avatar,    // Avatar
      field_3016951: user.WhatsApp,  // WhatsApp
    };
    const response = await baserowApi.post('', baserowData);
    return {
      id: response.data.id,
      Nome: response.data.field_3016949,
      Avatar: response.data.field_3016950,
      WhatsApp: response.data.field_3016951,
    };
  },

  async getUser(whatsapp: string) {
    const response = await baserowApi.get(`?filter__field_3016951__equal=${whatsapp}`);
    const baserowUser = response.data.results[0];
    if (baserowUser) {
      return {
        id: baserowUser.id,
        Nome: baserowUser.field_3016949,
        Avatar: baserowUser.field_3016950,
        WhatsApp: baserowUser.field_3016951,
      };
    }
    return null;
  },

  async updateUser(id: number, user: Partial<User>) {
    const baserowData: any = {};
    if (user.Nome) baserowData.field_3016949 = user.Nome;
    if (user.Avatar) baserowData.field_3016950 = user.Avatar;
    if (user.WhatsApp) baserowData.field_3016951 = user.WhatsApp;
    
    const response = await baserowApi.patch(`${id}/`, baserowData);
    return {
      id: response.data.id,
      Nome: response.data.field_3016949,
      Avatar: response.data.field_3016950,
      WhatsApp: response.data.field_3016951,
    };
  },
};