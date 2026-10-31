<script>
  import { createEventDispatcher, onDestroy } from 'svelte';
  import api from '../services/api';

  export let show = false;
  export let invoiceId = null;

  const dispatch = createEventDispatcher();

  let pdfUrl = null;
  let loading = false;
  let errorMsg = '';

  $: if (show && invoiceId) {
    loadPdf(invoiceId);
  } else {
    cleanup();
  }

  async function loadPdf(id) {
    cleanup();
    loading = true;
    errorMsg = '';
    try {
      const res = await api.get(`/sales/invoices/${id}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      pdfUrl = URL.createObjectURL(blob);
    } catch (err) {
      errorMsg = 'Error al cargar el PDF de la factura: ' + (err.response?.data?.title || err.message);
    } finally {
      loading = false;
    }
  }

  function downloadPdf() {
    if (!pdfUrl || !invoiceId) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `Factura_${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function closeModal() {
    cleanup();
    dispatch('close');
  }

  function cleanup() {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      pdfUrl = null;
    }
  }

  onDestroy(() => {
    cleanup();
  });
</script>

{#if show}
  <div class="custom-modal-backdrop" role="dialog" aria-modal="true">
    <div class="custom-modal-dialog modal-xl" style="height: 85vh;">
      <!-- Header con "Factura #[ID]" y botón 'X' -->
      <div class="custom-modal-header">
        <h5 class="modal-title m-0 fw-bold d-flex align-items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-file-earmark-pdf me-2" viewBox="0 0 16 16">
            <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
            <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.422c.114.228.094.508.04.81-.053.303-.162.656-.321 1.034.33.694.749 1.389 1.26 2.003.302-.073.612-.137.93-.19.613-.104 1.176-.123 1.632-.014.455.109.686.417.704.762.014.282-.11.554-.349.73-.218.16-.506.213-.83.213-.31 0-.671-.049-1.077-.145a19.12 19.12 0 0 1-2.843-.997l-.028.01c-.248.42-.514.823-.798 1.209a11.106 11.106 0 0 1-1.334 1.456c-.537.49-1.07.758-1.562.772a.931.931 0 0 1-.365-.077z"/>
          </svg>
          Factura #{invoiceId}
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

      <!-- Visor con iframe -->
      <div class="custom-modal-body p-0 flex-grow-1 position-relative d-flex flex-column" style="background-color: #525659;">
        {#if loading}
          <div class="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-white">
            <div class="spinner-border text-light mb-3" role="status"></div>
            <span>Generando y cargando comprobante PDF...</span>
          </div>
        {:else if errorMsg}
          <div class="p-4 bg-white m-3 rounded">
            <div class="alert alert-danger mb-0">{errorMsg}</div>
          </div>
        {:else if pdfUrl}
          <iframe
            src={pdfUrl}
            title="Comprobante de Factura"
            class="w-100 h-100 flex-grow-1"
            style="border: none; min-height: 480px;"
          ></iframe>
        {/if}
      </div>

      <!-- Footer con botón azul "Descargar" (sin botón gris "Cerrar") -->
      <div class="custom-modal-footer">
        <button
          type="button"
          class="btn btn-corporate px-4 fw-semibold d-flex align-items-center"
          disabled={!pdfUrl}
          on:click={downloadPdf}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download me-2" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
          </svg>
          Descargar
        </button>
      </div>
    </div>
  </div>
{/if}
