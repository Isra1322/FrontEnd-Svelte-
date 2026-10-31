<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import api from '../services/api';
  import { highlightText } from '../utils/highlight';

  export let show = false;

  const dispatch = createEventDispatcher();

  let filterType = 'all'; // 'all', 'identification', 'name'
  let searchQuery = '';
  let customers = [];
  let currentPage = 1;
  let totalPages = 1;
  let loading = false;
  let errorMsg = '';

  $: if (show) {
    loadCustomers(1);
  }

  function handleFilterTypeChange(e) {
    filterType = e.target.value;
    searchQuery = '';
    loadCustomers(1);
  }

  function handleSearchInput(e) {
    let val = e.target.value;

    if (filterType === 'identification') {
      // Solo números, máx 10
      val = val.replace(/\D/g, '').slice(0, 10);
    } else if (filterType === 'name') {
      // Solo letras y espacios
      val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    }

    searchQuery = val;
    e.target.value = val;
    loadCustomers(1);
  }

  async function loadCustomers(page = 1) {
    loading = true;
    errorMsg = '';
    try {
      const params = { page };
      const q = searchQuery.trim();

      if (q) {
        if (filterType === 'identification') {
          params.identification = q;
        } else if (filterType === 'name') {
          params.name = q;
        } else {
          // 'all'
          if (/^\d+$/.test(q)) {
            params.identification = q;
          } else {
            params.name = q;
          }
        }
      }

      const res = await api.get('/sales/customers/lookup', { params });
      customers = res.data?.items || [];
      currentPage = res.data?.page || 1;
      totalPages = res.data?.totalPages || 1;
    } catch (err) {
      errorMsg = 'Error al cargar clientes: ' + (err.response?.data?.title || err.message);
      customers = [];
    } finally {
      loading = false;
    }
  }

  function selectCustomer(cust) {
    dispatch('select', cust);
    closeModal();
  }

  function closeModal() {
    dispatch('close');
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      loadCustomers(page);
    }
  }
</script>

{#if show}
  <div class="custom-modal-backdrop" role="dialog" aria-modal="true">
    <div class="custom-modal-dialog modal-xl">
      <!-- Header con 'X' superior (sin botón gris cerrar) -->
      <div class="custom-modal-header">
        <h5 class="modal-title m-0 fw-bold d-flex align-items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-people-fill me-2" viewBox="0 0 16 16">
            <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
          </svg>
          Búsqueda de Clientes
        </h5>
        <button
          type="button"
          class="btn-close-custom"
          aria-label="Cerrar"
          on:click={closeModal}
        >
          &times;
        </button>
      </div>

      <div class="custom-modal-body">
        <!-- Barra de filtros -->
        <div class="row g-2 mb-3">
          <div class="col-12 col-md-4">
            <select
              class="form-select form-select-sm"
              value={filterType}
              on:change={handleFilterTypeChange}
            >
              <option value="all">Todo</option>
              <option value="identification">Número de cédula</option>
              <option value="name">Nombre</option>
            </select>
          </div>
          <div class="col-12 col-md-8">
            <input
              type="text"
              class="form-control form-select-sm"
              placeholder={filterType === 'identification' ? 'Buscar por cédula (solo números, máx 10)...' : filterType === 'name' ? 'Buscar por nombre (solo letras)...' : 'Buscar por cédula o nombre...'}
              value={searchQuery}
              on:input={handleSearchInput}
            />
          </div>
        </div>

        {#if errorMsg}
          <div class="alert alert-danger py-2 small mb-3">{errorMsg}</div>
        {/if}

        <!-- Tabla compacta -->
        <div class="table-responsive" style="min-height: 250px;">
          <table class="table table-sm table-hover table-striped align-middle mb-0 text-nowrap">
            <thead class="table-light">
              <tr class="small text-uppercase text-secondary">
                <th>Cédula</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Ciudad</th>
                <th class="text-center">Deuda</th>
                <th class="text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {#if loading}
                <tr>
                  <td colspan="7" class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span class="text-muted">Cargando clientes...</span>
                  </td>
                </tr>
              {:else if customers.length === 0}
                <tr>
                  <td colspan="7" class="text-center py-4 text-muted">
                    No se encontraron clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              {:else}
                {#each customers as cust (cust.id)}
                  {@const debtAmount = Number(cust.debt ?? cust.deuda ?? 0)}
                  <tr>
                    <td class="font-monospace small">
                      {@html highlightText(cust.identification || cust.cedulaRuc || '-', searchQuery)}
                    </td>
                    <td class="fw-semibold">
                      {@html highlightText(cust.name || cust.companyName || '-', searchQuery)}
                    </td>
                    <td class="small">{cust.phone || cust.telefono || '-'}</td>
                    <td class="small text-muted">{cust.email || cust.correo || '-'}</td>
                    <td class="small">{cust.city || cust.ciudad || '-'}</td>
                    <td class="text-center">
                      {#if debtAmount > 0}
                        <span class="badge bg-danger">
                          ${debtAmount.toFixed(2)}
                        </span>
                      {:else}
                        <span class="badge bg-success">
                          $0.00
                        </span>
                      {/if}
                    </td>
                    <td class="text-center">
                      <button
                        type="button"
                        class="btn btn-corporate btn-sm py-0 px-2"
                        on:click={() => selectCustomer(cust)}
                      >
                        Seleccionar
                      </button>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>

        <!-- Paginación centrada con botones numéricos [Anterior] [1] [2]... [Siguiente] -->
        {#if totalPages > 1}
          <div class="d-flex justify-content-center mt-3">
            <nav aria-label="Navegación de clientes">
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
        {/if}
      </div>
      <!-- Sin botón gris "Cerrar", solo 'X' superior según requerimiento -->
    </div>
  </div>
{/if}
