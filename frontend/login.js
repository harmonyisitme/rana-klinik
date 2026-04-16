document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const kullaniciAdi = document.getElementById('kullanici').value;
    const sifre = document.getElementById('sifre').value;
    const hataMesaji = document.getElementById('hataMesaji');
    const btn = document.getElementById('loginBtn');

    btn.disabled = true; btn.innerText = 'Giriş Yapılıyor...';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kullaniciAdi, sifre })
        });

        const veri = await response.json();

        if (response.ok) {
            // Şifre doğruysa, size verilen anahtarı (token) tarayıcının hafızasına kaydet
            localStorage.setItem('ranaToken', veri.token);
            // Yönetim paneline yönlendir
            window.location.href = 'admin.html';
        } else {
            hataMesaji.textContent = veri.mesaj;
            hataMesaji.style.display = 'block';
        }
    } catch (hata) {
        hataMesaji.textContent = 'Sunucuya bağlanılamadı!';
        hataMesaji.style.display = 'block';
    } finally {
        btn.disabled = false; btn.innerText = 'Giriş Yap';
    }
});
