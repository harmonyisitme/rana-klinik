// API URL: Otomatik Algılama
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = isLocal ? 'http://localhost:5501/api' : '/api';

// --- TOAST BİLDİRİM FONKSİYONU ---
export const showToast = (mesaj, tip = 'info', onClickCallback = null) => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px; pointer-events: none;";
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${tip}`;
    
    let icon = '';
    if (tip === 'success') icon = '<i class="fas fa-check-circle" style="color:#28a745"></i>';
    if (tip === 'error') icon = '<i class="fas fa-exclamation-circle" style="color:#dc3545"></i>';
    if (tip === 'info') icon = '<i class="fas fa-info-circle" style="color:#0f3460"></i>'; // Admin için de kullanılabilir
    
    toast.style.pointerEvents = 'auto'; // Bildirime tıklanabilsin
    toast.innerHTML = `${icon} <span>${mesaj}</span>`;
    container.appendChild(toast);

    const timeoutId = setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, onClickCallback ? 6000 : 3000); // Tıklanabilirse daha uzun süre göster

    if (onClickCallback) {
        toast.style.cursor = 'pointer';
        toast.addEventListener('click', () => {
            clearTimeout(timeoutId); // Otomatik kapanmayı iptal et
            onClickCallback();
            // Tıkladıktan sonra manuel olarak kaldır
            toast.style.animation = 'slideOut 0.3s ease forwards';
            toast.addEventListener('animationend', () => toast.remove());
        });
    }
};

// --- Kimlik Doğrulama Kontrolü ---
export const checkAuth = () => {
    if (!localStorage.getItem('ranaToken')) {
        window.location.href = 'login.html';
    }
};
