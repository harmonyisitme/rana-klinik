import { API_URL, showToast, checkAuth } from './utils.js';

// Güvenlik Kontrolü
checkAuth();

let tumRandevular = []; // Verileri burada saklayacağız
let silinecekRandevuId = null; // Silinecek ID'yi geçici olarak tutar
let onaylanacakRandevuId = null; // Onaylanacak ID
let randevuChart = null; // Grafik nesnesini tutmak için
let siralamaYon = 1; // 1: Artan (A-Z), -1: Azalan (Z-A)
let sonSiralama = ''; // Son sıralanan sütun
let sonRandevuSayisi = -1; // Bildirim kontrolü için sayaç (-1: ilk yükleme)

document.addEventListener('DOMContentLoaded', () => {
    randevulariGetir();
    
    // Tarih filtresi değiştiğinde tabloyu otomatik yenile
    const tarihInput = document.getElementById('tarihFiltresi');
    if (tarihInput) {
        tarihInput.addEventListener('change', tabloyuYenile);
    }

    // Durum filtresi değiştiğinde tabloyu otomatik yenile
    const durumInput = document.getElementById('durumFiltresi');
    if (durumInput) {
        durumInput.addEventListener('change', tabloyuYenile);
    }

    // --- CANLI BİLDİRİM SİSTEMİ (10 Saniyede bir kontrol et) ---
    setInterval(yeniRandevuKontrol, 10000);

    // --- MODAL İŞLEMLERİ ---
    const detayModal = document.getElementById('detayModal');
    const silmeModal = document.getElementById('silmeModal');
    const onayModal = document.getElementById('onayModal');
    const gecmisModal = document.getElementById('hastaGecmisModal');
    
    // Detay Modalı Kapatma
    document.querySelector('#detayModal .close-modal').onclick = () => detayModal.style.display = "none";
    
    // Silme Modalı Kapatma (X ve Vazgeç)
    document.getElementById('closeSilModal').onclick = () => silmeModal.style.display = "none";
    document.getElementById('btnSilVazgec').onclick = () => silmeModal.style.display = "none";

    // Onay Modalı Kapatma
    const closeOnayHandler = () => {
        document.getElementById('onayModal').style.display = "none";
        tabloyuYenile(); // Dropdown'u eski haline getirmek için tabloyu yenile
    };
    document.getElementById('closeOnayModal').onclick = closeOnayHandler;
    document.getElementById('btnOnayIptal').onclick = closeOnayHandler;
    // Geçmiş Modalı Kapatma
    if (document.getElementById('closeGecmisModal')) {
        document.getElementById('closeGecmisModal').onclick = () => gecmisModal.style.display = "none";
    }

    // Onay ve Kaydet Butonu
    document.getElementById('btnOnaylaKaydet').addEventListener('click', () => {
        const baslangic = document.getElementById('randevuBaslangicSaati').value;
        const bitis = document.getElementById('randevuBitisSaati').value;

        if (!baslangic || !bitis) {
            showToast('Lütfen başlangıç ve bitiş saatlerini seçin.', 'error');
            return;
        }
        if (onaylanacakRandevuId) {
            durumGuncelle(onaylanacakRandevuId, 'Onaylandı', `${baslangic} - ${bitis}`);
            onayModal.style.display = 'none';
        }
    });
    
    // Silme Onay Butonu
    document.getElementById('btnSilOnay').addEventListener('click', async () => {
        if (silinecekRandevuId) {
            try {
                const response = await fetch(`${API_URL}/randevular/${silinecekRandevuId}`, {
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
                    randevulariGetir();
                    silmeModal.style.display = 'none';
                    showToast('Randevu başarıyla silindi.', 'success');
                }
            } catch (hata) { showToast('Silme işlemi başarısız: ' + hata.message, 'error'); }
        }
    });

    window.onclick = function(event) {
        if (event.target == detayModal) detayModal.style.display = "none";
        if (event.target == silmeModal) silmeModal.style.display = "none";
        if (event.target == onayModal) onayModal.style.display = "none";
        if (event.target == gecmisModal) gecmisModal.style.display = "none";
    }

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

    // --- SAYFA GEÇİŞ EFEKTİ ---
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Sadece iç sayfalar ve geçerli linkler için
            if (!href || href.startsWith('#') || href.startsWith('javascript') || this.getAttribute('target') === '_blank') {
                return;
            }

            // Aynı sayfaya tıklanırsa (örn: Logo) yenilemeyi engelle
            if (this.href === window.location.href) {
                e.preventDefault();
                return;
            }

            e.preventDefault();
            document.body.classList.add('fade-out');

            setTimeout(() => {
                window.location.href = href;
            }, 200); // Admin paneli için biraz daha hızlı (0.2s)
        });
    });
});

