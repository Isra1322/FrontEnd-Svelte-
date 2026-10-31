<script>
  import { createEventDispatcher } from 'svelte';
  import api from '../services/api';
  import { highlightText } from '../utils/highlight';

  export let show = false;
  export let selectedProductIds = [];

  const dispatch = createEventDispatcher();

  let filterType = 'all'; // 'all', 'id', 'name'
  let searchQuery = '';
  let products = [];
  let currentPage = 1;
  let totalPages = 1;
  let loading = false;
  let errorMsg = '';

  $: if (show) {
    loadProducts(1);
  }

  function handleFilterTypeChange(e) {
    filterType = e.target.value;
    searchQuery = '';
    loadProducts(1);
  }

  function handleSearchInput(e) {
    let val = e.target.value;
    if (filterType === 'id') {
      val = val.replace(/\D/g, '');
    }
    searchQuery = val;
    e.target.value = val;
    loadProducts(1);
  }

  async function loadProducts(page = 1) {
    loading = true;
    errorMsg = '';
    try {
      const params = { page };
      const q = searchQuery.trim();

      if (q) {
        if (filterType === 'id') {
          params.id = q;
        } else if (filterType === 'name') {
          params.name = q;
        } else {
          // 'all'
          if (/^\d+$/.test(q)) {
            params.id = q;
          } else {
            params.name = q;
          }
        }
      }

      const res = await api.get('/sales/products', { params });
      products = res.data?.items || [];
      currentPage = res.data?.page || 1;
      totalPages = res.data?.totalPages || 1;
    } catch (err) {
      errorMsg = 'Error al cargar productos: ' + (err.response?.data?.title || err.message);
      products = [];
    } finally {
      loading = false;
    }
  }

  function addProduct(prod) {
    dispatch('add', prod);
  }

  function closeModal() {
    dispatch('close');
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      loadProducts(page);
    }
  }
</script>

{#if show}
  <div class="custom-modal-backdrop" role="dialog" aria-modal="true">
    <div class="custom-modal-dialog modal-lg">
      <div class="custom-modal-header">
        <h5 class="modal-title m-0 fw-bold d-flex align-items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-box me-2" viewBox="0 0 16 16">
            <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zm3.564 1.426L5.596 5 8 5.961 14.154 3.5l-2.404-.961zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.84L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/>
          </svg>
          Búsqueda de Productos
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
        <div class="row g-2 mb-3">
          <div class="col-12 col-md-4">
            <select
              class="form-select form-select-sm"
              value={filterType}
              on:change={handleFilterTypeChange}
            >
              <option value="all">Todo</option>
              <option value="id">ID</option>
              <option value="name">Nombre</option>
            </select>
          </div>
          <div class="col-12 col-md-8">
            <input
              type="text"
              class="form-control form-select-sm"
              placeholder={filterType === 'id' ? 'Buscar por ID (solo números)...' : filterType === 'name' ? 'Buscar por nombre...' : 'Buscar por ID o nombre...'}
              value={searchQuery}
              on:input={handleSearchInput}
            />
          </div>
        </div>

        {#if errorMsg}
          <div class="alert alert-danger py-2 small mb-3">{errorMsg}</div>
        {/if}

        <div class="table-responsive" style="min-height: 250px;">
          <table class="table table-sm table-hover table-striped align-middle mb-0 text-nowrap">
            <thead class="table-light">
              <tr class="small text-uppercase text-secondary">
                <th style="width: 80px;">ID</th>
                <th>Producto</th>
                <th class="text-center" style="width: 100px;">Stock</th>
                <th class="text-end" style="width: 120px;">Precio</th>
                <th class="text-center" style="width: 100px;">Acción</th>
              </tr>
            </thead>
            <tbody>
              {#if loading}
                <tr>
                  <td colspan="5" class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span class="text-muted">Cargando productos...</span>
                  </td>
                </tr>
              {:else if products.length === 0}
                <tr>
                  <td colspan="5" class="text-center py-4 text-muted">
                    No se encontraron productos disponibles.
                  </td>
                </tr>
              {:else}
                {#each products as prod (prod.id)}
                  {@const stock = Number(prod.unitsInStock ?? 0)}
                  {@const price = Number(prod.unitPrice ?? 0)}
                  {@const isSelected = selectedProductIds.map(String).includes(String(prod.id))}
                  <tr>
                    <td class="font-monospace small">
                      {@html highlightText(prod.id, searchQuery)}
                    </td>
                    <td class="fw-semibold">
                      {@html highlightText(prod.name, searchQuery)}
                    </td>
                    <td class="text-center">
                      {#if stock > 0}
                        <span class="badge bg-secondary">{stock}</span>
                      {:else}
                        <span class="badge bg-danger">Agotado</span>
                      {/if}
                    </td>
                    <td class="text-end fw-semibold">
                      ${price.toFixed(2)}
                    </td>
                    <td class="text-center">
                      {#if isSelected}
                        <button
                          type="button"
                          class="btn btn-secondary btn-sm py-0 px-2"
                          disabled
                        >
                          Ya seleccionado
                        </button>
                      {:else if stock <= 0}
                        <button
                          type="button"
                          class="btn btn-outline-secondary btn-sm py-0 px-2"
                          disabled
                        >
                          Agotado
                        </button>
                      {:else}
                        <button
                          type="button"
                          class="btn btn-corporate btn-sm py-0 px-2"
                          on:click={() => addProduct(prod)}
                        >
                          Agregar
                        </button>
                      {/if}
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>

        {#if totalPages > 1}
          <div class="d-flex justify-content-center mt-3">
            <nav aria-label="Navegación de productos">
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
    </div>
  </div>
{/if}
