'use client';

import { create } from 'zustand';

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
  initializeCart: () => void;
}

// Helper para guardar en localStorage
const saveToStorage = (items: CartItem[], userId: string | null) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('shopping-cart-storage', JSON.stringify({
      items,
      userId,
    }));
  } catch (error) {
    console.error('Error saving cart state:', error);
  }
};

// Helper para cargar de localStorage
const loadFromStorage = (): { items: CartItem[]; userId: string | null } => {
  if (typeof window === 'undefined') {
    return { items: [], userId: null };
  }

  try {
    const saved = localStorage.getItem('shopping-cart-storage');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        items: parsed.items || [],
        userId: parsed.userId || null,
      };
    }
  } catch (error) {
    console.error('Error loading cart state:', error);
  }

  return { items: [], userId: null };
};

export const useShoppingCartStore = create<ShoppingCartState>((set, get) => ({
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
      saveToStorage([], newUserId);
    } else {
      // Caso 1: No había usuario y ahora hay uno (o viceversa) - solo actualizar userId
      // Caso 2: Hidratación inicial desde localStorage - solo actualizar userId sin limpiar
      set({ userId: newUserId });
      saveToStorage(get().items, newUserId);
    }
  },

  addItem: (item) => {
    const items = get().items;
    const existingItem = items.find(
      (i) => i.itemId === item.itemId && i.itemType === item.itemType
    );

    let newItems: CartItem[];
    if (existingItem) {
      newItems = items.map((i) =>
        i.id === existingItem.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
    } else {
      newItems = [...items, { ...item, quantity: 1 }];
    }

    set({ items: newItems });
    saveToStorage(newItems, get().userId);
  },

  removeItem: (id: string) => {
    const newItems = get().items.filter((item) => item.id !== id);
    set({ items: newItems });
    saveToStorage(newItems, get().userId);
  },

  updateQuantity: (id: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }

    const newItems = get().items.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );

    set({ items: newItems });
    saveToStorage(newItems, get().userId);
  },

  clearCart: () => {
    set({ items: [] });
    saveToStorage([], get().userId);
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
      saveToStorage(itemsToKeep, get().userId);
    }
  },

  initializeCart: () => {
    if (typeof window === 'undefined') return;

    const { items, userId } = loadFromStorage();
    set({ items, userId });
  },
}));
