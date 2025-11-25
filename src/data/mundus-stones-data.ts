/**
 * Mundus Stones complete data including Divines scaling
 * Based on UESP wiki data
 */

export interface DivinesScaling {
  pieces: number; // 0-8 Divines armor pieces
  normal: number;
  fine: number;
  superior: number;
  epic: number;
  legendary: number;
}

export interface MundusEffect {
  type: string;
  baseValue: string;
  isPercentage: boolean;
  divinesScaling: DivinesScaling[];
}

export interface MundusStone {
  name: string;
  effects: MundusEffect[];
  locations: {
    aldmeriDominion: string;
    daggerfallCovenant: string;
    ebonheartPact: string;
    cyrodiil: string;
  };
  url: string;
}

// Complete mundus stones data with full Divines scaling
export const MUNDUS_STONES_DATA: MundusStone[] = [
  {
    name: 'The Apprentice',
    effects: [{
      type: 'Spell Power Increase',
      baseValue: '238',
      isPercentage: false,
      divinesScaling: [
        { pieces: 0, normal: 238, fine: 238, superior: 238, epic: 238, legendary: 238 },
        { pieces: 1, normal: 250, fine: 252, superior: 254, epic: 257, legendary: 259 },
        { pieces: 2, normal: 262, fine: 267, superior: 271, epic: 276, legendary: 281 },
        { pieces: 3, normal: 274, fine: 281, superior: 288, epic: 295, legendary: 302 },
        { pieces: 4, normal: 286, fine: 296, superior: 305, epic: 315, legendary: 324 },
        { pieces: 5, normal: 298, fine: 310, superior: 322, epic: 334, legendary: 346 },
        { pieces: 6, normal: 310, fine: 325, superior: 339, epic: 353, legendary: 367 },
        { pieces: 7, normal: 322, fine: 339, superior: 356, epic: 372, legendary: 389 },
        { pieces: 8, normal: 335, fine: 354, superior: 373, epic: 392, legendary: 411 },
      ],
    }],
    locations: {
      aldmeriDominion: "Reaper's March",
      daggerfallCovenant: 'Bangkorai',
      ebonheartPact: 'The Rift',
      cyrodiil: 'Cyrodiil',
    },
    url: 'https://en.uesp.net/wiki/Online:The_Apprentice_(Mundus_Stone)',
  },
  {
    name: 'The Atronach',
    effects: [{
      type: 'Magicka Recovery',
      baseValue: '310',
      isPercentage: false,
      divinesScaling: [
        { pieces: 0, normal: 310, fine: 310, superior: 310, epic: 310, legendary: 310 },
        { pieces: 1, normal: 325, fine: 328, superior: 332, epic: 335, legendary: 338 },
        { pieces: 2, normal: 341, fine: 347, superior: 354, epic: 360, legendary: 366 },
        { pieces: 3, normal: 357, fine: 366, superior: 376, epic: 385, legendary: 394 },
        { pieces: 4, normal: 373, fine: 385, superior: 398, epic: 410, legendary: 422 },
        { pieces: 5, normal: 389, fine: 404, superior: 420, epic: 435, legendary: 451 },
        { pieces: 6, normal: 404, fine: 423, superior: 442, epic: 460, legendary: 479 },
        { pieces: 7, normal: 420, fine: 442, superior: 464, epic: 485, legendary: 507 },
        { pieces: 8, normal: 436, fine: 461, superior: 486, epic: 510, legendary: 535 },
      ],
    }],
    locations: {
      aldmeriDominion: 'Greenshade',
      daggerfallCovenant: 'Rivenspire',
      ebonheartPact: 'Shadowfen',
      cyrodiil: 'Cyrodiil',
    },
    url: 'https://en.uesp.net/wiki/Online:The_Atronach_(Mundus_Stone)',
  },
  {
    name: 'The Lady',
    effects: [{
      type: 'Physical Resistance and Spell Resistance',
      baseValue: '2744',
      isPercentage: false,
      divinesScaling: [
        { pieces: 0, normal: 2744, fine: 2744, superior: 2744, epic: 2744, legendary: 2744 },
        { pieces: 1, normal: 2883, fine: 2911, superior: 2938, epic: 2966, legendary: 2993 },
        { pieces: 2, normal: 3023, fine: 3078, superior: 3133, epic: 3188, legendary: 3243 },
        { pieces: 3, normal: 3163, fine: 3246, superior: 3328, epic: 3410, legendary: 3493 },
        { pieces: 4, normal: 3303, fine: 3413, superior: 3523, epic: 3633, legendary: 3742 },
        { pieces: 5, normal: 3443, fine: 3580, superior: 3718, epic: 3855, legendary: 3992 },
        { pieces: 6, normal: 3583, fine: 3748, superior: 3912, epic: 4077, legendary: 4242 },
        { pieces: 7, normal: 3723, fine: 3915, superior: 4107, epic: 4299, legendary: 4491 },
        { pieces: 8, normal: 3863, fine: 4083, superior: 4302, epic: 4522, legendary: 4741 },
      ],
    }],
    locations: {
      aldmeriDominion: 'Auridon',
      daggerfallCovenant: 'Glenumbra',
      ebonheartPact: 'Stonefalls',
      cyrodiil: 'Cyrodiil',
    },
    url: 'https://en.uesp.net/wiki/Online:The_Lady_(Mundus_Stone)',
  },
  {
    name: 'The Lord',
    effects: [{
      type: 'Maximum Health',
      baseValue: '2225',
      isPercentage: false,
      divinesScaling: [
        { pieces: 0, normal: 2225, fine: 2225, superior: 2225, epic: 2225, legendary: 2225 },
        { pieces: 1, normal: 2338, fine: 2360, superior: 2382, epic: 2405, legendary: 2427 },
        { pieces: 2, normal: 2451, fine: 2496, superior: 2540, epic: 2585, legendary: 2629 },
        { pieces: 3, normal: 2565, fine: 2632, superior: 2698, epic: 2765, legendary: 2832 },
        { pieces: 4, normal: 2678, fine: 2767, superior: 2856, epic: 2945, legendary: 3034 },
        { pieces: 5, normal: 2792, fine: 2903, superior: 3014, epic: 3126, legendary: 3237 },
        { pieces: 6, normal: 2905, fine: 3039, superior: 3172, epic: 3306, legendary: 3439 },
        { pieces: 7, normal: 3019, fine: 3175, superior: 3330, epic: 3486, legendary: 3642 },
        { pieces: 8, normal: 3132, fine: 3310, superior: 3488, epic: 3666, legendary: 3844 },
      ],
    }],
    locations: {
      aldmeriDominion: 'Grahtwood',
      daggerfallCovenant: 'Stormhaven',
      ebonheartPact: 'Deshaan',
      cyrodiil: '†',
    },
    url: 'https://en.uesp.net/wiki/Online:The_Lord_(Mundus_Stone)',
  },
  {
    name: 'The Lover',
    effects: [{
      type: 'Spell and Physical Penetration',
      baseValue: '2744',
      isPercentage: false,
      divinesScaling: [
        { pieces: 0, normal: 2744, fine: 2744, superior: 2744, epic: 2744, legendary: 2744 },
        { pieces: 1, normal: 2883, fine: 2911, superior: 2938, epic: 2966, legendary: 2993 },
        { pieces: 2, normal: 3023, fine: 3078, superior: 3133, epic: 3188, legendary: 3243 },
        { pieces: 3, normal: 3163, fine: 3246, superior: 3328, epic: 3410, legendary: 3493 },
        { pieces: 4, normal: 3303, fine: 3413, superior: 3523, epic: 3633, legendary: 3742 },
        { pieces: 5, normal: 3443, fine: 3580, superior: 3718, epic: 3855, legendary: 3992 },
        { pieces: 6, normal: 3583, fine: 3748, superior: 3912, epic: 4077, legendary: 4242 },
        { pieces: 7, normal: 3723, fine: 3915, superior: 4107, epic: 4299, legendary: 4491 },
        { pieces: 8, normal: 3863, fine: 4083, superior: 4302, epic: 4522, legendary: 4741 },
      ],
    }],
    locations: {
      aldmeriDominion: 'Auridon',
      daggerfallCovenant: 'Glenumbra',
      ebonheartPact: 'Stonefalls',
      cyrodiil: 'Cyrodiil',
    },
    url: 'https://en.uesp.net/wiki/Online:The_Lover_(Mundus_Stone)',
  },
  {
    name: 'The Mage',
    effects: [{
      type: 'Maximum Magicka',
      baseValue: '2023',
      isPercentage: false,
      divinesScaling: [
        { pieces: 0, normal: 2023, fine: 2023, superior: 2023, epic: 2023, legendary: 2023 },
        { pieces: 1, normal: 2126, fine: 2146, superior: 2166, epic: 2186, legendary: 2207 },
        { pieces: 2, normal: 2229, fine: 2269, superior: 2310, epic: 2350, legendary: 2391 },
        { pieces: 3, normal: 2332, fine: 2393, superior: 2453, epic: 2514, legendary: 2575 },
        { pieces: 4, normal: 2435, fine: 2516, superior: 2597, epic: 2678, legendary: 2759 },
        { pieces: 5, normal: 2538, fine: 2640, superior: 2741, epic: 2842, legendary: 2943 },
        { pieces: 6, normal: 2642, fine: 2763, superior: 2884, epic: 3006, legendary: 3127 },
        { pieces: 7, normal: 2745, fine: 2886, superior: 3028, epic: 3170, legendary: 3311 },
        { pieces: 8, normal: 2848, fine: 3010, superior: 3172, epic: 3333, legendary: 3495 },
      ],
    }],
    locations: {
      aldmeriDominion: 'Grahtwood',
      daggerfallCovenant: 'Stormhaven',
      ebonheartPact: 'Deshaan',
      cyrodiil: 'Cyrodiil',
    },
    url: 'https://en.uesp.net/wiki/Online:The_Mage_(Mundus_Stone)',
  },
  {
    name: 'The Ritual',
    effects: [{
      type: 'Increase Healing Done',
      baseValue: '8%',
      isPercentage: true,
      divinesScaling: [
        { pieces: 0, normal: 8, fine: 8, superior: 8, epic: 8, legendary: 8 },
        { pieces: 1, normal: 8, fine: 8, superior: 8, epic: 8, legendary: 8 },
        { pieces: 2, normal: 8, fine: 8, superior: 9, epic: 9, legendary: 9 },
        { pieces: 3, normal: 9, fine: 9, superior: 9, epic: 9, legendary: 10 },
        { pieces: 4, normal: 9, fine: 9, superior: 10, epic: 10, legendary: 10 },
        { pieces: 5, normal: 10, fine: 10, superior: 10, epic: 11, legendary: 11 },
        { pieces: 6, normal: 10, fine: 10, superior: 11, epic: 11, legendary: 12 },
        { pieces: 7, normal: 10, fine: 11, superior: 11, epic: 12, legendary: 13 },
        { pieces: 8, normal: 11, fine: 11, superior: 12, epic: 13, legendary: 13 },
      ],
    }],
    locations: {
      aldmeriDominion: 'Malabal Tor',
      daggerfallCovenant: "Alik'r Desert",
      ebonheartPact: 'Eastmarch',
      cyrodiil: 'Cyrodiil',
    },
    url: 'https://en.uesp.net/wiki/Online:The_Ritual_(Mundus_Stone)',
  },
  {
    name: 'The Serpent',
    effects: [{
      type: 'Stamina Recovery',
      baseValue: '310',
      isPercentage: false,
      divinesScaling: [
        { pieces: 0, normal: 310, fine: 310, superior: 310, epic: 310, legendary: 310 },
        { pieces: 1, normal: 325, fine: 328, superior: 332, epic: 335, legendary: 338 },
        { pieces: 2, normal: 341, fine: 347, superior: 354, epic: 360, legendary: 366 },
        { pieces: 3, normal: 357, fine: 366, superior: 376, epic: 385, legendary: 394 },
        { pieces: 4, normal: 373, fine: 385, superior: 398, epic: 410, legendary: 422 },
        { pieces: 5, normal: 389, fine: 404, superior: 420, epic: 435, legendary: 451 },
        { pieces: 6, normal: 404, fine: 423, superior: 442, epic: 460, legendary: 479 },
        { pieces: 7, normal: 420, fine: 442, superior: 464, epic: 485, legendary: 507 },
        { pieces: 8, normal: 436, fine: 461, superior: 486, epic: 510, legendary: 535 },
      ],
    }],
    locations: {
      aldmeriDominion: 'Greenshade',
      daggerfallCovenant: 'Rivenspire',
      ebonheartPact: 'Shadowfen',
      cyrodiil: 'Cyrodiil',
    },
    url: 'https://en.uesp.net/wiki/Online:The_Serpent_(Mundus_Stone)',
  },
  {
    name: 'The Shadow',
    effects: [{
      type: 'Critical Damage and Critical Healing',
      baseValue: '11%',
      isPercentage: true,
      divinesScaling: [
        { pieces: 0, normal: 11, fine: 11, superior: 11, epic: 11, legendary: 11 },
        { pieces: 1, normal: 11, fine: 11, superior: 11, epic: 11, legendary: 12 },
        { pieces: 2, normal: 12, fine: 12, superior: 12, epic: 12, legendary: 13 },
        { pieces: 3, normal: 12, fine: 13, superior: 13, epic: 13, legendary: 14 },
        { pieces: 4, normal: 13, fine: 13, superior: 14, epic: 14, legendary: 15 },
        { pieces: 5, normal: 13, fine: 14, superior: 14, epic: 15, legendary: 16 },
        { pieces: 6, normal: 14, fine: 15, superior: 15, epic: 16, legendary: 17 },
        { pieces: 7, normal: 14, fine: 15, superior: 16, epic: 17, legendary: 18 },
        { pieces: 8, normal: 15, fine: 16, superior: 17, epic: 18, legendary: 19 },
      ],
    }],
    locations: {
      aldmeriDominion: 'Greenshade',
      daggerfallCovenant: 'Rivenspire',
      ebonheartPact: 'Shadowfen',
      cyrodiil: 'Cyrodiil',
    },
    url: 'https://en.uesp.net/wiki/Online:The_Shadow_(Mundus_Stone)',
  },
  {
    name: 'The Steed',
    effects: [
      {
        type: 'Health Recovery',
        baseValue: '238',
        isPercentage: false,
        divinesScaling: [
          { pieces: 0, normal: 238, fine: 238, superior: 238, epic: 238, legendary: 238 },
          { pieces: 1, normal: 250, fine: 252, superior: 254, epic: 257, legendary: 259 },
          { pieces: 2, normal: 262, fine: 267, superior: 271, epic: 276, legendary: 281 },
          { pieces: 3, normal: 274, fine: 281, superior: 288, epic: 295, legendary: 302 },
          { pieces: 4, normal: 286, fine: 296, superior: 305, epic: 315, legendary: 324 },
          { pieces: 5, normal: 298, fine: 310, superior: 322, epic: 334, legendary: 346 },
          { pieces: 6, normal: 310, fine: 325, superior: 339, epic: 353, legendary: 367 },
          { pieces: 7, normal: 322, fine: 339, superior: 356, epic: 372, legendary: 389 },
          { pieces: 8, normal: 335, fine: 354, superior: 373, epic: 392, legendary: 411 },
        ],
      },
      {
        type: 'Movement Speed',
        baseValue: '10%',
        isPercentage: true,
        divinesScaling: [
          { pieces: 0, normal: 10, fine: 10, superior: 10, epic: 10, legendary: 10 },
          { pieces: 1, normal: 10, fine: 10, superior: 10, epic: 10, legendary: 10 },
          { pieces: 2, normal: 11, fine: 11, superior: 11, epic: 11, legendary: 11 },
          { pieces: 3, normal: 11, fine: 11, superior: 12, epic: 12, legendary: 12 },
          { pieces: 4, normal: 12, fine: 12, superior: 12, epic: 13, legendary: 13 },
          { pieces: 5, normal: 12, fine: 13, superior: 13, epic: 14, legendary: 14 },
          { pieces: 6, normal: 13, fine: 13, superior: 14, epic: 14, legendary: 15 },
          { pieces: 7, normal: 13, fine: 14, superior: 14, epic: 15, legendary: 16 },
          { pieces: 8, normal: 14, fine: 14, superior: 15, epic: 16, legendary: 17 },
        ],
      },
    ],
    locations: {
      aldmeriDominion: "Reaper's March",
      daggerfallCovenant: 'Bangkorai',
      ebonheartPact: 'The Rift',
      cyrodiil: 'Cyrodiil',
    },
    url: 'https://en.uesp.net/wiki/Online:The_Steed_(Mundus_Stone)',
  },
  {
    name: 'The Thief',
    effects: [{
      type: 'Critical Chance',
      baseValue: '1212',
      isPercentage: false,
      divinesScaling: [
        { pieces: 0, normal: 1212, fine: 1212, superior: 1212, epic: 1212, legendary: 1212 },
        { pieces: 1, normal: 1273, fine: 1285, superior: 1298, epic: 1310, legendary: 1322 },
        { pieces: 2, normal: 1335, fine: 1359, superior: 1384, epic: 1408, legendary: 1432 },
        { pieces: 3, normal: 1397, fine: 1433, superior: 1470, epic: 1506, legendary: 1542 },
        { pieces: 4, normal: 1459, fine: 1507, superior: 1556, epic: 1604, legendary: 1653 },
        { pieces: 5, normal: 1521, fine: 1581, superior: 1642, epic: 1702, legendary: 1763 },
        { pieces: 6, normal: 1582, fine: 1655, superior: 1728, epic: 1801, legendary: 1873 },
        { pieces: 7, normal: 1644, fine: 1729, superior: 1814, epic: 1899, legendary: 1984 },
        { pieces: 8, normal: 1706, fine: 1803, superior: 1900, epic: 1997, legendary: 2094 },
      ],
    }],
    locations: {
      aldmeriDominion: 'Malabal Tor',
      daggerfallCovenant: "Alik'r Desert",
      ebonheartPact: 'Eastmarch',
      cyrodiil: 'Cyrodiil',
    },
    url: 'https://en.uesp.net/wiki/Online:The_Thief_(Mundus_Stone)',
  },
  {
    name: 'The Tower',
    effects: [{
      type: 'Maximum Stamina',
      baseValue: '2023',
      isPercentage: false,
      divinesScaling: [
        { pieces: 0, normal: 2023, fine: 2023, superior: 2023, epic: 2023, legendary: 2023 },
        { pieces: 1, normal: 2126, fine: 2146, superior: 2166, epic: 2186, legendary: 2207 },
        { pieces: 2, normal: 2229, fine: 2269, superior: 2310, epic: 2350, legendary: 2391 },
        { pieces: 3, normal: 2332, fine: 2393, superior: 2453, epic: 2514, legendary: 2575 },
        { pieces: 4, normal: 2435, fine: 2516, superior: 2597, epic: 2678, legendary: 2759 },
        { pieces: 5, normal: 2538, fine: 2640, superior: 2741, epic: 2842, legendary: 2943 },
        { pieces: 6, normal: 2642, fine: 2763, superior: 2884, epic: 3006, legendary: 3127 },
        { pieces: 7, normal: 2745, fine: 2886, superior: 3028, epic: 3170, legendary: 3311 },
        { pieces: 8, normal: 2848, fine: 3010, superior: 3172, epic: 3333, legendary: 3495 },
      ],
    }],
    locations: {
      aldmeriDominion: 'Grahtwood',
      daggerfallCovenant: 'Stormhaven',
      ebonheartPact: 'Deshaan',
      cyrodiil: 'Cyrodiil',
    },
    url: 'https://en.uesp.net/wiki/Online:The_Tower_(Mundus_Stone)',
  },
  {
    name: 'The Warrior',
    effects: [{
      type: 'Weapon Damage Increase',
      baseValue: '238',
      isPercentage: false,
      divinesScaling: [
        { pieces: 0, normal: 238, fine: 238, superior: 238, epic: 238, legendary: 238 },
        { pieces: 1, normal: 250, fine: 252, superior: 254, epic: 257, legendary: 259 },
        { pieces: 2, normal: 262, fine: 267, superior: 271, epic: 276, legendary: 281 },
        { pieces: 3, normal: 274, fine: 281, superior: 288, epic: 295, legendary: 302 },
        { pieces: 4, normal: 286, fine: 296, superior: 305, epic: 315, legendary: 324 },
        { pieces: 5, normal: 298, fine: 310, superior: 322, epic: 334, legendary: 346 },
        { pieces: 6, normal: 310, fine: 325, superior: 339, epic: 353, legendary: 367 },
        { pieces: 7, normal: 322, fine: 339, superior: 356, epic: 372, legendary: 389 },
        { pieces: 8, normal: 335, fine: 354, superior: 373, epic: 392, legendary: 411 },
      ],
    }],
    locations: {
      aldmeriDominion: 'Malabal Tor',
      daggerfallCovenant: "Alik'r Desert",
      ebonheartPact: 'Eastmarch',
      cyrodiil: 'Cyrodiil',
    },
    url: 'https://en.uesp.net/wiki/Online:The_Warrior_(Mundus_Stone)',
  },
];
