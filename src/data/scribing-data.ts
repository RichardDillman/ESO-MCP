/**
 * ESO Scribing System Data
 * Grimoires, Focus Scripts, Affix Scripts, and Signature Scripts
 */

export interface Grimoire {
  name: string;
  type: string;
  base_behavior: string;
  allowed_focus: string[];
  allowed_affix: string[];
  allowed_signature: string[];
  restrictions: string[];
}

export interface FocusScript {
  id: string;
  role: string;
  adds: string;
  class_restriction: string | null;
}

export interface AffixScript {
  id: string;
  adds: string;
  restriction: string | null;
}

export interface SignatureScript {
  id: string;
  effect: string;
  restriction: string[] | null;
}

export interface ScribedSkill {
  grimoire: string;
  focus: string;
  affix: string;
  signature: string;
  isValid: boolean;
  errors: string[];
}

export const GRIMOIRES: Grimoire[] = [
  {
    name: "Vault",
    type: "mobility",
    base_behavior: "Teleport or dash forward",
    allowed_focus: ["mobility", "stealth", "agility"],
    allowed_affix: ["utility", "light_damage"],
    allowed_signature: ["piercing_stride", "windstep_retreat"],
    restrictions: ["no_heavy_cc_signatures"]
  },
  {
    name: "Elemental Explosion",
    type: "aoe_damage",
    base_behavior: "Point-blank explosion with delay",
    allowed_focus: ["damage", "elemental"],
    allowed_affix: ["any_damage"],
    allowed_signature: ["explosive_finale"],
    restrictions: ["no_healing_signatures"]
  },
  {
    name: "Torchbearer",
    type: "dot_damage",
    base_behavior: "Ignites an enemy and applies burning DoT",
    allowed_focus: ["damage", "elemental"],
    allowed_affix: ["dot_only"],
    allowed_signature: ["rending_volley"],
    restrictions: ["no_tank_signatures"]
  },
  {
    name: "Trample",
    type: "mobility_damage",
    base_behavior: "Charge forward and deal physical damage",
    allowed_focus: ["damage", "agility"],
    allowed_affix: ["physical_only"],
    allowed_signature: ["crushing_sweep"],
    restrictions: ["no_ranged_signatures"]
  },
  {
    name: "Soul Burst",
    type: "utility_damage",
    base_behavior: "Damage plus optional utility effect",
    allowed_focus: ["damage", "utility"],
    allowed_affix: ["any"],
    allowed_signature: ["cephaliarch_judgment"],
    restrictions: []
  },
  {
    name: "Grand Healing",
    type: "healing_aoe",
    base_behavior: "Ground-targeted heal over time",
    allowed_focus: ["healing"],
    allowed_affix: ["healing_only"],
    allowed_signature: ["healing_chorus", "guardians_rally"],
    restrictions: ["no_damage_signatures"]
  },
  {
    name: "Shield Throw",
    type: "ranged_physical",
    base_behavior: "Throw shield that ricochets between enemies",
    allowed_focus: ["tank", "damage"],
    allowed_affix: ["physical", "utility"],
    allowed_signature: ["bulwark_guard"],
    restrictions: ["no_healing_signatures"]
  },
  {
    name: "Rune of Displacement",
    type: "utility_pull",
    base_behavior: "Place rune that pulls enemies and applies DoT",
    allowed_focus: ["utility", "cc"],
    allowed_affix: ["pull_based"],
    allowed_signature: ["binding_arrow", "burning_chains"],
    restrictions: ["no_healing_signatures"]
  },
  {
    name: "Starfall",
    type: "ranged_aoe",
    base_behavior: "Delayed meteor-like AoE strike",
    allowed_focus: ["damage", "elemental"],
    allowed_affix: ["aoe_only"],
    allowed_signature: ["explosive_finale"],
    restrictions: []
  },
  {
    name: "Warding Glyph",
    type: "defensive_buff",
    base_behavior: "Applies damage shield with defensive effects",
    allowed_focus: ["tank", "defense"],
    allowed_affix: ["shields"],
    allowed_signature: ["immovable_bastion"],
    restrictions: ["no_damage_affix"]
  },
  {
    name: "Stonespike",
    type: "ranged_dot",
    base_behavior: "Throw a stone that applies bleed or physical DoT",
    allowed_focus: ["damage", "dot"],
    allowed_affix: ["bleed_only", "physical"],
    allowed_signature: ["rending_volley"],
    restrictions: ["no_healing_affix"]
  }
];

export const FOCUS_SCRIPTS: FocusScript[] = [
  { id: "fell_focus", role: "damage", adds: "weapon/spell damage buff", class_restriction: null },
  { id: "mending_focus", role: "healing", adds: "healing conversion and boost", class_restriction: null },
  { id: "bulwark_focus", role: "tank", adds: "minor resolve or mitigation", class_restriction: null },
  { id: "stealth_focus", role: "stealth", adds: "invisibility or detection removal", class_restriction: null },
  { id: "agility_focus", role: "stamina", adds: "stamina cost or restore", class_restriction: null },
  { id: "sorcery_focus", role: "magicka", adds: "magicka cost or restore", class_restriction: null },
  { id: "compulsion_focus", role: "crowd_control", adds: "stun/snare/offbalance", class_restriction: null },
  { id: "elemental_focus", role: "elemental", adds: "adds flame/shock/frost/magic type", class_restriction: null },
  { id: "rage_focus", role: "berserk", adds: "minor berserk or scaling damage", class_restriction: null },
  { id: "cycle_focus", role: "execute", adds: "bonus damage to low health", class_restriction: null },
  { id: "arcanist_focus", role: "class_arcanist", adds: "crux generation and cephaliarch effects", class_restriction: "arcanist" }
];

