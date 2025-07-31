import { test, expect, Locator, Page } from '@playwright/test'

test.describe('solving a proof', () => {
  test.describe('correctly', () => {
    test('displays a Q.E.D. message', async ({ page }) => {
      await page.goto('/problems/gof9o3')
      const proofTable = getProofTable(page)

      await enterAndEnsureLine(proofTable, 'M → R', '→ O', [0, 2], 3)
      await enterAndEnsureLine(proofTable, 'R', '→ O', [1, 3], 4, true)

      const qedCell = proofTable.locator('tfoot tr').last().getByRole('cell')
      await expect(qedCell).toContainClass('table-success')
      await expect(qedCell).toHaveText(' Q.E.D. ')
    })

    test('adds an entry to the solutions list', async ({ page }) => {
      await page.goto('/problems/gof9o3')
      const proofTable = getProofTable(page)

      await enterAndEnsureLine(proofTable, 'M → R', '→ O', [0, 2], 3)
      await enterAndEnsureLine(proofTable, 'R', '→ O', [1, 3], 4, true)

      const solutions = page.getByTestId('solutions').locator('.list-group-item')
      await expect(solutions).toHaveCount(1)
    })

    test('handles suppositions', async ({ page }) => {
      await page.goto('/problems/j7hkhm')
      const proofTable = getProofTable(page)

      await enterAndEnsureLine(proofTable, 'C', 'S', [], 3)
      await enterAndEnsureLine(proofTable, 'F', '→ O', [0, 3], 4)
      await enterAndEnsureLine(proofTable, 'B', '→ O', [1, 4], 5)
      await enterAndEnsureLine(proofTable, 'A', '→ O', [2, 5], 6)
      await enterAndEnsureLine(proofTable, 'C → A', '→ I', [3, 6], 7, true)

      const qedCell = proofTable.locator('tfoot tr').last().getByRole('cell')
      await expect(qedCell).toContainClass('table-success')
      await expect(qedCell).toHaveText(' Q.E.D. ')
    })
  })

  test.describe('incorrectly', () => {
    test('indicates that there is an error', async ({ page }) => {
      await page.goto('/problems/gof9o3')
      const proofTable = getProofTable(page)

      await enterLine(proofTable, 'M → Z', '→ O', [0, 2])

      const formRow = proofTable.locator('tfoot tr').last()
      await expect(formRow).toContainClass('table-danger')
    })
  })
})

test.describe('showing previous solutions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/problems/gof9o3')
    const proofTable = getProofTable(page)
    await enterAndEnsureLine(proofTable, 'M → R', '→ O', [0, 2], 3)
    await enterAndEnsureLine(proofTable, 'R', '→ O', [1, 3], 4, true)

    await page.reload()
    await enterAndEnsureLine(proofTable, 'M → R', '→ O', [0, 2], 3)
    await enterAndEnsureLine(proofTable, 'A', 'S', [], 4)
    await enterAndEnsureLine(proofTable, 'R', '→ O', [1, 3], 5, true)
  })

  test('shows the proof when clicked', async ({ page }) => {
    await page.reload()
    const proofTable = getProofTable(page)

    page.getByTestId('solutions').locator('.list-group-item').last().click()
    await ensureLine(proofTable, 'M → R', '→ O', [0, 2], 3, true)
    await ensureLine(proofTable, 'R', '→ O', [1, 3], 4, true)

    page.getByTestId('solutions').locator('.list-group-item').first().click()
    await ensureLine(proofTable, 'M → R', '→ O', [0, 2], 3, true)
    await ensureLine(proofTable, 'A', 'S', [], 4, true)
    await ensureLine(proofTable, 'R', '→ O', [1, 3], 5, true)
    expect(true).toBe(true)
  })
})

test.describe('navigating away', () => {
  test('does not alert if proof has not been started', async ({ page }) => {
    await page.goto('/problems/tqpiwb')
    await page.getByTestId('next-problem-link').click()
    await expect(page).toHaveURL('/problems/ktn47i')
  })

  test.describe('proof has been started but not completed', () => {
    test.beforeEach('Open the URL and fill the formula field', async ({ page }) => {
      await page.goto('/problems/tqpiwb')
      await getProofTable(page).getByPlaceholder('Formula').fill('testing')
    })

    test('confirming the alert', async ({ page }) => {
      await page.getByTestId('next-problem-link').click()
      await ensureDialog(page)
      await expect(page).toHaveURL('/problems/ktn47i')
    })

    test('dismissing the alert', async ({ page }) => {
      await page.getByTestId('next-problem-link').click()
      await ensureDialog(page, false)
      await expect(page).toHaveURL('/problems/tqpiwb')
    })
  })

  test('does not alert if proof has been completed', async ({ page }) => {
    await test.step('Complete the proof', async () => {
      await page.goto('/problems/tqpiwb')
      const proofTable = getProofTable(page)
      await enterAndEnsureLine(proofTable, 'B', '→ O', [0, 1], 2, true)
      await page.getByRole('dialog').locator('[aria-label="Close"]').click()
    })

    await page.getByTestId('next-problem-link').click()
    await expect(page).toHaveURL('/problems/ktn47i')
  })
})

const getProofTable = (page: Page) => {
  return page.getByTestId('proof-table')
}

const enterLine = async (
  proofTable: Locator,
  formula: string,
  rule: string,
  justifications: number[],
) => {
  await test.step(`Enter proof line ${formula} [${rule}][${justifications.map((j) => j.toString()).join(', ')}]`, async () => {
    await proofTable.getByPlaceholder('Formula').fill(formula)
    await proofTable.getByRole('combobox').selectOption(rule)
    await justifications.forEach(async function (index) {
      await proofTable.getByTestId(`justification-${index}`).dispatchEvent('click')
    })
    await proofTable.getByRole('button', { name: 'Submit Line' }).click()
  })
}

const ensureLine = async (
  proofTable: Locator,
  formula: string,
  rule: string,
  justifications: number[],
  expectedIndex: number,
  completesProof: boolean = false,
) => {
  const startingColumn = completesProof ? 0 : 1
  await test.step(`Ensure proof line ${expectedIndex}`, async () => {
    const cols = proofTable.locator('tbody tr').nth(expectedIndex).getByRole('cell')
    const justText =
      rule === 'S' ? /^Unresolved Supposition/ : justifications.map((i) => i + 1).join(', ')
    await expect(cols.nth(startingColumn)).toHaveText(`${expectedIndex + 1}`)
    await expect(cols.nth(startingColumn + 1)).toHaveText(formula)
    await expect(cols.nth(startingColumn + 2)).toHaveText(justText)
    await expect(cols.nth(startingColumn + 3)).toHaveText(rule)
  })
}

const enterAndEnsureLine = async (
  proofTable: Locator,
  formula: string,
  rule: string,
  justifications: number[],
  expectedIndex: number,
  completesProof: boolean = false,
) => {
  await test.step(`Enter and ensure proof line ${expectedIndex}`, async () => {
    await enterLine(proofTable, formula, rule, justifications)
    await ensureLine(proofTable, formula, rule, justifications, expectedIndex, completesProof)
  })
}

const ensureDialog = async (
  page: Page,
  accept: boolean = true,
  okButton: string = 'OK',
  cancelButton: string = 'Cancel',
) => await page.getByRole('button', { name: accept ? okButton : cancelButton }).click()
