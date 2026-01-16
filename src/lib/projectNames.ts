/**
 * Generate fun, memorable project names
 */

const adjectives = [
  "Swift",
  "Bright",
  "Cosmic",
  "Nimble",
  "Stellar",
  "Vivid",
  "Radiant",
  "Bold",
  "Clever",
  "Mystic",
  "Serene",
  "Vibrant",
  "Golden",
  "Crystal",
  "Electric",
  "Velvet",
  "Amber",
  "Coral",
  "Jade",
  "Onyx",
  "Ruby",
  "Sapphire",
  "Azure",
  "Crimson",
  "Emerald",
  "Ivory",
  "Lunar",
  "Solar",
  "Neon",
  "Quantum",
];

const nouns = [
  "Phoenix",
  "Nebula",
  "Aurora",
  "Cascade",
  "Prism",
  "Vertex",
  "Horizon",
  "Zenith",
  "Spark",
  "Wave",
  "Echo",
  "Pulse",
  "Nova",
  "Orbit",
  "Comet",
  "Galaxy",
  "Meteor",
  "Quasar",
  "Vortex",
  "Beacon",
  "Ember",
  "Frost",
  "Storm",
  "Breeze",
  "Tide",
  "Flare",
  "Glow",
  "Drift",
  "Bloom",
  "Spark",
];

/**
 * Generate a random project name like "Swift Phoenix" or "Cosmic Aurora"
 */
export function generateProjectName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}
