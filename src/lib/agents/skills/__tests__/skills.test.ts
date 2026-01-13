import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const skillsDir = path.join(__dirname, '..');

const requiredPlanningSkills = [
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

describe('Skill Files', () => {
  it('all required planning skill files exist', () => {
    for (const skill of requiredPlanningSkills) {
      const filePath = path.join(skillsDir, `${skill}.skill.md`);
      expect(fs.existsSync(filePath), `Missing skill: ${skill}`).toBe(true);
    }
  });

  it('skill files are not empty', () => {
    for (const skill of requiredPlanningSkills) {
      const filePath = path.join(skillsDir, `${skill}.skill.md`);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.length, `Empty skill: ${skill}`).toBeGreaterThan(100);
    }
  });

  it('skill files have proper markdown structure', () => {
    for (const skill of requiredPlanningSkills) {
      const filePath = path.join(skillsDir, `${skill}.skill.md`);
      const content = fs.readFileSync(filePath, 'utf-8');
      // Should have at least one heading
      expect(content, `No heading in: ${skill}`).toMatch(/^#/m);
    }
  });

  it('orchestrator skill mentions delegation', () => {
    const content = fs.readFileSync(path.join(skillsDir, 'orchestrator.skill.md'), 'utf-8');
    expect(content.toLowerCase()).toMatch(/delegat/);
  });

  it('user-interview skill mentions requirements', () => {
    const content = fs.readFileSync(path.join(skillsDir, 'user-interview.skill.md'), 'utf-8');
    expect(content.toLowerCase()).toMatch(/requirement/);
  });

  it('principal-developer skill mentions sub-agents', () => {
    const content = fs.readFileSync(path.join(skillsDir, 'principal-developer.skill.md'), 'utf-8');
    expect(content.toLowerCase()).toMatch(/agent/);
  });
});
