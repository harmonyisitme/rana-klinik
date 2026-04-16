import { API_URL, showToast, checkAuth } from './utils.js';

// Güvenlik Kontrolü
checkAuth();

let mevcutHizmetler = [];
let secilenHizmetIndex = null; // Hangi hizmet için ikon seçildiğini takip eder

// Kullanılabilir İkon Kütüphanesi (FontAwesome)
const iconLibrary = [
    'fa-solid fa-ear-listen', 'fa-solid fa-ear-deaf', 'fa-solid fa-baby', 'fa-solid fa-bell',
    'fa-solid fa-user-doctor', 'fa-solid fa-stethoscope', 'fa-solid fa-heart-pulse', 'fa-solid fa-hospital',
    'fa-solid fa-notes-medical', 'fa-solid fa-file-medical', 'fa-solid fa-calendar-check', 'fa-solid fa-phone',
    'fa-solid fa-envelope', 'fa-solid fa-location-dot', 'fa-solid fa-circle-info', 'fa-solid fa-check',
    'fa-solid fa-star', 'fa-solid fa-comment-medical', 'fa-solid fa-hand-holding-medical', 'fa-solid fa-brain',
    'fa-solid fa-tooth', 'fa-solid fa-eye', 'fa-solid fa-lungs', 'fa-solid fa-dna',
    'fa-solid fa-syringe', 'fa-solid fa-pills', 'fa-solid fa-microscope', 'fa-solid fa-user-nurse',
    'fa-solid fa-wheelchair', 'fa-solid fa-crutch', 'fa-solid fa-x-ray', 'fa-solid fa-kit-medical'
];

