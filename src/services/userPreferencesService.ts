import axios from 'axios';

const BASEROW_API = 'https://api.baserow.io/api';
const BASEROW_TOKEN = import.meta.env.VITE_BASEROW_TOKEN;
const USER_PREFERENCES_TABLE_ID = '399128';

interface UserPreference {
  id?: number;
  field_3040269: number; // user_id
  field_3040270: number; // selected_restaurant_id
}

export const getUserPreferences = async (userId: number) => {
  try {
    const response = await axios.get(
      `${BASEROW_API}/database/rows/table/${USER_PREFERENCES_TABLE_ID}/`,
      {
        headers: {
          Authorization: `Token ${BASEROW_TOKEN}`,
        },
        params: {
          filter__field_3040269__equal: userId,
        },
      }
    );
    return response.data.results[0];
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
};

export const createUserPreferences = async (data: UserPreference) => {
  try {
    const response = await axios.post(
      `${BASEROW_API}/database/rows/table/${USER_PREFERENCES_TABLE_ID}/`,
      {
        field_3040269: data.field_3040269,
        field_3040270: data.field_3040270
      },
      {
        headers: {
          Authorization: `Token ${BASEROW_TOKEN}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating user preferences:', error);
    throw error;
  }
};

export const updateUserPreferences = async (id: number, data: Partial<UserPreference>) => {
  try {
    const response = await axios.patch(
      `${BASEROW_API}/database/rows/table/${USER_PREFERENCES_TABLE_ID}/${id}/`,
      {
        field_3040270: data.field_3040270
      },
      {
        headers: {
          Authorization: `Token ${BASEROW_TOKEN}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};
