// Gemeinsame Frontend-Helper für index.html (Admin-Übersicht) und formular.html (Public/Admin-Formular).
// Wird per <script src="/frontend-utils.js"> in beide Seiten eingebunden.

(function (root) {
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Erzeugt einen kurzlebigen Toast (3s). type='error' rotfärbt den Hintergrund.
  // Beide HTMLs definieren `.custom-toast` als Basisklasse; die error-Variante
  // wird über inline-style gesetzt, damit kein zusätzliches CSS in HTML pro Datei nötig ist.
  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    if (type === 'error') {
      toast.style.background = '#f44336';
      toast.style.color = '#fff';
      toast.style.borderLeftColor = '#c00000';
    }
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Erwartet ein <div id="confirmModal"> mit #confirmMessage, #confirmConfirm, #confirmCancel
  // (Markup ist in beiden HTMLs vorhanden). onCancel ist optional.
  function confirmAction(message, onConfirm, onCancel) {
    const modal = document.getElementById('confirmModal');
    const modalMessage = document.getElementById('confirmMessage');
    if (!modal || !modalMessage) {
      console.warn('confirmAction: confirmModal markup fehlt');
      if (typeof onConfirm === 'function') onConfirm();
      return;
    }
    modalMessage.textContent = message;
    modal.classList.add('active');

    document.getElementById('confirmConfirm').onclick = () => {
      modal.classList.remove('active');
      if (typeof onConfirm === 'function') onConfirm();
    };
    document.getElementById('confirmCancel').onclick = () => {
      modal.classList.remove('active');
      if (typeof onCancel === 'function') onCancel();
    };
  }

  root.escapeHtml = escapeHtml;
  root.showToast = showToast;
  root.confirmAction = confirmAction;
}(typeof window !== 'undefined' ? window : globalThis));
