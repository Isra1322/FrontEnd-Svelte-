<script>
  import { createEventDispatcher } from 'svelte';

  export let show = false;
  export let title = 'Confirmar Cancelación';
  export let message = '¿Está seguro de que desea cancelar la orden actual? Se borrarán todos los datos del cliente, entrega y productos seleccionados.';

  const dispatch = createEventDispatcher();

  function confirm() {
    dispatch('confirm');
  }

  function cancel() {
    dispatch('cancel');
  }
</script>

{#if show}
  <div class="custom-modal-backdrop" role="dialog" aria-modal="true">
    <div class="custom-modal-dialog" style="max-width: 480px;">
      <div class="custom-modal-header bg-danger">
        <h5 class="modal-title m-0 fw-bold d-flex align-items-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-exclamation-triangle-fill me-2" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
          {title}
        </h5>
        <button
          type="button"
          class="btn-close-custom"
          aria-label="Cerrar"
          on:click={cancel}
        >
          &times;
        </button>
      </div>

      <div class="custom-modal-body py-4">
        <p class="mb-0 text-secondary">{message}</p>
      </div>

      <div class="custom-modal-footer">
        <button
          type="button"
          class="btn btn-outline-secondary px-3"
          on:click={cancel}
        >
          No, continuar
        </button>
        <button
          type="button"
          class="btn btn-danger px-3 fw-semibold"
          on:click={confirm}
        >
          Sí, cancelar orden
        </button>
      </div>
    </div>
  </div>
{/if}
