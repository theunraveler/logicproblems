import { test as baseTest, expect as baseExpect, Locator } from '@playwright/test'

export const test = baseTest.extend<{
  proofTable: Locator
  enterLine: (formula: string, rule: string, justifications?: number[]) => void
}>({
  proofTable: async ({ page }, use) => {
    await use(await page.getByTestId('proof-table'))
  },

  enterLine: async ({ proofTable }, use) => {
    await use(async (formula: string, rule: string, justifications: number[] = []) => {
      await test.step(`Enter proof line ${formula} [${rule}][${justifications.map((j) => j.toString()).join(', ')}]`, async () => {
        await proofTable.getByPlaceholder('Formula').fill(formula)
        await proofTable.getByRole('combobox').selectOption(rule)
        await justifications.forEach(async function (index) {
          await proofTable.getByTestId(`justification-${index}`).dispatchEvent('click')
        })
        await proofTable.getByRole('button', { name: 'Submit Line' }).click()
      })
    })
  },
})

export const expect = baseExpect.extend({
  async toHaveProofLine(
    proofTable: Locator,
    index: number,
    formula: string,
    rule: string,
    justifications: number[] = [],
    completesProof: boolean = false,
    options?: { timeout?: number },
  ) {
    const assertionName = 'toHaveProofLine'
    let pass: boolean
    let matcherResult
    const startingColumn = completesProof ? 0 : 1
    const justText =
      rule === 'S' ? /^Unresolved Supposition/ : justifications.map((i) => i + 1).join(', ')
    const colExpectations = {
      [startingColumn]: `${index + 1}`,
      [startingColumn + 1]: formula,
      [startingColumn + 2]: justText,
      [startingColumn + 3]: rule,
    }
    const cols = await proofTable.locator('tbody tr').nth(index).getByRole('cell')
    try {
      await Object.entries(colExpectations).forEach(async ([colIndex, expectedText]) => {
        const col = await cols.nth(parseInt(colIndex))
        const expectation = this.isNot ? baseExpect(col).not : baseExpect(col)
        await expectation.toHaveText(expectedText, options)
      })
      pass = true
    } catch (err) {
      matcherResult = err.matcherResult
      pass = false
    }

    if (this.isNot) {
      pass = !pass
    }

    const message = pass
      ? () =>
          this.utils.matcherHint(assertionName, undefined, undefined, { isNot: this.isNot }) +
          '\n\n' +
          `Locator: ${proofTable}\n` +
          `Expected: not ${this.utils.printExpected(`${index}, ${formula}, ${justText}, ${rule}`)}\n` +
          (matcherResult ? `Received: ${this.utils.printReceived(matcherResult.actual)}` : '')
      : () =>
          this.utils.matcherHint(assertionName, undefined, undefined, { isNot: this.isNot }) +
          '\n\n' +
          `Locator: ${proofTable}\n` +
          `Expected: not ${this.utils.printExpected(`${index}, ${formula}, ${justText}, ${rule}`)}\n` +
          (matcherResult ? `Received: ${this.utils.printReceived(matcherResult.actual)}` : '')

    return {
      message,
      pass,
      name: assertionName,
      index,
      formula,
      justifications,
      rule,
      actual: matcherResult?.actual,
    }
  },
})
