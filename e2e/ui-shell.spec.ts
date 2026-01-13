import { test, expect } from '@playwright/test';

test.describe('Experiment Builder UI', () => {
  test('displays 3-panel layout', async ({ page }) => {
    await page.goto('/');

    // Check left sidebar exists with New Experiment button
    await expect(page.getByRole('button', { name: /New Experiment/i })).toBeVisible();

    // Without an experiment selected, center shows empty state
    await expect(page.getByText('Select or create an experiment to start')).toBeVisible();

    // Check right agent panel exists with section headers
    await expect(page.getByRole('heading', { name: 'Agents' })).toBeVisible();
  });

  test('shows empty state when no experiments', async ({ page }) => {
    await page.goto('/');

    // Check that sidebar exists
    const sidebar = page.locator('[class*="border-r"]');
    await expect(sidebar).toBeVisible();
  });

  test('displays agent phase sections', async ({ page }) => {
    await page.goto('/');

    // Check that planning, code generation, and testing sections exist
    // Using role selectors for headings to avoid matching agent names
    const agentPanel = page.locator('[class*="w-72"]');
    await expect(agentPanel).toBeVisible();

    // Look for phase category headers (h3 elements)
    await expect(agentPanel.getByRole('heading', { name: 'Planning' })).toBeVisible();
    await expect(agentPanel.getByRole('heading', { name: 'Code Generation' })).toBeVisible();
    await expect(agentPanel.getByRole('heading', { name: 'Testing' })).toBeVisible();
  });

  test('displays planning agents in agent panel', async ({ page }) => {
    await page.goto('/');

    // Check planning agents are listed in the right panel
    const agentPanel = page.locator('[class*="w-72"]');
    await expect(agentPanel.getByText('Planning Orchestrator')).toBeVisible();
    await expect(agentPanel.getByText('User Interview Agent')).toBeVisible();
    await expect(agentPanel.getByText('UX Design Agent')).toBeVisible();
    await expect(agentPanel.getByText('Principal Developer Agent')).toBeVisible();
  });

  test('displays code generation agents', async ({ page }) => {
    await page.goto('/');

    // Check codegen agents are listed in the right panel
    const agentPanel = page.locator('[class*="w-72"]');
    await expect(agentPanel.getByText('Code Generation Orchestrator')).toBeVisible();
    await expect(agentPanel.getByText('Schema Generator Agent')).toBeVisible();
    await expect(agentPanel.getByText('Component Generator Agent')).toBeVisible();
  });

  test('displays testing agents', async ({ page }) => {
    await page.goto('/');

    // Check testing agents are listed in the right panel
    const agentPanel = page.locator('[class*="w-72"]');
    await expect(agentPanel.getByText('Test Generator Agent')).toBeVisible();
    await expect(agentPanel.getByText('Evaluator Agent')).toBeVisible();
    await expect(agentPanel.getByText('Debugger Agent')).toBeVisible();
  });

  test('chat input appears when experiment is selected', async ({ page }) => {
    await page.goto('/');

    // First create an experiment
    await page.getByRole('button', { name: /New Experiment/i }).click();
    await page.getByLabel('Name').fill('Test App');
    await page.getByRole('button', { name: 'Create Experiment' }).click();

    // Now chat input should be visible
    const input = page.getByPlaceholder('Describe the app you want to build...');
    await expect(input).toBeVisible();

    await input.fill('Test message');
    await expect(input).toHaveValue('Test message');

    // Send button should exist
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeVisible();
  });

  test('new experiment button opens dialog', async ({ page }) => {
    await page.goto('/');

    // Click New Experiment button
    await page.getByRole('button', { name: /New Experiment/i }).click();

    // Dialog should open with form fields
    await expect(page.getByRole('heading', { name: 'New Experiment' })).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel(/Description/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Experiment' })).toBeVisible();
  });

  test('can create a new experiment', async ({ page }) => {
    await page.goto('/');

    // Click New Experiment button
    await page.getByRole('button', { name: /New Experiment/i }).click();

    // Fill in the form
    await page.getByLabel('Name').fill('Test Todo App');
    await page.getByLabel(/Description/i).fill('A simple todo application');

    // Create the experiment
    await page.getByRole('button', { name: 'Create Experiment' }).click();

    // Dialog should close and experiment should appear in sidebar
    await expect(page.getByRole('heading', { name: 'New Experiment' })).not.toBeVisible();
    // Use first() since there may be multiple experiments with same name from previous test runs
    await expect(page.getByText('Test Todo App').first()).toBeVisible();
  });
});
