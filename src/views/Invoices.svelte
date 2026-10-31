<script>
  import { onMount } from 'svelte';
  import api from '../services/api';
  import { highlightText } from '../utils/highlight';
  import InvoiceModal from '../components/InvoiceModal.svelte';

  let allInvoices = [];
  let loading = false;
  let errorMsg = '';
  let dateWarning = '';

  let filterType = 'invoice'; // 'invoice', 'customer', 'date'
  let searchQuery = '';
  let currentPage = 1;
  const pageSize = 8;

  let nativeDatePicker;
  let selectedInvoiceId = null;
  let showInvoiceModal = false;

  // Fecha máxima para datepicker nativo (hoy)
  const todayObj = new Date();
  const yyyy = todayObj.getFullYear();
  const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
  const dd = String(todayObj.getDate()).padStart(2, '0');
  const maxDateIso = `${yyyy}-${mm}-${dd}`;

  onMount(() => {
    loadAllInvoices();
  });

  async function loadAllInvoices() {
    loading = true;
    errorMsg = '';
    try {
      let page = 1;
      let fetched = [];
      let totalP = 1;

      // Carga todas las páginas para filtrado estricto y exacto en cliente
      while (page <= totalP) {
        const res = await api.get('/sales/invoices', { params: { page } });
        const items = res.data?.items || [];
        totalP = res.data?.totalPages || 1;
        fetched = [...fetched, ...items];
        page++;
        if (page > 15) break; // salvaguarda
      }

      allInvoices = fetched;
      currentPage = 1;
    } catch (err) {
      errorMsg = 'Error al cargar facturas: ' + (err.response?.data?.title || err.message);
      allInvoices = [];
    } finally {
      loading = false;
    }
  }

  function formatInvoiceDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }

  function handleFilterTypeChange(e) {
    filterType = e.target.value;
    searchQuery = '';
    dateWarning = '';
    currentPage = 1;
  }

  function applyDateMask(val) {
    const digits = val.replace(/[^0-9]/g, '').slice(0, 8);
    let d = digits.slice(0, 2);
    if (d.length === 2) {
      let dNum = parseInt(d, 10);
      if (dNum < 1) d = '01';
      else if (dNum > 31) d = '31';
    }

    let m = digits.slice(2, 4);
    if (m.length === 2) {
      let mNum = parseInt(m, 10);
      if (mNum < 1) m = '01';
      else if (mNum > 12) m = '12';
    }

    let y = digits.slice(4, 8);

    let formatted = d;
    if (m) formatted += '/' + m;
    if (y) formatted += '/' + y;

    return formatted;
  }

  function validateDate(formatted) {
    if (!formatted || formatted.length !== 10) return '';
    const parts = formatted.split('/');
    if (parts.length !== 3) return 'Formato de fecha inválido.';
    const dNum = parseInt(parts[0], 10);
    const mNum = parseInt(parts[1], 10);
    const yNum = parseInt(parts[2], 10);

    if (isNaN(yNum) || yNum <= 1900 || yNum >= 3000) {
      return 'El año debe ser mayor a 1900 y menor a 3000.';
    }

    if (isNaN(mNum) || mNum < 1 || mNum > 12) {
      return 'El mes debe estar entre 01 y 12.';
    }

    const maxDays = new Date(yNum, mNum, 0).getDate();
    if (isNaN(dNum) || dNum < 1 || dNum > maxDays) {
      return 'Día no válido para el mes seleccionado.';
    }

    const inputDate = new Date(yNum, mNum - 1, dNum);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    if (inputDate > now) {
      return 'No se permiten fechas futuras.';
    }

    return '';
  }

  function isCoherentDate(formatted) {
    if (!formatted || formatted.length !== 10) return false;
    return validateDate(formatted) === '';
  }

  function handleSearchInput(e) {
    let raw = e.target.value;
    dateWarning = '';
    let val = '';

    if (filterType === 'invoice') {
      val = raw.replace(/[^0-9]/g, '').slice(0, 10);
    } else if (filterType === 'customer') {
      val = raw.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').slice(0, 10);
    } else if (filterType === 'date') {
      val = applyDateMask(raw);
      if (val.length === 10) {
        dateWarning = validateDate(val);
      }
    }

    searchQuery = val;
    e.target.value = val;
    currentPage = 1;
  }

  function openNativePicker() {
    if (nativeDatePicker) {
      if (typeof nativeDatePicker.showPicker === 'function') {
        nativeDatePicker.showPicker();
      } else {
        nativeDatePicker.click();
      }
    }
  }

  function handleNativeDateChange(e) {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      const [y, m, d] = val.split('-');
      const formatted = `${d}/${m}/${y}`;
      dateWarning = validateDate(formatted);
      searchQuery = formatted;
      currentPage = 1;
      e.target.value = '';
    }
  }

  function viewInvoice(id) {
    selectedInvoiceId = id;
    showInvoiceModal = true;
  }

  // Filtrado de Facturas
  $: filteredInvoices = allInvoices.filter((inv) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    if (filterType === 'date') {
      // Si no es una fecha válida o es futura, no ejecutes la búsqueda en la lista de facturas hasta que se ingrese una fecha coherente
      if (dateWarning || !isCoherentDate(q)) {
        return true;
      }
      const dateFormatted = formatInvoiceDate(inv.orderDate).toLowerCase();
      return dateFormatted === q;
    }

    const invNum = String(inv.id || '');
    const clientName = (inv.customerName || '').toLowerCase();

    if (filterType === 'invoice') {
      return invNum.includes(q);
    } else if (filterType === 'customer') {
      return clientName.includes(q);
    }
    return true;
  });

  // Paginación estricta de 8 registros con slice
  $: totalItems = filteredInvoices.length;
  $: totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  $: startIdx = (currentPage - 1) * pageSize;
  $: endIdx = Math.min(startIdx + pageSize, totalItems);
  $: displayedInvoices = filteredInvoices.slice(startIdx, endIdx);

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }
</script>

