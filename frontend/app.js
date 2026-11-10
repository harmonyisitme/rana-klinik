import { API_URL, showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- SİTE AYARLARI ---
    let dynamicServiceDetails = {};
    let yasalMetinlerData = {};

    async function siteAyarlariniGetir() {
        try {
            const response = await fetch(`${API_URL}/site-ayarlari?_t=${Date.now()}`);
            if (!response.ok) return;
            const ayarlar = await response.json();
            yasalMetinlerData = ayarlar.yasalMetinler || {};

            const logoSrc = (ayarlar.logo && ayarlar.logo.trim() !== '') ? ayarlar.logo : '/logo.png';
            document.querySelectorAll('.logo, .footer-logo').forEach(el => {
                el.innerHTML = `<img src="${logoSrc}" alt="Rana Klinik" style="height: 60px; vertical-align: middle;">`;
            });

            if (ayarlar.anaRenk) document.documentElement.style.setProperty('--primary-color', ayarlar.anaRenk);
            if (ayarlar.ikincilRenk) document.documentElement.style.setProperty('--accent-color', ayarlar.ikincilRenk);

            // Hizmetler
            const servicesContainer = document.getElementById('servicesContainer');
            if (servicesContainer && ayarlar.hizmetler.length > 0) {
                servicesContainer.querySelectorAll('.service-card').forEach(card => card.remove());
                ayarlar.hizmetler.forEach((hizmet, index) => {
                    dynamicServiceDetails[hizmet.key] = { title: hizmet.baslik, content: hizmet.detay };
                    const card = document.createElement('div');
                    card.className = 'service-card';
                    card.setAttribute('data-key', hizmet.key);
                    card.innerHTML = `<div class="card-content"><div class="icon"><i class="${hizmet.ikon}"></i></div><h3>${hizmet.baslik}</h3><p>${hizmet.ozet}</p></div>`;
                    servicesContainer.appendChild(card);
                });
                attachServiceClickEvents();
            }
        } catch (error) {
            console.error('Site ayarları yüklenemedi:', error);
        }
    }

    siteAyarlariniGetir();

    // --- BLOG ---
    const blogKapsayici = document.getElementById('blogKapsayici');
    let allBlogs = [];

    async function bloglariGetir() {
        if (!blogKapsayici) return;
        try {
            const response = await fetch(`${API_URL}/blog?_t=${Date.now()}`);
            const sonuc = await response.json();
            allBlogs = sonuc.veri || [];
            blogKapsayici.innerHTML = '';
            
            if (allBlogs.length === 0) {
                blogKapsayici.innerHTML = '<p style="text-align: center; width: 100%;">Henüz blog yazısı yok.</p>';
                return;
            }

            allBlogs.forEach(yazi => {
                const kart = document.createElement('div');
                kart.className = 'blog-card';
                kart.addEventListener('click', () => openBlogModal(yazi.id || yazi._id));
                kart.innerHTML = `<img src="${yazi.gorselUrl || ''}" class="blog-img"><div class="blog-body"><h3>${yazi.baslik}</h3><p>${yazi.icerik.substring(0, 100)}...</p></div>`;
                blogKapsayici.appendChild(kart);
            });
        } catch (err) {
            console.error('Bloglar yüklenemedi', err);
        }
    }
    bloglariGetir();

    // --- MOBİL MENÜ ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('nav-active');
            hamburger.classList.toggle('toggle');
        });
    }

    // --- HİZMET MODAL ---
    const serviceModal = document.getElementById('serviceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const closeServiceModal = document.querySelector('.close-service-modal');

    function attachServiceClickEvents() {
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', () => {
                const key = card.getAttribute('data-key');
                const data = dynamicServiceDetails[key];
                if (data && serviceModal) {
                    modalTitle.innerText = data.title;
                    modalBody.innerHTML = data.content;
                    serviceModal.style.display = 'flex';
                }
            });
        });
    }
    if (closeServiceModal && serviceModal) {
        closeServiceModal.addEventListener('click', () => serviceModal.style.display = 'none');
    }

    // --- BLOG MODAL ---
    const blogModal = document.getElementById('blogModal');
    const closeBlogModal = document.getElementById('closeBlogModal');
    function openBlogModal(id) {
        const blog = allBlogs.find(b => String(b._id || b.id) === String(id));
        if (!blog || !blogModal) return;
        document.getElementById('blogModalImage').src = blog.gorselUrl;
        document.getElementById('blogModalTitle').innerText = blog.baslik;
        document.getElementById('blogModalBody').innerHTML = blog.icerik.replace(/\n/g, '<br>');
        blogModal.style.display = 'flex';
    }
    if (closeBlogModal && blogModal) {
        closeBlogModal.addEventListener('click', () => blogModal.style.display = 'none');
    }

    // --- KESİN WHATSAPP YÖNLENDİRME (TÜM RANDEVU BUTONLARI İÇİN) ---
    document.querySelectorAll('a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            const text = this.textContent.toLowerCase();

            // Eğer buton randevu ile ilgiliyse ya da #randevu hedefini içeriyorsa
            if (href === '#randevu' || text.includes('randevu') || text.includes('hemen randevu')) {
                e.preventDefault();
                window.location.href = 'https://wa.me/905519849333?text=Merhaba,%20randevu%20almak%20istiyorum.';
                return;
            }
        });
    });

    // Preloader
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
        }
    });
});
