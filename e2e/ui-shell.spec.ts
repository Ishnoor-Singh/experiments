import { test, expect } from '@playwright/test';

test.describe('Experiment Builder UI', () => {
  test('displays 3-panel layout', async ({ page }) => {
    await page.goto('/');

    // Check left sidebar exists with New Experiment button
    await expect(page.getByRole('button', { name: /New Experiment/i })).toBeVisible();

    // Without an experiment selected, center shows welcome message
    await expect(page.getByRole('heading', { name: 'Welcome to Experiment Builder' })).toBeVisible();

    // Check right status panel exists
    await expect(page.getByRole('heading', { name: 'Status' })).toBeVisible();
  });

  test('shows empty state when no experiments', async ({ page }) => {
    await page.goto('/');

    // Check that sidebar exists by looking for the Experiments header
    await expect(page.getByText('Experiments').first()).toBeVisible();
  });

  test('displays agent phase sections', async ({ page }) => {
    await page.goto('/');

    // Check that planning, code generation, and testing sections exist
    // Look for phase category headers (h3 elements) within the Agents tab
    await expect(page.getByRole('heading', { name: 'Planning' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Code Generation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Testing' })).toBeVisible();
  });

  test('displays planning agents in agent panel', async ({ page }) => {
    await page.goto('/');

    // Check planning agents are listed
    await expect(page.getByText('Planning Orchestrator')).toBeVisible();
    await expect(page.getByText('User Interview Agent')).toBeVisible();
    await expect(page.getByText('UX Design Agent')).toBeVisible();
    await expect(page.getByText('Principal Developer Agent')).toBeVisible();
  });

  test('displays code generation agents', async ({ page }) => {
    await page.goto('/');

    // Check codegen agents are listed
    await expect(page.getByText('Code Generation Orchestrator')).toBeVisible();
    await expect(page.getByText('Schema Generator Agent')).toBeVisible();
    await expect(page.getByText('Component Generator Agent')).toBeVisible();
  });

  test('displays testing agents', async ({ page }) => {
    await page.goto('/');

    // Check testing agents are listed
    await expect(page.getByText('Test Generator Agent')).toBeVisible();
    await expect(page.getByText('Evaluator Agent')).toBeVisible();
    await expect(page.getByText('Debugger Agent')).toBeVisible();
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

  test('displays activity feed tab', async ({ page }) => {
    await page.goto('/');

    // Check that all four tabs are visible
    const agentsTab = page.getByRole('tab', { name: 'Agents' });
    const specsTab = page.getByRole('tab', { name: 'Specs' });
    const filesTab = page.getByRole('tab', { name: 'Files' });
    const activityTab = page.getByRole('tab', { name: 'Activity' });

    await expect(agentsTab).toBeVisible();
    await expect(specsTab).toBeVisible();
    await expect(filesTab).toBeVisible();
    await expect(activityTab).toBeVisible();

    // Agents tab should be active by default
    await expect(agentsTab).toHaveAttribute('aria-selected', 'true');
    await expect(activityTab).toHaveAttribute('aria-selected', 'false');

    // Click on Activity tab
    await activityTab.click();

    // Activity tab should now be active
    await expect(activityTab).toHaveAttribute('aria-selected', 'true');
    await expect(agentsTab).toHaveAttribute('aria-selected', 'false');

    // Activity feed should show empty state
    await expect(page.getByText('Select an experiment to view activities')).toBeVisible();
  });

  test('displays specs tab with empty state', async ({ page }) => {
    await page.goto('/');

    // Click on Specs tab
    const specsTab = page.getByRole('tab', { name: 'Specs' });
    await specsTab.click();

    // Specs tab should be active
    await expect(specsTab).toHaveAttribute('aria-selected', 'true');

    // Should show empty state since no experiment is selected
    await expect(page.getByText('Select an experiment to view specifications')).toBeVisible();
  });

  test('displays files tab with empty state', async ({ page }) => {
    await page.goto('/');

    // Click on Files tab
    const filesTab = page.getByRole('tab', { name: 'Files' });
    await filesTab.click();

    // Files tab should be active
    await expect(filesTab).toHaveAttribute('aria-selected', 'true');

    // Should show empty state since no experiment is selected
    await expect(page.getByText('Select an experiment to view generated files')).toBeVisible();
  });
});