export const AFFIX_SCRIPTS: AffixScript[] = [
  { id: "bleeding_edge", adds: "bleed_dot", restriction: "physical_or_bleed" },
  { id: "shocking_burst", adds: "shock_aoe", restriction: null },
  { id: "flame_sigil", adds: "flame_damage", restriction: null },
  { id: "chilling_rune", adds: "frost_damage_and_snare", restriction: null },
  { id: "darkened_soul", adds: "magic_dot", restriction: null },
  { id: "corrosive_spores", adds: "armor_reduction", restriction: null },
  { id: "stormlash", adds: "chain_lightning", restriction: null },
  { id: "restorative_grace", adds: "hot", restriction: null },
  { id: "purifying_light", adds: "cleanse_or_burst_heal", restriction: null },
  { id: "guardians_boon", adds: "minor_protection_and_heal", restriction: null },
  { id: "redeemers_touch", adds: "damage_to_heal_conversion", restriction: null },
  { id: "challengers_mark", adds: "taunt", restriction: "tank" },
  { id: "defiant_ward", adds: "shield", restriction: null },
  { id: "siphoning_shade", adds: "resource_drain", restriction: null },
  { id: "immovable_stone", adds: "cc_immunity", restriction: null },
  { id: "crushing_gravity", adds: "pull_or_knockdown", restriction: "only_pull_grimoires" },
  { id: "cephaliarch_flare", adds: "generate_1_crux", restriction: "arcanist" },
  { id: "tomebearers_lash", adds: "bonus_damage_at_3_crux", restriction: "arcanist" },
  { id: "draconic_fortitude", adds: "dk_heal_or_armor", restriction: "dragonknight" },
  { id: "stormcalling_tether", adds: "shock_tether", restriction: "sorcerer" },
  { id: "frost_guardian_bite", adds: "frost_animal_proc", restriction: "warden" },
  { id: "shadowed_precision", adds: "crit_buff_or_minor_berserk", restriction: "nightblade" }
];

export const SIGNATURE_SCRIPTS: SignatureScript[] = [
  { id: "piercing_stride", effect: "gap_closer_with_penetration", restriction: ["2h", "dw", "1hshield"] },
  { id: "crushing_sweep", effect: "cone_cleave", restriction: ["melee"] },
  { id: "rebounding_frost", effect: "ricochet_projectile", restriction: ["ranged"] },
  { id: "explosive_finale", effect: "large_delayed_aoe", restriction: null },
  { id: "healing_chorus", effect: "group_aoe_heal", restriction: null },
  { id: "guardians_rally", effect: "burst_heal_plus_minor_courage", restriction: ["support"] },
  { id: "bulwark_guard", effect: "shield_plus_taunt", restriction: ["tank"] },
  { id: "immovable_bastion", effect: "massive_shield_and_cc_immunity", restriction: ["heavy_armor"] },
  { id: "windstep_retreat", effect: "dodge_backwards_and_cleanse", restriction: ["bow"] },
  { id: "rending_volley", effect: "stacking_dot_like_endless_hail", restriction: ["bow"] },
  { id: "siphoning_blade", effect: "steal_resources_on_hit", restriction: ["nightblade"] },
  { id: "draconic_smash", effect: "fiery_slam", restriction: ["dragonknight"] },
  { id: "frost_gale", effect: "frost_aoe", restriction: ["warden"] },
  { id: "lightning_sunder", effect: "sorc_lightning_burst", restriction: ["sorcerer"] },
  { id: "cephaliarch_judgment", effect: "arcanist_crux_finisher", restriction: ["arcanist"] },
  { id: "holy_benediction", effect: "templar_burst_heal", restriction: ["templar"] },
  { id: "burning_chains", effect: "dk_pull", restriction: ["dragonknight"] },
  { id: "silvered_assault", effect: "fighters_guild_holy_finisher", restriction: ["fighters_guild"] },
  { id: "binding_arrow", effect: "root_and_immobilize", restriction: ["bow"] }
];

/**
 * Validate a scribed skill combination
 */