async function randevulariGetir() {
    document.getElementById('randevuListesi').innerHTML = '<tr><td colspan="7" class="loading-text">Yükleniyor...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/randevular`, {
            headers: { 'x-auth-token': localStorage.getItem('ranaToken') }
        });

        if (response.status === 401 || response.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return; // Önemli: Fonksiyonu burada sonlandır
        }

        if (!response.ok) {
            throw new Error(`HTTP hata kodu: ${response.status}`);
        }
        
        tumRandevular = await response.json(); // Global değişkene ata

        // İlk yüklemede sayıyı hafızaya al
        if (sonRandevuSayisi === -1) {
            sonRandevuSayisi = tumRandevular.length;
        }
        istatistikleriGuncelle(tumRandevular); // İstatistikleri hesapla
        grafikOlustur(tumRandevular); // Grafiği oluştur
        tabloyuYenile(); // Tabloyu çiz
    } catch (hata) {
        console.error('Hata:', hata);
        document.getElementById('randevuListesi').innerHTML = '<tr><td colspan="7" style="color:red; text-align:center;">Randevular yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</td></tr>';
        showToast('Randevular yüklenirken bir hata oluştu.', 'error');
    }
}

// --- PERİYODİK KONTROL FONKSİYONU ---
async function yeniRandevuKontrol() {
    try {
        // Arka planda sessizce veriyi çek
        const response = await fetch(`${API_URL}/randevular?_t=${Date.now()}`, {
            headers: { 'x-auth-token': localStorage.getItem('ranaToken') }
        });

        if (response.status === 401 || response.status === 403) {
            console.warn('Bildirim kontrolü sırasında yetkilendirme hatası. Oturum sona ermiş olabilir.');
            return;
        }

        if (!response.ok) {
            console.error(`Bildirim kontrolü sırasında HTTP hatası: ${response.status}`);
            return;
        }
        
        const guncelVeri = await response.json();
        const guncelSayi = guncelVeri.length;

        // Eğer yeni bir kayıt varsa (Sayı arttıysa)
        if (sonRandevuSayisi !== -1 && guncelSayi > sonRandevuSayisi) {
            const fark = guncelSayi - sonRandevuSayisi;
            
            // Yeni randevuları bul
            const eskiIdler = new Set(tumRandevular.map(r => r.id));
            const yeniRandevular = guncelVeri.filter(r => !eskiIdler.has(r.id));

            // 1. Sesli Uyarı Çal (Ayarlara göre)
            const sesAyari = localStorage.getItem('notificationSound') || 'default';
            
            if (sesAyari !== 'mute') {
                let soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; // Default
                if (sesAyari === 'soft') soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3';
                if (sesAyari === 'alert') soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3';

                const audio = new Audio(soundUrl);
                audio.play().catch(e => console.log('Ses çalınamadı (otomatik oynatma engeli).'));
            }

            // 4. Verileri Güncelle (showToast'tan önce yapalım ki detayGoster çalışsın)
            tumRandevular = guncelVeri;

            // 2. Görsel Bildirim (Toast)
            if (fark === 1 && yeniRandevular.length === 1) {
                const yeniRandevu = yeniRandevular[0];
                // Tıklandığında detayGoster fonksiyonunu çağıran bir callback gönder
                showToast(`🔔 Yeni randevu: ${yeniRandevu.adSoyad}`, 'success', () => { //
                    detayGoster(yeniRandevu.id); //
                });
            } else {
                showToast(`🔔 ${fark} yeni randevu talebi alındı!`, 'success');
            }

            // 3. Zil İkonunu Aktif Et
            const btnNotif = document.querySelector('.btn-notification');
            if (btnNotif) {
                btnNotif.classList.add('active');
                btnNotif.title = `${fark} Yeni Bildirim`;
            }

            // Diğer UI güncellemeleri
            istatistikleriGuncelle(tumRandevular);
            grafikOlustur(tumRandevular);
            tabloyuYenile();
            
            // Sayacı güncelle
            sonRandevuSayisi = guncelSayi;
        }
    } catch (e) {
        console.error("Bildirim kontrol hatası:", e);
    }
}

