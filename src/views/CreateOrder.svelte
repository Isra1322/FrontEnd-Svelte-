<script>
  import { orderStore } from '../stores/order';
  import api from '../services/api';
  import CustomerModal from '../components/CustomerModal.svelte';
  import ProductModal from '../components/ProductModal.svelte';
  import ConfirmModal from '../components/ConfirmModal.svelte';

  const { customer, delivery, items, subtotal, iva, total } = orderStore;

  let showCustomerModal = false;
  let showProductModal = false;
  let showCancelModal = false;
  let showDeleteModal = false;
  let productToDelete = null;

  let submitting = false;
  let successBanner = '';
  let errorMessage = '';

  // Reactividad para deudas y validación
  $: customerDebt = Number($customer?.debt ?? $customer?.deuda ?? 0);
  $: hasDebt = $customer != null && customerDebt > 0;
  $: isPostalValid = /^\d{6}$/.test($delivery.postalCode || '');
  $: canAddProduct = $customer != null && !hasDebt && isPostalValid;

  $: canSubmitOrder =
    $customer != null &&
    !hasDebt &&
    isPostalValid &&
    $delivery.address.trim().length > 0 &&
    $delivery.city.trim().length > 0 &&
    $delivery.country.trim().length > 0 &&
    $items.length > 0 &&
    !submitting;

  function handleCityInput(e) {
    let val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').slice(0, 20);
    orderStore.updateDelivery('city', val);
    e.target.value = val;
  }

  function handleCountryInput(e) {
    let val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').slice(0, 20);
    orderStore.updateDelivery('country', val);
    e.target.value = val;
  }

  function handlePostalInput(e) {
    let val = e.target.value.replace(/\D/g, '').slice(0, 6);
    orderStore.updateDelivery('postalCode', val);
    e.target.value = val;
  }

  function handleAddressInput(e) {
    let val = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.-]/g, '');
    val = val.replace(/-{2,}/g, '-');
    val = val.slice(0, 40);
    orderStore.updateDelivery('address', val);
    e.target.value = val;
  }

  function handleCustomerSelect(event) {
    const cust = event.detail;
    orderStore.setCustomer(cust);
    successBanner = '';
    errorMessage = '';
  }

  function handleProductAdd(event) {
    const prod = event.detail;
    orderStore.addProduct(prod);
  }

  function handleQuantityInput(item, e) {
    let v = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
    v = v === '' ? '1' : v;
    let num = parseInt(v, 10);
    if (num > item.unitsInStock) {
      num = item.unitsInStock;
      v = String(num);
    }
    e.target.value = v;
    orderStore.updateQuantity(item.id, num);
  }

  function handleQuantityBlur(item, e) {
    if (!e.target.value || parseInt(e.target.value, 10) < 1) {
      e.target.value = '1';
    }
    let num = parseInt(e.target.value, 10);
    if (num > item.unitsInStock) {
      num = item.unitsInStock;
      e.target.value = String(num);
    }
    orderStore.updateQuantity(item.id, num);
  }

  function requestDeleteProduct(item) {
    productToDelete = item;
    showDeleteModal = true;
  }

  function confirmDeleteProduct() {
    if (productToDelete) {
      orderStore.removeItem(productToDelete.id);
    }
    showDeleteModal = false;
    productToDelete = null;
  }

  function confirmCancel() {
    orderStore.reset();
    showCancelModal = false;
    errorMessage = '';
  }

  async function submitOrder() {
    if (!canSubmitOrder) return;

    submitting = true;
    errorMessage = '';
    successBanner = '';

    try {
      // Generar UUID estándar para requestId
      const requestId = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

      const payload = {
        requestId,
        customerId: $customer.id || $customer.customerId,
        shipAddress: $delivery.address.trim(),
        shipCity: $delivery.city.trim(),
        shipCountry: $delivery.country.trim(),
        shipPostalCode: $delivery.postalCode.trim(),
        orderDetails: $items.map((i) => ({
          productId: Number(i.id),
          unitPrice: Number(i.unitPrice),
          quantity: Number(i.quantity)
        }))
      };

      const res = await api.post('/CreateOrder', payload);
      const orderId = res.data;

      // Descargar y abrir de inmediato el comprobante PDF en nueva pestaña usando Blob
      try {
        const pdfRes = await api.get(`/sales/invoices/${orderId}/pdf`, {
          responseType: 'blob'
        });
        const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(blob);
        window.open(pdfUrl, '_blank');
      } catch (pdfErr) {
        console.error('Error al generar PDF de comprobante:', pdfErr);
      }

      // Banner verde de confirmación
      successBanner = `¡Orden #${orderId} registrada exitosamente en el sistema!`;

      // Limpia el formulario
      orderStore.reset();
    } catch (err) {
      errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.title ||
        err.message ||
        'Error al registrar la orden en el servidor.';
    } finally {
      submitting = false;
    }
  }
