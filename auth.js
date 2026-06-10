// auth.js
// Controlador de Autenticación con Supabase Auth y UI con Tailwind CSS

document.addEventListener('DOMContentLoaded', () => {
  const authContainer = document.getElementById('auth-container');
  const appContainer = document.getElementById('app-container');
  const authForm = document.getElementById('auth-form');
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const submitBtn = document.getElementById('auth-submit-btn');
  const toggleBtn = document.getElementById('auth-toggle-btn');
  const toggleText = document.getElementById('auth-toggle-text');
  const subtitleText = document.getElementById('auth-subtitle');
  const errorAlert = document.getElementById('auth-error-alert');
  const signoutBtn = document.getElementById('btn-signout');

  let authMode = 'login'; // 'login' o 'signup'

  // Alternar modo entre iniciar sesión y registrarse
  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    errorAlert.classList.add('hidden');
    if (authMode === 'login') {
      authMode = 'signup';
      subtitleText.textContent = 'Crea una cuenta nueva en ServiTrack';
      submitBtn.textContent = 'Registrarse';
      toggleText.textContent = '¿Ya tienes una cuenta?';
      toggleBtn.textContent = 'Inicia sesión';
    } else {
      authMode = 'login';
      subtitleText.textContent = 'Inicia sesión para gestionar tus servicios';
      submitBtn.textContent = 'Iniciar Sesión';
      toggleText.textContent = '¿No tienes una cuenta?';
      toggleBtn.textContent = 'Regístrate';
    }
  });

  // Enviar formulario (Login o Registro)
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorAlert.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent =
      authMode === 'login' ? 'Iniciando sesión...' : 'Registrando cuenta...';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!supabaseClient) {
      showError(
        'Error: Supabase no está inicializado. Verifica las credenciales en storage.js'
      );
      submitBtn.disabled = false;
      submitBtn.textContent =
        authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse';
      return;
    }

    try {
      if (authMode === 'login') {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) throw error;
        console.log('Inicio de sesión exitoso:', data.user.email);
      } else {
        const { data, error } = await supabaseClient.auth.signUp({
          email: email,
          password: password,
        });

        if (error) throw error;

        if (data.user && data.session === null) {
          alert(
            '¡Registro exitoso! Por favor, verifica tu correo electrónico para confirmar la cuenta (si está configurada la confirmación por correo) o intenta iniciar sesión directamente.'
          );
          // Cambiar a login
          toggleBtn.click();
        } else if (data.session) {
          console.log(
            'Registro e inicio de sesión automático:',
            data.user.email
          );
        }
      }
    } catch (err) {
      showError(
        err.message || 'Ocurrió un error inesperado durante la autenticación.'
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent =
        authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse';
    }
  });

  // Cerrar sesión
  signoutBtn.addEventListener('click', async () => {
    if (!supabaseClient) return;
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      console.log('Sesión cerrada con éxito.');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  });

  // Escuchar cambios de estado en Supabase Auth
  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('Cambio de estado Auth:', event);
      if (session) {
        // Usuario autenticado
        showDashboard();
        // Forzar carga de datos y renderizar
        loadData().then(() => {
          if (typeof renderApp === 'function') renderApp();
        });
      } else {
        // Sin sesión activa
        showLogin();
        services = [];
        if (typeof renderApp === 'function') renderApp();
      }
    });
  } else {
    console.error(
      'Supabase no inicializado en storage.js. No se puede escuchar auth.'
    );
  }

  // Funciones auxiliares de visualización
  function showDashboard() {
    authContainer.classList.add('hidden');
    authContainer.classList.remove('flex');
    appContainer.classList.remove('hidden');
  }

  function showLogin() {
    appContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
    authContainer.classList.add('flex');
    authForm.reset();
    errorAlert.classList.add('hidden');
  }

  function showError(msg) {
    errorAlert.textContent = msg;
    errorAlert.classList.remove('hidden');
  }
});
