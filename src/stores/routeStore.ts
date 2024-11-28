import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeliveryData } from '../types';

interface RouteState {
  deliveryPoints: DeliveryData[];
  addDeliveryPoint: (delivery: DeliveryData) => void;
  clearRoute: () => void;
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set) => ({
      deliveryPoints: [],
      addDeliveryPoint: (delivery) =>
        set((state) => ({
          deliveryPoints: [...state.deliveryPoints, delivery],
        })),
      clearRoute: () => set({ deliveryPoints: [] }),
    }),
    {
      name: 'route-storage',
    }
  )
);
