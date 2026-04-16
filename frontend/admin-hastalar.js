import { API_URL, showToast, checkAuth } from './utils.js';

// Güvenlik Kontrolü
checkAuth();

let tumHastalar = []; // Hastaları hafızada tutmak için
let sonRandevuSayisi = -1; // Bildirim takibi için

document.addEventListener('DOMContentLoaded', () => {
    hastalariGetir();

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

    // --- CANLI BİLDİRİM SİSTEMİ BAŞLAT ---
    (async () => {
        try {
            const res = await fetch(`${API_URL}/randevular?_t=${Date.now()}`, {
                headers: { 'x-auth-token': localStorage.getItem('ranaToken') }
            });

            if (res.status === 401 || res.status === 403) {
                showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
                localStorage.removeItem('ranaToken');
                setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                return; // Önemli: Fonksiyonu burada sonlandır
            }

            if (!res.ok) {
                throw new Error(`HTTP hata kodu: ${res.status}`);
            } else {
                const data = await res.json();
                sonRandevuSayisi = data.length;
            }
        } catch (e) {}
        setInterval(yeniRandevuKontrol, 10000);
    })();

    // Modal Kapatma İşlemleri
    const gecmisModal = document.getElementById('hastaGecmisModal');
    const duzenleModal = document.getElementById('hastaDuzenleModal');
    
    // Geçmiş Modalı Kapatma
    document.querySelector('#hastaGecmisModal .close-modal').onclick = () => gecmisModal.style.display = "none";
    
    // Düzenle Modalı Kapatma
    document.getElementById('closeDuzenleModal').onclick = () => duzenleModal.style.display = "none";

    window.onclick = function(event) {
        if (event.target == gecmisModal) gecmisModal.style.display = "none";
        if (event.target == duzenleModal) duzenleModal.style.display = "none";
    }

    // Düzenleme Formu Gönderme
    document.getElementById('hastaDuzenleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editHastaId').value;
        
        const email = document.getElementById('editEmail').value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            alert('Geçersiz E-posta Adresi! Lütfen kontrol ediniz.');
            return;
        }

        const veri = {
            adSoyad: document.getElementById('editAdSoyad').value,
            tcKimlik: document.getElementById('editTcKimlik').value,
            telefon: document.getElementById('editTelefon').value,
            email: document.getElementById('editEmail').value,
            cinsiyet: document.getElementById('editCinsiyet').value,
            dogumTarihi: document.getElementById('editDogumTarihi').value
        };

        try {
            const response = await fetch(`/api/hastalar/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('ranaToken')
                },
                body: JSON.stringify(veri)
            });

            if (response.ok) {
                showToast('Hasta bilgileri başarıyla güncellendi.', 'success');
                document.getElementById('hastaDuzenleModal').style.display = 'none';
                hastalariGetir();
            } else {
                const errorData = await response.json();
                showToast(`Güncelleme başarısız: ${errorData.mesaj || 'Bilinmeyen bir hata oluştu.'}`, 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Hata oluştu: Hasta bilgileri güncellenemedi.', 'error');
        }
    });

    // Arama Kutusu Dinleyicisi
    document.getElementById('hastaArama').addEventListener('input', (e) => {
        hastalariFiltrele(e.target.value);
    });

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

async function hastalariGetir() {
    const tabloGovdesi = document.getElementById('hastaListesi');
    tabloGovdesi.innerHTML = '<tr><td colspan="9" class="loading-text">Yükleniyor...</td></tr>'; //
    
    try {
        // Hem hastaları hem randevuları paralel olarak çekiyoruz
        const [hastalarRes, randevularRes] = await Promise.all([
            fetch('/api/hastalar', { headers: { 'x-auth-token': localStorage.getItem('ranaToken') } }),
            fetch('/api/randevular', { headers: { 'x-auth-token': localStorage.getItem('ranaToken') } })
        ]);

        if (hastalarRes.status === 401 || hastalarRes.status === 403 || randevularRes.status === 401 || randevularRes.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        if (!hastalarRes.ok) {
            throw new Error(`Hastalar API hatası: ${hastalarRes.status}`);
        }

        const hastalar = await hastalarRes.json();
        let randevular = [];
        if (randevularRes.ok) {
            randevular = await randevularRes.json();
        }

        // Her hastanın son randevu tarihini bul
        const sonRandevuMap = {};
        randevular.forEach(r => {
            if (!sonRandevuMap[r.hastaId] || new Date(r.tarih) > new Date(sonRandevuMap[r.hastaId])) { // r.hastaId'yi kullan
                sonRandevuMap[r.hastaId || r.id] = r.tarih;
            }
        });

        // Hastalar listesine son randevu tarihini ekle
        tumHastalar = hastalar.map(h => ({ ...h, sonRandevuTarihi: sonRandevuMap[h.id] || null }));
        
        tabloGovdesi.innerHTML = '';
        hastalariListele(tumHastalar); // Listeleme fonksiyonunu çağır

    } catch (hata) {
        console.error('Hata:', hata);
        tabloGovdesi.innerHTML = '<tr><td colspan="9" style="color:red; text-align:center;">Veriler yüklenemedi.</td></tr>';
        showToast('Hastalar yüklenirken bir hata oluştu.', 'error');
    }
}

// Hastaları Listeleme Fonksiyonu (Filtreleme için ayrıldı)
function hastalariListele(hastalar) {
    const tabloGovdesi = document.getElementById('hastaListesi');
    tabloGovdesi.innerHTML = '';

    if (hastalar.length === 0) {
        tabloGovdesi.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 20px;">Kayıt bulunamadı.</td></tr>';
        return;
    }

    hastalar.forEach(hasta => {
        const satir = document.createElement('tr');
        
        // KVKK Maskeleme (TC ve Telefon)
        const maskeliTC = hasta.tcKimlik && hasta.tcKimlik.length > 4 
            ? hasta.tcKimlik.substring(0, 2) + '*******' + hasta.tcKimlik.substring(hasta.tcKimlik.length - 2) 
            : (hasta.tcKimlik || '-');

        // Satıra Tıklama Özelliği (Düzenlemeyi Aç)
        satir.style.cursor = 'pointer';
        satir.onclick = (e) => {
            // Eğer tıklanan yer buton veya link ise modalı açma
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) return;
            hastaDuzenleModalAc(hasta.id);
        };
        const hastaId = hasta.id;

        satir.innerHTML = `
            <td><a href="#" onclick="hastaGecmisiniGoster('${hasta.id}', '${hasta.adSoyad}'); return false;" style="color: #0f3460; font-weight: 600; text-decoration: none;">${hasta.adSoyad}</a></td>
            <td>${maskeliTC}</td>
            <td>${hasta.telefon || '-'}</td>
            <td>${hasta.email || '-'}</td>
            <td>${hasta.cinsiyet || '-'}</td>
            <td>${hasta.dogumTarihi ? new Date(hasta.dogumTarihi).toLocaleDateString('tr-TR') : '-'}</td>
            <td>${new Date(hasta.kayitTarihi).toLocaleDateString('tr-TR')}</td>
            <td>${hasta.sonRandevuTarihi ? new Date(hasta.sonRandevuTarihi).toLocaleDateString('tr-TR') : '-'}</td>
            <td> 
                <button onclick="hastaDuzenleModalAc('${hasta.id}')" style="background: #ffc107; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">✏️</button>
                <button onclick="hastaSil('${hasta.id}')" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">🗑️</button>
            </td>
        `;
        tabloGovdesi.appendChild(satir);
    });
}

// Hasta Geçmişini Gösteren Fonksiyon
window.hastaGecmisiniGoster = async (hastaId, adSoyad) => {
    const modal = document.getElementById('hastaGecmisModal');
    const liste = document.getElementById('hastaRandevuListesi');
    document.getElementById('modalHastaAdi').innerText = adSoyad;
    
    liste.innerHTML = '<tr><td colspan="4" class="loading-text">Yükleniyor...</td></tr>';
    modal.style.display = 'block';

    try {
        const response = await fetch(`${API_URL}/randevular?hastaId=${hastaId}`, {
             headers: { 'x-auth-token': localStorage.getItem('ranaToken') }
        });

        if (response.status === 401 || response.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        if (!response.ok) {
            throw new Error(`Randevu geçmişi API hatası: ${response.status}`);
        }

        const randevular = await response.json();
        
        liste.innerHTML = '';
        
        if (randevular.length === 0) {
            liste.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 15px;">Bu hastaya ait geçmiş randevu bulunamadı.</td></tr>';
            return;
        }

        randevular.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(r.tarih).toLocaleDateString('tr-TR')}</td>
                <td>${r.hizmetTuru}</td>
                <td><span class="status-badge">${r.durum}</span></td>
                <td>${r.mesaj || '-'}</td>
            `;
            liste.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        liste.innerHTML = '<tr><td colspan="4" style="color:red; text-align:center;">Veriler yüklenemedi.</td></tr>';
        showToast('Hasta geçmişi yüklenirken bir hata oluştu.', 'error');
    }
};

// Hasta Silme Fonksiyonu
window.hastaSil = async (id) => {
    if (!confirm('Bu hastayı silmek istediğinize emin misiniz?')) return;
    try {
        const response = await fetch(`${API_URL}/hastalar/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': localStorage.getItem('ranaToken') }
        });

        if (response.status === 401 || response.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        if (response.ok) {
            showToast('Hasta başarıyla silindi.', 'success');
            hastalariGetir();
        } else {
            const errorData = await response.json();
            showToast(`Silme başarısız: ${errorData.mesaj || 'Bilinmeyen bir hata oluştu.'}`, 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Hata oluştu: Hasta silinemedi.', 'error');
    }
};

// Hasta Düzenleme Modalını Aç
window.hastaDuzenleModalAc = (id) => {
    const hasta = tumHastalar.find(h => String(h.id) === String(id));
    if (!hasta) return;

    document.getElementById('editHastaId').value = hasta.id; // Sequelize id
    document.getElementById('editAdSoyad').value = hasta.adSoyad; 
    document.getElementById('editTcKimlik').value = hasta.tcKimlik || '';
    document.getElementById('editTelefon').value = hasta.telefon;
    document.getElementById('editEmail').value = hasta.email || '';
    document.getElementById('editCinsiyet').value = hasta.cinsiyet || '';
    if(hasta.dogumTarihi) document.getElementById('editDogumTarihi').value = new Date(hasta.dogumTarihi).toISOString().split('T')[0];

    document.getElementById('hastaDuzenleModal').style.display = 'block';
};

// EXCEL İNDİRME FONKSİYONU
window.excelDisaAktar = () => {
    if (tumHastalar.length === 0) {
        showToast('Dışa aktarılacak veri yok.', 'error');
        return;
    }

    const excelVerisi = tumHastalar.map(h => ({
        'Ad Soyad': h.adSoyad,
        'TC Kimlik': h.tcKimlik || '-',
        'Telefon': h.telefon,
        'E-posta': h.email || '-',
        'Cinsiyet': h.cinsiyet || '-',
        'Doğum Tarihi': h.dogumTarihi ? new Date(h.dogumTarihi).toLocaleDateString('tr-TR') : '-',
        'Kayıt Tarihi': new Date(h.kayitTarihi).toLocaleDateString('tr-TR'),
        'Son Randevu': h.sonRandevuTarihi ? new Date(h.sonRandevuTarihi).toLocaleDateString('tr-TR') : '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelVerisi);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hastalar");
    XLSX.writeFile(workbook, 'Rana_Hastalar.xlsx');
};

// ARAMA FİLTRELEME FONKSİYONU
function hastalariFiltrele(aramaMetni) {
    const kucukMetin = aramaMetni.toLowerCase();
    const filtrelenmisHastalar = tumHastalar.filter(h => 
        h.adSoyad.toLowerCase().includes(kucukMetin) ||
        (h.tcKimlik && h.tcKimlik.includes(kucukMetin)) ||
        h.telefon.includes(kucukMetin)
    );
    hastalariListele(filtrelenmisHastalar);
}

// --- PERİYODİK KONTROL FONKSİYONU ---
async function yeniRandevuKontrol() {
    try {
        const response = await fetch(`${API_URL}/randevular?_t=${Date.now()}`, {
            headers: { 'x-auth-token': localStorage.getItem('ranaToken') }
        });

        if (response.status === 401 || response.status === 403) {
            console.warn('Bildirim kontrolü sırasında yetkilendirme hatası. Oturum sona ermiş olabilir.');
            localStorage.removeItem('ranaToken');
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        if (!response.ok) {
            console.error(`Bildirim kontrolü sırasında HTTP hatası: ${response.status}`);
            showToast('Bildirimler yüklenirken bir hata oluştu.', 'error');
            return;
        }
        
        const guncelVeri = await response.json();
        const guncelSayi = guncelVeri.length;

        if (sonRandevuSayisi !== -1 && guncelSayi > sonRandevuSayisi) {
            const fark = guncelSayi - sonRandevuSayisi;
            
            // Sesli Uyarı
            const sesAyari = localStorage.getItem('notificationSound') || 'default';
            if (sesAyari !== 'mute') {
                let soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
                if (sesAyari === 'soft') soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3';
                if (sesAyari === 'alert') soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3';
                new Audio(soundUrl).play().catch(e => console.log('Ses çalınamadı.'));
            }

            // Görsel Bildirim
            showToast(`🔔 ${fark} yeni randevu talebi alındı!`, 'success');

            // Zil İkonunu Güncelle
            const btnNotif = document.querySelector('.btn-notification');
            if (btnNotif) {
                btnNotif.classList.add('active');
            }
            
            sonRandevuSayisi = guncelSayi;
            
            // Hastalar listesini de yenile (Son randevu tarihi güncellensin diye)
            hastalariGetir();
        }
    } catch (e) { console.error("Bildirim kontrol hatası:", e); }
}
