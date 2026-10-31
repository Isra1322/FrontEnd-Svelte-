<script>
  import { auth } from '../stores/auth';
  import { navigation } from '../stores/navigation';
</script>

<div class="d-flex flex-column align-items-center justify-content-center text-center py-5 my-auto" style="min-height: 70vh;">
  <div class="mb-4 text-corporate">
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#0d3b66" class="bi bi-box-seam" viewBox="0 0 16 16">
      <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zm3.564 1.426L5.596 5 8 5.961 14.154 3.5l-2.404-.961zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.84L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/>
    </svg>
  </div>
  <h1 class="fw-bold mb-3" style="color: #0d3b66; font-size: 2.75rem;">
    Bienvenido a NorthWind Sales
  </h1>
  <p class="text-secondary fs-5 mb-4" style="max-width: 650px;">
    Plataforma para la gestión y creación de pedidos de ventas.
  </p>

  {#if $auth.isAuthenticated}
    <div class="d-flex gap-3 mt-2">
      <button
        class="btn btn-corporate btn-lg px-4 shadow-sm"
        on:click={() => navigation.navigate('createorder')}
      >
        Crear nueva orden
      </button>
      <button
        class="btn btn-outline-secondary btn-lg px-4 shadow-sm"
        on:click={() => navigation.navigate('invoices')}
      >
        Consultar facturas
      </button>
    </div>
  {:else}
    <div class="d-flex gap-3 mt-2">
      <button
        class="btn btn-corporate btn-lg px-4 shadow-sm"
        on:click={() => navigation.navigate('login')}
      >
        Iniciar sesión
      </button>
      <button
        class="btn btn-outline-primary btn-lg px-4 shadow-sm"
        style="color: #0d3b66; border-color: #0d3b66;"
        on:click={() => navigation.navigate('register')}
      >
        Crear cuenta
      </button>
    </div>
  {/if}
</div>
