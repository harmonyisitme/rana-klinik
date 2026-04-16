const { randevuOlustur, randevulariGetir } = require('./controllers/randevuController');
const Randevu = require('./models/Randevu');
const Hasta = require('./models/Hasta');
const { Op } = require('sequelize'); // Op'u import et

// Sequelize modellerini mock'la
jest.mock('./models/Randevu', () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
}));

jest.mock('./models/Hasta', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

describe('Randevu Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    // Her testten önce tüm mock'ları temizle
    jest.clearAllMocks();
  });

  describe('randevuOlustur', () => {
    test('hasta mevcut değilse yeni hasta ve randevu oluşturmalı', async () => {
      mockReq.body = {
        adSoyad: 'Test Hasta',
        telefon: '5551234567',
        email: 'test@example.com',
        tcKimlik: '12345678901',
        cinsiyet: 'Erkek',
        dogumTarihi: '1990-01-01',
        hizmetTuru: 'İşitme Testi',
        tarih: '2026-05-01',
        mesaj: 'Test mesajı',
      };

      Hasta.findOne.mockResolvedValue(null); // Hasta bulunamadı
      Hasta.create.mockResolvedValue({ id: 1, ...mockReq.body }); // Yeni hasta oluşturuldu
      Randevu.create.mockResolvedValue({ id: 101, ...mockReq.body, hastaId: 1 }); // Randevu oluşturuldu

      await randevuOlustur(mockReq, mockRes);

      expect(Hasta.findOne).toHaveBeenCalledWith({
        where: {
          [Op.or]: [ // Sequelize Op'u kullan
            { telefon: '5551234567' },
            { telefon: '05551234567' },
            { tcKimlik: '12345678901' },
          ],
        },
      });
      expect(Hasta.create).toHaveBeenCalledWith({
        adSoyad: 'Test Hasta',
        telefon: '5551234567',
        tcKimlik: '12345678901',
        email: 'test@example.com',
        cinsiyet: 'Erkek',
        dogumTarihi: '1990-01-01',
      });
      expect(Randevu.create).toHaveBeenCalledWith({
        ...mockReq.body,
        telefon: '5551234567',
        hastaId: 1,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ mesaj: 'Randevu başarıyla oluşturuldu.' });
    });

    test('hasta mevcutsa yeni randevu oluşturmalı', async () => {
      mockReq.body = {
        adSoyad: 'Mevcut Hasta',
        telefon: '5559876543',
        email: 'mevcut@example.com',
        tcKimlik: '98765432109',
        hizmetTuru: 'İşitme Cihazı',
        tarih: '2026-05-02',
        mesaj: 'Mevcut hasta randevusu',
      };
      const existingPatient = { id: 2, adSoyad: 'Mevcut Hasta', telefon: '5559876543' };

      Hasta.findOne.mockResolvedValue(existingPatient); // Hasta bulundu
      Randevu.create.mockResolvedValue({ id: 102, ...mockReq.body, hastaId: 2 }); // Randevu oluşturuldu

      await randevuOlustur(mockReq, mockRes);

      expect(Hasta.findOne).toHaveBeenCalled();
      expect(Hasta.create).not.toHaveBeenCalled(); // Yeni hasta oluşturulmamalı
      expect(Randevu.create).toHaveBeenCalledWith({
        ...mockReq.body,
        telefon: '5559876543',
        hastaId: 2,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ mesaj: 'Randevu başarıyla oluşturuldu.' });
    });

    test('randevu oluşturma sırasında hataları işlemeli', async () => {
      mockReq.body = {
        adSoyad: 'Hata Hasta',
        telefon: '5551112233',
        hizmetTuru: 'Test',
        tarih: '2026-05-03',
      };
      const errorMessage = 'Veritabanı hatası';

      Hasta.findOne.mockResolvedValue(null);
      Hasta.create.mockRejectedValue(new Error(errorMessage)); // DB hatasını simüle et

      await randevuOlustur(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ mesaj: 'Randevu oluşturulurken hata.', hata: errorMessage });
    });
  });

  describe('randevulariGetir', () => {
    test('filtre sağlanmazsa tüm randevuları döndürmeli', async () => {
      const mockAppointments = [
        { id: 1, adSoyad: 'Hasta 1', tarih: '2026-05-01' },
        { id: 2, adSoyad: 'Hasta 2', tarih: '2026-05-02' },
      ];
      Randevu.findAll.mockResolvedValue(mockAppointments);

      await randevulariGetir(mockReq, mockRes);

      expect(Randevu.findAll).toHaveBeenCalledWith({
        where: {},
        order: [['createdAt', 'DESC']],
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockAppointments);
    });

    test('hastaId filtresiyle randevuları döndürmeli', async () => {
      mockReq.query.hastaId = '123';
      const mockAppointments = [
        { id: 1, hastaId: '123', adSoyad: 'Hasta 1', tarih: '2026-05-01' },
      ];
      Randevu.findAll.mockResolvedValue(mockAppointments);

      await randevulariGetir(mockReq, mockRes);

      expect(Randevu.findAll).toHaveBeenCalledWith({
        where: { hastaId: '123' },
        order: [['createdAt', 'DESC']],
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockAppointments);
    });

    test('randevuları çekerken hataları işlemeli', async () => {
      const errorMessage = 'Veritabanı bağlantı hatası';
      Randevu.findAll.mockRejectedValue(new Error(errorMessage));

      await randevulariGetir(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ mesaj: 'Veriler getirilemedi.' });
    });
  });
});