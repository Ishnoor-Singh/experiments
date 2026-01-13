import fs from 'fs';
import path from 'path';
import { AgentRole } from './types';

// Cache for loaded skills
const skillCache = new Map<AgentRole, string>();

/**
 * Load a skill file for a given agent role
 */
export function loadSkill(role: AgentRole): string {
  // Check cache first
  if (skillCache.has(role)) {
    return skillCache.get(role)!;
  }

  try {
    const skillPath = path.join(process.cwd(), 'src/lib/agents/skills', `${role}.skill.md`);
    const content = fs.readFileSync(skillPath, 'utf-8');
    skillCache.set(role, content);
    return content;
  } catch (error) {
    console.error(`Failed to load skill for ${role}:`, error);
    return '';
  }
}

/**
 * Load skill synchronously (for server-side use)
 */
export function loadSkillSync(role: AgentRole): string {
  return loadSkill(role);
}

/**
 * Clear the skill cache (useful for development)
 */
export function clearSkillCache(): void {
  skillCache.clear();
}

/**
 * Preload all planning skills
 */
export function preloadPlanningSkills(): void {
  const planningRoles: AgentRole[] = [
    'orchestrator',
    'user-interview',
    'ux-design',
    'frontend',
    'backend-database',
    'backend-api',
    'backend-logic',
    'backend-infra',
    'principal-developer',
  ];

  for (const role of planningRoles) {
    loadSkill(role);
  }
}
