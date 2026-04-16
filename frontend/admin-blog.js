import { API_URL, showToast, checkAuth } from './utils.js';

// Güvenlik Kontrolü
checkAuth();

let duzenlenecekId = null; // Düzenleme modunda olup olmadığımızı takip eder
let tumBloglar = []; // Blog verilerini tutar
let formDegisti = false; // Değişiklik takibi
let taslakModu = false; // Taslak mı yayın mı kontrolü

// Sayfa Yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    listeAlaniOlustur(); // Listeyi göstereceğimiz HTML alanını yarat
    bloglariListele();   // Verileri çek

    // Form değişikliklerini izle
    document.getElementById('blogFormu').addEventListener('input', () => {
        formDegisti = true;
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

// Buton Dinleyicileri
document.getElementById('btnTaslak').addEventListener('click', () => {
    taslakModu = true;
    // Form submit olayını manuel tetikle
    document.getElementById('blogFormu').dispatchEvent(new Event('submit'));
});

document.getElementById('btnYayinla').addEventListener('click', () => {
    taslakModu = false;
});

// Vazgeç Butonu
document.getElementById('btnVazgec').addEventListener('click', () => {
    if (formDegisti && !confirm('Değişiklikleriniz kaybolacak. Düzenlemeyi iptal etmek istiyor musunuz?')) {
        return;
    }
    duzenlemeModunuKapat();
});

function duzenlemeModunuKapat() {
    document.getElementById('blogFormu').reset();
    document.getElementById('mevcutGorselUrl').value = '';
    document.getElementById('gorselOnizleme').style.display = 'none';
    duzenlenecekId = null;
    formDegisti = false;
    document.getElementById('btnYayinla').innerText = 'Makaleyi Yayınla';
    document.getElementById('btnTaslak').innerText = 'Taslak Olarak Kaydet';
    document.getElementById('btnVazgec').style.display = 'none';
    document.getElementById('formBaslik').innerText = 'Yeni Blog Yazısı Ekle';
    document.getElementById('mesajKutusu').style.display = 'none';
}

// Sayfadan ayrılmaya çalışırsa uyarı ver
window.addEventListener('beforeunload', (e) => {
    if (formDegisti) {
        e.preventDefault();
        e.returnValue = '';
    }
});

document.getElementById('blogFormu').addEventListener('submit', async (e) => {
    e.preventDefault();

    const activeBtn = taslakModu ? document.getElementById('btnTaslak') : document.getElementById('btnYayinla');
    const orjinalBtnMetni = activeBtn.innerText;
    const mesajKutusu = document.getElementById('mesajKutusu');

    // Dosya Yükleme İşlemi
    let gorselUrl = document.getElementById('mevcutGorselUrl').value; // Varsayılan olarak mevcut olanı al
    const dosyaInput = document.getElementById('gorselDosya');

    if (dosyaInput.files.length > 0) {
        const formData = new FormData();
        formData.append('dosya', dosyaInput.files[0]);

        try {
            const uploadResponse = await fetch('/api/upload', { method: 'POST', headers: { 'x-auth-token': localStorage.getItem('ranaToken') }, body: formData });
            
            if (uploadResponse.status === 401 || uploadResponse.status === 403) {
                showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
                localStorage.removeItem('ranaToken');
                setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                throw new Error('Yetkilendirme hatası, giriş sayfasına yönlendiriliyor.'); // Hata fırlat
            }

            if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                gorselUrl = uploadResult.url;
            } else {
                throw new Error(`Dosya yükleme başarısız: ${uploadResponse.statusText}`);
            }
        } catch (err) {
            console.error('Dosya yükleme hatası:', err);
        }
    }
    
    const blogVerisi = {
        baslik: document.getElementById('baslik').value,
        gorselUrl: gorselUrl || 'https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        yazar: document.getElementById('yazar').value,
        icerik: document.getElementById('icerik').value,
        yayinlandiMi: !taslakModu // Taslak ise false, yayınla ise true
    };

    // Butonu kilitle ve yükleniyor yap
    activeBtn.disabled = true;
    activeBtn.innerText = 'İşleniyor...';

    try {
        let url = '/api/blog';
        let method = 'POST';

        // Eğer düzenleme modundaysak URL ve Method değişir
        if (duzenlenecekId) {
            url = `/api/blog/${duzenlenecekId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('ranaToken') },
            body: JSON.stringify(blogVerisi)
        });

        if (response.status === 401 || response.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return; // Önemli: Fonksiyonu burada sonlandır
        }

        const veri = await response.json();

        if (response.ok) {
            duzenlemeModunuKapat(); // Formu ve UI'ı sıfırla
            mesajKutusu.style.display = 'block';
            mesajKutusu.style.backgroundColor = '#d4edda';
            mesajKutusu.style.color = '#155724';
            mesajKutusu.textContent = veri.mesaj;
            bloglariListele(); // Listeyi güncelle
        } else {
            throw new Error(veri.mesaj);
        }
    } catch (hata) {
        mesajKutusu.style.display = 'block';
        mesajKutusu.style.backgroundColor = '#f8d7da';
        mesajKutusu.style.color = '#721c24';
        mesajKutusu.textContent = 'İşlem sırasında hata oluştu: ' + hata.message;
    } finally {
        // İşlem bitince butonu eski haline getir
        activeBtn.disabled = false;
        activeBtn.innerText = orjinalBtnMetni;
    }
});

// --- ÇIKIŞ YAP MODALI ---
const cikisModal = document.getElementById('cikisModal');
const btnLogout = document.getElementById('btnLogout');
const btnCikisOnay = document.getElementById('btnCikisOnay');
const btnCikisVazgec = document.getElementById('btnCikisVazgec');
const closeCikisModal = document.getElementById('closeCikisModal');

if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        if (formDegisti && !confirm('Kaydedilmemiş değişiklikleriniz var. Yine de çıkış yapmak istiyor musunuz?')) {
            return;
        }
        if (cikisModal) cikisModal.style.display = 'block';
    });
}
if (btnCikisOnay) {
    btnCikisOnay.addEventListener('click', () => {
        formDegisti = false;
        localStorage.removeItem('ranaToken');
        window.location.href = 'login.html';
    });
}
if (btnCikisVazgec) btnCikisVazgec.addEventListener('click', () => cikisModal.style.display = 'none');
if (closeCikisModal) closeCikisModal.addEventListener('click', () => cikisModal.style.display = 'none');

window.addEventListener('click', (e) => {
    if (e.target == cikisModal) cikisModal.style.display = 'none';
});

// --- YENİ EKLENEN FONKSİYONLAR ---

// 1. Blog Listesi İçin HTML Alanı Oluştur
function listeAlaniOlustur() {
    const mainContainer = document.querySelector('.admin-container');
    const listeDiv = document.createElement('div');
    listeDiv.id = 'adminBlogListesi';
    listeDiv.style.marginTop = '40px';
    listeDiv.innerHTML = `
        <h2 style="margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">Mevcut Blog Yazıları</h2>
        <div class="table-container">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8f9fa; text-align: left;">
                        <th style="padding: 12px;">Görsel</th>
                        <th style="padding: 12px;">Başlık</th>
                        <th style="padding: 12px;">Yazar</th>
                        <th style="padding: 12px;">Tarih</th>
                        <th style="padding: 12px;">Durum</th>
                        <th style="padding: 12px;">İşlemler</th>
                    </tr>
                </thead>
                <tbody id="blogTabloGovdesi"></tbody>
            </table>
        </div>
    `;
    mainContainer.appendChild(listeDiv);
}

// 2. Blogları Getir ve Listele
async function bloglariListele() {
    const tablo = document.getElementById('blogTabloGovdesi');
    tablo.innerHTML = '<tr><td colspan="5" style="padding:20px; text-align:center;">Yükleniyor...</td></tr>';

    try {
        const response = await fetch(`${API_URL}/blog?limit=100&admin=true&_t=${Date.now()}`, {
            headers: { 'x-auth-token': localStorage.getItem('ranaToken') }
        });

        if (response.status === 401 || response.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }
        if (!response.ok) {
            throw new Error(`Blog API hatası: ${response.status}`);
        }
        const sonuc = await response.json();
        tumBloglar = sonuc.veri;

        tablo.innerHTML = '';

        if (tumBloglar.length === 0) {
            tablo.innerHTML = '<tr><td colspan="5" style="padding:20px; text-align:center;">Henüz blog yazısı yok.</td></tr>';
            return;
        }

        tumBloglar.forEach(blog => {
            const tr = document.createElement('tr');
            
            // Durum etiketi
            const durumBadge = blog.yayinlandiMi 
                ? '<span class="status-badge" style="background:#d4edda; color:#155724;">Yayında</span>' 
                : '<span class="status-badge" style="background:#e2e3e5; color:#383d41;">Taslak</span>';

            tr.style.borderBottom = '1px solid #eee';
            tr.innerHTML = `
                <td style="padding: 12px;"><img src="${blog.gorselUrl}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
                <td style="padding: 12px;">${blog.baslik}</td>
                <td style="padding: 12px;">${blog.yazar}</td>
                <td style="padding: 12px;">${new Date(blog.createdAt).toLocaleDateString('tr-TR')}</td>
                <td style="padding: 12px;">${durumBadge}</td>
                <td style="padding: 12px; display: flex; gap: 5px; align-items: center;">
                    <button onclick="duzenleModunaGec('${blog.id}')" style="background: #ffc107; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✏️</button>
                    <button onclick="blogSil('${blog.id}')" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">🗑️</button>
                </td>
            `;
            tablo.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        tablo.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Veriler yüklenemedi.</td></tr>';
        showToast('Blog yazıları yüklenirken bir hata oluştu.', 'error');
    }
}

// 3. Silme Fonksiyonu
window.blogSil = async (id) => {
    if (!confirm('Bu blog yazısını silmek istediğinize emin misiniz?')) return;

    try {
        const response = await fetch(`/api/blog/${id}`, { method: 'DELETE', headers: { 'x-auth-token': localStorage.getItem('ranaToken') } });

        if (response.status === 401 || response.status === 403) {
            showToast('Oturumunuz sona erdi veya yetkiniz yok. Lütfen tekrar giriş yapın.', 'error');
            localStorage.removeItem('ranaToken');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }
        
        if (response.ok) {
            showToast('Blog yazısı başarıyla silindi.', 'success');
            bloglariListele(); // Listeyi yenile
        } else {
            const errorData = await response.json();
            showToast(`Silme işlemi başarısız: ${errorData.mesaj || 'Bilinmeyen bir hata oluştu.'}`, 'error');
        }
    } catch (error) {
        showToast('Bağlantı hatası: Blog yazısı silinemedi.', 'error');
    }
};

// 4. Düzenleme Moduna Geç
window.duzenleModunaGec = (id) => {
    const blog = tumBloglar.find(b => String(b.id) === String(id));
    if (!blog) return;

    // Formu doldur
    document.getElementById('baslik').value = blog.baslik;
    
    // Görsel işlemleri
    document.getElementById('mevcutGorselUrl').value = blog.gorselUrl;
    const onizleme = document.getElementById('gorselOnizleme');
    onizleme.style.display = 'block';
    onizleme.querySelector('img').src = blog.gorselUrl;

    document.getElementById('yazar').value = blog.yazar;
    document.getElementById('icerik').value = blog.icerik;

    formDegisti = false; // Programatik doldurma sonrası değişikliği sıfırla

    // Modu güncelle
    duzenlenecekId = id;
    
    // Buton metnini değiştir ve yukarı kaydır
    document.getElementById('btnYayinla').innerText = 'Güncellemeyi Kaydet';
    document.getElementById('btnTaslak').innerText = 'Taslak Olarak Güncelle';
    document.getElementById('btnVazgec').style.display = 'block';
    document.getElementById('formBaslik').innerText = 'Blog Yazısını Düzenle';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Kullanıcıya bilgi ver
    const mesajKutusu = document.getElementById('mesajKutusu');
    mesajKutusu.style.display = 'block';
    mesajKutusu.style.backgroundColor = '#fff3cd';
    mesajKutusu.style.color = '#856404';
    mesajKutusu.textContent = `"${blog.baslik}" yazısını düzenliyorsunuz.`;
};
