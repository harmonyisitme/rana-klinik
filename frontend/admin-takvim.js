import { API_URL, showToast, checkAuth } from './utils.js';

// Güvenlik Kontrolü
checkAuth();

let calendar; // Takvim nesnesini daha geniş bir kapsamda tanımla
let sonRandevuSayisi = -1; // Bildirim takibi için

document.addEventListener('DOMContentLoaded', async () => {
    const calendarEl = document.getElementById('calendar');
    console.log('Calendar element found:', calendarEl); // Calendar elementinin bulunup bulunmadığını kontrol et

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
    } catch (e) { console.error("Initial notification count fetch error:", e); }
    setInterval(yeniRandevuKontrol, 10000);

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

    if (!calendarEl) {
        console.error('HATA: HTML sayfasında id="calendar" olan bir element bulunamadı. Takvim yüklenemedi.');
        return;
    }

    await loadAndRenderCalendar(calendarEl); // Takvimi yükle ve render et
});

async function loadAndRenderCalendar(calendarEl) {
    try {
        const response = await fetch(`${API_URL}/randevular`, {
            headers: { 'x-auth-token': localStorage.getItem('ranaToken') }
        });
        const randevular = await response.json();
        console.log('Admin Takvim: API\'den gelen randevular:', randevular);

        const events = randevular.map(randevu => {
            let color = '#17a2b8'; // Tamamlandı
            if (randevu.durum === 'Bekliyor') color = '#f0ad4e'; // Bekliyor
            if (randevu.durum === 'Onaylandı') color = '#28a745'; // Onaylandı

            let start = randevu.tarih;
            let end = null;
            let allDay = false;

            // Eğer özel bir saat aralığı atanmışsa (Örn: "14:30 - 15:00")
            if (randevu.randevuSaati) {
                try {
                    // 1. Tarih kısmını al (YYYY-MM-DD)
                    // Veritabanından gelen format: "2023-10-27T00:00:00.000Z"
                    const datePart = randevu.tarih.split('T')[0];

                    // 2. Saat kısmını ayrıştır
                    const timeParts = randevu.randevuSaati.split('-');
                    const startTime = timeParts[0].trim(); // "14:30"
                    
                    // 3. FullCalendar için birleştir (YYYY-MM-DDTHH:mm:00)
                    start = `${datePart}T${startTime}:00`;

                    if (timeParts.length > 1) {
                        const endTime = timeParts[1].trim(); // "15:00"
                        end = `${datePart}T${endTime}:00`;
                    }
                } catch (e) { console.error("Saat formatlama hatası:", e); }
            } else {
                // Saat atanmamışsa (Bekliyor ise) Tüm Gün kısmında göster
                allDay = true;
                start = randevu.tarih.split('T')[0]; // Tüm gün olayları için YYYY-MM-DD formatını kullan
            }
            // Bu return ifadesi, if/else bloğunun dışında olmalı ki her randevu için bir olay dönsün.
            return { 
                id: randevu.id,
                title: randevu.adSoyad,
                start: start,
                end: end,
                allDay: allDay,
                backgroundColor: color,
                borderColor: color,
                extendedProps: {
                    hizmet: randevu.hizmetTuru,
                    telefon: randevu.telefon,
                    durum: randevu.durum,
                    mesaj: randevu.mesaj,
                    randevuSaati: randevu.randevuSaati,
                    email: randevu.email,
                    tcKimlik: randevu.tcKimlik,
                    cinsiyet: randevu.cinsiyet,
                    dogumTarihi: randevu.dogumTarihi
                }
            };
        });

        console.log('Admin Takvim: FullCalendar\'a gönderilen olaylar (events):', events);
        
        if (calendar) { // Eğer takvim zaten oluşturulduysa, sadece olayları güncelle
            calendar.setOption('events', events);
            calendar.refetchEvents(); // Olayları yeniden çek (gerekirse)
        } else { // İlk defa oluşturuluyorsa
            calendar = new FullCalendar.Calendar(calendarEl, {
                locale: 'tr',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,listWeek'
                },
                initialView: 'dayGridMonth',
                events: events,
                eventMouseEnter: function(info) {
                    const tooltip = document.getElementById('eventTooltip');
                    const props = info.event.extendedProps;
                    tooltip.innerHTML = `
                        <strong>${info.event.title}</strong><br>
                        Saat: ${props.randevuSaati || 'Atanmadı'}<br>
                        Hizmet: ${props.hizmet}
                    `;
                    tooltip.style.display = 'block';
                    tooltip.style.left = info.jsEvent.pageX + 10 + 'px';
                    tooltip.style.top = info.jsEvent.pageY + 10 + 'px';
                },
                eventMouseLeave: function(info) {
                    const tooltip = document.getElementById('eventTooltip');
                    tooltip.style.display = 'none';
                },
                eventClick: function(info) {
                    const props = info.event.extendedProps;
                    
                    // TC Maskeleme
                    const maskeliTC = props.tcKimlik ? props.tcKimlik.substring(0, 2) + '*******' + props.tcKimlik.substring(9) : '';

                    const modalIcerik = document.getElementById('modalIcerik');
                    modalIcerik.innerHTML = `
                        <div class="detail-row"><strong>Hasta:</strong> ${info.event.title}</div>
                        <div class="detail-row"><strong>Tarih:</strong> ${info.event.start.toLocaleDateString('tr-TR')}</div>
                        <div class="detail-row"><strong>Saat:</strong> ${props.randevuSaati || 'Atanmadı'}</div>
                        <div class="detail-row"><strong>Durum:</strong> ${props.durum}</div>
                        <div class="detail-row"><strong>Telefon:</strong> ${props.telefon}</div>
                        <div class="detail-row"><strong>E-posta:</strong> ${props.email || '-'}</div>
                        ${props.tcKimlik ? `<div class="detail-row"><strong>TC Kimlik:</strong> ${maskeliTC}</div>` : ''}
                        ${props.cinsiyet ? `<div class="detail-row"><strong>Cinsiyet:</strong> ${props.cinsiyet}</div>` : ''}
                        ${props.dogumTarihi ? `<div class="detail-row"><strong>Doğum Tarihi:</strong> ${new Date(props.dogumTarihi).toLocaleDateString('tr-TR')}</div>` : ''}
                        <div class="detail-row"><strong>Hizmet:</strong> ${props.hizmet}</div>
                        <div class="detail-row"><strong>Mesaj:</strong> ${props.mesaj || '-'}</div>
                    `;
                    document.getElementById('eventModal').style.display = 'block';
                }
            });
            calendar.render();
        }

    } catch (error) {
        console.error('Randevular yüklenemedi:', error);
        if (calendarEl) { // calendarEl'in varlığını kontrol et
            calendarEl.innerHTML = '<p style="color: red; text-align: center;">Takvim verileri yüklenirken bir hata oluştu.</p>';
        }
    }
}

// Modal Kapatma İşlemleri
const modal = document.getElementById('eventModal');
const span = document.getElementsByClassName("close-modal")[0];
if (span) span.onclick = function() { modal.style.display = "none"; }
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// --- PERİYODİK KONTROL FONKSİYONU ---
async function yeniRandevuKontrol() {
    try {
        const response = await fetch(`${API_URL}/randevular?_t=${Date.now()}`, {
            headers: { 'x-auth-token': localStorage.getItem('ranaToken') }
        });

        if (response.status === 401 || response.status === 403) {
            console.warn('Bildirim kontrolü sırasında yetkilendirme hatası. Oturum sona ermiş olabilir.');
            // Token'ı temizle ve giriş sayfasına yönlendir
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
            
            // Takvimi yeni verilerle yeniden render et
            const calendarEl = document.getElementById('calendar');
            if (calendarEl && calendar) { // calendarEl ve calendar nesnesinin varlığını kontrol et
                await loadAndRenderCalendar(calendarEl);
            }
        }
    } catch (e) { console.error("Bildirim kontrol hatası:", e); }
}
