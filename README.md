# LoveApp

Romantik date planlama siteleri — Eda 💕

## Versiyonlar

| Versiyon | Klasör | Açıklama |
|----------|--------|----------|
| **V1** | [`V1/`](V1/) | İlk date teklifi — soru, tarih, yemek, yürüyüş, bira |
| **V2** | [`V2/`](V2/) | İlk date başarılı — özet + 2. date planlama |
| **V3** | kök (`index.html`) | **Patili Rota**: pixel art roguelike, 17 Ekim date daveti |

Git geçmişinde tüm commit'ler korunur. V1 ve V2 arşiv olarak kendi klasörlerinde durur.

## Canlı

- **V3 (güncel):** https://thevanerr.github.io/LA/
- **V2 (arşiv):** https://thevanerr.github.io/LA/V2/
- **V1 (arşiv):** https://thevanerr.github.io/LA/V1/

## V3 — Patili Rota

Kral Maymun cumartesi planını çalıp her sayfayı ikiye yırtmış. Eda (tabby) ve yardımcısı Fatih 8 bölümlük sarayda yarım sayfaları toplar; her durak iki bölüm: kahvaltı → kahve → yürüyüş → akşam yemeği. Kral yenilince epilasyona gider 💅, sonra davet sorusu ve indirilebilir pixel bilet.

- Her oyunda bölümler yeniden üretilir, sis ile keşif, rastgele eşyalar, bölümler arası güç seçimi, 10 kalp, 9 can.
- **Öpücük 💋:** Fatih'in dibindeyken (E / 💋 butonu) +5 can, 18 sn'de bir. Bayılan Fatih'i de uyandırır.
- **Gizli odalar:** Her koşuda Anı Odası ve Komiklik Odası farklı bölümlerde, çatlak bir duvarın arkasında.
- **Dostlar:** Her durakta bir NPC (Simitçi Tekir, Barista Baykuş, Karabaş, Garson Tosbağa) amacı anlatır ve gizli odaları fısıldar.
- **Beraber mod** şimdilik kapalı (`config.js` → `coop: true` ile açılır, sunucu gerekir).

**Metinleri, durakları, mekânları, saatleri, NPC konuşmalarını** değiştirmek için sadece [`assets/js/config.js`](assets/js/config.js) dosyasını düzenle.

**Gizli oda fotoğrafları:** resimleri [`assets/photos/`](assets/photos/) klasörüne koy, `config.js` içindeki `memoryPhotos` / `funnyPhotos` listelerine ekle. Çerçevelerde küçük hâlleri görünür, dokununca büyür.

### Yerelde çalıştırma

```bash
npm install
npm start          # http://localhost:8080 — hem site hem beraber mod
```

Test için bir kattan başlamak: `http://localhost:8080/?kat=4`

Bir şey ekledikten sonra bozulma var mı diye bakmak için: `npm test` (kat üretimi, oyun akışı ve beraber mod, ~12 sn).

### Beraber modu yayına almak (örnek: Render, ücretsiz)

1. Render → New → Web Service → bu repo
2. Build: `npm install` · Start: `npm start`
3. Verilen adresi ister doğrudan paylaş (site de oradan açılır), ister GitHub Pages sürümü için `config.js` içindeki `server` alanına yaz: `'wss://<adın>.onrender.com/ws'`
4. Odayı kur → **Davet linkini paylaş** → Eda linke tıklayınca doğrudan odaya katılır.

Ücretsiz sunucu 15 dk boşta kalınca uyur; ilk bağlantı 30-60 sn sürebilir.

### Dosyalar

| Dosya | Görev |
|-------|-------|
| `assets/js/core.js` | Oyun kuralları (tarayıcı + sunucu ortak) |
| `assets/js/main.js` | Çizim, arayüz, kontroller, final |
| `assets/js/sprites.js` | Pixel art |
| `assets/js/audio.js` | Chiptune müzik ve efektler |
| `assets/js/net.js` | Tek oyunculu / online bağlantı |
| `server/server.js` | Oda sunucusu + statik site |

## Firebase

- V1 yanıtları: `date_responses`
- V2 yanıtları: `date2_responses`
- V3 yanıtları: `date3_responses` — kuralı yayına almak için: `firebase deploy --only firestore:rules`
