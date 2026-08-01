import { test, expect, type Page } from '@playwright/test'
import { ensureActiveOrg, signInAsSuperAdmin } from '../helpers/auth'

/**
 * Class assignment board — subgroup lanes and multi-select.
 *
 * Each class is a column, its subgroups (US1–US3 inside "Unterstufe") are
 * labelled lanes within it, and dragging writes
 * school_class_enrollments.grade_level_id.
 *
 * The suite skips itself when the org has no class with subgroups: the lanes
 * only exist for a class whose stage has children, and a fresh CI database
 * has neither.
 *
 * The server-side rule that a subgroup must belong to the target class is
 * covered by enrollment-grade-level.integration-spec, which builds the
 * mismatched pair it needs — a seeded org rarely has one.
 */
test.describe('Students kanban — subgroups', () => {
  const openBoard = async (page: Page) => {
    await signInAsSuperAdmin(page)
    await ensureActiveOrg(page)
    await page.goto('/en/admin/students/kanban', { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('heading', { name: /classroom assignment/i }),
    ).toBeVisible({ timeout: 15000 })
  }

  /** True when a class on the board is split into subgroups. */
  const hasSubgroups = async (page: Page): Promise<boolean> =>
    (await page.getByText(/without subgroup/i).count()) > 0

  /** Reads a lane's counter badge, e.g. the "2" next to "US1". */
  const laneCount = async (page: Page, label: RegExp): Promise<number> => {
    const heading = page.getByText(label).first()
    const badge = heading.locator('xpath=following-sibling::span[1]')
    const text = (await badge.innerText()).trim()
    return Number.parseInt(text, 10)
  }

  test('renders a labelled lane per subgroup', async ({ page }) => {
    await openBoard(page)
    test.skip(!(await hasSubgroups(page)), 'no class with subgroups in this org')

    // Subgroup lanes plus the lane for children not placed in one.
    await expect(page.getByText(/^US\d$/).first()).toBeVisible()
    await expect(page.getByText(/without subgroup/i).first()).toBeVisible()
    // The class keeps its own header with the capacity over all lanes.
    await expect(page.getByText(/\d+\/\d+/).first()).toBeVisible()
  })

  test('multi-select moves several children in one drag', async ({ page }) => {
    await openBoard(page)
    test.skip(!(await hasSubgroups(page)), 'no class with subgroups in this org')

    const unplacedBefore = await laneCount(page, /without subgroup/i)
    test.skip(unplacedBefore < 2, 'needs two unplaced children')

    // The two topmost cards in the "without subgroup" lane.
    const lane = page
      .getByText(/without subgroup/i)
      .first()
      .locator('xpath=../following-sibling::div[1]')
    const first = lane.locator('> div').nth(0)
    const second = lane.locator('> div').nth(1)
    const firstName = (await first.innerText()).split('\n')[0]

    await first.click({ modifiers: ['Meta'] })
    await second.click({ modifiers: ['Meta'] })
    await expect(page.getByText(/2 selected/i)).toBeVisible({ timeout: 10000 })

    const targetLabel = page.getByText(/^US\d$/).first()
    const targetName = (await targetLabel.innerText()).trim()
    const from = await first.boundingBox()
    const to = await targetLabel.boundingBox()
    if (!from || !to) throw new Error('card or target not visible')

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    await page.mouse.move(from.x + 20, from.y + 20, { steps: 5 })
    await page.mouse.move(to.x + to.width / 2, to.y + 18, { steps: 15 })
    await page.mouse.up()

    await expect(page.getByText(/classroom updated/i)).toBeVisible({
      timeout: 15000,
    })

    // Both landed: the lane grew by two, the selection bar is gone.
    await expect(page.getByText(/2 selected/i)).toHaveCount(0)
    await expect
      .poll(async () => laneCount(page, new RegExp(`^${targetName}$`)), {
        timeout: 15000,
      })
      .toBeGreaterThanOrEqual(2)

    // Persisted server-side, not just moved in local state.
    await page.reload({ waitUntil: 'networkidle' })
    await expect
      .poll(async () => laneCount(page, /without subgroup/i), {
        timeout: 15000,
      })
      .toBe(unplacedBefore - 2)
    await expect(page.getByText(firstName).first()).toBeVisible()
  })

  test('a plain click opens the student profile', async ({ page }) => {
    await openBoard(page)

    const anyCard = page.locator('[class*="cursor-grab"]').first()
    test.skip((await anyCard.count()) === 0, 'no student on the board')

    await anyCard.click()
    await expect(page).toHaveURL(/\/admin\/students\/[0-9a-f-]{36}/, {
      timeout: 15000,
    })
  })

})