// TABLOYU YENİLEME VE FİLTRELEME FONKSİYONU
function tabloyuYenile() {
    const tabloGövdesi = document.getElementById('randevuListesi');
    const secilenTarih = document.getElementById('tarihFiltresi').value;
    const secilenDurum = document.getElementById('durumFiltresi').value;
    
    let randevular = [...tumRandevular]; // Kopya üzerinde çalış

    // Filtreleme
    if (secilenTarih) {
        randevular = randevular.filter(r => r.tarih && r.tarih.startsWith(secilenTarih));
    }
    if (secilenDurum && secilenDurum !== 'Tümü') {
        randevular = randevular.filter(r => r.durum === secilenDurum);
    }
    console.log('Tabloya listelenecek randevular (filtre sonrası):', randevular);

    tabloGövdesi.innerHTML = '';

    if (randevular.length === 0) {
        tabloGövdesi.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Kriterlere uygun randevu bulunamadı.</td></tr>';
        return;
    }

    randevular.forEach(randevu => {
        const satir = document.createElement('tr');
        
        // Tarih Kontrolü
        const randevuTarihi = new Date(randevu.tarih);
        const bugun = new Date();
        if (randevuTarihi.toDateString() === bugun.toDateString()) {
            satir.classList.add('today-row');
        }

        // Satıra Tıklama Özelliği (Detayları Aç)
        satir.style.cursor = 'pointer';
        satir.onclick = (e) => {
            // Eğer tıklanan yer buton veya dropdown ise detay modalını açma
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.closest('button') || e.target.closest('select')) return;
            detayGoster(randevu.id);
        };

        const saatBilgisi = randevu.randevuSaati ? `<br><small>🕒 ${randevu.randevuSaati}</small>` : '';
        const randevuId = randevu.id;
        const durumDropdown = `
            <select class="status-dropdown" onchange="durumDropdownGuncelle('${randevu.id}', this.value)">
                <option value="Bekliyor" ${randevu.durum === 'Bekliyor' ? 'selected' : ''}>Bekliyor</option>
                <option value="Onaylandı" ${randevu.durum === 'Onaylandı' ? 'selected' : ''}>Onaylandı</option>
                <option value="Tamamlandı" ${randevu.durum === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
            </select>
        `;

        satir.innerHTML = `
            <td>${new Date(randevu.tarih).toLocaleDateString('tr-TR')} ${saatBilgisi}</td>
            <td>${randevu.adSoyad}</td>
            <td>${randevu.telefon}</td>
            <td>${randevu.hizmetTuru}</td>
            <td>${randevu.mesaj || '-'}</td>
            <td>${durumDropdown}</td>
            <td style="display: flex; gap: 5px;">
                <button class="btn-action" style="background-color: #17a2b8; color: white;" onclick="detayGoster('${randevuId}')" title="Detaylar">ℹ️</button> <!-- -->
                <button class="btn-action delete" onclick="randevuSil('${randevu.id}')">🗑️</button> <!-- -->
            </td>
        `;
        tabloGövdesi.appendChild(satir);
    });
}

// DURUM DEĞİŞTİRME DROPDOWN FONKSİYONU
window.durumDropdownGuncelle = (id, yeniDurum) => {
    const randevu = tumRandevular.find(r => String(r.id) === String(id));
    if (randevu && randevu.durum === yeniDurum) return; // Değişiklik yoksa bir şey yapma

    if (yeniDurum === 'Onaylandı') {
        onayModalAc(id);
    } else {
        durumGuncelle(id, yeniDurum);
    }
};