</script>

<div class="container-fluid px-4 py-4">
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h2 class="fw-bold m-0" style="color: #0d3b66;">
      Crear Nueva Orden de Venta
    </h2>
  </div>

  <!-- Banner de Éxito -->
  {#if successBanner}
    <div class="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4 shadow-sm" role="alert">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-check-circle-fill me-2 flex-shrink-0" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
      </svg>
      <div class="fw-bold fs-6">{successBanner}</div>
      <button type="button" class="btn-close" aria-label="Close" on:click={() => (successBanner = '')}></button>
    </div>
  {/if}

  <!-- Banner de Error -->
  {#if errorMessage}
    <div class="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-4 shadow-sm" role="alert">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-exclamation-triangle-fill me-2 flex-shrink-0" viewBox="0 0 16 16">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      </svg>
      <div>{errorMessage}</div>
      <button type="button" class="btn-close" aria-label="Close" on:click={() => (errorMessage = '')}></button>
    </div>
  {/if}

  <!-- Alerta Roja Destacada si el cliente seleccionado tiene Deuda > 0 -->
  {#if hasDebt}
    <div class="alert alert-danger d-flex align-items-center mb-4 shadow-sm border-danger border-2 p-3" role="alert" style="background-color: #f8d7da;">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#842029" class="bi bi-slash-circle-fill me-3 flex-shrink-0" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-4.646-5.646a.5.5 0 0 0-.708 0l-8 8a.5.5 0 0 0 .708.708l8-8a.5.5 0 0 0 0-.708z"/>
      </svg>
      <div class="fw-bold fs-6" style="color: #842029;">
        El cliente seleccionado posee una deuda pendiente de $ {customerDebt.toFixed(2)}. No es posible registrar nuevas órdenes hasta saldar la cuenta.
      </div>
    </div>
  {/if}

  <!-- 2 Columnas Simétricas Superiores -->
  <div class="row g-4 mb-4">
    <!-- Columna Izquierda: DATOS DEL CLIENTE (SOLO LECTURA) -->
    <div class="col-12 col-lg-6">
      <div class="card h-100 shadow-sm border-0">
        <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h6 class="fw-bold m-0 text-corporate d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-person-badge me-2" viewBox="0 0 16 16">
              <path d="M6.5 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
              <path d="M4.5 0A2.5 2.5 0 0 0 2 2.5V14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2.5A2.5 2.5 0 0 0 11.5 0h-7zM3 2.5A1.5 1.5 0 0 1 4.5 1h7A1.5 1.5 0 0 1 13 2.5V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2.5z"/>
            </svg>
            DATOS DEL CLIENTE (SOLO LECTURA)
          </h6>
          <button
            type="button"
            class="btn btn-corporate btn-sm px-3"
            on:click={() => (showCustomerModal = true)}
          >
            Buscar cliente
          </button>
        </div>
        <div class="card-body p-3">
          {#if $customer}
            <div class="row g-3">
              <div class="col-6 col-sm-4">
                <label for="cust-id" class="form-label text-muted small fw-semibold mb-1">ID Cliente</label>
                <input
                  id="cust-id"
                  type="text"
                  class="form-control form-control-sm bg-light"
                  value={$customer.id || $customer.customerId || ''}
                  readonly
                />
              </div>
              <div class="col-6 col-sm-4">
                <label for="cust-cedula" class="form-label text-muted small fw-semibold mb-1">Cédula</label>
                <input
                  id="cust-cedula"
                  type="text"
                  class="form-control form-control-sm bg-light"
                  value={$customer.identification || $customer.cedulaRuc || ''}
                  readonly
                />
              </div>
              <div class="col-12 col-sm-4">
                <label for="cust-phone" class="form-label text-muted small fw-semibold mb-1">Teléfono</label>
                <input
                  id="cust-phone"
                  type="text"
                  class="form-control form-control-sm bg-light"
                  value={$customer.phone || $customer.telefono || ''}
                  readonly
                />
              </div>
              <div class="col-12 col-sm-6">
                <label for="cust-name" class="form-label text-muted small fw-semibold mb-1">Nombre</label>
                <input
                  id="cust-name"
                  type="text"
                  class="form-control form-control-sm bg-light fw-medium"
                  value={$customer.name || $customer.companyName || ''}
                  readonly
                />
              </div>
              <div class="col-12 col-sm-6">
                <label for="cust-email" class="form-label text-muted small fw-semibold mb-1">Correo Electrónico</label>
                <input
                  id="cust-email"
                  type="text"
                  class="form-control form-control-sm bg-light"
                  value={$customer.email || $customer.correo || ''}
                  readonly
                />
              </div>
            </div>
          {:else}
            <div class="text-center py-4 text-muted">
              <p class="mb-0">No se ha seleccionado ningún cliente.</p>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Columna Derecha: DATOS DE ENTREGA DE LA ORDEN -->
    <div class="col-12 col-lg-6">
      <div class="card h-100 shadow-sm border-0">
        <div class="card-header bg-white py-3 border-bottom">
          <h6 class="fw-bold m-0 text-corporate d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-truck me-2" viewBox="0 0 16 16">
              <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-4 0H.5a.5.5 0 0 1-.5-.5v-8zm11 7a2 2 0 0 1 4 0h.5a.5.5 0 0 0 .5-.5V8.85a.5.5 0 0 0-.11-.313l-1.48-1.85A.5.5 0 0 0 13.02 6H12v4.5zm-1-6.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5H2a2 2 0 0 1 4 0h4a2 2 0 0 1 4 0h.5a.5.5 0 0 0 .5-.5V4z"/>
            </svg>
            DATOS DE ENTREGA DE LA ORDEN
          </h6>
        </div>
        <div class="card-body p-3">
          <div class="row g-3">
            <div class="col-12">
              <label for="order-address" class="form-label fw-semibold">Dirección</label>
              <input
                id="order-address"
                type="text"
                class="form-control form-control-sm"
                placeholder="Dirección de envío..."
                maxlength="40"
                value={$delivery.address}
                on:input={handleAddressInput}
                disabled={hasDebt}
              />
            </div>
            <div class="col-12 col-sm-4">
              <label for="order-city" class="form-label fw-semibold">Ciudad</label>
              <input
                id="order-city"
                type="text"
                class="form-control form-control-sm"
                placeholder="Ciudad"
                maxlength="20"
                value={$delivery.city}
                on:input={handleCityInput}
                disabled={hasDebt}
              />
            </div>
            <div class="col-12 col-sm-4">
              <label for="order-country" class="form-label fw-semibold">País</label>
              <input
                id="order-country"
                type="text"
                class="form-control form-control-sm"
                placeholder="País"
                maxlength="20"
                value={$delivery.country}
                on:input={handleCountryInput}
                disabled={hasDebt}
              />
            </div>
            <div class="col-12 col-sm-4">
              <label for="order-postal" class="form-label fw-semibold">Código Postal</label>
              <input
                id="order-postal"
                type="text"
                class="form-control form-control-sm {!isPostalValid && $delivery.postalCode ? 'is-invalid' : ''}"
                placeholder="Ej. 170101"
                maxlength="6"
                value={$delivery.postalCode}
                on:input={handlePostalInput}
                disabled={hasDebt}
              />
              {#if !isPostalValid && $delivery.postalCode}
                <div class="invalid-feedback small" style="font-size: 0.75rem;">
                  Debe tener exactamente 6 dígitos.
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Detalle de Productos -->
  <div class="card shadow-sm border-0 mb-4">
    <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
      <h6 class="fw-bold m-0 text-corporate d-flex align-items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-cart3 me-2" viewBox="0 0 16 16">
          <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .49.598l-1 5a.5.5 0 0 1-.465.401l-9.397.472L4.415 11H13a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l.84 4.479 9.144-.459L13.89 4H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
        DETALLE DE PRODUCTOS DE LA ORDEN
      </h6>
      <!-- Botón + Agregar producto deshabilitado según reglas estrictas -->
      <button
        type="button"
        class="btn btn-corporate btn-sm px-3"
        disabled={!canAddProduct}
        title={!$customer ? 'Seleccione un cliente primero' : hasDebt ? 'Cliente posee deuda activa' : !isPostalValid ? 'Ingrese un código postal válido de 6 dígitos' : ''}
        on:click={() => (showProductModal = true)}
      >
        + Agregar producto
      </button>
    </div>

    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr class="small text-uppercase text-secondary">
              <th style="width: 80px;" class="ps-3">ID</th>
              <th>Producto</th>
              <th class="text-end" style="width: 140px;">Precio Unit.</th>
              <th class="text-center" style="width: 140px;">Cantidad</th>
              <th class="text-end" style="width: 140px;">Subtotal</th>
              <th class="text-center" style="width: 90px;">Acción</th>
            </tr>
          </thead>
          <tbody>
            {#if $items.length === 0}
              <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                  No hay productos agregados a la orden.
                </td>
              </tr>
            {:else}
              {#each $items as item (item.id)}
                {@const itemSubtotal = item.unitPrice * item.quantity}
                <tr>
                  <td class="font-monospace small ps-3">{item.id}</td>
                  <td class="fw-semibold">{item.name}</td>
                  <td class="text-end">${Number(item.unitPrice).toFixed(2)}</td>
                  <td class="text-center">
                    <input
                      type="text"
                      inputmode="numeric"
                      class="form-control form-control-sm text-center mx-auto"
                      style="max-width: 90px;"
                      value={item.quantity}
                      on:input={(e) => handleQuantityInput(item, e)}
                      on:blur={(e) => handleQuantityBlur(item, e)}
                      disabled={hasDebt}
                    />
                    <div class="text-muted" style="font-size: 0.7rem;">
                      Disp: {item.unitsInStock}
                    </div>
                  </td>
                  <td class="text-end fw-semibold">
                    ${itemSubtotal.toFixed(2)}
                  </td>
                  <td class="text-center">
                    <button
                      type="button"
                      class="btn btn-outline-danger btn-sm p-1 px-2 d-inline-flex align-items-center justify-content-center"
                      title="Eliminar producto"
                      on:click={() => requestDeleteProduct(item)}
                      disabled={hasDebt}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Totales destacados en azul -->
    <div class="card-footer bg-light p-3 border-top">
      <div class="row align-items-center">
        <div class="col-12 col-md-6 mb-3 mb-md-0 d-flex gap-2">
          <button
            type="button"
            class="btn btn-outline-secondary px-4"
            disabled={$items.length === 0 && !$customer}
            on:click={() => (showCancelModal = true)}
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-corporate px-4 fw-semibold"
            disabled={!canSubmitOrder}
            on:click={submitOrder}
          >
            {#if submitting}
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              Registrando orden...
            {:else}
              Enviar Orden
            {/if}
          </button>
        </div>
        <div class="col-12 col-md-6 text-md-end">
          <div class="d-inline-block text-start p-3 rounded" style="background-color: #eef4f8; border: 1px solid #0d3b66; min-width: 260px;">
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted small">Subtotal:</span>
              <span class="fw-bold" style="color: #0d3b66;">${$subtotal.toFixed(2)}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted small">IVA (15%):</span>
              <span class="fw-bold" style="color: #0d3b66;">${$iva.toFixed(2)}</span>
            </div>
            <hr class="my-1 border-secondary" />
            <div class="d-flex justify-content-between">
              <span class="fw-bold fs-6" style="color: #0d3b66;">Total:</span>
              <span class="fw-bold fs-5" style="color: #0d3b66;">${$total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Modal Búsqueda de Clientes -->
<CustomerModal
  show={showCustomerModal}
  on:select={handleCustomerSelect}
  on:close={() => (showCustomerModal = false)}
/>

<!-- Modal Búsqueda de Productos -->
<ProductModal
  show={showProductModal}
  selectedProductIds={$items.map((i) => i.id)}
  on:add={handleProductAdd}
  on:close={() => (showProductModal = false)}
/>

<!-- Modal Confirmación de Cancelación -->
<ConfirmModal
  show={showCancelModal}
  on:confirm={confirmCancel}
  on:cancel={() => (showCancelModal = false)}
/>

<!-- Modal Confirmar Eliminación de Producto -->
{#if showDeleteModal}
  <div class="modal show d-block" tabindex="-1" style="background-color: rgba(15, 23, 42, 0.5); backdrop-filter: blur(5px); z-index: 1060;">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 450px;">
      <div class="modal-content shadow border-0 rounded-3">
        <div class="modal-header py-2 px-3 border-bottom">
          <h6 class="modal-title fw-bold text-danger mb-0">Confirmar eliminación</h6>
          <button type="button" class="btn-close" aria-label="Cerrar" on:click={() => { showDeleteModal = false; productToDelete = null; }}></button>
        </div>
        <div class="modal-body py-3 px-3">
          <p class="mb-0 text-secondary">
            ¿Está seguro de que desea eliminar <strong>{productToDelete?.name || productToDelete?.productName || 'este producto'}</strong> de la orden?
          </p>
        </div>
        <div class="modal-footer py-2 px-3 border-top bg-light justify-content-end gap-2">
          <button type="button" class="btn btn-sm btn-secondary px-3" on:click={() => { showDeleteModal = false; productToDelete = null; }}>
            Cancelar
          </button>
          <button type="button" class="btn btn-sm btn-danger px-3 shadow-sm" on:click={confirmDeleteProduct}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
