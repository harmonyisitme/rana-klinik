import { API_URL, showToast, checkAuth } from './utils.js';

// Güvenlik Kontrolü
checkAuth();

let tumMesajlar = [];

document.addEventListener('DOMContentLoaded', () => {
    mesajlariGetir();

    // Modal Kapatma
    const modal = document.getElementById('mesajModal');
    const closeBtn = document.querySelector('#mesajModal .close-modal');
    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = "none";
    }
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }

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

async function mesajlariGetir() {
    const liste = document.getElementById('mesajListesi');
    const filtreEl = document.getElementById('mesajFiltresi');
    const siralamaEl = document.getElementById('mesajSiralama');
    
    // Elementler yoksa varsayılan değerleri kullan (Hata önleme)
    const filtre = filtreEl ? filtreEl.value : 'tumu';
    const siralama = siralamaEl ? siralamaEl.value : 'yeni';

    if (!liste) {
        console.error('HATA: HTML sayfasında id="mesajListesi" olan bir div bulunamadı.');
        return;
    }

    liste.innerHTML = '<p class="loading-text">Yükleniyor...</p>';

    try {
        // Cache sorununu önlemek için timestamp (?_t=...) ve filtre/sıralama parametreleri ekledik
        const response = await fetch(`${API_URL}/iletisim?durum=${filtre}&sirala=${siralama}&_t=${Date.now()}`, {
            headers: { 'x-auth-token': localStorage.getItem('ranaToken') }
        });

        if (response.status === 401 || response.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }
        if (!response.ok) {
            throw new Error('Veriler çekilemedi. Lütfen tekrar giriş yapın.');
        }

        const mesajlar = await response.json();
        tumMesajlar = mesajlar;

        liste.innerHTML = '';

        if (!mesajlar || mesajlar.length === 0) {
            liste.innerHTML = '<div style="text-align:center; padding: 20px; color: #666;">📭 Henüz gelen kutunuzda mesaj yok.</div>';
            return;
        }

        mesajlar.forEach(msg => {
            const tarih = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('tr-TR') : '-';
            const saat = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('tr-TR') : '';
            const mesajMetni = msg.mesaj || '';

            // Okundu durumu kontrolü
            const okunduClass = msg.okunduMu ? 'opacity: 0.7;' : 'border-left: 5px solid #28a745;';
            const okunduBtnText = msg.okunduMu ? 'Okunmadı Yap' : 'Okundu İşaretle';
            const okunduBtnIcon = msg.okunduMu ? '📖' : '✅'; //
            const okunduBtnAction = !msg.okunduMu; // Boolean değeri doğrudan kullan
            const msgId = msg.id;

            const div = document.createElement('div');
            div.className = 'message-card';
            div.style.cssText = okunduClass;
            div.innerHTML = `
                <div class="msg-header">
                    <span><strong>${msg.adSoyad || 'İsimsiz'}</strong> (${msg.email || '-'})</span>
                    <span>${tarih} ${saat}</span>
                </div>
                <div class="msg-body">
                    <h4>${msg.konu || 'Konu Yok'}</h4>
                    <p>${mesajMetni.substring(0, 100)}${mesajMetni.length > 100 ? '...' : ''}</p>
                </div>
                <div class="msg-footer">
                    <button class="btn-refresh" onclick="mesajDurumDegistir('${msgId}', ${okunduBtnAction})" style="padding: 5px 15px; font-size: 12px; background-color: #6c757d; margin-right: 5px;">${okunduBtnIcon} ${okunduBtnText}</button>
                    <button class="btn-refresh" onclick="mesajOku('${msgId}')" style="padding: 5px 15px; font-size: 12px;">Oku</button>
                    <button class="btn-action delete" onclick="mesajSil('${msgId}')" style="font-size: 16px;">🗑️</button>
                </div>
            `;
            liste.appendChild(div);
        });

    } catch (error) {
        console.error(error);
        liste.innerHTML = `<div style="color:red; text-align:center; padding: 20px;">⚠️ Mesajlar yüklenirken bir sorun oluştu.<br><small>${error.message}</small></div>`;
        showToast('Mesajlar yüklenirken bir hata oluştu.', 'error');
    }
}

window.mesajOku = (id) => {
    console.log('Mesaj Oku ID:', id);
    const msg = tumMesajlar.find(m => String(m.id) === String(id));
    if (!msg) {
        console.error('Mesaj bulunamadı!');
        return;
    }

    const tarih = msg.createdAt ? new Date(msg.createdAt).toLocaleString('tr-TR') : '-';
    const mesajIcerigi = msg.mesaj ? msg.mesaj.replace(/\n/g, '<br>') : '';

    document.getElementById('modalIcerik').innerHTML = `
        <div class="detail-row"><strong>Gönderen:</strong> ${msg.adSoyad || 'İsimsiz'}</div>
        <div class="detail-row"><strong>E-posta:</strong> ${msg.email || '-'}</div>
        <div class="detail-row"><strong>Tarih:</strong> ${tarih}</div>
        <div class="detail-row"><strong>Konu:</strong> ${msg.konu || '-'}</div>
        <div class="detail-row"><strong>Mesaj:</strong> <div style="margin-top:10px; background:#f9f9f9; padding:15px; border-radius:5px; line-height:1.5;">${mesajIcerigi}</div></div>
    `;
    document.getElementById('btnYanitla').href = `mailto:${msg.email}?subject=YNT: ${msg.konu}`;
    document.getElementById('mesajModal').style.display = 'block';
};

window.mesajSil = async (id) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    try {
        const response = await fetch(`${API_URL}/iletisim/${id}`, { method: 'DELETE', headers: { 'x-auth-token': localStorage.getItem('ranaToken') } });
        if (response.status === 401 || response.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }
        if (response.ok) { showToast('Mesaj başarıyla silindi.', 'success'); mesajlariGetir(); }
        else {
            const errorData = await response.json();
            showToast(`Silme başarısız: ${errorData.mesaj || 'Bilinmeyen bir hata oluştu.'}`, 'error');
        }
    } catch (err) { showToast('Hata oluştu: Mesaj silinemedi.', 'error'); }
};

// Mesaj Durumunu Değiştir (Okundu/Okunmadı)
window.mesajDurumDegistir = async (id, yeniDurum) => {
    try {
        const response = await fetch(`${API_URL}/iletisim/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('ranaToken') },
            body: JSON.stringify({ okunduMu: yeniDurum })
        });
        if (response.status === 401 || response.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        if (response.ok) {
            showToast(`Mesaj durumu güncellendi.`, 'success');
            mesajlariGetir(); // Listeyi yenile
        } else {
            const errorData = await response.json();
            showToast(`Güncelleme başarısız: ${errorData.mesaj || 'Bilinmeyen bir hata oluştu.'}`, 'error');
        }
    } catch (error) { showToast('Hata oluştu: Mesaj durumu güncellenemedi.', 'error'); }
};
