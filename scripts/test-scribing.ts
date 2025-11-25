#!/usr/bin/env tsx
/**
 * Test Scribing System
 */

import {
  validateScribedSkill,
  describeScribedSkill,
  GRIMOIRES,
  FOCUS_SCRIPTS,
  AFFIX_SCRIPTS,
  SIGNATURE_SCRIPTS,
} from '../src/data/scribing-data.js';

console.log('🎯 Testing ESO Scribing System\n');

// Test 1: Valid combination
console.log('=== Test 1: Valid Arcanist Scribed Skill ===');
const valid1 = validateScribedSkill(
  'Soul Burst',
  'arcanist_focus',
  'cephaliarch_flare',
  'cephaliarch_judgment',
  'arcanist'
);
console.log(`Valid: ${valid1.isValid}`);
console.log(`Errors: ${valid1.errors.length === 0 ? 'None' : valid1.errors.join(', ')}`);

const description1 = describeScribedSkill(
  'Soul Burst',
  'arcanist_focus',
  'cephaliarch_flare',
  'cephaliarch_judgment'
);
console.log(`\nDescription:\n${description1}\n`);

// Test 2: Invalid combination (wrong class)
console.log('=== Test 2: Invalid - Arcanist script on non-Arcanist ===');
const invalid1 = validateScribedSkill(
  'Soul Burst',
  'arcanist_focus',
  'cephaliarch_flare',
  'cephaliarch_judgment',
  'dragonknight'
);
console.log(`Valid: ${invalid1.isValid}`);
console.log(`Errors: ${invalid1.errors.join('\n  - ')}\n`);

// Test 3: Valid mobility skill
console.log('=== Test 3: Valid Mobility Skill ===');
const valid2 = validateScribedSkill(
  'Vault',
  'agility_focus',
  'stormlash',
  'piercing_stride'
);
console.log(`Valid: ${valid2.isValid}`);
console.log(`Errors: ${valid2.errors.length === 0 ? 'None' : valid2.errors.join(', ')}`);

const description2 = describeScribedSkill(
  'Vault',
  'agility_focus',
  'stormlash',
  'piercing_stride'
);
console.log(`\nDescription:\n${description2}\n`);

// Test 4: Invalid - incompatible signature
console.log('=== Test 4: Invalid - Incompatible Signature ===');
const invalid2 = validateScribedSkill(
  'Vault',
  'agility_focus',
  'stormlash',
  'explosive_finale' // Not allowed on Vault
);
console.log(`Valid: ${invalid2.isValid}`);
console.log(`Errors: ${invalid2.errors.join('\n  - ')}\n`);

// Test 5: List available components
console.log('=== Test 5: Available Scribing Components ===');
console.log(`Grimoires: ${GRIMOIRES.length}`);
console.log(`Focus Scripts: ${FOCUS_SCRIPTS.length}`);
console.log(`Affix Scripts: ${AFFIX_SCRIPTS.length}`);
console.log(`Signature Scripts: ${SIGNATURE_SCRIPTS.length}\n`);

// Test 6: Show grimoire compatibility
console.log('=== Test 6: Elemental Explosion Grimoire ===');
const explosion = GRIMOIRES.find(g => g.name === 'Elemental Explosion');
if (explosion) {
  console.log(`Name: ${explosion.name}`);
  console.log(`Type: ${explosion.type}`);
  console.log(`Base: ${explosion.base_behavior}`);
  console.log(`Allowed Focus: ${explosion.allowed_focus.join(', ')}`);
  console.log(`Allowed Signatures: ${explosion.allowed_signature.join(', ')}`);
  console.log(`Restrictions: ${explosion.restrictions.join(', ')}`);
}

console.log('\n✅ All scribing tests completed!');
