import { test, expect } from '@playwright/test'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ACCOUNT_ID = '12345678'

const mockProsResponse = {
  account_id: 12345678,
  pros: [
    {
      account_id: 87278757,
      avatarfull: 'https://example.com/avatar.jpg',
      profileurl: 'https://steamcommunity.com/id/Miracle-/',
      personaname: 'Miracle-',
      team_name: 'Team Liquid',
      last_match_time: '2024-01-15T20:00:00.000Z',
      games: 3,
      win: 1,
      country_code: 'JO',
    },
    {
      account_id: 111620041,
      avatarfull: 'https://example.com/avatar2.jpg',
      profileurl: 'https://steamcommunity.com/id/Puppey/',
      personaname: 'Puppey',
      team_name: 'Team Secret',
      last_match_time: '2023-11-20T18:30:00.000Z',
      games: 1,
      win: 0,
      country_code: 'EE',
    },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Intercepts /api/pro-encounters/* and responds with the given payload. */
function mockProEncounters(page: import('@playwright/test').Page, body: object, status = 200) {
  return page.route('**/api/pro-encounters/**', (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('StompTracker — page load', () => {
  test('shows the title, search form, and Search button', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toContainText('StompTracker')
    await expect(page.getByPlaceholder(/account id/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^search$/i })).toBeVisible()
  })
})

test.describe('StompTracker — client-side validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows "Enter your Account ID" when submitting an empty form', async ({ page }) => {
    await page.getByRole('button', { name: /^search$/i }).click()

    await expect(page.getByRole('alert')).toContainText('Enter your Account ID')
  })

  test('shows a numbers-only error when the input contains letters', async ({ page }) => {
    await page.getByPlaceholder(/account id/i).fill('abc123')
    await page.getByRole('button', { name: /^search$/i }).click()

    await expect(page.getByRole('alert')).toContainText('numbers only')
  })

  test('clears the validation error when the user starts typing again', async ({ page }) => {
    await page.getByRole('button', { name: /^search$/i }).click()
    await expect(page.getByRole('alert')).toBeVisible()

    await page.getByPlaceholder(/account id/i).fill('1')
    await expect(page.getByRole('alert')).not.toBeVisible()
  })
})

test.describe('StompTracker — search results', () => {
  test('shows the results table after a successful search', async ({ page }) => {
    await mockProEncounters(page, mockProsResponse)
    await page.goto('/')

    await page.getByPlaceholder(/account id/i).fill(ACCOUNT_ID)
    await page.getByRole('button', { name: /^search$/i }).click()

    await expect(page.getByTestId('summary-bar')).toBeVisible()
    await expect(page.getByTestId('summary-bar')).toContainText('2')
    await expect(page.getByText('Miracle-')).toBeVisible()
    await expect(page.getByText('Puppey')).toBeVisible()
  })

  test('shows the empty state when the player has no pro encounters', async ({ page }) => {
    await mockProEncounters(page, { account_id: 12345678, pros: [] })
    await page.goto('/')

    await page.getByPlaceholder(/account id/i).fill(ACCOUNT_ID)
    await page.getByRole('button', { name: /^search$/i }).click()

    await expect(page.getByText('No pro encounters found')).toBeVisible()
  })

  test('shows the error message when the API returns a 503', async ({ page }) => {
    await mockProEncounters(
      page,
      { error: 'Could not connect to the OpenDota API.' },
      503,
    )
    await page.goto('/')

    await page.getByPlaceholder(/account id/i).fill(ACCOUNT_ID)
    await page.getByRole('button', { name: /^search$/i }).click()

    // ErrorMessage renders with role="alert" and shows the message
    await expect(page.getByRole('alert')).toContainText('Could not connect to the OpenDota API.')
  })

  test('shows the error message when the API returns a 429', async ({ page }) => {
    await mockProEncounters(
      page,
      { error: 'OpenDota rate limit reached. Please try again in a few seconds.' },
      429,
    )
    await page.goto('/')

    await page.getByPlaceholder(/account id/i).fill(ACCOUNT_ID)
    await page.getByRole('button', { name: /^search$/i }).click()

    await expect(page.getByRole('alert')).toContainText('rate limit')
  })

  test('the Search button is disabled while a request is in flight', async ({ page }) => {
    // Use a never-resolving mock to hold the loading state
    await page.route('**/api/pro-encounters/**', () => { /* intentionally hangs */ })
    await page.goto('/')

    await page.getByPlaceholder(/account id/i).fill(ACCOUNT_ID)
    await page.getByRole('button', { name: /^search$/i }).click()

    await expect(page.getByRole('button', { name: /searching/i })).toBeDisabled()
  })
})
