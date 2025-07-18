import { test, expect, Dialog, Locator, Page } from '@playwright/test'

test.describe('solving a proof', () => {
  test.describe('correctly', () => {
    test('displays a Q.E.D. message', async ({ page }) => {
      await page.goto('/problems/1095208a-68e1-4a15-8175-51684a5459ba')
      const proofTable = getProofTable(page)

      await enterAndEnsureLine(proofTable, 'M → R', '→ O', [0, 2], 3)
      await enterAndEnsureLine(proofTable, 'R', '→ O', [1, 3], 4, null, true)

      const qedCell = proofTable.locator('tbody tr').last().getByRole('cell')
      await expect(qedCell).toContainClass('table-success')
      await expect(qedCell).toHaveText(' Q.E.D. ')
    })

    test('handles suppositions', async ({ page }) => {
      await page.goto('/problems/5b35cbf6-dee5-440e-b6ed-607dada1ce16')
      const proofTable = getProofTable(page)

      await enterAndEnsureLine(proofTable, 'C', 'S', [], 3, [3])
      await enterAndEnsureLine(proofTable, 'F', '→ O', [0, 3], 4, [0, 3])
      await enterAndEnsureLine(proofTable, 'B', '→ O', [1, 4], 5, [0, 1, 3])
      await enterAndEnsureLine(proofTable, 'A', '→ O', [2, 5], 6, [0, 1, 2, 3])
      await enterAndEnsureLine(proofTable, 'C → A', '→ I', [3, 6], 7, [0, 1, 2], true)

      const qedCell = proofTable.locator('tbody tr').last().getByRole('cell')
      await expect(qedCell).toContainClass('table-success')
      await expect(qedCell).toHaveText(' Q.E.D. ')
    })
  })

  test.describe('incorrectly', () => {
    test('indicates that there is an error', async ({ page }) => {
      await page.goto('/problems/1095208a-68e1-4a15-8175-51684a5459ba')
      const proofTable = getProofTable(page)

      await enterLine(proofTable, 'M → Z', '→ O', [0, 2])

      const formRow = proofTable.locator('tbody tr').last()
      await expect(formRow).toContainClass('table-danger')
    })
  })
})

test.describe('navigating away', () => {
  test.describe('proof has not been started', () => {
    test.beforeEach('Open the URL', async ({ page }) => {
      await page.goto('/problems/d3e5f749-8b67-4116-ba5b-628102d8f306')
    })

    test('does not alert', async ({ page }) => {
      await page.getByTestId('next-problem-link').click()
      await expect(page).toHaveURL('/problems/70182d92-3db1-46c0-9f50-2d7e9e6c3b7e')
    })
  })

  test.describe('proof has been started but not completed', () => {
    test.beforeEach('Open the URL and fill the formula field', async ({ page }) => {
      await page.goto('/problems/d3e5f749-8b67-4116-ba5b-628102d8f306')
      await getProofTable(page).getByPlaceholder('Formula').fill('testing')
    })

    test('confirming the alert', async ({ page }) => {
      page.on('dialog', ensureDialog())
      await page.getByTestId('next-problem-link').click()
      await expect(page).toHaveURL('/problems/70182d92-3db1-46c0-9f50-2d7e9e6c3b7e')
    })

    test('dismissing the alert', async ({ page }) => {
      page.on('dialog', ensureDialog(false))
      await page.getByTestId('next-problem-link').click()
      await expect(page).toHaveURL('/problems/d3e5f749-8b67-4116-ba5b-628102d8f306')
    })
  })

  test.describe('proof has been completed', () => {
    test.beforeEach('Complete the proof', async ({ page }) => {
      await page.goto('/problems/d3e5f749-8b67-4116-ba5b-628102d8f306')
      const proofTable = getProofTable(page)
      await enterAndEnsureLine(proofTable, 'B', '→ O', [0, 1], 2, null, true)
      await page.getByRole('dialog').getByText('Close').click()
    })

    test('does not alert', async ({ page }) => {
      await page.getByTestId('next-problem-link').click()
      await expect(page).toHaveURL('/problems/70182d92-3db1-46c0-9f50-2d7e9e6c3b7e')
    })
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
  dependencies: number[] | null = null,
  completesProof: boolean = false,
) => {
  let startingColumn = 0
  if (!completesProof) {
    startingColumn += 1
  }
  if (!dependencies) {
    startingColumn -= 1
  }
  await test.step(`Ensure proof line ${expectedIndex}`, async () => {
    const cols = proofTable.locator('tbody tr').nth(expectedIndex).getByRole('cell')
    if (dependencies && dependencies.length > 0) {
      await expect(cols.nth(startingColumn)).toHaveText(
        dependencies.map((i) => i + 1).join(', ')
      )
    }
    await expect(cols.nth(startingColumn + 1)).toHaveText(`${expectedIndex + 1}`)
    await expect(cols.nth(startingColumn + 2)).toHaveText(formula)
    await expect(cols.nth(startingColumn + 3)).toHaveText(
      justifications.map((i) => i + 1).join(', '),
    )
    await expect(cols.nth(startingColumn + 4)).toHaveText(rule)
  })
}

const enterAndEnsureLine = async (
  proofTable: Locator,
  formula: string,
  rule: string,
  justifications: number[],
  expectedIndex: number,
  dependencies: number[] | null = null,
  completesProof: boolean = false,
) => {
  await test.step(`Enter and ensure proof line ${expectedIndex}`, async () => {
    await enterLine(proofTable, formula, rule, justifications)
    await ensureLine(proofTable, formula, rule, justifications, expectedIndex, dependencies, completesProof)
  })
}

const ensureDialog = (accept: boolean = true) => {
  return async function (dialog: Dialog) {
    expect(dialog.type()).toContain('confirm')
    expect(dialog.message()).toContain('Are you sure')
    await dialog[accept ? 'accept' : 'dismiss']()
  }
}
