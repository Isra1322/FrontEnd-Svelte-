<script>
  import { auth } from '../stores/auth';
  import { navigation } from '../stores/navigation';

  export let currentPage = 'home';

  function handleNavigate(page) {
    navigation.navigate(page);
  }

  function handleLogout() {
    auth.logout();
  }
</script>

<nav class="navbar navbar-expand-lg navbar-dark" style="background-color: #0d3b66; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
  <div class="container-fluid px-4">
    <button
      class="navbar-brand btn btn-link text-white text-decoration-none fw-bold fs-4 p-0 d-flex align-items-center"
      on:click={() => handleNavigate('home')}
      style="letter-spacing: 0.5px;"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-compass me-2" viewBox="0 0 16 16">
        <path d="M8 160.1A7.99 7.99 0 0 0 16 8 8 8 0 0 0 8 0a8 8 0 0 0-8 8 8 8 0 0 0 8 8.1zm0-1a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"/>
        <path d="M6.94 7.44l4.95-2.83-2.83 4.95-4.95 2.83 2.83-4.95zm.77.77l1.58 2.76 2.76-1.58-1.58-2.76-2.76 1.58z"/>
      </svg>
      NorthWind Sales
    </button>

    <button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarContent"
      aria-controls="navbarContent"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="navbarContent">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
        {#if $auth.isAuthenticated}
          <li class="nav-item">
            <button
              class="nav-link btn btn-link text-white {currentPage === 'createorder' ? 'fw-bold active' : 'opacity-75'}"
              style="text-decoration: none;"
              on:click={() => handleNavigate('createorder')}
            >
              Crear orden
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link btn btn-link text-white {currentPage === 'invoices' ? 'fw-bold active' : 'opacity-75'}"
              style="text-decoration: none;"
              on:click={() => handleNavigate('invoices')}
            >
              Consultar facturas
            </button>
          </li>
        {/if}
      </ul>

      <div class="d-flex align-items-center gap-2">
        {#if $auth.isAuthenticated}
          <span class="text-white me-3 fw-medium">
            Hola, {$auth.user?.name || 'Usuario'}
          </span>
          <button
            class="btn btn-outline-light btn-sm px-3"
            on:click={handleLogout}
          >
            Cerrar sesión
          </button>
        {:else}
          <button
            class="btn btn-outline-light btn-sm px-3"
            on:click={() => handleNavigate('login')}
          >
            Iniciar sesión
          </button>
          <button
            class="btn btn-light btn-sm px-3 fw-semibold text-primary"
            style="color: #0d3b66 !important;"
            on:click={() => handleNavigate('register')}
          >
            Crear cuenta
          </button>
        {/if}
      </div>
    </div>
  </div>
</nav>

<style>
  .nav-link.active {
    border-bottom: 2px solid #ffffff;
  }
  .nav-link:hover {
    opacity: 1 !important;
  }
</style>
