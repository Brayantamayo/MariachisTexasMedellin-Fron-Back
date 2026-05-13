import api from '@/shared/api/api';
import { GaleriaItem } from '@/types';




export const galeriaService = {
  async getAll(): Promise<GaleriaItem[]> {
    const { data } = await api.get('/galeria');
    return data;
  },

  async upload(formData: FormData): Promise<GaleriaItem> {
    const { data } = await api.post('/galeria', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/galeria/${id}`);
  },
};
