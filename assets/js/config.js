/* Patili Rota — düzenlenebilir her şey burada.
   Duraklar, mekânlar, saatler, diyaloglar, fotoğraflar. Kodun geri kalanına dokunmana gerek yok. */
window.PATI_CONFIG = {
  // Beraber mod şimdilik kapalı. Açmak için true yap (sunucu gerekir, README'ye bak).
  coop: false,
  server: '',

  her: 'Eda',
  him: 'Fatih',

  dateLabel: 'Cumartesi · 17 Ekim 2026',
  dateShort: '17 Ekim Cumartesi',

  // Her durak iki bölüm sürer: ilk bölümde yırtık sayfanın yarısı (sadece ipucu), ikincisinde tamamı.
  // icon: kahvalti | kahve | yuruyus | aksam
  stops: [
    {
      icon: 'kahvalti', emoji: '☀️', title: 'Kahvaltı', time: 'Sabah', place: 'Sürpriz 🤫',
      hint: 'Güne başlamanın en lezzetli yolu… Çaydanlık şimdiden fokurduyor.',
      note: 'Güne birlikte başlıyoruz. Çay benden, simit benden, menemen tartışması ikimizden.',
    },
    {
      icon: 'kahve', emoji: '☕', title: 'Kahve', time: 'Öğlen', place: 'Sürpriz 🤫',
      hint: 'Öğlen olunca bir şeyler içeceğiz. Köpüklü olabilir…',
      note: 'Öğle kahvesi molası. Esnemek hâlâ yasak.',
    },
    {
      icon: 'yuruyus', emoji: '🍂', title: 'Yürüyüş', time: 'Öğleden sonra', place: 'Sürpriz 🤫',
      hint: 'Öğleden sonra ayaklarımız biraz çalışacak. Sonbahar yaprakları bizi bekliyor.',
      note: 'Ankara sonbaharında el ele yürüyüş. Yürüyüşümle dalga geçmek yasak 🚶',
    },
    {
      icon: 'aksam', emoji: '🌙', title: 'Akşam Yemeği', time: 'Akşam', place: 'Sürpriz 🤫',
      hint: 'Gün bitmeden güzel bir sofraya oturacağız…',
      note: 'Günün kapanışı. Menü sürpriz… tantuni olabilir mi? 👀',
    },
  ],

  // Gizli odaların duvarlarındaki çerçeveler (her odada 3 çerçeve; fazlası galeride ok tuşlarıyla gezilir).
  // Fotoğrafları assets/photos/ klasörüne koy, sonra buraya ekle:
  memoryPhotos: [
    // { src: 'assets/photos/ani-1.jpg', caption: 'İlk date, 5 Eylül' },
  ],
  funnyPhotos: [
    // { src: 'assets/photos/komik-1.jpg', caption: 'Bu fotoğraf hiç olmadı 😂' },
  ],
  emptyFrame: {
    memory: 'Bu çerçeve yeni anılarımızı bekliyor 💕',
    funny: 'Bu çerçeveye komik bir fotoğrafımız gelecek 😂',
  },

  // who: her | him | king | kingBald | info
  intro: [
    { who: 'him', text: 'Eda! Cumartesi için kusursuz bir plan hazırlamıştım. Dört durak, tek gün, bol miyav.' },
    { who: 'king', text: 'Hö hö hö! O plan artık benim! Her sayfayı ikiye yırttım, kıllı maymunlarıma dağıttım!' },
    { who: 'him', text: 'Kral Maymun… Şu kıllarla seni saray halısı sandım. 😾' },
    { who: 'king', text: 'Bu kıllar benim gururum! Sayfaları istiyorsanız sarayımın sekiz bölümünü geçeceksiniz. Hö hö!' },
    { who: 'him', text: 'Merak etme Eda, ben hep yanındayım. Canın azalırsa bana bir öpücük yeter 💋' },
    { who: 'info', text: "Düşmana doğru yürü = pençe 🐾 · MİYAV = sersemlet · 💋 = Fatih'in yanındayken can doldur · Yoldaki dostlarla konuş, gizli odaları ara!" },
  ],

  // Yoldaki dostlar (her durakta bir tane, başlangıç odasında durur). first: durağın ilk bölümü, second: ikinci bölümü
  npcs: [
    {
      name: 'Simitçi Tekir',
      first: [
        'Hoş geldin Eda! Ben Simitçi Tekir. Kötü haber: Kral Maymun cumartesi planını çalmış!',
        'Üstüne bir de her sayfayı ikiye yırtmış. Her bölümde yırtık yarımı taşıyan kıllı bir maymun dolaşıyor.',
        'O maymunu bul, pençele, sayfayı kap. İki yarım birleşince durağın sırrı açılıyor. Sonra merdivenden aşağı!',
        "Canın azalırsa Fatih'in yanına git ve onu öp 💋 Aşk her yarayı sarar. Simit de sarar ama aşk daha iyi.",
        'Bir de… bu sarayda iki gizli oda varmış: biri anılarla, biri kahkahalarla dolu. Çatlak duvarlara dikkat et!',
      ],
      second: [
        'Sayfanın diğer yarısı bu katta! Kokusundan belli: maymun kılı kokuyor.',
        'MİYAV ile etrafındakileri sersemletebilirsin. Fatih bayılırsa yanında dur ya da bir öpücükle uyandır.',
      ],
    },
    {
      name: 'Barista Baykuş',
      first: [
        'Huu huu! Kahve dükkânına hoş geldin. Burada esneme hayaletleri dolaşır, sakın esneme!',
        'Kahve içersen hızlanırsın. Tantuni bulursan ikinizin de canı dolar. Bilge tavsiyesi: tantuniyi asla reddetme.',
      ],
      second: [
        'Kral Maymun her sabah buraya gelip köpüklü kahve ister. Köpükten kıl çıkıyor ama kimse bir şey diyemiyor.',
        'Darbeler bazen 2-3 can götürür. Kalplerine göz kulak ol, gerekirse Fatih’e koş 💋',
      ],
    },
    {
      name: 'Karabaş',
      first: [
        'Hav! Parka hoş geldin! Güvercinlere dikkat, simit kırıntısı için her şeyi yaparlar.',
        'Bir de kaçak toplar var, dümdüz giderler. Önlerinden çekil yeter.',
      ],
      second: [
        'Kral Maymun geçen gün buradan geçti. Çimlere o kadar kıl döktü ki belediye biçme makinesi gönderdi.',
        'Bu parkta yürüyüşle dalga geçmek yasak. Fatih’in yürüyüşü de buna dahil. Hav!',
      ],
    },
    {
      name: 'Garson Tosbağa',
      first: [
        'Ak-şam ye-me-ği-ne hoş gel-di-niz… Ben yavaş konuşurum, siz hızlı koşun.',
        'Kral Maymun bir alt katta. O kadar kıllı ki masaya oturunca halı sanıyorlar.',
      ],
      second: [
        'Kral bu katın en dibinde. Muz ve kıl yumağı fırlatır. Kıl yumağı yutarsan öksürürsün, benden söylemesi.',
        'Duydum ki onu yenince epilasyona götürecekmişsiniz. Hıhı… Bayılırım.',
      ],
    },
  ],

  // Dostlar, gizli oda olan katlarda bunu da fısıldar
  secretHints: {
    memory: 'Psst… Bu katta bir duvar çatlamış. Arkasından kalp atışları geliyor 💕 Çatlak duvarın üstüne yürü!',
    funny: 'Psst… Bu katta bir duvarın arkasından kahkaha sesleri geliyor 😂 Çatlak bir duvar görürsen üstüne yürü!',
    none: 'Bu katta gizli oda yok bence. Ama sarayda iki tane varmış, aramaya devam!',
    allFound: 'İki gizli odayı da bulmuşsun! Helal olsun, gözünden hiçbir şey kaçmıyor.',
  },

  outro: [
    { who: 'king', text: 'Tamam, tamam! Kazandınız… Plan sizin.' },
    { who: 'him', text: 'Bir de cezan var Kral Maymun: seni epilasyona götürüyoruz! 💅' },
    { who: 'king', text: 'HAYIIIR! Bu kıllar benim gururum! Kırk yıldır uzatıyorum!' },
  ],
  epilation: {
    title: 'EPİLASYON ZAMANI!',
    tip: 'Ağda bantlarına dokun ve çek!',
    button: 'ÇEK! 🩹',
    cries: ['AYYYY!', 'ANNEEEE!', 'KILLARIIIIM!'],
    done: 'Pürüzsüz! ✨',
  },
  afterEpilation: [
    { who: 'kingBald', text: '…Aslında fena değilmiş. Rüzgârı her yerimde hissediyorum. ✨' },
    { who: 'kingBald', text: 'Tamam, planınız sizin. Ama bana da bir tantuni getirin. 🌯' },
    { who: 'him', text: 'Anlaştık. Şimdi asıl soruya gelelim…' },
  ],

  question: 'Eda, bu cumartesi bu rotaya benimle çıkar mısın?',
  noStolen: 'Hayır seçeneği (artık kel olan) Kral Maymun tarafından çalındı 🐒',
  ticketNote: 'Geçerlilik: sonsuza dek · Ağlamak hâlâ yasak 😼',
};