document.addEventListener('DOMContentLoaded', async () => {
    await ayarlariGetir();

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

    // İkon Modalını Kapatma (Dışına tıklayınca)
    window.addEventListener('click', (e) => {
        const iconModal = document.getElementById('iconModal');
        if (e.target == iconModal) iconModal.style.display = 'none';
    });

    // Ses Test Butonu
    const btnSesTest = document.getElementById('btnSesTest');
    if (btnSesTest) {
        btnSesTest.addEventListener('click', () => {
            const ses = document.getElementById('bildirimSesi').value;
            if (ses === 'mute') return;
            
            let url = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
            if (ses === 'soft') url = 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3';
            if (ses === 'alert') url = 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3';
            
            new Audio(url).play().catch(e => alert('Ses çalınamadı.'));
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

async function ayarlariGetir() {
    try {
        const response = await fetch('/api/site-ayarlari', {
            headers: { 'x-auth-token': localStorage.getItem('ranaToken') }
        });

        if (response.status === 401 || response.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }
        const ayarlar = await response.json();

        // Logo
        document.getElementById('mevcutLogoUrl').value = ayarlar.logo || '';
        if (ayarlar.logo) {
            const onizleme = document.getElementById('logoOnizleme');
            onizleme.style.display = 'block';
            onizleme.querySelector('img').src = ayarlar.logo;
        }

        // Favicon
        document.getElementById('mevcutFaviconUrl').value = ayarlar.favicon || '';
        if (ayarlar.favicon) {
            const onizleme = document.getElementById('faviconOnizleme');
            onizleme.style.display = 'block';
            onizleme.querySelector('img').src = ayarlar.favicon;
        }

        // Hero Görsel
        document.getElementById('mevcutHeroUrl').value = ayarlar.heroGorsel || '';
        if (ayarlar.heroGorsel) {
            const heroOnizleme = document.getElementById('heroOnizleme');
            heroOnizleme.style.display = 'block';
            heroOnizleme.querySelector('img').src = ayarlar.heroGorsel;
        }

        // Ana Renk
        document.getElementById('anaRenk').value = ayarlar.anaRenk || '#0056b3';
        document.getElementById('ikincilRenk').value = ayarlar.ikincilRenk || '#e94560';

        // Hakkımızda
        const hakkimizda = ayarlar.hakkimizda || {};
        document.getElementById('hakkimizdaBaslik').value = hakkimizda.baslik || '';
        document.getElementById('hakkimizdaIcerik').value = hakkimizda.icerik || '';
        document.getElementById('mevcutHakkimizdaUrl').value = hakkimizda.gorsel || '';
        
        if (hakkimizda.gorsel) {
            const hOnizleme = document.getElementById('hakkimizdaOnizleme');
            hOnizleme.style.display = 'block';
            hOnizleme.querySelector('img').src = hakkimizda.gorsel;
        }

        // Yasal Metinler
        const yasal = ayarlar.yasalMetinler || {};
        document.getElementById('gizlilikPolitikasi').value = yasal.gizlilikPolitikasi || '';
        document.getElementById('kullanimSartlari').value = yasal.kullanimSartlari || '';
        document.getElementById('kvkkMetni').value = yasal.kvkkMetni || '';

        // İletişim
        document.getElementById('telefon').value = ayarlar.iletisim.telefon;
        document.getElementById('email').value = ayarlar.iletisim.email;
        document.getElementById('adres').value = ayarlar.iletisim.adres;
        document.getElementById('haritaEmbed').value = ayarlar.haritaEmbed || '';

        // Saatler
        document.getElementById('haftaici').value = ayarlar.calismaSaatleri.haftaici;
        document.getElementById('cumartesi').value = ayarlar.calismaSaatleri.cumartesi;
        document.getElementById('pazar').value = ayarlar.calismaSaatleri.pazar;

        // Sosyal Medya
        const sm = ayarlar.sosyalMedya || {};
        document.getElementById('sm-facebook').value = sm.facebook || '';
        document.getElementById('sm-twitter').value = sm.twitter || '';
        document.getElementById('sm-instagram').value = sm.instagram || '';
        document.getElementById('sm-linkedin').value = sm.linkedin || '';

        // Hizmetler
        mevcutHizmetler = ayarlar.hizmetler;
        hizmetleriListele();

        // Bildirim Sesi (LocalStorage'dan çek)
        document.getElementById('bildirimSesi').value = localStorage.getItem('notificationSound') || 'default';
    } catch (error) {
        console.error('Ayarlar yüklenemedi', error);
        showToast('Ayarlar yüklenirken bir hata oluştu.', 'error');
    }
}

document.getElementById('ayarlarFormu').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.querySelector('.btn-save');
    btn.disabled = true;
    btn.innerText = 'Kaydediliyor...';

    // E-posta Doğrulama
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Geçersiz E-posta Adresi! Lütfen kontrol ediniz.');
        btn.disabled = false; btn.innerText = 'Ayarları Kaydet';
        return;
    }

    // Bildirim Sesini Kaydet (LocalStorage)
    localStorage.setItem('notificationSound', document.getElementById('bildirimSesi').value);

    // Dosya Yükleme İşlemleri (Refactor Edilmiş)
    const uploadFile = async (fileInput, currentUrl) => {
        if (fileInput.files.length === 0) return currentUrl;
        const formData = new FormData();
        formData.append('dosya', fileInput.files[0]);
        try {
            const response = await fetch('/api/upload', { method: 'POST', headers: { 'x-auth-token': localStorage.getItem('ranaToken') }, body: formData });
            if (response.status === 401 || response.status === 403) {
                showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
                localStorage.removeItem('ranaToken');
                setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                throw new Error('Yetkilendirme hatası, giriş sayfasına yönlendiriliyor.'); // Hata fırlat
            }
            if (response.ok) return (await response.json()).url;
            throw new Error(`Dosya yükleme başarısız: ${response.statusText}`);
        } catch (error) {
            console.error('Dosya yükleme hatası:', error);
            showToast('Dosya yüklenirken bir hata oluştu.', 'error');
            return currentUrl; // Hata durumunda mevcut URL'yi döndür
        }
    };

    // Hizmet verilerini formdan topla
    const guncelHizmetler = mevcutHizmetler.map((h, index) => ({
        ...h, // Eski verileri (detay, key) koru
        baslik: document.getElementById(`hizmet-baslik-${index}`).value,
        ikon: document.getElementById(`hizmet-ikon-${index}`).value,
        ozet: document.getElementById(`hizmet-ozet-${index}`).value
    }));

    // Harita Linkini Düzenle (iframe kodu yapıştırılırsa içinden src'yi al)
    let haritaDegeri = document.getElementById('haritaEmbed').value;
    if (haritaDegeri.includes('<iframe')) {
        const match = haritaDegeri.match(/src=["']([^"']+)["']/);
        if (match) {
            haritaDegeri = match[1];
        }
    }

    const veri = {
        logo: await uploadFile(document.getElementById('logoDosya'), document.getElementById('mevcutLogoUrl').value),
        favicon: await uploadFile(document.getElementById('faviconDosya'), document.getElementById('mevcutFaviconUrl').value),
        heroGorsel: await uploadFile(document.getElementById('heroDosya'), document.getElementById('mevcutHeroUrl').value),
        anaRenk: document.getElementById('anaRenk').value,
        ikincilRenk: document.getElementById('ikincilRenk').value,
        haritaEmbed: haritaDegeri,
        hakkimizda: {
            baslik: document.getElementById('hakkimizdaBaslik').value,
            icerik: document.getElementById('hakkimizdaIcerik').value,
            gorsel: await uploadFile(document.getElementById('hakkimizdaDosya'), document.getElementById('mevcutHakkimizdaUrl').value)
        },
        yasalMetinler: {
            gizlilikPolitikasi: document.getElementById('gizlilikPolitikasi').value,
            kullanimSartlari: document.getElementById('kullanimSartlari').value,
            kvkkMetni: document.getElementById('kvkkMetni').value
        },
        iletisim: {
            telefon: document.getElementById('telefon').value,
            email: document.getElementById('email').value,
            adres: document.getElementById('adres').value
        },
        calismaSaatleri: {
            haftaici: document.getElementById('haftaici').value,
            cumartesi: document.getElementById('cumartesi').value,
            pazar: document.getElementById('pazar').value
        },
        sosyalMedya: {
            facebook: document.getElementById('sm-facebook').value,
            twitter: document.getElementById('sm-twitter').value,
            instagram: document.getElementById('sm-instagram').value,
            linkedin: document.getElementById('sm-linkedin').value
        },
        hizmetler: guncelHizmetler
    };

    try {
        const response = await fetch('/api/site-ayarlari', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('ranaToken') },
            body: JSON.stringify(veri)
        });
        if (response.status === 401 || response.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        if (response.ok) {
            showToast('Ayarlar başarıyla güncellendi!', 'success');
        } else {
            const errorData = await response.json();
            showToast(`Ayarlar güncellenirken hata oluştu: ${errorData.mesaj || 'Bilinmeyen bir hata.'}`, 'error');
        }
    } catch (error) { showToast('Sunucu hatası: Ayarlar güncellenemedi.', 'error');
    } finally { btn.disabled = false; btn.innerText = 'Ayarları Kaydet'; }
});

// --- YENİ EKLENEN FONKSİYONLAR ---

// Hizmetleri Ekrana Basan Fonksiyon
function hizmetleriListele() {
    const container = document.getElementById('hizmetlerContainer');
    container.innerHTML = '';

    mevcutHizmetler.forEach((hizmet, index) => {
        const div = document.createElement('div');
        div.className = 'service-item';
        div.innerHTML = `
            <div class="form-row" style="margin-bottom: 10px;">
                <input type="text" id="hizmet-baslik-${index}" placeholder="Başlık">
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div id="ikon-onizleme-${index}" style="width: 30px; text-align: center; font-size: 20px; color: #0f3460;"></div>
                    <input type="text" id="hizmet-ikon-${index}" placeholder="İkon Sınıfı" readonly style="flex: 1; background-color: #f9f9f9; cursor: pointer;" onclick="ikonSecModalAc(${index})">
                    <button type="button" onclick="ikonSecModalAc(${index})" style="background: #6c757d; color: white; border: none; padding: 0 15px; border-radius: 5px; cursor: pointer; height: 100%;">Seç</button>
                </div>
            </div>
            <textarea id="hizmet-ozet-${index}" rows="2" placeholder="Özet Açıklama"></textarea>
            <button type="button" onclick="hizmetSil(${index})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px; margin-top: 5px;">Sil</button>
        `;
        container.appendChild(div);

        // Verileri güvenli bir şekilde inputlara ata (Tırnak işareti sorununu önler)
        document.getElementById(`hizmet-baslik-${index}`).value = hizmet.baslik || '';
        document.getElementById(`hizmet-ikon-${index}`).value = hizmet.ikon || '';
        if (hizmet.ikon) {
            document.getElementById(`ikon-onizleme-${index}`).innerHTML = `<i class="${hizmet.ikon}"></i>`;
        }
        document.getElementById(`hizmet-ozet-${index}`).value = hizmet.ozet || '';
    });
}

// Mevcut Inputlardaki Verileri Array'e Kaydet (Ekle/Sil yaparken veri kaybını önler)
function verileriSenkronizeEt() {
    mevcutHizmetler = mevcutHizmetler.map((h, index) => ({
        ...h,
        baslik: document.getElementById(`hizmet-baslik-${index}`).value,
        ikon: document.getElementById(`hizmet-ikon-${index}`).value,
        ozet: document.getElementById(`hizmet-ozet-${index}`).value
    }));
}

// Yeni Hizmet Ekleme Butonu
document.getElementById('btnHizmetEkle').addEventListener('click', () => {
    verileriSenkronizeEt(); // Önce mevcut yazılanları kaydet
    // Yeni boş hizmet objesi ekle
    mevcutHizmetler.push({ baslik: '', ikon: '', ozet: '', key: 'new-' + Date.now(), detay: '<p>Detaylar yakında...</p>' });
    hizmetleriListele(); // Listeyi yeniden çiz
});

// Hizmet Silme Fonksiyonu
window.hizmetSil = (index) => {
    if(!confirm('Bu hizmeti listeden kaldırmak istediğinize emin misiniz?')) return;
    verileriSenkronizeEt();
    mevcutHizmetler.splice(index, 1);
    hizmetleriListele();
};

// --- İKON SEÇİM FONKSİYONLARI ---

window.ikonSecModalAc = (index) => {
    secilenHizmetIndex = index;
    const modal = document.getElementById('iconModal');
    const grid = document.getElementById('iconGrid');
    
    // İkonları oluştur (Sadece ilk açılışta veya her seferinde temizleyip)
    grid.innerHTML = '';
    iconLibrary.forEach(iconClass => {
        const div = document.createElement('div');
        div.className = 'icon-item';
        div.innerHTML = `<i class="${iconClass}"></i><span>${iconClass.replace('fa-solid fa-', '')}</span>`;
        div.onclick = () => ikonSec(iconClass);
        grid.appendChild(div);
    });

    modal.style.display = 'block';
};

window.ikonSec = (iconClass) => {
    document.getElementById(`hizmet-ikon-${secilenHizmetIndex}`).value = iconClass;
    document.getElementById(`ikon-onizleme-${secilenHizmetIndex}`).innerHTML = `<i class="${iconClass}"></i>`;
    document.getElementById('iconModal').style.display = 'none';
};
