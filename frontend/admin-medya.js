import { API_URL, showToast, checkAuth } from './utils.js';

// Güvenlik Kontrolü
checkAuth();

document.addEventListener('DOMContentLoaded', () => {
    medyaGetir();

    // --- ÇIKIŞ YAP MODALI ---
    const cikisModal = document.getElementById('cikisModal');
    const btnLogout = document.getElementById('btnLogout');
    const btnCikisOnay = document.getElementById('btnCikisOnay');
    const btnCikisVazgec = document.getElementById('btnCikisVazgec');
    const closeCikisModal = document.getElementById('closeCikisModal');

    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (cikisModal) cikisModal.style.display = 'block';
        });
    }
    if (btnCikisOnay) {
        btnCikisOnay.addEventListener('click', () => {
            localStorage.removeItem('ranaToken');
            window.location.href = 'login.html';
        });
    }
    if (btnCikisVazgec) btnCikisVazgec.addEventListener('click', () => cikisModal.style.display = 'none');
    if (closeCikisModal) closeCikisModal.addEventListener('click', () => cikisModal.style.display = 'none');
    
    window.addEventListener('click', (e) => {
        if (e.target == cikisModal) cikisModal.style.display = 'none';
    });

    // --- KARANLIK MOD ---
    const darkModeBtn = document.getElementById('darkModeBtn');
    const body = document.body;

    // Kayıtlı tercihi kontrol et
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.setAttribute('data-theme', 'dark');
        if(darkModeBtn) darkModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            if (body.getAttribute('data-theme') === 'dark') {
                body.removeAttribute('data-theme');
                localStorage.setItem('darkMode', 'disabled');
                darkModeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            } else {
                body.setAttribute('data-theme', 'dark');
                localStorage.setItem('darkMode', 'enabled');
                darkModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            }
        });
    }

    // --- SAYFA GEÇİŞ EFEKTİ ---
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (!href || href.startsWith('#') || href.startsWith('javascript') || this.getAttribute('target') === '_blank') {
                return;
            }

            if (this.href === window.location.href) {
                e.preventDefault();
                return;
            }

            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => window.location.href = href, 200);
        });
    });
});

async function medyaGetir() {
    const grid = document.getElementById('mediaGrid');
    grid.innerHTML = '<p class="loading-text">Görseller yükleniyor...</p>';

    try {
        const response = await fetch('/api/medya', {
            headers: { 'x-auth-token': localStorage.getItem('ranaToken') }
        });

        if (response.status === 401 || response.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }
        if (!response.ok) {
            throw new Error(`Medya API hatası: ${response.status}`);
        }
        const dosyalar = await response.json();

        grid.innerHTML = '';

        if (dosyalar.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Henüz yüklenmiş bir görsel yok.</p>';
            return;
        }

        dosyalar.forEach(dosya => {
            const item = document.createElement('div');
            item.className = 'media-item';
            item.innerHTML = `
                <div class="media-img-container">
                    <img src="${dosya.url}" alt="${dosya.ad}">
                </div>
                <div class="media-actions">
                    <button class="btn-media btn-copy" onclick="urlKopyala('${dosya.url}')" title="Linki Kopyala">🔗</button>
                    <button class="btn-media btn-delete" onclick="dosyaSil('${dosya.ad}')" title="Sil">🗑️</button>
                </div>
            `;
            grid.appendChild(item);
        });

    } catch (error) {
        console.error('Hata:', error);
        grid.innerHTML = '<p style="grid-column: 1/-1; color: red; text-align: center;">Görseller yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>';
        showToast('Görseller yüklenirken bir hata oluştu.', 'error');
    }
}

window.urlKopyala = (url) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl).then(() => {
        alert('Görsel linki kopyalandı!');
    });
};

window.dosyaSil = async (dosyaAdi) => {
    if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return;

    try { 
        const response = await fetch(`/api/medya/${dosyaAdi}`, { method: 'DELETE', headers: { 'x-auth-token': localStorage.getItem('ranaToken') } }); 
        if (response.status === 401 || response.status === 403) { 
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error'); 
            localStorage.removeItem('ranaToken'); 
            setTimeout(() => { window.location.href = 'login.html'; }, 1500); 
            return; 
        } 
        if (response.ok) { showToast('Görsel başarıyla silindi.', 'success'); medyaGetir(); } 
        else { 
            const errorData = await response.json(); 
            showToast(`Silme başarısız: ${errorData.mesaj || 'Bilinmeyen bir hata oluştu.'}`, 'error'); 
        } 
    } catch (error) { showToast('Hata oluştu: Görsel silinemedi.', 'error'); }
};
