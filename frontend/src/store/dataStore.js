import { create } from 'zustand'

export const useDataStore = create((set) => ({
  customers: [],
  products: [],
  orders: [],
  setCustomers: (customers) => set({ customers }),
  setProducts: (products) => set({ products }),
  setOrders: (orders) => set({ orders }),
}))