// SIRALAMA FONKSİYONU
function sirala(anahtar) {
    // Aynı sütuna tıklandıysa yönü ters çevir, farklıysa sıfırla
    if (sonSiralama === anahtar) {
        siralamaYon *= -1;
    } else {
        siralamaYon = 1;
        sonSiralama = anahtar;
    }

    tumRandevular.sort((a, b) => {
        let valA = a[anahtar] ? a[anahtar].toString().toLowerCase() : '';
        let valB = b[anahtar] ? b[anahtar].toString().toLowerCase() : '';

        if (valA < valB) return -1 * siralamaYon;
        if (valA > valB) return 1 * siralamaYon;
        return 0;
    });

    tabloyuYenile();
}

// DETAY GÖSTERME FONKSİYONU
function detayGoster(id) {
    const randevu = tumRandevular.find(r => String(r.id) === String(id));
    if (!randevu) return;

    // TC Kimlik Maskeleme (Varsa ilk 2 ve son 2 haneyi göster)
    const maskeliTC = randevu.tcKimlik ? randevu.tcKimlik.substring(0, 2) + '*******' + randevu.tcKimlik.substring(9) : '';

    const modalIcerik = document.getElementById('modalIcerik');
    modalIcerik.innerHTML = `
        <div class="detail-row"><strong>Tarih:</strong> ${new Date(randevu.tarih).toLocaleDateString('tr-TR')}</div>
        <div class="detail-row"><strong>Saat:</strong> ${randevu.randevuSaati || 'Atanmadı'}</div>
        <div class="detail-row"><strong>Ad Soyad:</strong> ${randevu.adSoyad}</div>
        <div class="detail-row"><strong>Telefon:</strong> ${randevu.telefon}</div>
        <div class="detail-row"><strong>E-posta:</strong> ${randevu.email || '-'}</div>
        ${randevu.tcKimlik ? `<div class="detail-row"><strong>TC Kimlik:</strong> ${maskeliTC}</div>` : ''}
        ${randevu.cinsiyet ? `<div class="detail-row"><strong>Cinsiyet:</strong> ${randevu.cinsiyet}</div>` : ''}
        ${randevu.dogumTarihi ? `<div class="detail-row"><strong>Doğum Tarihi:</strong> ${new Date(randevu.dogumTarihi).toLocaleDateString('tr-TR')}</div>` : ''}
        <div class="detail-row"><strong>Hizmet Türü:</strong> ${randevu.hizmetTuru}</div>
        <div class="detail-row"><strong>Durum:</strong> ${randevu.durum}</div>
        <div class="detail-row"><strong>Mesaj:</strong> <p style="margin-top:5px; background:#f9f9f9; padding:10px; border-radius:5px;">${randevu.mesaj || 'Mesaj yok.'}</p></div>
        
        ${randevu.hastaId ? `
        <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
            <button class="btn-refresh" onclick="hastaGecmisiniGoster('${randevu.hastaId}', '${randevu.adSoyad}')" style="width: 100%; background-color: #6c757d;">📋 Hastanın Geçmiş Randevuları</button>
        </div>` : ''}
    `;

    document.getElementById('detayModal').style.display = "block";
}

// HASTA GEÇMİŞİNİ GÖSTER
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
    }
};

