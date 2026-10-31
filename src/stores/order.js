import { writable, derived } from 'svelte/store';

const initialDelivery = {
  address: '',
  city: '',
  country: '',
  postalCode: ''
};

function createOrderStore() {
  const customer = writable(null);
  const delivery = writable({ ...initialDelivery });
  const items = writable([]);

  const subtotal = derived(items, ($items) =>
    $items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
  );

  const iva = derived(subtotal, ($subtotal) => $subtotal * 0.15);

  const total = derived([subtotal, iva], ([$subtotal, $iva]) => $subtotal + $iva);

  const reset = () => {
    customer.set(null);
    delivery.set({ ...initialDelivery });
    items.set([]);
  };

  const setCustomer = (cust) => {
    customer.set(cust);
    if (cust) {
      const addr = (cust.address || cust.direccion || '').slice(0, 40);
      const city = (cust.city || cust.ciudad || '').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').slice(0, 20);
      const country = (cust.country || cust.pais || '').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').slice(0, 20);
      const postal = (cust.postalCode || cust.codigoPostal || '').replace(/\D/g, '').slice(0, 6);

      delivery.set({
        address: addr,
        city: city,
        country: country,
        postalCode: postal
      });
    }
  };

  const updateDelivery = (field, val) => {
    delivery.update(d => ({ ...d, [field]: val }));
  };

  const addProduct = (prod) => {
    items.update(current => {
      const existingIndex = current.findIndex(p => p.id === prod.id);
      if (existingIndex >= 0) {
        const item = current[existingIndex];
        const newQty = Math.min(item.unitsInStock, item.quantity + 1);
        const updated = [...current];
        updated[existingIndex] = { ...item, quantity: newQty };
        return updated;
      } else {
        return [...current, {
          id: prod.id,
          name: prod.name,
          unitPrice: Number(prod.unitPrice) || 0,
          unitsInStock: Number(prod.unitsInStock) || 0,
          quantity: 1
        }];
      }
    });
  };

  const updateQuantity = (id, newQty) => {
    items.update(current =>
      current.map(item => {
        if (item.id === id) {
          const clamped = Math.max(1, Math.min(item.unitsInStock, newQty));
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    items.update(current => current.filter(item => item.id !== id));
  };

  return {
    customer,
    delivery,
    items,
    subtotal,
    iva,
    total,
    setCustomer,
    updateDelivery,
    addProduct,
    updateQuantity,
    removeItem,
    reset
  };
}

export const orderStore = createOrderStore();
