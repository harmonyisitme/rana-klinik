import { API_URL, showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // API_URL artık utils.js'den geliyor

    // --- INPUT FORMATLAMA (Telefon ve TC) ---
    function formatla(deger, tur) {
        if (!deger) return '';
        deger = deger.toString().replace(/\D/g, ''); // Sadece rakamları al
        
        if (tur === 'telefon') {
            if (deger.startsWith('0')) deger = deger.substring(1);
            if (deger.length > 10) deger = deger.substring(0, 10);
            
            let formatli = '';
            if (deger.length > 0) formatli = '(' + deger.substring(0, 3);
            if (deger.length >= 4) formatli += ') ' + deger.substring(3, 6);
            if (deger.length >= 7) formatli += ' ' + deger.substring(6, 8);
            if (deger.length >= 9) formatli += ' ' + deger.substring(8, 10);
            return formatli;
        } else {
            // TC
            if (deger.startsWith('0')) deger = deger.substring(1);
            if (deger.length > 11) deger = deger.substring(0, 11);
            return deger;
        }
    }

    function inputFormatla(inputId, tur) {
        const input = document.getElementById(inputId);
        if (!input) return;

        input.addEventListener('input', (e) => {
            e.target.value = formatla(e.target.value, tur);
        });
    }

    // Formatlanacak alanları tanımla
    inputFormatla('telefon', 'telefon');
    inputFormatla('sorguTc', 'tc');
    inputFormatla('tcKimlik', 'tc');

    // --- TARİH KISITLAMASI (GEÇMİŞ TARİH SEÇİMİNİ ENGELLE) ---
    let doluGunler = [];
    const tarihInput = document.getElementById('tarih');
    
    if (tarihInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        tarihInput.min = `${yyyy}-${mm}-${dd}`;

        // Dolu günleri çek
        fetch(`${API_URL}/randevular/dolu-gunler`)
            .then(res => res.json())
            .then(data => {
                doluGunler = data;
            })
            .catch(err => console.error('Dolu günler alınamadı:', err));

        // Tarih değiştiğinde kontrol et
        tarihInput.addEventListener('change', (e) => {
            const secilenTarih = e.target.value;
            if (doluGunler.includes(secilenTarih)) {
                showToast('Seçtiğiniz tarih tamamen doludur. Lütfen başka bir tarih seçiniz.', 'error');
                e.target.value = ''; // Seçimi temizle
            }
            // Hafta sonu kontrolü (İsteğe bağlı, Pazar günü engelleme)
            const day = new Date(secilenTarih).getDay();
            if (day === 0) { // 0 = Pazar
                showToast('Pazar günleri kliniğimiz kapalıdır.', 'error');
                e.target.value = '';
            }
        });
    }

    // --- TC KİMLİK DOĞRULAMA ALGORİTMASI ---
    function tcKimlikDogrula(tcno) {
        if (!tcno || tcno.length !== 11) return false;
        if (tcno[0] === '0') return false; // 0 ile başlayamaz

        let tekler = 0, ciftler = 0, toplam = 0;
        
        for (let i = 0; i < 9; i++) {
            let rakam = parseInt(tcno[i]);
            if (i % 2 === 0) tekler += rakam; // 1, 3, 5, 7, 9. haneler (indis 0, 2, 4, 6, 8)
            else ciftler += rakam;            // 2, 4, 6, 8. haneler (indis 1, 3, 5, 7)
            toplam += rakam;
        }

        let hane10 = ((tekler * 7) - ciftler) % 10;
        let hane11 = (toplam + hane10) % 10;

        if (hane10 !== parseInt(tcno[9])) return false;
        if (hane11 !== parseInt(tcno[10])) return false;

        return true;
    }

    // --- E-POSTA DOĞRULAMA ---
    function emailDogrula(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // --- 0. SİTE AYARLARINI ÇEK VE YERLEŞTİR ---
    let dynamicServiceDetails = {}; // Modal için dinamik veri
    let yasalMetinlerData = {}; // Yasal metinleri saklamak için

    async function siteAyarlariniGetir() {
        try {
            // Önbellek sorununu önlemek için timestamp ekliyoruz
            const response = await fetch(`${API_URL}/site-ayarlari?_t=${Date.now()}`);
            if (!response.ok) return;
            const ayarlar = await response.json();

            // Yasal metinleri sakla
            yasalMetinlerData = ayarlar.yasalMetinler || {};

            // 0. Logo Ayarı
            const logoSrc = (ayarlar.logo && ayarlar.logo.trim() !== '') ? ayarlar.logo : '/logo.png';
            const logoElements = document.querySelectorAll('.logo, .footer-logo');
            logoElements.forEach(el => {
                el.innerHTML = `<img src="${logoSrc}" alt="Rana Klinik" style="height: 60px; vertical-align: middle;">`;
            });

            // 0.0 Favicon Ayarı
            if (ayarlar.favicon && ayarlar.favicon.trim() !== '') {
                let link = document.querySelector("link[rel~='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.getElementsByTagName('head')[0].appendChild(link);
                }
                link.href = ayarlar.favicon;
            }

            // 0.1 Hero Görseli
            if (ayarlar.heroGorsel && ayarlar.heroGorsel.trim() !== '') {
                const heroSection = document.querySelector('.hero');
                if (heroSection) {
                    heroSection.style.background = `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url('${ayarlar.heroGorsel}') center/cover`;
                }
            }

            // 0.1.1 Ana Renk Ayarı
            if (ayarlar.anaRenk) {
                document.documentElement.style.setProperty('--primary-color', ayarlar.anaRenk);
            }

            // 0.1.2 İkincil Renk Ayarı
            if (ayarlar.ikincilRenk) {
                document.documentElement.style.setProperty('--accent-color', ayarlar.ikincilRenk);
            }

            // 0.2 Hakkımızda Sayfası (Eğer o sayfadaysak)
            const aboutTitle = document.getElementById('aboutTitle');
            const aboutContent = document.getElementById('aboutContent');
            const aboutImage = document.getElementById('aboutImage');
            
            if (aboutTitle && ayarlar.hakkimizda) {
                aboutTitle.textContent = ayarlar.hakkimizda.baslik;
                aboutContent.innerHTML = ayarlar.hakkimizda.icerik.replace(/\n/g, '<br>');
                if (aboutImage && ayarlar.hakkimizda.gorsel) aboutImage.src = ayarlar.hakkimizda.gorsel;
            }

            // 0.3 Header (Top Bar) Bilgileri
            const headerTelefon = document.getElementById('headerTelefon');
            const headerEmail = document.getElementById('headerEmail');
            const headerAdres = document.getElementById('headerAdres');
            
            if (headerTelefon) headerTelefon.innerHTML = `<a href="tel:${ayarlar.iletisim.telefon}" style="color: inherit; text-decoration: none;"><i class="fas fa-phone-alt"></i> ${ayarlar.iletisim.telefon}</a>`;
            if (headerEmail) headerEmail.innerHTML = `<a href="mailto:${ayarlar.iletisim.email}" style="color: inherit; text-decoration: none;"><i class="fas fa-envelope"></i> ${ayarlar.iletisim.email}</a>`;
            if (headerAdres) headerAdres.innerHTML = `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ayarlar.iletisim.adres)}" target="_blank" style="color: inherit; text-decoration: none;"><i class="fas fa-map-marker-alt"></i> ${ayarlar.iletisim.adres}</a>`;

            // 0.4 İletişim Sayfası Verileri
            const pageAdres = document.getElementById('pageAdres');
            const pageTelefon = document.getElementById('pageTelefon');
            const pageEmail = document.getElementById('pageEmail');
            const pageSaatler = document.getElementById('pageSaatler');
            const googleMapFrame = document.getElementById('googleMapFrame');

            if (pageAdres) {
                pageAdres.innerText = ayarlar.iletisim.adres;
                pageTelefon.innerHTML = `<a href="tel:${ayarlar.iletisim.telefon}" style="color: inherit;">${ayarlar.iletisim.telefon}</a>`;
                pageEmail.innerHTML = `<a href="mailto:${ayarlar.iletisim.email}" style="color: inherit;">${ayarlar.iletisim.email}</a>`;
                pageSaatler.innerHTML = `Hafta İçi: ${ayarlar.calismaSaatleri.haftaici}<br>Cumartesi: ${ayarlar.calismaSaatleri.cumartesi}<br>Pazar: ${ayarlar.calismaSaatleri.pazar}`;
                
                // Harita
                if (googleMapFrame && ayarlar.haritaEmbed) {
                    let embedUrl = ayarlar.haritaEmbed;
                    // Eğer yanlışlıkla iframe kodu olarak kaydedildiyse düzelt (Fallback)
                    if (embedUrl.includes('<iframe')) {
                        const match = embedUrl.match(/src=["']([^"']+)["']/);
                        if (match) embedUrl = match[1];
                    }
                    googleMapFrame.src = embedUrl;
                }
            }

            // 1. Footer Bilgileri
            const footerIletisim = document.getElementById('footerIletisim');
            if (footerIletisim) {
                // İletişim Kısmı
                footerIletisim.innerHTML = `
                    <li><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ayarlar.iletisim.adres)}" target="_blank">📍 ${ayarlar.iletisim.adres}</a></li>
                    <li><a href="tel:${ayarlar.iletisim.telefon}">📞 ${ayarlar.iletisim.telefon}</a></li>
                    <li><a href="mailto:${ayarlar.iletisim.email}">✉️ ${ayarlar.iletisim.email}</a></li>
                `;
            }
            // Çalışma Saatleri
            const footerSaatler = document.getElementById('footerSaatler');
            if (footerSaatler) {
                footerSaatler.innerHTML = `
                    <h4>Çalışma Saatleri</h4>
                    <p>Pzt - Cuma: ${ayarlar.calismaSaatleri.haftaici}</p>
                    <p>Cumartesi: ${ayarlar.calismaSaatleri.cumartesi}</p>
                    <p>Pazar: ${ayarlar.calismaSaatleri.pazar}</p>
                `;
            }

            // 1.5 Sosyal Medya Linkleri
            const socialLinks = document.querySelector('.social-links');
            if (socialLinks && ayarlar.sosyalMedya) {
                const sm = ayarlar.sosyalMedya;
                let html = '';
                if (sm.facebook && sm.facebook !== '#') html += `<a href="${sm.facebook}" target="_blank"><i class="fab fa-facebook-f"></i></a>`;
                if (sm.twitter && sm.twitter !== '#') html += `<a href="${sm.twitter}" target="_blank"><i class="fab fa-twitter"></i></a>`;
                if (sm.instagram && sm.instagram !== '#') html += `<a href="${sm.instagram}" target="_blank"><i class="fab fa-instagram"></i></a>`;
                if (sm.linkedin && sm.linkedin !== '#') html += `<a href="${sm.linkedin}" target="_blank"><i class="fab fa-linkedin-in"></i></a>`;
                socialLinks.innerHTML = html;
            }

            // 1.6 Header Sosyal Medya Linkleri
            const headerSocials = document.getElementById('headerSocials');
            if (headerSocials && ayarlar.sosyalMedya) {
                const sm = ayarlar.sosyalMedya;
                let html = '';
                if (sm.facebook && sm.facebook !== '#') html += `<a href="${sm.facebook}" target="_blank"><i class="fab fa-facebook-f"></i></a>`;
                if (sm.twitter && sm.twitter !== '#') html += `<a href="${sm.twitter}" target="_blank"><i class="fab fa-twitter"></i></a>`;
                if (sm.instagram && sm.instagram !== '#') html += `<a href="${sm.instagram}" target="_blank"><i class="fab fa-instagram"></i></a>`;
                if (sm.linkedin && sm.linkedin !== '#') html += `<a href="${sm.linkedin}" target="_blank"><i class="fab fa-linkedin-in"></i></a>`;
                headerSocials.innerHTML = html;
            }

            // 2. Hizmetler Bölümü
            const servicesContainer = document.getElementById('servicesContainer');
            if (servicesContainer && ayarlar.hizmetler.length > 0) {
                // Mevcut (statik) kartları temizle
                const existingCards = servicesContainer.querySelectorAll('.service-card');
                existingCards.forEach(card => card.remove());
                
                ayarlar.hizmetler.forEach((hizmet, index) => {
                    // Modal verisini hazırla
                    dynamicServiceDetails[hizmet.key] = {
                        title: hizmet.baslik,
                        content: hizmet.detay
                    };

                    // Kartı oluştur
                    const card = document.createElement('div');
                    card.className = 'service-card';
                    card.setAttribute('data-key', hizmet.key);
                    // Kademeli animasyon için gecikme ekle
                    card.style.setProperty('--delay', `${index * 0.15}s`);

                    card.innerHTML = `
                        <div class="card-content">
                            <div class="icon"><i class="${hizmet.ikon}"></i></div>
                            <h3>${hizmet.baslik}</h3>
                            <p>${hizmet.ozet}</p>
                        </div>
                    `;
                    servicesContainer.appendChild(card);
                });

                // Animasyonu tetikle
                setTimeout(() => {
                    servicesContainer.classList.add('loaded');
                    const allCards = servicesContainer.querySelectorAll('.service-card');
                    const angleStep = 360 / allCards.length;
                    const radius = 320; // Dairenin yarıçapı (px)

                    allCards.forEach((card, index) => {
                        const angle = index * angleStep;
                        // Kartı dairesel yörüngeye yerleştir ve kendi ekseninde düzelt
                        card.style.transform = `rotate(${angle}deg) translateX(${radius}px) rotate(-${angle}deg)`;
                    });
                }, 100);

                // Tıklama olaylarını yeniden bağla
                attachServiceClickEvents();
            }

            // 3. Randevu Formu Hizmet Seçenekleri
            const hizmetSelect = document.getElementById('hizmetTuru');
            if (hizmetSelect && ayarlar.hizmetler.length > 0) {
                hizmetSelect.innerHTML = '<option value="">Lütfen seçin...</option>';
                
                ayarlar.hizmetler.forEach(hizmet => {
                    const option = document.createElement('option');
                    option.value = hizmet.baslik;
                    option.textContent = hizmet.baslik;
                    hizmetSelect.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Site ayarları yüklenemedi:', error);
        }
    }

    siteAyarlariniGetir();

    // --- 1. BLOG YAZILARINI VERİTABANINDAN ÇEKME ---
    const blogKapsayici = document.getElementById('blogKapsayici');
    let allBlogs = [];

    async function bloglariGetir() {
        if (!blogKapsayici) return; // Eğer sayfada blog alanı yoksa (örn: iletişim sayfası) dur.

        try {
            // Backend'den blogları iste
            // Önbellek sorununu önlemek için timestamp ekliyoruz
            const response = await fetch(`${API_URL}/blog?_t=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`Sunucu Hatası: ${response.status}`);
            }

            const sonuc = await response.json();
            const bloglar = sonuc.veri;
            allBlogs = bloglar; // Modal için tüm veriyi sakla

            // Kapsayıcıyı temizle
            blogKapsayici.innerHTML = '';

            if (!bloglar || bloglar.length === 0) {
                blogKapsayici.innerHTML = '<p style="text-align: center; width: 100%;">Henüz paylaşılmış bir blog yazısı bulunamadı.</p>';
                return;
            }

            // Her blog yazısı için bir kart oluştur
            bloglar.forEach(yazi => {
                const kart = document.createElement('div');
                kart.className = 'blog-card';

                // Karta tıklama olayı ekle
            kart.addEventListener('click', () => openBlogModal(yazi.id));

                kart.innerHTML = `
                    <img src="${yazi.gorselUrl || 'https://via.placeholder.com/400x200'}" class="blog-img" alt="${yazi.baslik}">
                    <div class="blog-body">
                        <h3>${yazi.baslik}</h3>
                        <p>${yazi.icerik.substring(0, 120)}...</p>
                        <div class="blog-footer">
                            <span>✍️ ${yazi.yazar}</span>
                            <span>📅 ${new Date(yazi.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                    </div>
                `;
                blogKapsayici.appendChild(kart);
            });

        } catch (error) {
            console.error('Blog Getirme Hatası:', error);
            blogKapsayici.innerHTML = `
                <div style="text-align: center; width: 100%; color: #721c24; background: #f8d7da; padding: 20px; border-radius: 8px;">
                    <p><strong>Bloglar şu an yüklenemiyor.</strong></p>
                    <small>Hata Detayı: Sunucuya (Port: 5501) ulaşılamadı. Lütfen Backend terminalini kontrol edin.</small>
                </div>`;
        }
    }

    // Sayfa açıldığında blogları çalıştır
    bloglariGetir();

    // --- 1.1 BLOG SLIDER KONTROLLERİ ---
    const prevBtn = document.getElementById('prevBlogBtn');
    const nextBtn = document.getElementById('nextBlogBtn');

    if (prevBtn && nextBtn && blogKapsayici) {
        prevBtn.addEventListener('click', () => {
            blogKapsayici.scrollBy({ left: -320, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            blogKapsayici.scrollBy({ left: 320, behavior: 'smooth' });
        });
    }

    // --- 1.2 ÖZEL CAPTCHA MANTIĞI ---
    let captchaDogruCevap = 0;

    function captchaOlustur() {
        const sayi1 = Math.floor(Math.random() * 10) + 1; // 1-10 arası
        const sayi2 = Math.floor(Math.random() * 10) + 1; // 1-10 arası
        captchaDogruCevap = sayi1 + sayi2;
        
        const label = document.getElementById('captchaLabel');
        if (label) label.textContent = `Güvenlik Sorusu: ${sayi1} + ${sayi2} = ?`;
        const input = document.getElementById('captchaInput');
        if (input) input.value = '';
    }

    // Sayfa yüklenince ve form gönderildikten sonra yeni soru sor
    captchaOlustur();

    // --- 2. RANDEVU FORMU GÖNDERME İŞLEMİ ---
    const form = document.getElementById('randevuFormu');
    const mesajKutusu = document.getElementById('formMesaj');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Sayfanın yenilenmesini durdur

            // Captcha Kontrolü
            const kullaniciCevabi = parseInt(document.getElementById('captchaInput').value);
            if (kullaniciCevabi !== captchaDogruCevap) {
                showToast('Güvenlik sorusu yanlış! Lütfen tekrar deneyin.', 'error');
                captchaOlustur(); // Yanlışsa yeni soru sor
                return;
            }

            // TC Kimlik Kontrolü
            const tcNo = document.getElementById('tcKimlik').value;
            if (!tcKimlikDogrula(tcNo)) {
                showToast('Geçersiz TC Kimlik Numarası! Lütfen kontrol ediniz.', 'error');
                return;
            }

            // E-posta Kontrolü
            const email = document.getElementById('email').value;
            if (!emailDogrula(email)) {
                showToast('Geçersiz E-posta Adresi! Lütfen kontrol ediniz.', 'error');
                return;
            }

            // Cinsiyet ve doğum tarihi zorunlu
            const cinsiyet = document.getElementById('cinsiyet').value;
            const dogumTarihi = document.getElementById('dogumTarihi').value;
            if (!cinsiyet) {
                showToast('Lütfen cinsiyetinizi seçin.', 'error');
                return;
            }
            if (!dogumTarihi) {
                showToast('Lütfen doğum tarihinizi girin.', 'error');
                return;
            }

            // Form verilerini topla
            const randevuVerisi = {
                hastaId: document.getElementById('hastaId').value, // Varsa hasta ID'si
                adSoyad: document.getElementById('adSoyad').value,
                telefon: document.getElementById('telefon').value.replace(/\D/g, ''), // Formatı temizle
                email: document.getElementById('email').value,
                tcKimlik: document.getElementById('tcKimlik').value,
                cinsiyet: document.getElementById('cinsiyet').value,
                dogumTarihi: document.getElementById('dogumTarihi').value,
                hizmetTuru: document.getElementById('hizmetTuru').value,
                tarih: document.getElementById('tarih').value,
                mesaj: document.getElementById('mesaj').value
            };

            try {
                const response = await fetch(`${API_URL}/randevular`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(randevuVerisi)
                });

                const sonuc = await response.json();
                console.log('Randevu oluşturma API yanıtı:', sonuc);

                if (response.ok) {
                    // Başarı Durumu
                    mesajKutusu.style.display = 'block';
                    mesajKutusu.style.backgroundColor = '#d4edda';
                    mesajKutusu.style.color = '#155724';
                    mesajKutusu.textContent = 'Randevu talebiniz başarıyla alındı! Sizinle iletişime geçeceğiz.';
                    showToast('Randevu talebiniz başarıyla alındı!', 'success');

                    // Konfeti Animasyonu
                    if (window.confetti) {
                        confetti({
                            particleCount: 150,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: ['#0f3460', '#e94560', '#ffffff'] // Site renkleri
                        });
                    }

                    form.reset(); // Formu boşalt
                    captchaOlustur(); // Yeni captcha oluştur
                } else {
                    throw new Error(sonuc.mesaj || 'Randevu gönderilemedi.');
                }

            } catch (hata) {
                console.error('Randevu Gönderme Hatası:', hata);
                mesajKutusu.style.display = 'block';
                mesajKutusu.style.backgroundColor = '#f8d7da';
                mesajKutusu.style.color = '#721c24';
                mesajKutusu.textContent = 'Bağlantı Hatası: Sunucu kapalı veya adres (5501) yanlış.';
                showToast('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'error');
            }
        });
    }

    // --- 3. KVKK VE ÇEREZ YÖNETİMİ ---
    initKVKK();

    // --- 4. MOBİL MENÜ (HAMBURGER) ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links li');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('nav-active');
            
            // Link animasyonları
            links.forEach((link, index) => {
                if (link.style.animation) {
                    link.style.animation = '';
                } else {
                    link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
                }
            });

            // Hamburger animasyonu (X şeklini alması için)
            hamburger.classList.toggle('toggle');
        });
    }

    // --- 5. NAVBAR SCROLL EFEKTİ ---
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            document.body.classList.add('scrolled');
            if(scrollTopBtn) scrollTopBtn.classList.add('visible');
        } else {
            document.body.classList.remove('scrolled');
            if(scrollTopBtn) scrollTopBtn.classList.remove('visible');
        }
    });
    
    if(scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- 6. HİZMETLER MODAL İŞLEMLERİ ---
    const serviceModal = document.getElementById('serviceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const closeServiceModal = document.querySelector('.close-service-modal');

    // Kartlara Tıklama Olayı (Fonksiyon haline getirildi çünkü dinamik yükleniyor)
    function attachServiceClickEvents() {
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach(card => {
            card.addEventListener('click', () => {
                const key = card.getAttribute('data-key');
                // Önce dinamik veriye bak, yoksa (henüz yüklenmediyse) boş dön
                const data = dynamicServiceDetails[key];
                
                if (data) {
                    modalTitle.innerText = data.title;
                    modalBody.innerHTML = data.content;
                    serviceModal.style.display = 'flex';
                }
            });
        });
    }
    
    // İlk yüklemede mevcut kartlar için çalıştır (Fallback)
    attachServiceClickEvents();

    // Modalı Kapatma
    if (closeServiceModal) {
        closeServiceModal.addEventListener('click', () => serviceModal.style.display = 'none');
    }
    window.addEventListener('click', (e) => {
        if (e.target == serviceModal) serviceModal.style.display = 'none';
    });

    // --- 6.1 BLOG MODAL İŞLEMLERİ ---
    const blogModal = document.getElementById('blogModal');
    const closeBlogModal = document.getElementById('closeBlogModal');

    function openBlogModal(id) {
        const blog = allBlogs.find(b => String(b._id || b.id) === String(id));
        if (!blog) return;

        document.getElementById('blogModalImage').src = blog.gorselUrl;
        document.getElementById('blogModalImage').alt = blog.baslik;
        document.getElementById('blogModalTitle').innerText = blog.baslik;
        document.getElementById('blogModalMeta').innerHTML = `
            <span>✍️ ${blog.yazar}</span>
            <span style="margin-left: 20px;">📅 ${new Date(blog.createdAt).toLocaleDateString('tr-TR')}</span>
        `;
        // İçerikteki satır sonlarını HTML <br> etiketine çevirerek göster
        document.getElementById('blogModalBody').innerHTML = blog.icerik.replace(/\n/g, '<br>');

        blogModal.style.display = 'flex';
    }

    if (closeBlogModal) {
        closeBlogModal.addEventListener('click', () => blogModal.style.display = 'none');
    }
    window.addEventListener('click', (e) => {
        if (e.target == blogModal) blogModal.style.display = 'none';
    });

    // --- 7. PRELOADER ---
    // Sayfa tamamen yüklendiğinde (resimler dahil) preloader'ı kaldır
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
        }
    });

    // --- 8. MODAL & SMOOTH SCROLL ---
    const randevuModal = document.getElementById('randevuModal');
    const closeRandevuModal = document.getElementById('closeRandevuModal');

    // YENİ: Sayfa yüklendiğinde URL'de #randevu varsa modalı aç (Dış sayfalardan gelen linkler için)
    if (window.location.hash === '#randevu' && randevuModal) {
        randevuModal.style.display = 'flex';
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');

            if (targetId === '#randevu') {
                randevuModal.style.display = 'flex';
            } else {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const headerOffset = 85;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.scrollY - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                }
            }

            // Mobil menü açıksa kapat
            if (navLinks && navLinks.classList.contains('nav-active')) {
                hamburger.click();
            }
        });
    });

    // Randevu Modalı Kapatma
    if (closeRandevuModal) {
        closeRandevuModal.addEventListener('click', () => randevuModal.style.display = 'none');
    }
    window.addEventListener('click', (e) => {
        if (e.target == randevuModal) randevuModal.style.display = 'none';
    });

    // --- 9. RANDEVU ADIMLARI (YENİ) ---
    const step1 = document.getElementById('randevuStep1');
    const step2 = document.getElementById('randevuStep2');
    const formArea = document.getElementById('randevuFormu');
    const kisiselBilgiler = document.getElementById('kisiselBilgiler');

    // Adım Değiştirme Fonksiyonu (Global erişim için window'a atadık)
    window.randevuAdimGec = (adim) => {
        step1.style.display = 'none';
        step2.style.display = 'none';
        formArea.style.display = 'none';
        document.getElementById('sorguHata').style.display = 'none';
        document.getElementById('formMesaj').style.display = 'none';

        let activeStep;
        if (adim === 1) activeStep = step1;
        if (adim === 2) activeStep = step2;
        if (adim === 3) activeStep = formArea;

        if (activeStep) {
            // Animasyonu sıfırla ve yeniden başlat
            activeStep.style.animation = 'none';
            activeStep.offsetHeight; /* trigger reflow */
            activeStep.style.animation = 'slideInRight 0.4s ease forwards';
            
            if (adim === 3) {
                activeStep.style.display = 'grid';
            } else {
                activeStep.style.display = 'block';
            }
        }
    };

    // Butonlar
    document.getElementById('btnIlkRandevu').addEventListener('click', () => {
        // Formu temizle ve kişisel bilgileri göster
        form.reset();
        document.getElementById('hastaId').value = '';
        kisiselBilgiler.style.display = 'contents'; // Grid yapısını korumak için contents
        randevuAdimGec(3);
        captchaOlustur();
    });

    document.getElementById('btnKayitliHasta').addEventListener('click', () => {
        randevuAdimGec(2);
    });

    document.getElementById('btnSorgula').addEventListener('click', async () => {
        const tcInput = document.getElementById('sorguTc').value;
        const tc = tcInput.replace(/\D/g, ''); // Formatı temizle
        const hata = document.getElementById('sorguHata');
        
        if (!tc || tc.length !== 11) { hata.innerText = 'Lütfen 11 haneli TC Kimlik numaranızı girin.'; hata.style.display = 'block'; return; }

        try {
            const response = await fetch(`${API_URL}/hastalar/bul?tcKimlik=${tc}`);
            const hasta = await response.json();

            if (response.ok) {
                // Hasta bulundu, formu doldur (Sequelize id)
                document.getElementById('hastaId').value = hasta.id;
                document.getElementById('adSoyad').value = hasta.adSoyad;
                document.getElementById('telefon').value = formatla(hasta.telefon, 'telefon'); // Formatlı yaz
                document.getElementById('email').value = hasta.email || '';
                document.getElementById('tcKimlik').value = hasta.tcKimlik || '';
                document.getElementById('cinsiyet').value = hasta.cinsiyet || '';
                if(hasta.dogumTarihi) document.getElementById('dogumTarihi').value = new Date(hasta.dogumTarihi).toISOString().split('T')[0];

                // Kişisel bilgileri gizle (Zaten kayıtlı)
                kisiselBilgiler.style.display = 'none';
                randevuAdimGec(3);
                captchaOlustur();
            } else {
                hata.innerText = 'Kayıt bulunamadı. Lütfen "İlk Kez Randevu" seçeneğini kullanın.';
                hata.style.display = 'block';
            }
        } catch (err) { hata.innerText = 'Sorgulama hatası.'; hata.style.display = 'block'; }
    });

    // --- 11. YASAL METİN MODALI ---
    const yasalModal = document.getElementById('yasalModal');
    const closeYasalModal = document.getElementById('closeYasalModal');

    window.yasalMetinGoster = (tip) => {
        const title = document.getElementById('yasalModalTitle');
        const body = document.getElementById('yasalModalBody');
        
        if (tip === 'gizlilik') { title.innerText = 'Gizlilik Politikası'; body.innerText = yasalMetinlerData.gizlilikPolitikasi || 'İçerik bulunamadı.'; }
        else if (tip === 'sartlar') { title.innerText = 'Kullanım Şartları'; body.innerText = yasalMetinlerData.kullanimSartlari || 'İçerik bulunamadı.'; }
        else if (tip === 'kvkk') { title.innerText = 'KVKK Aydınlatma Metni'; body.innerText = yasalMetinlerData.kvkkMetni || 'İçerik bulunamadı.'; }

        yasalModal.style.display = 'flex';
    };

    if (closeYasalModal) {
        closeYasalModal.addEventListener('click', () => yasalModal.style.display = 'none');
    }
    window.addEventListener('click', (e) => {
        if (e.target == yasalModal) yasalModal.style.display = 'none';
    });

    // --- 12. SAYFA GEÇİŞ EFEKTİ (SMOOTH TRANSITION) ---
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const target = this.getAttribute('target');

            // 1. Eğer link boşsa, # ile başlıyorsa (sayfa içi) veya yeni sekme ise (target="_blank") engelleme.
            if (!href || href.startsWith('#') || target === '_blank' || href.startsWith('mailto:') || href.startsWith('tel:')) {
                return;
            }

            // 2. Diğer tüm iç linkler için geçiş efekti uygula
            e.preventDefault();
            document.body.classList.add('fade-out');

            // CSS transition süresi (0.3s) kadar bekle sonra git
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });
});

function initKVKK() {
    // 1. CSS Dosyasını Otomatik Ekle (HTML'e elle eklememek için)
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'kvkk.css';
    document.head.appendChild(link);

    // 2. Çerez Kabul Edilmiş mi Kontrol Et
    if (localStorage.getItem('cookieConsent') === 'true') {
        return; // Zaten kabul edilmişse hiçbir şey yapma
    }

    // 3. HTML Yapısını Oluştur
    const body = document.body;

    // Çerez Banner HTML
    const bannerDiv = document.createElement('div');
    bannerDiv.className = 'cookie-banner';
    bannerDiv.innerHTML = `
        <p>
            Sizlere daha iyi hizmet sunabilmek, site trafiğini analiz etmek ve kişiselleştirilmiş içerik sunmak amacıyla 
            çerezler (cookies) kullanmaktayız. Sitemizi kullanmaya devam ederek çerez kullanımını kabul etmiş sayılırsınız.
        </p>
        <div class="cookie-btn-group">
            <button id="openKvkk" class="btn-kvkk-link">KVKK Metni</button>
            <button id="acceptCookie" class="btn-cookie-accept">Kabul Et</button>
        </div>
    `;

    // KVKK Modal HTML
    const modalDiv = document.createElement('div');
    modalDiv.id = 'kvkkModal';
    modalDiv.className = 'kvkk-modal';
    modalDiv.innerHTML = `
        <div class="kvkk-content">
            <span id="closeKvkk" class="close-kvkk">&times;</span>
            <h2>Kişisel Verilerin Korunması (KVKK)</h2>
            <br>
            <p><strong>Rana Klinik</strong> olarak kişisel verilerinizin güvenliği hususuna azami hassasiyet göstermekteyiz.</p>
            <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, kişisel verileriniz; veri sorumlusu olarak kliniğimiz tarafından aşağıda açıklanan kapsamda işlenebilecektir.</p>
            <br>
            <h4>1. Kişisel Verilerin Toplanması</h4>
            <p>Randevu oluşturma, iletişim formları ve site ziyareti sırasında adınız, telefon numaranız ve IP adresiniz gibi veriler toplanmaktadır.</p>
            <br>
            <h4>2. Verilerin İşlenme Amacı</h4>
            <p>Toplanan verileriniz, randevu süreçlerinin yürütülmesi, sizinle iletişim kurulması ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmektedir.</p>
            <br>
            <p>Detaylı bilgi için kliniğimizle iletişime geçebilirsiniz.</p>
        </div>
    `;

    body.appendChild(bannerDiv);
    body.appendChild(modalDiv);

    // 4. Olay Dinleyicileri (Event Listeners)
    
    // Kabul Et Butonu
    document.getElementById('acceptCookie').addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'true');
        bannerDiv.style.display = 'none';
    });

    // KVKK Aç
    document.getElementById('openKvkk').addEventListener('click', () => {
        modalDiv.style.display = 'flex';
    });

    // KVKK Kapat
    document.getElementById('closeKvkk').addEventListener('click', () => {
        modalDiv.style.display = 'none';
    });

    // Modal dışına tıklayınca kapat
    window.addEventListener('click', (e) => {
        if (e.target == modalDiv) {
            modalDiv.style.display = 'none';
        }
    });
}