// DURUM GÜNCELLEME FONKSİYONU
async function durumGuncelle(id, yeniDurum, saat = null) {
    try {
        const response = await fetch(`${API_URL}/randevular/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('ranaToken') },
            body: JSON.stringify({ durum: yeniDurum, randevuSaati: saat })
        });
        if (response.status === 401 || response.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }
        if (response.ok) {
            randevulariGetir(); // Tabloyu tazele
            showToast(`Durum "${yeniDurum}" olarak güncellendi.`, 'success');
        }
        else {
            const errorData = await response.json();
            showToast(`Güncelleme başarısız: ${errorData.mesaj || 'Bilinmeyen bir hata oluştu.'}`, 'error');
        }
    } catch (hata) { showToast('Güncelleme başarısız: ' + hata.message, 'error'); }
}

// ONAY MODALINI AÇ
function onayModalAc(id) {
    onaylanacakRandevuId = id;
    document.getElementById('onayModal').style.display = 'block';
}

// SİLME FONKSİYONU
function randevuSil(id) {
    silinecekRandevuId = id;
    document.getElementById('silmeModal').style.display = 'block';
}

// Modül bağlamında kullanılan inline onclick için global fonksiyonlar
window.detayGoster = detayGoster;
window.randevuSil = randevuSil;

// --- DIŞA AKTARMA FONKSİYONLARI ---

// Mevcut filtreleri uygulayarak veriyi hazırlar
function verileriFiltrele() {
    const secilenTarih = document.getElementById('tarihFiltresi').value;
    const secilenDurum = document.getElementById('durumFiltresi').value;
    
    let veri = tumRandevular;

    if (secilenTarih) {
        veri = veri.filter(r => r.tarih && r.tarih.startsWith(secilenTarih));
    }
    if (secilenDurum && secilenDurum !== 'Tümü') {
        veri = veri.filter(r => r.durum === secilenDurum);
    }
    return veri;
}

// EXCEL İNDİR
function excelDisaAktar() {
    const veri = verileriFiltrele();
    if (veri.length === 0) { showToast('Dışa aktarılacak veri yok.', 'error'); return; }

    // Veriyi Excel formatına uygun hale getir (Türkçe başlıklar)
    const excelVerisi = veri.map(r => ({
        'Tarih': new Date(r.tarih).toLocaleDateString('tr-TR'),
        'Ad Soyad': r.adSoyad,
        'Telefon': r.telefon,
        'E-posta': r.email || '-',
        'Hizmet Türü': r.hizmetTuru,
        'Durum': r.durum,
        'Mesaj': r.mesaj
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelVerisi);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Randevular");
    XLSX.writeFile(workbook, 'Rana_Randevular.xlsx');
}

// PDF İNDİR
function pdfDisaAktar() {
    const veri = verileriFiltrele();
    if (veri.length === 0) { showToast('Dışa aktarılacak veri yok.', 'error'); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Rana Klinik - Randevu Listesi", 14, 15);

    const tabloBasliklari = [["Tarih", "Ad Soyad", "Telefon", "Hizmet", "Durum"]];
    const tabloVerileri = veri.map(r => [
        new Date(r.tarih).toLocaleDateString('tr-TR'),
        r.adSoyad,
        r.telefon,
        r.hizmetTuru,
        r.durum
    ]);

    doc.autoTable({
        head: tabloBasliklari,
        body: tabloVerileri,
        startY: 20,
    });

    doc.save("Rana_Randevular.pdf");
}

// İSTATİSTİKLERİ GÜNCELLE
function istatistikleriGuncelle(data) {
    document.getElementById('statToplam').innerText = data.length;
    document.getElementById('statBekleyen').innerText = data.filter(r => r.durum === 'Bekliyor').length;
    document.getElementById('statOnaylanan').innerText = data.filter(r => r.durum === 'Onaylandı').length;
    document.getElementById('statTamamlanan').innerText = data.filter(r => r.durum === 'Tamamlandı').length;
}

// GRAFİK OLUŞTURMA FONKSİYONU
function grafikOlustur(data) {
    const ctx = document.getElementById('randevuGrafik');
    if (!ctx) return;

    // Mevcut grafik varsa yok et (yeniden çizim hatasını önlemek için)
    if (randevuChart) {
        randevuChart.destroy();
    }

    const bekleyen = data.filter(r => r.durum === 'Bekliyor').length;
    const onaylanan = data.filter(r => r.durum === 'Onaylandı').length;
    const tamamlanan = data.filter(r => r.durum === 'Tamamlandı').length;

    randevuChart = new Chart(ctx, {
        type: 'doughnut', // Pasta grafik türü (bar, line, pie da olabilir)
        data: {
            labels: ['Bekleyen', 'Onaylanan', 'Tamamlanan'],
            datasets: [{
                label: 'Randevu Sayısı',
                data: [bekleyen, onaylanan, tamamlanan],
                backgroundColor: ['#f0ad4e', '#28a745', '#17a2b8'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}
