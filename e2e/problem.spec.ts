import { test, expect, Dialog, Locator, Page } from '@playwright/test'

test.describe('solving a proof', () => {
  test.describe('correctly', () => {
    test('works', async ({ page }) => {
      await page.goto('/problems/1095208a-68e1-4a15-8175-51684a5459ba')
      const proofTable = getProofTable(page)

      await enterAndEnsureLine(proofTable, 'M → R', '→ O', [0, 2], 3)
      await enterAndEnsureLine(proofTable, 'R', '→ O', [1, 3], 4, true)

      const qedCell = proofTable.locator('tbody tr').last().getByRole('cell')
      await expect(qedCell).toContainClass('table-success')
      await expect(qedCell).toHaveText(' 🎉 Q.E.D. ')
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
      await enterAndEnsureLine(proofTable, 'B', '→ O', [0, 1], 2, true)
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
  await proofTable.getByPlaceholder('Formula').fill(formula)
  await proofTable.getByRole('combobox').selectOption(rule)
  await justifications.forEach(async function (index) {
    await proofTable.getByTestId(`justification-${index}`).dispatchEvent('click')
  })
  await proofTable.getByRole('button', { name: 'Submit Line' }).click()
}

const enterAndEnsureLine = async (
  proofTable: Locator,
  formula: string,
  rule: string,
  justifications: number[],
  expectedIndex: number,
  completesProof: boolean = false,
) => {
  const startingColumn = completesProof ? 0 : 1
  await test.step(`Fill in proof line ${expectedIndex}`, async () => {
    await enterLine(proofTable, formula, rule, justifications)
    const cols = proofTable.locator('tbody tr').nth(expectedIndex).getByRole('cell')
    await expect(cols.nth(startingColumn)).toHaveText(`${expectedIndex + 1}`)
    await expect(cols.nth(startingColumn + 1)).toHaveText(formula)
    await expect(cols.nth(startingColumn + 2)).toHaveText(
      justifications.map((i) => i + 1).join(', '),
    )
    await expect(cols.nth(startingColumn + 3)).toHaveText(rule)
  })
}

const ensureDialog = (accept: boolean = true) => {
  return async function (dialog: Dialog) {
    expect(dialog.type()).toContain('confirm')
    expect(dialog.message()).toContain('Are you sure')
    await dialog[accept ? 'accept' : 'dismiss']()
  }
}
