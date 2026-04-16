const SiteAyarlari = require('../models/SiteAyarlari');

// Ayarları Getir (Yoksa varsayılan oluştur)
const ayarlariGetir = async (req, res) => {
    try {
        let ayarlar = await SiteAyarlari.findOne();
        
        if (!ayarlar) {
            // İlk kez çalışıyorsa varsayılan verileri kaydet
            ayarlar = await SiteAyarlari.create({
                logo: '',
                favicon: '',
                heroGorsel: '',
                haritaEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3011.650490016368!2d29.02169431541304!3d40.99034797930264!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab86666666667%3A0x6666666666666666!2sKad%C4%B1k%C3%B6y%2C%20Istanbul!5e0!3m2!1sen!2str!4v1610000000000!5m2!1sen!2str',
                anaRenk: '#0056b3',
                ikincilRenk: '#e94560',
                calismaSaatleri: {
                    haftaici: '09:00 - 18:00',
                    cumartesi: '10:00 - 14:00',
                    pazar: 'Kapalı'
                },
                hakkimizda: {
                    baslik: 'Hakkımızda',
                    icerik: 'Rana Klinik olarak işitme sağlığınız için buradayız.',
                    gorsel: ''
                },
                yasalMetinler: {
                    gizlilikPolitikasi: 'Gizlilik Politikası içeriği buraya gelecek.',
                    kullanimSartlari: 'Kullanım Şartları içeriği buraya gelecek.',
                    kvkkMetni: 'KVKK Aydınlatma Metni içeriği buraya gelecek.'
                },
                sosyalMedya: {
                    facebook: '#',
                    twitter: '#',
                    instagram: '#',
                    linkedin: '#'
                },
                hizmetler: [
                    { key: 'test', ikon: 'fa-solid fa-ear-listen', baslik: 'İşitme Testleri', ozet: 'Kapsamlı işitme değerlendirmesi.', detay: '<p>Detaylı odyolojik testler...</p>' },
                    { key: 'cihaz', ikon: 'fa-solid fa-ear-deaf', baslik: 'İşitme Cihazı', ozet: 'En yeni teknoloji cihazlar.', detay: '<p>Cihaz uygulaması...</p>' },
                    { key: 'pediatrik', ikon: 'fa-solid fa-baby', baslik: 'Pediatrik Odyoloji', ozet: 'Çocuklar için özel testler.', detay: '<p>Çocuk odyolojisi...</p>' },
                    { key: 'tinnitus', ikon: 'fa-solid fa-bell', baslik: 'Tinnitus Tedavisi', ozet: 'Çınlama terapisi.', detay: '<p>Tinnitus yönetimi...</p>' }
                ]
            });
        }
        
        res.status(200).json(ayarlar);
    } catch (error) {
        res.status(500).json({ mesaj: 'Ayarlar getirilemedi.', hata: error.message });
    }
};

// Ayarları Güncelle
const ayarlariGuncelle = async (req, res) => {
    try {
        // Tek bir ayar dökümanı olduğu için ilkini bulup güncelliyoruz
        let ayarlar = await SiteAyarlari.findOne();
        if (!ayarlar) {
            ayarlar = await SiteAyarlari.create(req.body);
        } else {
            await ayarlar.update(req.body);
        }
        res.status(200).json({ mesaj: 'Ayarlar güncellendi.', veri: ayarlar });
    } catch (error) {
        res.status(500).json({ mesaj: 'Güncelleme hatası.', hata: error.message });
    }
};

module.exports = { ayarlariGetir, ayarlariGuncelle };
