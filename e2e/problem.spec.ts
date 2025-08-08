import { Page } from '@playwright/test'
import { test, expect } from './fixtures.ts'

test.describe('solving a proof', () => {
  test.describe('correctly', () => {
    test('displays a Q.E.D. message', async ({ page, proofTable, enterLine }) => {
      await page.goto('/problems/gof9o3')

      await enterLine('M → R', '→ O', [0, 2])
      await enterLine('R', '→ O', [1, 3])

      const qedCell = proofTable.locator('tfoot tr').last().getByRole('cell')
      await expect(qedCell).toContainClass('table-success')
      await expect(qedCell).toHaveText(' Q.E.D. ')
    })

    test('adds an entry to the solutions list', async ({ page, enterLine }) => {
      await page.goto('/problems/gof9o3')

      await enterLine('M → R', '→ O', [0, 2])
      await enterLine('R', '→ O', [1, 3])

      const solutions = page.getByTestId('solutions').locator('.list-group-item')
      await expect(solutions).toHaveCount(1)
    })

    test('handles suppositions', async ({ page, proofTable, enterLine }) => {
      await page.goto('/problems/j7hkhm')

      await enterLine('C', 'S')
      await enterLine('F', '→ O', [0, 3])
      await enterLine('B', '→ O', [1, 4])
      await enterLine('A', '→ O', [2, 5])
      await enterLine('C → A', '→ I', [3, 6])

      const qedCell = proofTable.locator('tfoot tr').last().getByRole('cell')
      await expect(qedCell).toContainClass('table-success')
      await expect(qedCell).toHaveText(' Q.E.D. ')
    })
  })

  test.describe('incorrectly', () => {
    test('indicates that there is an error', async ({ page, proofTable, enterLine }) => {
      await page.goto('/problems/gof9o3')

      await enterLine('M → Z', '→ O', [0, 2])

      const formRow = proofTable.locator('tfoot tr').last()
      await expect(formRow).toContainClass('table-danger')
    })
  })
})

test.describe('showing previous solutions', () => {
  test.beforeEach(async ({ page, enterLine }) => {
    await page.goto('/problems/gof9o3')
    await enterLine('M → R', '→ O', [0, 2])
    await enterLine('R', '→ O', [1, 3])

    await page.reload()
    await enterLine('M → R', '→ O', [0, 2])
    await enterLine('A', 'S', [])
    await enterLine('R', '→ O', [1, 3])
  })

  test('shows the proof when clicked', async ({ page, proofTable }) => {
    await page.reload()

    await page.getByTestId('solutions').locator('.list-group-item').last().click()
    await expect(proofTable).toHaveProofLine(3, 'M → R', '→ O', [0, 2], true)
    await expect(proofTable).toHaveProofLine(4, 'R', '→ O', [1, 3], true)

    await page.getByTestId('solutions').locator('.list-group-item').first().click()
    await expect(proofTable).toHaveProofLine(3, 'M → R', '→ O', [0, 2], true)
    await expect(proofTable).toHaveProofLine(4, 'A', 'S', [], true)
    await expect(proofTable).toHaveProofLine(5, 'R', '→ O', [1, 3], true)
  })
})

test.describe('navigating away', () => {
  test('does not alert if proof has not been started', async ({ page }) => {
    await page.goto('/problems/tqpiwb')
    await page.getByTestId('next-problem-link').click()
    await expect(page).toHaveURL('/problems/ktn47i')
  })

  test.describe('proof has been started but not completed', () => {
    test.beforeEach('Open the URL and fill the formula field', async ({ page, proofTable }) => {
      await page.goto('/problems/tqpiwb')
      await proofTable.getByPlaceholder('Formula').fill('testing')
    })

    test('confirming the alert', async ({ page }) => {
      await page.getByTestId('next-problem-link').click()
      await page.mouse.move(0, 0)
      await ensureDialog(page)
      await expect(page).toHaveURL('/problems/ktn47i')
    })

    test('dismissing the alert', async ({ page }) => {
      await page.getByTestId('next-problem-link').click()
      await page.mouse.move(0, 0)
      await ensureDialog(page, false)
      await expect(page).toHaveURL('/problems/tqpiwb')
    })
  })

  test('does not alert if proof has been completed', async ({ page, enterLine }) => {
    await test.step('Complete the proof', async () => {
      await page.goto('/problems/tqpiwb')
      await enterLine('B', '→ O', [0, 1])
      await page.getByRole('dialog').locator('[aria-label="Close"]').click()
    })

    await page.getByTestId('next-problem-link').click()
    await expect(page).toHaveURL('/problems/ktn47i')
  })
})

test.describe('problem navigation', () => {
  test.describe('previous', () => {
    test('goes to the previous problem', async ({ page, proofTable }) => {
      await page.goto('/problems/ktn47i')
      await page.getByTestId('previous-problem-link').click()
      await expect(page).toHaveURL('/problems/tqpiwb')
      await expect(page).toHaveTitle(/^Orientation |/)
      await expect(proofTable).toHaveProofLine(0, 'A → B', 'A')
    })

    test('does not show if there is no previous problem', async ({ page }) => {
      await page.goto('/problems/tqpiwb')
      await expect(page.getByTestId('previous-problem-link')).toHaveCount(0)
    })
  })

  test.describe('next', () => {
    test('goes to the next problem', async ({ page, proofTable }) => {
      await page.goto('/problems/ktn47i')
      await page.getByTestId('next-problem-link').click()
      await expect(page).toHaveURL('/problems/gof9o3')
      await expect(page).toHaveTitle(/^Chapter Three #2 |/)
      await expect(proofTable).toHaveProofLine(0, 'E → (M → R)', 'A')
    })

    test('does not show if there is no next problem', async ({ page }) => {
      await page.goto('/problems/cb15ts')
      await expect(page.getByTestId('next-problem-link')).toHaveCount(0)
    })
  })
})

const ensureDialog = async (
  page: Page,
  accept: boolean = true,
  okButton: string = 'OK',
  cancelButton: string = 'Cancel',
) => await page.getByRole('button', { name: accept ? okButton : cancelButton }).click()
