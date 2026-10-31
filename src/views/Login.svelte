<script>
  import { auth } from '../stores/auth';
  import { navigation } from '../stores/navigation';

  let email = '';
  let password = '';
  let errorMessage = '';
  let emailWarning = '';
  let loading = false;

  function handleEmailInput(e) {
    let val = e.target.value;
    
    // Solo permite letras, números, -, _, @, .
    val = val.replace(/[^a-zA-Z0-9\-_@.]/g, '');

    // Bloquea guiones seguidos ('--')
    while (val.includes('--')) {
      val = val.replace(/--/g, '-');
    }

    // Bloquea punto tras '.com' ('.com.')
    while (val.toLowerCase().includes('.com.')) {
      val = val.replace(/\.com\./gi, '.com');
    }

    // Límite de 30 caracteres
    if (val.length > 30) {
      val = val.slice(0, 30);
    }

    email = val;
    e.target.value = val;

    // Validación inmediata
    validateEmailImmediate(val);
  }

  function validateEmailImmediate(val) {
    if (val.endsWith('.')) {
      emailWarning = 'El correo no puede terminar en punto (.)';
    } else {
      emailWarning = '';
    }
  }

  async function handleSubmit() {
    errorMessage = '';
    if (!email.trim() || !password) {
      errorMessage = 'Por favor complete todos los campos';
      return;
    }

    if (email.endsWith('.')) {
      errorMessage = 'El correo electrónico no puede terminar con un punto (.)';
      return;
    }

    const emailRegex = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(email)) {
      errorMessage = 'Por favor ingrese un formato de correo electrónico válido';
      return;
    }

    loading = true;
    const result = await auth.login(email.trim(), password);
    loading = false;

    if (!result.success) {
      errorMessage = result.message || 'Credenciales inválidas. Por favor intente de nuevo.';
    }
  }
</script>

<div class="container py-5">
  <div class="row justify-content-center">
    <div class="col-12 col-md-8 col-lg-5">
      <div class="card shadow-sm border-0 rounded-3">
        <div class="card-header bg-corporate text-white text-center py-4 rounded-top-3">
          <h3 class="fw-bold mb-1">Iniciar Sesión</h3>
          <p class="text-white-50 mb-0 small">NorthWind Sales Management</p>
        </div>
        <div class="card-body p-4 p-md-5">
          {#if errorMessage}
            <div class="alert alert-danger d-flex align-items-center mb-4" role="alert">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-exclamation-triangle-fill me-2 flex-shrink-0" viewBox="0 0 16 16">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              </svg>
              <div>{errorMessage}</div>
            </div>
          {/if}

          <form on:submit|preventDefault={handleSubmit}>
            <div class="mb-3">
              <label for="login-email" class="form-label fw-semibold">Correo Electrónico</label>
              <input
                id="login-email"
                type="text"
                class="form-control {emailWarning ? 'is-invalid' : ''}"
                placeholder="ejemplo@correo.com"
                maxlength="30"
                value={email}
                on:input={handleEmailInput}
                disabled={loading}
                required
                autocomplete="username"
              />
              {#if emailWarning}
                <div class="invalid-feedback d-block small mt-1">
                  {emailWarning}
                </div>
              {:else}
                <div class="form-text small">
                  Máximo 30 caracteres. Sin caracteres especiales ni guiones dobles.
                </div>
              {/if}
            </div>

            <div class="mb-4">
              <label for="login-password" class="form-label fw-semibold">Contraseña</label>
              <input
                id="login-password"
                type="password"
                class="form-control"
                placeholder="••••••••"
                bind:value={password}
                disabled={loading}
                required
                autocomplete="current-password"
              />
            </div>

            <button
              type="submit"
              class="btn btn-corporate w-100 py-2 fw-semibold"
              disabled={loading}
            >
              {#if loading}
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Iniciando sesión...
              {:else}
                Iniciar Sesión
              {/if}
            </button>
          </form>

          <div class="text-center mt-4">
            <span class="text-muted small">¿No tienes una cuenta?</span>
            <button
              type="button"
              class="btn btn-link btn-sm p-0 ms-1 fw-semibold text-corporate text-decoration-none"
              on:click={() => navigation.navigate('register')}
            >
              Crear cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