<div class="container-fluid px-4 py-3">
  <!-- Título en azul #0d3b66 con botón Refrescar -->
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h3 class="fw-bold m-0" style="color: #0d3b66;">
      Consultar Facturas
    </h3>
    <button
      type="button"
      class="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
      style="color: #0d3b66; border-color: #0d3b66;"
      disabled={loading}
      on:click={loadAllInvoices}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-arrow-clockwise {loading ? 'spinner-border spinner-border-sm border-0' : ''}" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
      </svg>
      Refrescar
    </button>
  </div>

  {#if errorMsg}
    <div class="alert alert-danger mb-3 alert-dismissible fade show py-2" role="alert">
      {errorMsg}
      <button type="button" class="btn-close py-2" aria-label="Close" on:click={() => (errorMsg = '')}></button>
    </div>
  {/if}

  <!-- Card Principal con Barra de Filtro Superior -->
  <div class="card shadow-sm border-0 mb-3">
    <div class="card-body p-2 px-3 border-bottom bg-light">
      <div class="row g-2 align-items-center">
        <!-- Desplegable ("No. Factura", "Cliente", "Fecha") -->
        <div class="col-12 col-md-3">
          <label for="filter-type-select" class="form-label small fw-semibold mb-1 text-secondary">Filtrar por:</label>
          <select
            id="filter-type-select"
            class="form-select form-select-sm"
            value={filterType}
            on:change={handleFilterTypeChange}
          >
            <option value="invoice">No. Factura</option>
            <option value="customer">Cliente</option>
            <option value="date">Fecha</option>
          </select>
        </div>

        <!-- Campo de búsqueda con botón de calendario SVG SOLO si filterType === 'date' -->
        <div class="col-12 col-md-9">
          <label for="filter-search-input" class="form-label small fw-semibold mb-1 text-secondary">Criterio de búsqueda:</label>
          <div class="input-group input-group-sm">
            <input
              id="filter-search-input"
              type="text"
              class="form-control {dateWarning ? 'is-invalid' : ''}"
              maxlength="10"
              placeholder={filterType === 'date'
                ? 'DD/MM/YYYY (Escriba o use el calendario)...'
                : filterType === 'invoice'
                ? 'Número de factura (ej. 7003)...'
                : 'Nombre de cliente...'}
              value={searchQuery}
              on:input={handleSearchInput}
            />

            {#if filterType === 'date'}
              <!-- Botón con SVG de calendario que abre el datepicker nativo SOLO cuando filterType es exactamente 'date' -->
              <button
                type="button"
                class="btn btn-outline-secondary d-flex align-items-center"
                title="Abrir selector de fecha"
                on:click={openNativePicker}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-calendar-event" viewBox="0 0 16 16">
                  <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
                  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                </svg>
              </button>

              <!-- Datepicker nativo con min="1901-01-01" y max={hoy} para bloquear fechas fuera de rango -->
              <input
                type="date"
                class="position-absolute"
                style="opacity: 0; pointer-events: none; width: 0; height: 0;"
                min="1901-01-01"
                max={maxDateIso}
                bind:this={nativeDatePicker}
                on:change={handleNativeDateChange}
              />
            {/if}

            {#if searchQuery}
              <button
                type="button"
                class="btn btn-outline-secondary"
                title="Limpiar búsqueda"
                on:click={() => {
                  searchQuery = '';
                  dateWarning = '';
                  currentPage = 1;
                }}
              >
                &times;
              </button>
            {/if}
          </div>

          {#if dateWarning}
            <div class="text-danger small mt-1" style="font-size: 0.75rem;">
              {dateWarning}
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Tabla estilizada compacta (8 registros por página estrictos con slice) -->
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-sm table-hover align-middle mb-0 text-nowrap compact-invoices-table">
          <thead class="table-light">
            <tr class="small text-uppercase text-secondary">
              <th class="ps-3" style="width: 120px;">No. Factura</th>
              <th>Cliente</th>
              <th style="width: 150px;">Fecha</th>
              <th class="text-end" style="width: 130px;">Total</th>
              <th class="text-center" style="width: 130px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#if loading}
              <tr>
                <td colspan="5" class="text-center py-4">
                  <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  <span class="text-muted small">Cargando facturas...</span>
                </td>
              </tr>
            {:else if displayedInvoices.length === 0}
              <tr>
                <td colspan="5" class="text-center py-4 text-muted small">
                  No se encontraron facturas con el criterio de búsqueda seleccionado.
                </td>
              </tr>
            {:else}
              {#each displayedInvoices as inv (inv.id)}
                {@const dateStr = formatInvoiceDate(inv.orderDate)}
                <tr>
                  <td class="font-monospace fw-bold ps-3" style="color: #0d3b66;">
                    #{@html highlightText(String(inv.id), searchQuery)}
                  </td>
                  <td>
                    <div class="fw-semibold">
                      {@html highlightText(inv.customerName || 'Cliente sin nombre', searchQuery)}
                    </div>
                    {#if inv.customerIdentification}
                      <div class="text-muted font-monospace" style="font-size: 0.75rem;">
                        Cédula: {@html highlightText(inv.customerIdentification, searchQuery)}
                      </div>
                    {/if}
                  </td>
                  <td class="text-secondary">
                    {@html highlightText(dateStr, filterType === 'date' && (dateWarning || !isCoherentDate(searchQuery)) ? '' : searchQuery)}
                  </td>
                  <td class="text-end fw-bold" style="color: #0d3b66;">
                    ${Number(inv.total || 0).toFixed(2)}
                  </td>
                  <td class="text-center">
                    <button
                      type="button"
                      class="btn btn-corporate btn-sm py-1 px-3 fw-semibold"
                      on:click={() => viewInvoice(inv.id)}
                    >
                      Ver Factura
                    </button>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Card Footer: paginación centrada en la parte inferior del contenedor (d-flex justify-content-center) -->
    <div class="card-footer bg-light py-2 border-top">
      <div class="d-flex flex-column align-items-center justify-content-center gap-1">
        <span class="text-muted small" style="font-size: 0.8rem;">
          {#if totalItems === 0}
            Mostrando 0 facturas
          {:else}
            Mostrando {startIdx + 1} - {endIdx} de {totalItems} facturas
          {/if}
        </span>
        <div class="d-flex justify-content-center w-100">
          <nav aria-label="Paginación de facturas">
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item {currentPage <= 1 ? 'disabled' : ''}">
                <button
                  class="page-link"
                  on:click={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Anterior
                </button>
              </li>

              {#each Array(totalPages) as _, idx}
                {@const pageNum = idx + 1}
                <li class="page-item {currentPage === pageNum ? 'active' : ''}">
                  <button
                    class="page-link"
                    on:click={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                </li>
              {/each}

              <li class="page-item {currentPage >= totalPages ? 'disabled' : ''}">
                <button
                  class="page-link"
                  on:click={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Siguiente
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .compact-invoices-table th,
  .compact-invoices-table td {
    padding-top: 6px !important;
    padding-bottom: 6px !important;
    font-size: 0.85rem;
  }
</style>

<!-- Modal Visor de Factura -->
<InvoiceModal
  show={showInvoiceModal}
  invoiceId={selectedInvoiceId}
  on:close={() => (showInvoiceModal = false)}
/>