export function validateScribedSkill(
  grimoire: string,
  focus: string,
  affix: string,
  signature: string,
  playerClass?: string
): ScribedSkill {
  const errors: string[] = [];
  let isValid = true;

  // Find the grimoire
  const grimoireData = GRIMOIRES.find(g => g.name.toLowerCase() === grimoire.toLowerCase());
  if (!grimoireData) {
    errors.push(`Unknown grimoire: ${grimoire}`);
    return { grimoire, focus, affix, signature, isValid: false, errors };
  }

  // Find the scripts
  const focusData = FOCUS_SCRIPTS.find(f => f.id === focus);
  const affixData = AFFIX_SCRIPTS.find(a => a.id === affix);
  const signatureData = SIGNATURE_SCRIPTS.find(s => s.id === signature);

  // Validate focus
  if (!focusData) {
    errors.push(`Unknown focus script: ${focus}`);
    isValid = false;
  } else {
    // Check class restriction
    if (focusData.class_restriction && playerClass && focusData.class_restriction !== playerClass.toLowerCase()) {
      errors.push(`Focus "${focus}" requires ${focusData.class_restriction} class`);
      isValid = false;
    }

    // Map focus roles to grimoire categories
    const roleMapping: { [key: string]: string[] } = {
      'damage': ['fell_focus', 'rage_focus', 'cycle_focus', 'elemental_focus'],
      'healing': ['mending_focus'],
      'tank': ['bulwark_focus'],
      'stealth': ['stealth_focus'],
      'agility': ['agility_focus'],
      'mobility': ['agility_focus', 'stealth_focus'],
      'elemental': ['elemental_focus'],
      'utility': ['compulsion_focus', 'sorcery_focus', 'agility_focus'],
      'cc': ['compulsion_focus'],
    };

    // Check if focus is compatible with grimoire
    let isCompatible = false;
    for (const allowedCategory of grimoireData.allowed_focus) {
      if (roleMapping[allowedCategory]?.includes(focusData.id)) {
        isCompatible = true;
        break;
      }
    }

    if (!isCompatible) {
      errors.push(`Focus "${focus}" (${focusData.role}) not compatible with grimoire "${grimoire}" (accepts: ${grimoireData.allowed_focus.join(', ')})`);
      isValid = false;
    }
  }

  // Validate affix
  if (!affixData) {
    errors.push(`Unknown affix script: ${affix}`);
    isValid = false;
  } else {
    // Check class restriction
    if (affixData.restriction && playerClass) {
      if (affixData.restriction === 'arcanist' && playerClass.toLowerCase() !== 'arcanist') {
        errors.push(`Affix "${affix}" requires Arcanist class`);
        isValid = false;
      }
      if (affixData.restriction === 'dragonknight' && playerClass.toLowerCase() !== 'dragonknight') {
        errors.push(`Affix "${affix}" requires Dragonknight class`);
        isValid = false;
      }
      // Add more class checks as needed
    }
  }

  // Validate signature
  if (!signatureData) {
    errors.push(`Unknown signature script: ${signature}`);
    isValid = false;
  } else {
    // Check if grimoire allows this signature
    if (!grimoireData.allowed_signature.includes(signatureData.id)) {
      errors.push(`Grimoire "${grimoire}" does not allow signature: ${signature}`);
      isValid = false;
    }
    // Check class restriction
    if (signatureData.restriction && playerClass) {
      const classRestrictions = ['arcanist', 'dragonknight', 'sorcerer', 'warden', 'nightblade', 'templar'];
      const hasClassRestriction = signatureData.restriction.some(r => classRestrictions.includes(r));
      if (hasClassRestriction && !signatureData.restriction.includes(playerClass.toLowerCase())) {
        errors.push(`Signature "${signature}" requires one of: ${signatureData.restriction.join(', ')}`);
        isValid = false;
      }
    }
  }

  return {
    grimoire,
    focus,
    affix,
    signature,
    isValid,
    errors
  };
}

/**
 * Get description of a scribed skill
 */
export function describeScribedSkill(
  grimoire: string,
  focus: string,
  affix: string,
  signature: string
): string {
  const grimoireData = GRIMOIRES.find(g => g.name.toLowerCase() === grimoire.toLowerCase());
  const focusData = FOCUS_SCRIPTS.find(f => f.id === focus);
  const affixData = AFFIX_SCRIPTS.find(a => a.id === affix);
  const signatureData = SIGNATURE_SCRIPTS.find(s => s.id === signature);

  if (!grimoireData || !focusData || !affixData || !signatureData) {
    return 'Invalid scribed skill combination';
  }

  return `${grimoireData.name} (Scribed)
Base: ${grimoireData.base_behavior}
Focus: ${focusData.adds}
Affix: ${affixData.adds}
Signature: ${signatureData.effect}`;
}

/**
 * Detect scribed skills in ability list
 */
export function detectScribedSkills(abilities: string[]): {
  ability: string;
  possibleGrimoire: string;
  isScribed: boolean;
}[] {
  const results: { ability: string; possibleGrimoire: string; isScribed: boolean }[] = [];

  for (const ability of abilities) {
    const lowerAbility = ability.toLowerCase();

    // Check if ability name contains grimoire keywords
    for (const grimoire of GRIMOIRES) {
      const grimoireName = grimoire.name.toLowerCase();
      if (lowerAbility.includes(grimoireName) ||
          lowerAbility.includes('scribed') ||
          lowerAbility.includes('scribing')) {
        results.push({
          ability,
          possibleGrimoire: grimoire.name,
          isScribed: true
        });
        break;
      }
    }
  }

  return results;
}
