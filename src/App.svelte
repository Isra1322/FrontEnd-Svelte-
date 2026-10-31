<script>
  import Navbar from './components/Navbar.svelte';
  import Home from './views/Home.svelte';
  import Login from './views/Login.svelte';
  import Register from './views/Register.svelte';
  import CreateOrder from './views/CreateOrder.svelte';
  import Invoices from './views/Invoices.svelte';
  import { currentPage, navigation } from './stores/navigation';
  import { auth } from './stores/auth';

  // Si intenta acceder a rutas protegidas sin sesión, redirige a login
  $: if (
    ($currentPage === 'createorder' || $currentPage === 'invoices') &&
    !$auth.isAuthenticated
  ) {
    navigation.navigate('login');
  }

  // Si está autenticado y visita login o register, puede ir a home
  $: if (
    ($currentPage === 'login' || $currentPage === 'register') &&
    $auth.isAuthenticated
  ) {
    navigation.navigate('home');
  }
</script>

<div class="d-flex flex-column min-vh-100">
  <Navbar currentPage={$currentPage} />

  <main class="flex-grow-1">
    {#if $currentPage === 'home'}
      <Home />
    {:else if $currentPage === 'login'}
      <Login />
    {:else if $currentPage === 'register'}
      <Register />
    {:else if $currentPage === 'createorder'}
      {#if $auth.isAuthenticated}
        <CreateOrder />
      {:else}
        <Login />
      {/if}
    {:else if $currentPage === 'invoices'}
      {#if $auth.isAuthenticated}
        <Invoices />
      {:else}
        <Login />
      {/if}
    {:else}
      <Home />
    {/if}
  </main>
</div>
