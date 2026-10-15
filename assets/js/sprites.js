/* Patili Rota — pixel art. Her sprite 16x16 karakter ızgarası; harfler paletteki renklere karşılık gelir. */
(function () {
  'use strict';

  const PAL = {
    k: '#2a1b2d', w: '#fff8ee', s: '#ffffff', p: '#f7a8bb', P: '#e2557a',
    r: '#e04f4f', R: '#9e2a3a', y: '#ffd166', Y: '#e8a33d', g: '#72c96f', G: '#3f8a4d',
    u: '#62a0e8', U: '#34508f', n: '#9a6a43', N: '#6b4428', t: '#efcf9f', T: '#c99a66',
    e: '#a3a8bb', E: '#5f6377', l: '#d4c4f7', L: '#9b86d6', o: '#f39a4a', O: '#cf6a2a',
    c: '#fff1d6', C: '#e8d2a8', m: '#4a3328', x: '#1b1b22', z: '#c8cbd6',
  };

  // Kedi şablonu: b = tüy, v = çizgi (tabby), h = açık ton (ağız/göğüs)
  const CAT = [
    '................',
    '..k..........k..',
    '.kbk........kbk.',
    '.kbpk......kpbk.',
    '.kbppkkkkkkppbk.',
    '.kbbbbvbbvbbbbk.',
    'kbbbbbbvvbbbbbbk',
    'kvbbksbbbbksbbvk',
    'kbbbkkbbbbkkbbbk',
    'kvbpbbhpphbbpbvk',
    '.kbbbbkhhkbbbbk.',
    '..kkbbbbbbbbkk..',
    '...kvvbhhbvvk.kk',
    '...kbbbhhbbbkkbk',
    '...kvvbhhbvvbbk.',
    '....kwwkkwwkkk..',
  ];
  const CAT_SLEEP = [
    '................',
    '................',
    '................',
    '................',
    '................',
    '..k...k.........',
    '.kbk.kbk........',
    '.kbpkpbkkkkkkk..',
    'kbbbbbbbvbbvbbk.',
    'kbkkbkkbbbbbbbbk',
    'kvbpbbpbvbbvbbbk',
    'kbbbhhbbbbbbbbkk',
    '.kbbbbbbbbbbbkbk',
    '..kwwkkkkkwwkkbk',
    '...kk.....kk.kk.',
    '................',
  ];
  const BOW = [
    '................',
    '................',
    '..........PP.PP.',
    '..........PPRPP.',
    '..........PP.PP.',
  ];
  const CATS = {
    eda:    { b: '#b48c6a', v: '#5c4434', h: '#f0dcc2' },   // tabby
    sarman: { b: '#f3a65a', v: '#d0702f', h: '#ffe4c2' },   // Fatih (sarman)
    tekir:  { b: '#9ea3ae', v: '#5b606b', h: '#e4e7ee' },   // Simitçi Tekir
  };
  const SIMIT_HAT = [
    '................',
    '.....kkkkkk.....',
    '....kTnTyTnk....',
    '....kkkkkkkk....',
  ];
  // Epilasyon sonrası kel kral: kürk yerine pembe ten
  const BALD = { n: '#f1b6a6', N: '#d4917f' };

  const S = {
    egg: [
      '................',
      '......kkkk......',
      '.....kwwwwk.....',
      '....kwwwwssk....',
      '...kwwwwwwwsk...',
      '...kwkkwwkkwk...',
      '..kwwwkwwkwwwk..',
      '..kwwkkwwkkwwk..',
      '..kwwkswwkswwk..',
      '..kwpwwwwwwpwk..',
      '..kwwwwkkwwwwk..',
      '..kCwwwwwwwwCk..',
      '...kCwwwwwwCk...',
      '....kkCCCCkk....',
      '.....ok..ko.....',
      '....kok..kok....',
    ],
    teapot: [
      '................',
      '.......kk.......',
      '......kyyk......',
      '.....kkkkkk.....',
      '....kRrrrrrk....',
      '.k.krrrrrrrrk...',
      'krkkrkkrrkkrrkk.',
      'krrkrrkrrkrrrkrk',
      '.krkrrsrrrrrrk.k',
      '..kkrrrrkkrrrkrk',
      '...krrrrrrrrrkk.',
      '...kRrrrrrrrRk..',
      '....kRRRRRRRk...',
      '.....kkkkkkk....',
      '................',
      '................',
    ],
    ball: [
      '................',
      '................',
      '.....kkkkkk.....',
      '....kwwwwwwk....',
      '...kwwwxxwwwk...',
      '..kwwwxxxxwwwk..',
      '..kxwwwxxwwwxk..',
      '..kxxwwwwwwxxk..',
      '..kxwwwwwwwwxk..',
      '..kwwwwxxwwwwk..',
      '..kzwwxxxxwwzk..',
      '...kzwwxxwwzk...',
      '....kzzzzzzk....',
      '.....kkkkkk.....',
      '................',
      '................',
    ],
    pigeon: [
      '................',
      '................',
      '.........kkk....',
      '........keeek...',
      '.......kekseEk..',
      '.......keeeekEk.',
      '....kkkkgLeek...',
      '...keeeeLgeek...',
      '..keeEEeeeeek...',
      '.kEeeEEEeeeek...',
      'kEEeeeEEeeek....',
      '.kkEEeeeeekk....',
      '...kkkkkkkk.....',
      '.....kO.kO......',
      '....kOOkOOk.....',
      '................',
    ],
    kil: [
      '................',
      '................',
      '................',
      '......N..N......',
      '....N.nnnn.N....',
      '.....nnNnnnn....',
      '...NnNnnnNnnN...',
      '....nnnnNnnn....',
      '...NnnNnnnnnN...',
      '....nnnnnNnn....',
      '.....nNnnnn.N...',
      '....N.nnnn......',
      '......N..N......',
      '................',
      '................',
      '................',
    ],
    mektup: [
      '................',
      '................',
      '................',
      '..kkkkkkkkkkkk..',
      '..kwkcccccckwk..',
      '..kcwkcccckwck..',
      '..kccwkcckwcck..',
      '..kcccwkkwccck..',
      '..kcccrrkrrcck..',
      '..kccrrrrrrrck..',
      '..kcccrrrrrcck..',
      '..kccccrrrccck..',
      '..kkkkkkkkkkkk..',
      '................',
      '................',
      '................',
    ],
    baykus: [
      '................',
      '..kk........kk..',
      '..knk......knk..',
      '..knnkkkkkknnk..',
      '.knnnnnnnnnnnnk.',
      '.knwwwnnnnwwwnk.',
      '.kwwkkwnnwkkwwk.',
      '.kwwkswnnwkswwk.',
      '.knwwwnYYnwwwnk.',
      '.knnnnnYYnnnnnk.',
      '.knTTTTTTTTTTnk.',
      '.knTwwwwwwwwTnk.',
      '..knwwwwwwwwnk..',
      '..knwwwPPwwwnk..',
      '...kkwwwwwwkk...',
      '....kYYkkYYk....',
    ],
    karabas: [
      '................',
      '................',
      '..kkk......kkk..',
      '.kNNNk....kNNNk.',
      '.kNNNkkkkkkNNNk.',
      '.kNNkEEEEEEkNNk.',
      '.kNkEEEEEEEEkNk.',
      '..kEEksEEksEEk..',
      '..kEEkkEEkkEEk..',
      '..kEETTTTTTEEk..',
      '..kEETkkkkTEEk..',
      '...kEETppTEEk...',
      '...kEEETTEEEk...',
      '..kEEEEEEEEEEk..',
      '..kEkEEEEEEkEk..',
      '..kTkkk..kkkTk..',
    ],
    tosbaga: [
      '................',
      '................',
      '......kkkk......',
      '.....kggggk.....',
      '....kgksksgk....',
      '....kggggggk....',
      '....kgkkkkgk....',
      '.....kPkkPk.....',
      '..kkkkPPPPkkkk..',
      '.kGGnGGnGGnGGGk.',
      'kGnGGnGGnGGnGGGk',
      'kGGnGGnGGnGGnGGk',
      'kGGGGGGGGGGGGGGk',
      '.kggkkkkkkkkggk.',
      '.kggk......kggk.',
      '..kk........kk..',
    ],
    ghost: [
      '................',
      '.....kkkkkk.....',
      '....kllllllk....',
      '...kllssllllk...',
      '..kllsllllllLk..',
      '..klkkkllkkklk..',
      '..klllllllllLk..',
      '..kllllkkllllk..',
      '..klllkxxklllk..',
      '..klllkxxkllLk..',
      '..kllllkkllLLk..',
      '..kllllllllLLk..',
      '..kLllllLllLLk..',
      '..kLLkLLkLLkLk..',
      '..kk.k..k..k.k..',
      '................',
    ],
    bean: [
      '................',
      '................',
      '................',
      '.....kkkkkk.....',
      '....knnnnnnk....',
      '...knnkNnnnnk...',
      '..knnnnkNnnnnk..',
      '..knkknnkkknnk..',
      '..knsknnnskknk..',
      '..knnnnkNnnnnk..',
      '..knnnnnkNnnnk..',
      '...kNnnnnkNnk...',
      '....kNNNNNNk....',
      '.....kkkkkk.....',
      '.....k.k..k.k...',
      '................',
    ],
    monkey: [
      '................',
      '.....kkkkkk.....',
      '....knnnnnnk....',
      '.kkknnnnnnnnkkk.',
      'kttknnnnnnnnkttk',
      'ktTknttnnttnkTtk',
      '.kkkttttttttkkk.',
      '...ktkstttkstk..',
      '...ktkkttttkkk..',
      '...kttttkktttk..',
      '....ktttttttk...',
      '...kknkkkkkknkk.',
      '..knnntttttnnnk.',
      '..knnkttttttknkk',
      '...kknnkknnkk.kn',
      '....kkk..kkk..k.',
    ],
    simit: [
      '................',
      '................',
      '................',
      '.....kkkkkk.....',
      '....kTnTnTnk....',
      '...kTwTnnTyTk...',
      '..kTnTkkkknTnk..',
      '..knyTk...kTwk..',
      '..kTnk.....kTk..',
      '..kwTnk...knnk..',
      '..kTnTkkkkTyTk..',
      '...kTnTwnTnTk...',
      '....kTnTyTnk....',
      '.....kkkkkk.....',
      '................',
      '................',
    ],
    tantuni: [
      '................',
      '................',
      '..........kk....',
      '.........kgGk...',
      '........krgrk...',
      '.......krrcrk...',
      '......kccrrgk...',
      '.....kcctcrk....',
      '....kwcctck.....',
      '...kwwwttk......',
      '..kwwwwwk.......',
      '..kwwPwwk.......',
      '...kwwwk........',
      '....kkk.........',
      '................',
      '................',
    ],
    kahve: [
      '................',
      '.......e.e......',
      '......e.e.......',
      '.......e.e......',
      '................',
      '....kkkkkkkk....',
      '...kwNNNNNNwk...',
      '...kwwwwwwwwkkk.',
      '...kwPwwPwwwk.k.',
      '...kwwwwwwwwk.k.',
      '...kwwwwwwwwkkk.',
      '....kwwwwwwk....',
      '..kkkkkkkkkkkk..',
      '..kzzzzzzzzzzk..',
      '...kkkkkkkkkk...',
      '................',
    ],
    balik: [
      '................',
      '................',
      '................',
      '................',
      '......kkkkk.....',
      '.k...kuuuuuk....',
      'kuk.kuuuuskuk...',
      'kuukuuuuuuuuuk..',
      '.kuuuUuUuuuuuuk.',
      'kuukUuUuuuuuuk..',
      'kuk.kUUUUUUUk...',
      '.k...kkkkkkk....',
      '................',
      '................',
      '................',
      '................',
    ],
    yumak: [
      '................',
      '................',
      '................',
      '.....kkkkkk.....',
      '....kpppPppk....',
      '...kpPppPpppk...',
      '..kppPpPpppPpk..',
      '..kpppPPpppPpk..',
      '..kPpppPpPPppk..',
      '..kpPpppPpppPk..',
      '..kppPpppPpPpk..',
      '...kppPPpppPk...',
      '....kpppPppkPk..',
      '.....kkkkkk..Pk.',
      '..............P.',
      '................',
    ],
    kediotu: [
      '................',
      '................',
      '.......kk.......',
      '......kgGk......',
      '...kk.kgGk.kk...',
      '..kgGkkgGkkgGk..',
      '..kggGkgGkgGgk..',
      '...kggGgGgGgk...',
      '....kkgGGgkk....',
      '..kkggkGGkggkk..',
      '.kgggGkGGkGgggk.',
      '..kkkkkGGkkkkk..',
      '.......kk.......',
      '................',
      '................',
      '................',
    ],
    page: [
      '................',
      '................',
      '...kkkkkkkkkk...',
      '..kCcccccccccCk.',
      '..kkcccccccckkk.',
      '...kcCCCCCCck...',
      '...kccccccccck..',
      '...kcCCCCCcck...',
      '...kccccrrcrrk..',
      '...kcCCCrrrrrk..',
      '...kcccccrrrk...',
      '..kkkcccccrkkkk.',
      '..kCccccccccCk..',
      '...kkkkkkkkkk...',
      '................',
      '................',
    ],
    heart: [
      '................',
      '................',
      '................',
      '...kkk...kkk....',
      '..krrrk.krrrk...',
      '.krsrrrkrrrrrk..',
      '.krsrrrrrrrrrk..',
      '.krrrrrrrrrrrk..',
      '..krrrrrrrrrk...',
      '...krrrrrrrk....',
      '....krrrrrk.....',
      '.....krrrk......',
      '......krk.......',
      '.......k........',
      '................',
      '................',
    ],
    heartEmpty: [
      '................',
      '................',
      '................',
      '...kkk...kkk....',
      '..kEEEk.kEEEk...',
      '.kEeeeEkEeeeEk..',
      '.kEeeeeeeeeeEk..',
      '.kEeeeeeeeeeEk..',
      '..kEeeeeeeeEk...',
      '...kEeeeeeEk....',
      '....kEeeeEk.....',
      '.....kEeEk......',
      '......kEk.......',
      '.......k........',
      '................',
      '................',
    ],
    shield: [
      '................',
      '................',
      '...kkkkkkkkkk...',
      '..kuuuuuuuuuuk..',
      '..kusuuuuuuuuk..',
      '..kusuuwwuuuuk..',
      '..kuuuwwwwuuuk..',
      '..kuuuwwwwuuuk..',
      '...kuuuwwuuuk...',
      '...kuuuuuuuuk...',
      '....kuuuuuuk....',
      '.....kuuuuk.....',
      '......kkkk......',
      '................',
      '................',
      '................',
    ],
    paw: [
      '................',
      '................',
      '....kk....kk....',
      '...kppk..kppk...',
      '...kppk..kppk...',
      '.kk.kk.kk.kk.kk.',
      'kppk..kppk..kppk',
      'kppk.kkkkkk.kppk',
      '.kk.kppppppk.kk.',
      '...kppppppppk...',
      '..kppppppppppk..',
      '..kppppppppppk..',
      '...kppppppppk...',
      '....kkkkkkkk....',
      '................',
      '................',
    ],
    banana: [
      '................',
      '................',
      '................',
      '..........kk....',
      '.........kNk....',
      '........kyyk....',
      '.......kyyYk....',
      '......kyyyYk....',
      '....kkyyyYk.....',
      '..kkyyyyYYk.....',
      '.kNyyyyYYk......',
      '..kkYYYkk.......',
      '....kkk.........',
      '................',
      '................',
      '................',
    ],
    steam: [
      '................',
      '................',
      '................',
      '.......kk.......',
      '.....kkwwkk.....',
      '....kwwwwwwk....',
      '...kwswwwwzzk...',
      '..kwwwwwwwwwzk..',
      '..kwwwwwwwwzzk..',
      '...kzwwwwwzzk...',
      '....kkzzzzkk....',
      '......kkkk......',
      '................',
      '................',
      '................',
      '................',
    ],
    stairs: [
      'kkkkkkkkkkkkkkkk',
      'kTTTTTTTTTTTTTTk',
      'kTxxxxxxxxxxxxTk',
      'kTnnnnnnnnnnnnTk',
      'kTxxxxxxxxxxxxTk',
      'kTxNNNNNNNNNNxTk',
      'kTxxxxxxxxxxxxTk',
      'kTxxmmmmmmmmxxTk',
      'kTxxxxxxxxxxxxTk',
      'kTxxxmmmmmmxxxTk',
      'kTxxxxxxxxxxxxTk',
      'kTxxxxxxxxxxxxTk',
      'kTxxxxxxxxxxxxTk',
      'kTxxxxxxxxxxxxTk',
      'kTTTTTTTTTTTTTTk',
      'kkkkkkkkkkkkkkkk',
    ],
    hatch: [
      '................',
      '.kkkkkkkkkkkkkk.',
      '.knnnnNnnnnnnnk.',
      '.knTnnNnnTnnnnk.',
      '.kNNNNNNNNNNNNk.',
      '.knnnnnNnnnnnNk.',
      '.knnTnnNnnnTnnk.',
      '.kNNNNkkkkNNNNk.',
      '.knnnkYYYYknnnk.',
      '.knnnkYkkYknnnk.',
      '.kNNNkYYYYkNNNk.',
      '.knnnnkkkknnnnk.',
      '.knnTnnNnnnTnnk.',
      '.knnnnnNnnnnnnk.',
      '.kkkkkkkkkkkkkk.',
      '................',
    ],
    doorOpen: [
      '................',
      '................',
      '................',
      '................',
      '..kkkkkkkkkkkk..',
      '..keeeeeeeeeek..',
      '..kekkkkkkkkek..',
      '..kek......kek..',
      '..kek......kek..',
      '..kekkkkkkkkek..',
      '..keeeeeeeeeek..',
      '..kkkkkkkkkkkk..',
      '................',
      '................',
      '................',
      '................',
    ],
    doorShut: [
      '................',
      '................',
      '..kkkkkkkkkkkk..',
      '..krrrrrrrrrrk..',
      '..krkkkkkkkkrk..',
      '..krkuuuuuukrk..',
      '..krkusuuuukrk..',
      '..krkuuuuuukrk..',
      '..krkkkkkkkkrk..',
      '..krrrrrrrrrrk..',
      '..krrrrrrkkkrk..',
      '..krrrrrrrrrrk..',
      '..kRRRRRRRRRRk..',
      '..kkkkkkkkkkkk..',
      '................',
      '................',
    ],
    crown: [
      '................',
      '................',
      '..k....kk....k..',
      '.kyk..kyyk..kyk.',
      '.kyyk.kyyk.kyyk.',
      '.kyyykyyyykyyyk.',
      '.kyrryyuuyyrryk.',
      '.kyYyyYyyYyyYyk.',
      '.kkkkkkkkkkkkkk.',
    ],
  };

  // Kat dekorları
  const DECOR = {
    kahvalti: [
      [
        '................',
        '................',
        '................',
        '....kkkkkkkk....',
        '..kkwwwwwwwwkk..',
        '.kwwwyyywwrrwwk.',
        '.kwwyyyyywrrrwk.',
        '.kwwwyyywwwrrwk.',
        '.kwxwwwwwwwwwwk.',
        '.kwwwwgwwtttwwk.',
        '..kkwwwwwtttkk..',
        '....kkkkkkkk....',
        '................',
        '................',
        '................',
        '................',
      ],
      [
        '................',
        '................',
        '.....kkkkkk.....',
        '.....kRRRRk.....',
        '.....kRRRRk.....',
        '......kRRk......',
        '......kRRk......',
        '.....kRRRRk.....',
        '.....kRsRRk.....',
        '.....kRRRRk.....',
        '......kkkk......',
        '...kkkkkkkkkk...',
        '..kzzzzzzzzzzk..',
        '...kkkkkkkkkk...',
        '................',
        '................',
      ],
      'plant',
    ],
    yuruyus: [
      [
        '.....kkkkkk.....',
        '...kkgggGggkk...',
        '..kggGgggggGgk..',
        '.kgggggGgggggGk.',
        '.kgGgggggggGggk.',
        'kggggGgggGgggggk',
        'kgGggggggggggGgk',
        '.kgggGgggggGggk.',
        '.kGggggGgggggGk.',
        '..kkGgggggGgkk..',
        '....kkkNNkkk....',
        '......kNNk......',
        '......kNNk......',
        '......kNNk......',
        '....kkNNNNkk....',
        '................',
      ],
      [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '.kkkkkkkkkkkkkk.',
        '.kNnNnNnNnNnNnk.',
        '.kkkkkkkkkkkkkk.',
        '.kNnNnNnNnNnNnk.',
        '.kkkkkkkkkkkkkk.',
        '.kEk........kEk.',
        '.kEk........kEk.',
        '.kkk........kkk.',
        '................',
        '................',
      ],
      [
        '................',
        '................',
        '................',
        '................',
        '...r.....y......',
        '..rwr...yOy..p..',
        '...r..p..y..pwp.',
        '...g.pwp.g...p..',
        '...g..p..g...g..',
        '..kkkkkkkkkkkk..',
        '..kNNNNNNNNNNk..',
        '..kNnnnnnnnnNk..',
        '..kNNNNNNNNNNk..',
        '..kkkkkkkkkkkk..',
        '................',
        '................',
      ],
    ],
    // Gizli anı odası: kalp balon, kalpli mum, gül
    memory: [
      [
        '....kkk..kkk....',
        '...kpppkkpppk...',
        '..kpswpppppppk..',
        '..kpsppppppppk..',
        '..kpppppppppPk..',
        '...kpppppppPk...',
        '....kppppppk....',
        '.....kpppPk.....',
        '......kppk......',
        '.......kk.......',
        '.......k........',
        '........k.......',
        '.......k........',
        '........k.......',
        '......kkkk......',
        '......kEEk......',
      ],
      [
        '................',
        '.......y........',
        '......yYy.......',
        '......yOy.......',
        '.......k........',
        '.....kkkkk......',
        '.....kpppk......',
        '.....kpwpk......',
        '.....kpppk......',
        '.....kprpk......',
        '.....kpppk......',
        '.....kpppk......',
        '...kkkkkkkkk....',
        '...kzzzzzzzk....',
        '....kkkkkkk.....',
        '................',
      ],
      'rose',
    ],
    // Komiklik odası: lastik ördek, osuruk yastığı, muz kabuğu
    funny: [
      [
        '................',
        '................',
        '................',
        '.....kkkk.......',
        '....kyyyyk......',
        '...kyykyyyk.....',
        '...kyyyyyykOOk..',
        '...kyyyyyyOOOk..',
        '....kyyyyykkk...',
        '..kkkyyyyyykkk..',
        '.kyyyyyyyyyyyyk.',
        '.kyyyYyyyyyyyyk.',
        '.kYyyyYYyyyyyYk.',
        '..kYYyyyyyyYYk..',
        '...kkkkkkkkkk...',
        '................',
      ],
      [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '.....kkkkkk.....',
        '...kkPPPPPPkk...',
        '..kPpPPPPPPPPk..',
        '.kPpPPPPPPPPPPk.',
        '.kPPPPPPPPPPPPkk',
        '..kRPPPPPPPPRkPk',
        '...kkkkkkkkkk.k.',
        '................',
        '................',
        '................',
      ],
      [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '......kk........',
        '.....kyYk.......',
        '..kk.kyYk.kk....',
        '.kyYkkyYkkyYk...',
        '..kyyYyyyYyyk...',
        '...kyyYYYyyk....',
        '....kkkkkkk.....',
        '................',
        '................',
      ],
    ],
    kahve: [
      [
        '................',
        '................',
        '.....kk..kk.....',
        '....kTTkkTTk....',
        '.....kTTTTk.....',
        '....kTTTTTTk....',
        '...kTTTTTTTTk...',
        '..kTTNNNNNNTTk..',
        '..kTTNkTTkNTTk..',
        '..kTTNNkkNNTTk..',
        '..kTTTTTTTTTTk..',
        '..kTTTTTTTTTTk..',
        '..kCTTTTTTTTCk..',
        '...kkkkkkkkkk...',
        '................',
        '................',
      ],
      [
        '................',
        '................',
        '...kkkkkkkkkk...',
        '..kOOOOOOOOOOk..',
        '..kOooooooooOk..',
        '..kOooooooooOk..',
        '..kOooooooooOk..',
        'kkkOOOOOOOOOOkkk',
        'kOkooooooooookOk',
        'kOkooooooooookOk',
        'kOkkkkkkkkkkkkOk',
        'kOOOOOOOOOOOOOOk',
        'kkkkkkkkkkkkkkkk',
        '.kNk........kNk.',
        '.kkk........kkk.',
        '................',
      ],
      'plant',
    ],
    aksam: [
      [
        '.......y........',
        '......yYy.......',
        '......kwk.......',
        '......kwk.......',
        '..y...kwk...y...',
        '.yYy..kwk..yYy..',
        '.kwk..kwk..kwk..',
        '.kwk.kYYYk.kwk..',
        '.kYYkkkYkkkYYk..',
        '..kkYYYYYYYkk...',
        '......kYk.......',
        '......kYk.......',
        '......kYk.......',
        '....kkYYYkk.....',
        '...kYYYYYYYk....',
        '...kkkkkkkkk....',
      ],
      [
        '................',
        '.....kk..kk.....',
        '....krrkkrrk....',
        '...krRrkrRrrk...',
        '...krrrrrrrrk...',
        '....kkrRrrkk....',
        '..kk.kgkkgk.kk..',
        '..kgk.kgGk.kgk..',
        '...kgkkGGkkgk...',
        '.....kkGGkk.....',
        '.....kuuuuk.....',
        '....kuusuuuk....',
        '....kuuuuuuk....',
        '....kUuuuuUk....',
        '.....kkkkkk.....',
        '................',
      ],
    ],
    plant: [
      '................',
      '......kk........',
      '....kkgGk.kk....',
      '...kgggGkkgGk...',
      '..kggGgGkgGgk...',
      '..kgGkkgGgGkk...',
      '...kk.kgGgGgk...',
      '..kkgkkgGGkkgk..',
      '.kgggGkGGkgGgGk.',
      '..kkkkkGkkkkkk..',
      '....kkkkkkkk....',
      '....kOOOOOOk....',
      '.....kOooOk.....',
      '.....kOooOk.....',
      '......kkkk......',
      '................',
    ],
  };

  function draw(rows, pal, flip) {
    const h = rows.length, w = rows[0].length;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x];
        if (ch === '.') continue;
        const col = (pal && pal[ch]) || PAL[ch];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(flip ? w - 1 - x : x, y, 1, 1);
      }
    }
    return c;
  }

  function overlay(base, top, pal) {
    return base.map((row, y) => {
      if (!top[y]) return row;
      let out = '';
      for (let x = 0; x < row.length; x++) out += top[y][x] && top[y][x] !== '.' ? top[y][x] : row[x];
      return out;
    });
  }

  // Bir satır aşağı kaydırılmış (zıplama) kare: ayaklar yerinde kalır
  function bob(rows) {
    const out = ['.'.repeat(rows[0].length)].concat(rows.slice(0, rows.length - 2));
    out.push(rows[rows.length - 1]);
    return out;
  }

  function silhouette(src, color) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }

  function scale2(src) {
    const c = document.createElement('canvas');
    c.width = src.width * 2; c.height = src.height * 2;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0, c.width, c.height);
    return c;
  }

  const cache = {};
  function build() {
    // kediler: [yön][kare]
    for (const name of Object.keys(CATS)) {
      const pal = CATS[name];
      let base = CAT;
      let sleep = CAT_SLEEP;
      if (name === 'eda') base = overlay(CAT, BOW);
      if (name === 'tekir') base = overlay(CAT, SIMIT_HAT);
      const frames = [base, bob(base)];
      cache['cat_' + name] = {
        r: frames.map((f) => draw(f, pal, false)),
        l: frames.map((f) => draw(f, pal, true)),
        sleep: { r: draw(sleep, pal, false), l: draw(sleep, pal, true) },
      };
      cache['cat_' + name].white = cache['cat_' + name].r.map((c) => silhouette(c, '#ffffff'));
      cache['cat_' + name].whiteL = cache['cat_' + name].l.map((c) => silhouette(c, '#ffffff'));
    }
    const simple = ['egg', 'teapot', 'ghost', 'bean', 'monkey', 'pigeon', 'baykus', 'karabas', 'tosbaga'];
    for (const k of simple) {
      const frames = [S[k], bob(S[k])];
      cache[k] = {
        r: frames.map((f) => draw(f, null, false)),
        l: frames.map((f) => draw(f, null, true)),
      };
      cache[k].white = cache[k].r.map((c) => silhouette(c, '#ffffff'));
      cache[k].whiteL = cache[k].l.map((c) => silhouette(c, '#ffffff'));
    }
    // sayfa hırsızı: maymun + elinde sayfa
    const pagem = overlay(S.monkey, [
      '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '................',
      '..........kkkkk.', '.........kcccck.', '.........kcrrck.', '.........kccrck.', '.........kkkkk.',
    ]);
    cache.pagem = {
      r: [draw(pagem), draw(bob(pagem))],
      l: [draw(pagem, null, true), draw(bob(pagem), null, true)],
    };
    cache.pagem.white = cache.pagem.r.map((c) => silhouette(c, '#ffffff'));
    cache.pagem.whiteL = cache.pagem.l.map((c) => silhouette(c, '#ffffff'));

    // Kral maymun ve epilasyon sonrası kel hâli
    cache.king = buildKing(null);
    cache.kingBald = buildKing(BALD);
    // Dostlar: 0 kahvaltı, 1 kahve, 2 yürüyüş, 3 akşam
    cache.npc = { 0: cache.cat_tekir, 1: cache.baykus, 2: cache.karabas, 3: cache.tosbaga };

    const ball = draw(S.ball);
    const ballW = silhouette(ball, '#ffffff');
    cache.ball = { r: [ball, ball], l: [ball, ball], white: [ballW, ballW], whiteL: [ballW, ballW] };

    for (const k of ['simit', 'tantuni', 'kahve', 'balik', 'yumak', 'kediotu', 'mektup', 'page', 'heart', 'heartEmpty', 'shield', 'paw', 'banana', 'kil', 'steam', 'stairs', 'hatch', 'doorOpen', 'doorShut', 'crown']) {
      cache[k] = draw(S[k]);
    }
    const spin = (src) => [0, 1, 2, 3].map((i) => {
      const c = document.createElement('canvas');
      c.width = 16; c.height = 16;
      const g = c.getContext('2d');
      g.translate(8, 8); g.rotate((i * Math.PI) / 2); g.translate(-8, -8);
      g.drawImage(src, 0, 0);
      return c;
    });
    cache.bananaSpin = spin(cache.banana);
    cache.kilSpin = spin(cache.kil);

    cache.decor = {};
    for (const key of ['kahvalti', 'kahve', 'yuruyus', 'aksam', 'memory', 'funny']) {
      cache.decor[key] = DECOR[key].map((d) => draw(d === 'plant' ? DECOR.plant : d === 'rose' ? DECOR.aksam[1] : d));
    }
  }

  // 32x32 kral: büyütülmüş gövde + kırmızı pelerin + taç. pal verilirse kürk rengi değişir (kel hâl).
  function buildKing(pal) {
    const out = { r: [], l: [], white: [], whiteL: [] };
    for (const flip of [false, true]) {
      for (let f = 0; f < 2; f++) {
        const c = document.createElement('canvas');
        c.width = 32; c.height = 34;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.fillStyle = PAL.k; g.fillRect(3, 19 + f, 26, 14 - f);
        g.fillStyle = PAL.R; g.fillRect(4, 20 + f, 24, 12 - f);
        g.fillStyle = PAL.r; g.fillRect(5, 20 + f, 22, 4);
        g.fillStyle = PAL.w; for (let x = 5; x < 27; x += 3) g.fillRect(x, 20 + f, 2, 2);
        const body = draw(f ? bob(S.monkey) : S.monkey, pal, flip);
        g.drawImage(scale2(body), 0, 2);
        if (pal) {
          // kel kafada parlama
          g.fillStyle = '#ffffff';
          g.fillRect(flip ? 18 : 12, 6 + f, 2, 2);
          g.fillRect(flip ? 16 : 14, 5 + f, 2, 1);
        }
        const crown = draw(S.crown, null, false);
        g.drawImage(crown, 8, -1 + f, 16, 9);
        (flip ? out.l : out.r).push(c);
        (flip ? out.whiteL : out.white).push(silhouette(c, '#ffffff'));
      }
    }
    return out;
  }

  function get(name) { return cache[name]; }

  function dataURL(name, scale) {
    const src = typeof name === 'string' ? cache[name] : name;
    const c = document.createElement('canvas');
    const s = scale || 2;
    c.width = src.width * s; c.height = src.height * s;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL();
  }

  window.PatiSprites = { PAL, build, get, dataURL, cache };
})();
