'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  itemType: 'course' | 'subscription' | 'workshop' | 'other';
  itemId: string;
  title: string;
  price: number;
  quantity: number;
  thumbnail?: string;
}

interface ShoppingCartState {
  items: CartItem[];
  userId: string | null; // ⚠️ CRÍTICO: Vincular carrito al usuario
  setUserId: (userId: string | null) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  removePurchasedCourses: (purchasedCourseIds: string[]) => void;
  // Exponer userId para que los componentes puedan leerlo
}

export const useShoppingCartStore = create<ShoppingCartState>()(
  persist(
    (set, get) => ({
      items: [],
      userId: null,

      // ⚠️ CRÍTICO: Método para establecer el userId y limpiar carrito si cambia
      setUserId: (newUserId: string | null) => {
        const currentUserId = get().userId;
        
        // Si el userId no cambió, no hacer nada (evitar re-renders innecesarios)
        if (currentUserId === newUserId) {
          return;
        }
        
        // Si el usuario cambió (de un usuario a otro o de usuario a null), limpiar el carrito
        // IMPORTANTE: Solo limpiar si había un usuario anterior (no durante la hidratación inicial)
        if (currentUserId !== null && currentUserId !== newUserId) {
          // Había un usuario diferente, limpiar el carrito
          set({ items: [], userId: newUserId });
        } else {
          // Caso 1: No había usuario y ahora hay uno (o viceversa) - solo actualizar userId
          // Caso 2: Hidratación inicial desde localStorage - solo actualizar userId sin limpiar
          set({ userId: newUserId });
        }
      },

      addItem: (item) => {
        const items = get().items;
        const existingItem = items.find(
          (i) => i.itemId === item.itemId && i.itemType === item.itemType
        );

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === existingItem.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({
            items: [...items, { ...item, quantity: 1 }],
          });
        }
      },

      removeItem: (id: string) => {
        set({
          items: get().items.filter((item) => item.id !== id),
        });
      },

      updateQuantity: (id: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      // ⚠️ CRÍTICO: Remover cursos comprados del carrito
      removePurchasedCourses: (purchasedCourseIds: string[]) => {
        const currentItems = get().items;
        const itemsToKeep = currentItems.filter(
          (item) => 
            // Mantener items que no son cursos
            item.itemType !== 'course' ||
            // O cursos que no están en la lista de comprados
            !purchasedCourseIds.includes(item.itemId)
        );

        // Solo actualizar si hay cambios
        if (itemsToKeep.length !== currentItems.length) {
          set({ items: itemsToKeep });
        }
      },
    }),
    {
      name: 'shopping-cart-storage',
      // ⚠️ CRÍTICO: Incluir userId en el persist para que cada usuario tenga su propio carrito
      partialize: (state) => ({
        items: state.items,
        userId: state.userId,
      }),
    }
  )
);

