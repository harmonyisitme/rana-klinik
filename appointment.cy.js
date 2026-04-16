describe('Randevu Alma Akışı', () => {
  beforeEach(() => {
    // Ana sayfayı ziyaret et
    cy.visit('http://localhost:5501/');
    // Preloader'ın kaybolduğundan emin ol
    cy.get('#preloader', { timeout: 10000 }).should('not.be.visible');
    // Çerez onayını kabul et (varsa)
    cy.get('body').then(($body) => {
      if ($body.find('.cookie-banner').length) {
        cy.get('#acceptCookie').click();
      }
    });
  });

  it('yeni bir randevuyu başarıyla oluşturmalı', () => {
    // "Randevu Al" butonuna tıkla
    cy.get('a[href="#randevu"]').first().click();
    cy.get('#randevuModal').should('be.visible');

    // "İlk Kez Randevu Alıyorum" seçeneğini seç
    cy.get('#btnIlkRandevu').click();
    cy.get('#randevuFormu').should('be.visible');

    // Kişisel bilgileri doldur
    cy.get('#adSoyad').type('Cypress Test Hasta');
    cy.get('#telefon').type('5551112233');
    cy.get('#email').type('cypress@test.com');
    cy.get('#tcKimlik').type('11122233344'); // Geçerli bir TC
    cy.get('#cinsiyet').select('Erkek');
    cy.get('#dogumTarihi').type('1990-01-01');

    // Hizmet ve tarih seç
    cy.get('#hizmetTuru').select('İşitme Testi');
    // Gelecek bir tarih seç
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
    cy.get('#tarih').type(tomorrowFormatted);

    cy.get('#mesaj').type('Cypress otomatik test randevusu.');

    // Captcha'yı çöz
    cy.get('#captchaLabel').invoke('text').then((text) => {
      const regex = /Güvenlik Sorusu: (\d+) \+ (\d+) = \?/;
      const match = text.match(regex);
      if (match) {
        const num1 = parseInt(match[1]);
        const num2 = parseInt(match[2]);
        const answer = num1 + num2;
        cy.get('#captchaInput').type(answer);
      } else {
        throw new Error('Captcha etiketi formatı tanınmadı');
      }
    });

    // Formu gönder
    cy.get('#randevuFormu button[type="submit"]').click();

    // Başarı mesajını doğrula
    cy.get('#toast-container').should('contain', 'Randevu talebiniz başarıyla alındı!');
    cy.get('#randevuModal').should('not.be.visible'); // Modal kapanmalı
  });

  it('geçersiz TC Kimlik için hata göstermeli', () => {
    cy.get('a[href="#randevu"]').first().click();
    cy.get('#randevuModal').should('be.visible');
    cy.get('#btnIlkRandevu').click();
    cy.get('#randevuFormu').should('be.visible');

    cy.get('#adSoyad').type('Geçersiz TC Test');
    cy.get('#telefon').type('5551112233');
    cy.get('#email').type('invalidtc@test.com');
    cy.get('#tcKimlik').type('123'); // Geçersiz TC
    cy.get('#hizmetTuru').select('İşitme Testi');
    cy.get('#tarih').type('2026-05-01'); // Herhangi bir tarih
    cy.get('#captchaInput').type('10'); // Captcha'yı doğru varsayalım

    cy.get('#randevuFormu button[type="submit"]').click();
    cy.get('#toast-container').should('contain', 'Geçersiz TC Kimlik Numarası!');
  });

  // Kayıtlı hasta akışı, geçersiz e-posta, geçmiş tarih vb. için daha fazla test eklenebilir.
});