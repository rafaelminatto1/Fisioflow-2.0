
import { apiClient } from './apiClient';

class AddressService {
  async getAddressByCep(cep: string): Promise<any> {
    try {
      // Using a public API for CEP lookup
      const response = await apiClient.get(`https://viacep.com.br/ws/${cep}/json/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching address by CEP:', error);
      return null;
    }
  }
}

export const addressService = new AddressService();
