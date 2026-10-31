<script>
  import { auth } from '../stores/auth';
  import { navigation } from '../stores/navigation';

  let firstName = '';
  let lastName = '';
  let email = '';
  let password = '';
  let confirmPassword = '';

  let errorMessage = '';
  let successMessage = '';
  let emailWarning = '';
  let loading = false;

  function formatTitleCase(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  function handleNameInput(e, field) {
    let val = e.target.value;
    // Solo letras (sin espacios, sin números, sin caracteres especiales)
    val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g, '').slice(0, 30);

    // Formateo automático en Title Case
    val = formatTitleCase(val);

    if (field === 'first') {
      firstName = val;
    } else {
      lastName = val;
    }
    e.target.value = val;
  }

  function handleEmailInput(e) {
    let val = e.target.value;
    val = val.replace(/[^a-zA-Z0-9\-_@.]/g, '');

    while (val.includes('--')) {
      val = val.replace(/--/g, '-');
    }

    while (val.toLowerCase().includes('.com.')) {
      val = val.replace(/\.com\./gi, '.com');
    }

    if (val.length > 30) {
      val = val.slice(0, 30);
    }

    email = val;
    e.target.value = val;

    if (val.endsWith('.')) {
      emailWarning = 'El correo no puede terminar en punto (.)';
    } else {
      emailWarning = '';
    }
  }

  async function handleSubmit() {
    errorMessage = '';
    successMessage = '';

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      errorMessage = 'Todos los campos son obligatorios';
      return;
    }

    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/;
    if (!nameRegex.test(firstName)) {
      errorMessage = 'El nombre solo debe contener letras sin espacios ni caracteres especiales';
      return;
    }
    if (!nameRegex.test(lastName)) {
      errorMessage = 'El apellido solo debe contener letras sin espacios ni caracteres especiales';
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

    if (password.length < 6) {
      errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (password !== confirmPassword) {
      errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    loading = true;
    const result = await auth.register({
      firstName: formatTitleCase(firstName),
      lastName: formatTitleCase(lastName),
      email: email.trim().toLowerCase(),
      password
    });
    loading = false;

    if (result.success) {
      successMessage = '¡Registro exitoso! Redirigiendo al inicio de sesión...';
      setTimeout(() => {
        navigation.navigate('login');
      }, 1500);
    } else {
      errorMessage = result.message || 'Error al procesar el registro.';
    }
  }
</script>

<div class="container py-5">
  <div class="row justify-content-center">
    <div class="col-12 col-md-8 col-lg-6">
      <div class="card shadow-sm border-0 rounded-3">
        <div class="card-header bg-corporate text-white text-center py-4 rounded-top-3">
          <h3 class="fw-bold mb-1">Crear Cuenta</h3>
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

          {#if successMessage}
            <div class="alert alert-success d-flex align-items-center mb-4" role="alert">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-check-circle-fill me-2 flex-shrink-0" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
              </svg>
              <div>{successMessage}</div>
            </div>
          {/if}

          <form on:submit|preventDefault={handleSubmit}>
            <div class="row g-3 mb-3">
              <div class="col-sm-6">
                <label for="reg-firstname" class="form-label fw-semibold">Nombre</label>
                <input
                  id="reg-firstname"
                  type="text"
                  class="form-control"
                  placeholder="Juan"
                  maxlength="30"
                  value={firstName}
                  on:input={(e) => handleNameInput(e, 'first')}
                  disabled={loading}
                  required
                />
                <div class="form-text small">Solo letras, sin espacios (Máx. 30 car.).</div>
              </div>

              <div class="col-sm-6">
                <label for="reg-lastname" class="form-label fw-semibold">Apellido</label>
                <input
                  id="reg-lastname"
                  type="text"
                  class="form-control"
                  placeholder="Pérez"
                  maxlength="30"
                  value={lastName}
                  on:input={(e) => handleNameInput(e, 'last')}
                  disabled={loading}
                  required
                />
                <div class="form-text small">Solo letras, sin espacios (Máx. 30 car.).</div>
              </div>
            </div>

            <div class="mb-3">
              <label for="reg-email" class="form-label fw-semibold">Correo Electrónico</label>
              <input
                id="reg-email"
                type="text"
                class="form-control {emailWarning ? 'is-invalid' : ''}"
                placeholder="ejemplo@correo.com"
                maxlength="30"
                value={email}
                on:input={handleEmailInput}
                disabled={loading}
                required
              />
              {#if emailWarning}
                <div class="invalid-feedback d-block small mt-1">
                  {emailWarning}
                </div>
              {:else}
                <div class="form-text small">Máx. 30 caracteres. Sin '--' ni '.com.'.</div>
              {/if}
            </div>

            <div class="row g-3 mb-4">
              <div class="col-sm-6">
                <label for="reg-password" class="form-label fw-semibold">Contraseña</label>
                <input
                  id="reg-password"
                  type="password"
                  class="form-control"
                  placeholder="••••••••"
                  bind:value={password}
                  disabled={loading}
                  required
                />
              </div>
              <div class="col-sm-6">
                <label for="reg-confirm" class="form-label fw-semibold">Confirmar</label>
                <input
                  id="reg-confirm"
                  type="password"
                  class="form-control"
                  placeholder="••••••••"
                  bind:value={confirmPassword}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-corporate w-100 py-2 fw-semibold"
              disabled={loading}
            >
              {#if loading}
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Registrando...
              {:else}
                Crear Cuenta
              {/if}
            </button>
          </form>

          <div class="text-center mt-4">
            <span class="text-muted small">¿Ya tienes una cuenta?</span>
            <button
              type="button"
              class="btn btn-link btn-sm p-0 ms-1 fw-semibold text-corporate text-decoration-none"
              on:click={() => navigation.navigate('login')}
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
