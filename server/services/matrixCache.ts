import { BaserowService } from './baserow';

interface MatrixCacheEntry {
  id?: number;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  distance: number;
  duration: number;
  points: Array<[number, number]>;
  created_at: Date;
  last_used: Date;
}

class MatrixCacheService {
  private baserow: BaserowService;
  private readonly TABLE_NAME = 'matrix_cache';
  private readonly COORD_MARGIN = 0.0001; // Margem de erro para coordenadas (~10 metros)

  constructor() {
    this.baserow = new BaserowService();
  }

  async findRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<MatrixCacheEntry | null> {
    try {
      // Buscar do Baserow com uma margem de erro pequena
      const results = await this.baserow.select(this.TABLE_NAME, {
        filter_type: 'AND',
        filters: [
          {
            field: 'origin_lat',
            type: 'range',
            value: [origin.lat - this.COORD_MARGIN, origin.lat + this.COORD_MARGIN]
          },
          {
            field: 'origin_lng',
            type: 'range',
            value: [origin.lng - this.COORD_MARGIN, origin.lng + this.COORD_MARGIN]
          },
          {
            field: 'destination_lat',
            type: 'range',
            value: [destination.lat - this.COORD_MARGIN, destination.lat + this.COORD_MARGIN]
          },
          {
            field: 'destination_lng',
            type: 'range',
            value: [destination.lng - this.COORD_MARGIN, destination.lng + this.COORD_MARGIN]
          }
        ],
        order_by: '-last_used',
        limit: 1
      });

      if (results.length > 0) {
        const entry = results[0];
        
        // Atualizar last_used
        await this.baserow.update(this.TABLE_NAME, entry.id!, {
          last_used: new Date()
        });

        return entry;
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar cache:', error);
      return null;
    }
  }

  async saveRoute(data: Omit<MatrixCacheEntry, 'id' | 'created_at' | 'last_used'>): Promise<boolean> {
    try {
      await this.baserow.create(this.TABLE_NAME, {
        ...data,
        created_at: new Date(),
        last_used: new Date()
      });

      return true;
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    try {
      const OLD_DAYS = 30; // Remover entradas não usadas há 30 dias
      const MAX_RECORDS = 10000;

      // 1. Remover entradas antigas
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - OLD_DAYS);

      await this.baserow.delete(this.TABLE_NAME, {
        filter_type: 'AND',
        filters: [
          {
            field: 'last_used',
            type: 'date_before',
            value: oldDate.toISOString()
          }
        ]
      });

      // 2. Se ainda tiver muitos registros, remover os mais antigos
      const count = await this.baserow.count(this.TABLE_NAME);
      if (count > MAX_RECORDS) {
        const toDelete = count - MAX_RECORDS;
        const oldestRecords = await this.baserow.select(this.TABLE_NAME, {
          order_by: 'last_used',
          limit: toDelete
        });

        for (const record of oldestRecords) {
          await this.baserow.delete(this.TABLE_NAME, record.id!);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }
}

export const matrixCache = new MatrixCacheService();
