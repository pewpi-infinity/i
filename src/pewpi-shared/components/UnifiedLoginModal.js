/**
 * UnifiedLoginModal - Lightweight login UI component
 * Opt-in modal for magic-link login
 */

class UnifiedLoginModal {
  constructor(authService) {
    this.authService = authService;
    this.modal = null;
    this.isVisible = false;
  }

  /**
   * Show the login modal
   */
  show() {
    if (this.isVisible) return;
    
    this.modal = this._createModal();
    document.body.appendChild(this.modal);
    this.isVisible = true;
    
    // Focus email input
    setTimeout(() => {
      const emailInput = this.modal.querySelector('#pewpi-login-email');
      if (emailInput) emailInput.focus();
    }, 100);
  }

  /**
   * Hide the login modal
   */
  hide() {
    if (!this.isVisible || !this.modal) return;
    
    this.modal.remove();
    this.modal = null;
    this.isVisible = false;
  }

  /**
   * Create modal HTML
   */
  _createModal() {
    const modal = document.createElement('div');
    modal.id = 'pewpi-login-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    content.innerHTML = `
      <h2 style="margin: 0 0 1rem; font-size: 1.5rem; color: #333;">Login to Pewpi</h2>
      <p style="margin: 0 0 1.5rem; color: #666; font-size: 0.9rem;">Enter your email to receive a magic link</p>
      
      <form id="pewpi-login-form">
        <input 
          type="email" 
          id="pewpi-login-email" 
          placeholder="email@example.com" 
          required
          style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
            margin-bottom: 1rem;
            box-sizing: border-box;
          "
        />
        
        <div id="pewpi-login-error" style="display: none; color: #d32f2f; margin-bottom: 1rem; font-size: 0.875rem;"></div>
        
        <div style="display: flex; gap: 0.5rem;">
          <button 
            type="submit" 
            id="pewpi-login-submit"
            style="
              flex: 1;
              padding: 0.75rem;
              background: #1976d2;
              color: white;
              border: none;
              border-radius: 4px;
              font-size: 1rem;
              cursor: pointer;
              font-weight: 500;
            "
          >
            Login
          </button>
          
          <button 
            type="button" 
            id="pewpi-login-cancel"
            style="
              padding: 0.75rem 1.5rem;
              background: transparent;
              color: #666;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 1rem;
              cursor: pointer;
            "
          >
            Cancel
          </button>
        </div>
      </form>
    `;

    modal.appendChild(content);

    // Add event listeners
    const form = content.querySelector('#pewpi-login-form');
    const emailInput = content.querySelector('#pewpi-login-email');
    const cancelBtn = content.querySelector('#pewpi-login-cancel');
    const submitBtn = content.querySelector('#pewpi-login-submit');
    const errorDiv = content.querySelector('#pewpi-login-error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      if (!email) return;

      // Disable form during submission
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';
      errorDiv.style.display = 'none';

      try {
        await this.authService.login(email);
        this.hide();
      } catch (error) {
        errorDiv.textContent = error.message || 'Login failed';
        errorDiv.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    });

    cancelBtn.addEventListener('click', () => {
      this.hide();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hide();
      }
    });

    // Close on escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.hide();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    return modal;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UnifiedLoginModal };
}

if (typeof window !== 'undefined') {
  window.UnifiedLoginModal = UnifiedLoginModal;
}
