/**
 * Nusantara CRM — Login Module (T-41)
 * JWT-like auth with localStorage, protected routes, loading states
 */
import { state } from '../../state.js'
import api from '../../api/api.js'

export default class LoginView {
  constructor() {
    this.loading = false
  }

  async mount(el) {
    this.el = el

    // Auto-redirect if already logged in
    if (state.isAuthenticated) {
      window.location.hash = '#/'
      return
    }

    this.render()
    this.attachEvents()
  }

  render() {
    this.el.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-primary-50 to-gold-50 flex items-center justify-center p-4">
        <div class="w-full max-w-md">
          <!-- Logo & Branding -->
          <div class="text-center mb-8">
            <div class="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span class="text-white font-bold text-xl">NC</span>
            </div>
            <h1 class="font-heading font-bold text-2xl text-gray-900">Nusantara CRM</h1>
            <p class="text-gray-500 text-sm mt-1">Sistem Manajemen Travel Umroh & Haji</p>
          </div>

          <!-- Login Card -->
          <div class="card p-8 shadow-xl">
            <h2 class="font-heading font-semibold text-xl text-gray-900 mb-6">Masuk ke Akun</h2>

            <form id="login-form" class="space-y-5">
              <!-- Email -->
              <div>
                <label for="email" class="form-label">Alamat Email</label>
                <input 
                  type="email" 
                  id="email" 
                  class="form-input" 
                  placeholder="admin@nusantara.crm"
                  autocomplete="email"
                  required
                />
                <p id="email-error" class="form-error hidden"></p>
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="form-label">Kata Sandi</label>
                <div class="relative">
                  <input 
                    type="password" 
                    id="password" 
                    class="form-input pr-10" 
                    placeholder="••••••••"
                    autocomplete="current-password"
                    required
                  />
                  <button 
                    type="button" 
                    id="toggle-password" 
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </button>
                </div>
                <p id="password-error" class="form-error hidden"></p>
              </div>

              <!-- Error Alert -->
              <div id="login-error" class="hidden bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span id="error-message">Email atau password salah</span>
                </div>
              </div>

              <!-- Submit -->
              <button 
                type="submit" 
                id="login-btn"
                class="btn-primary w-full justify-center py-3 text-base"
                ${this.loading ? 'disabled' : ''}
              >
                ${this.loading ? `
                  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Memproses...</span>
                ` : `
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                  </svg>
                  <span>Masuk</span>
                `}
              </button>
            </form>

            <!-- Demo Credentials -->
            <div class="mt-6 pt-6 border-t border-gray-100">
              <p class="text-xs text-gray-400 text-center mb-3">Demo Akun</p>
              <div class="grid grid-cols-2 gap-3 text-xs">
                <button type="button" class="demo-btn p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-left" data-email="admin@nusantara.crm" data-password="admin123">
                  <span class="font-medium text-gray-700">Admin</span>
                  <span class="block text-gray-400">admin@nusantara.crm</span>
                </button>
                <button type="button" class="demo-btn p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-left" data-email="staff@nusantara.crm" data-password="staff123">
                  <span class="font-medium text-gray-700">Staff</span>
                  <span class="block text-gray-400">staff@nusantara.crm</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <p class="text-center text-xs text-gray-400 mt-6">
            &copy; ${new Date().getFullYear()} Nusantara Travel. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    `
  }

  attachEvents() {
    const form = document.getElementById('login-form')
    const togglePassword = document.getElementById('toggle-password')
    const passwordInput = document.getElementById('password')

    // Toggle password visibility
    togglePassword?.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password'
      passwordInput.type = isPassword ? 'text' : 'password'
      togglePassword.innerHTML = isPassword ? `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
        </svg>
      ` : `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      `
    })

    // Demo buttons
    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('email').value = btn.dataset.email
        document.getElementById('password').value = btn.dataset.password
        document.getElementById('email').focus()
      })
    })

    // Form submit
    form?.addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.handleLogin()
    })
  }

  async handleLogin() {
    const email = document.getElementById('email')?.value.trim()
    const password = document.getElementById('password')?.value
    const errorDiv = document.getElementById('login-error')
    const errorMsg = document.getElementById('error-message')
    const loginBtn = document.getElementById('login-btn')

    // Clear previous errors
    errorDiv?.classList.add('hidden')
    document.querySelectorAll('.form-error').forEach(el => el.classList.add('hidden'))

    // Validate
    if (!email || !password) {
      if (!email) {
        document.getElementById('email-error').textContent = 'Email wajib diisi'
        document.getElementById('email-error').classList.remove('hidden')
      }
      if (!password) {
        document.getElementById('password-error').textContent = 'Password wajib diisi'
        document.getElementById('password-error').classList.remove('hidden')
      }
      return
    }

    // Show loading
    this.loading = true
    loginBtn.disabled = true
    loginBtn.innerHTML = `
      <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
      <span>Memproses...</span>
    `

    try {
      const { user, token } = await api.login(email, password)
      
      // Store auth data
      state.login(user, token)

      // Show success toast
      window.showToast?.(`Selamat datang, ${user.name}!`, 'success')

      // Redirect to dashboard
      window.location.hash = '#/'
      
    } catch (err) {
      console.error('Login failed:', err)
      this.loading = false
      errorMsg.textContent = err.message || 'Email atau password salah'
      errorDiv?.classList.remove('hidden')
      
      // Reset button
      loginBtn.disabled = false
      loginBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
        </svg>
        <span>Masuk</span>
      `
    }
  }
}

// Standalone logout function
export function logout() {
  state.logout()
  window.showToast?.('Anda telah keluar dari akun', 'info')
  window.location.hash = '#/login'
}
