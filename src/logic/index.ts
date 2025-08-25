import { Expression } from '@/logic/ast'
import { parse } from '@/logic/parse'
import { Rule } from '@/logic/rules'

export class Line {
  public readonly formula: Expression
  public readonly rule: Rule

  constructor(
    public readonly index: number,
    formula: Expression | string,
    rule: Rule | string,
    public readonly justifications: number[] = [],
  ) {
    this.formula = formula instanceof Expression ? formula : parse(formula)
    this.rule = rule instanceof Rule ? rule : Rule.findByShorthand(rule)
    this.justifications = justifications.toSorted((a, b) => a - b)
  }

  dependencies(proof: Proof): number[] {
    if (this.justifications.length <= 0) {
      return [this.index]
    }
    const lines = proof.lines
    const deps = [
      ...new Set(this.justifications.flatMap((i) => lines[i].dependencies(proof))),
    ].toSorted()
    if (!this.rule.resolvesSupposition) {
      return deps
    }
    return deps.filter(
      (l) =>
        !this.justifications.includes(l) || lines[l].rule.valueOf() !== Rule.SUPPOSITION.valueOf(),
    )
  }

  hasUnresolvedDependencies(proof: Proof): boolean {
    const lines = proof.lines
    const deps = this.dependencies(proof).map((i) => lines[i])
    return deps.some((l) => l.rule.valueOf() === Rule.SUPPOSITION.valueOf())
  }

  toString(): string {
    return `${this.formula} [${this.justifications}][${this.rule}]`
  }
}

export class Proof {
  public readonly premises: Line[]
  public readonly conclusion: Expression
  public readonly deductions: Line[] = []

  constructor(premises: Expression[] | Line[] | string[], conclusion: Expression | string) {
    this.premises = premises.map((premise, index) => {
      return premise instanceof Line ? premise : new Line(index, premise, Rule.ASSUMPTION)
    })
    this.conclusion = conclusion instanceof Expression ? conclusion : parse(conclusion)
  }

  /**
   * Return all lines of the proof, including premises.
   */
  get lines() {
    return this.premises.concat(this.deductions)
  }

  addDeductions(deductions: [Expression | string, Rule | string, number[] | undefined][]): Line[] {
    return deductions.map((deduction) => this.addDeduction(...deduction))
  }

  addDeduction(
    formula: Expression | string,
    rule: Rule | string,
    justifications: number[] = [],
  ): Line {
    const lines = this.lines
    const deduction = new Line(lines.length, formula, rule, justifications)
    deduction.rule.evaluate(
      deduction.formula,
      deduction.justifications.map((index) => lines[index]),
      this,
    )
    this.deductions.push(deduction)
    return deduction
  }

  clear() {
    this.deductions.length = 0
  }

  qed(): boolean {
    if (this.deductions.length <= 0) {
      return false
    }

    const lastLine = this.deductions[this.deductions.length - 1]
    return (
      this.conclusion.valueOf() === lastLine.formula.valueOf() &&
      !lastLine.hasUnresolvedDependencies(this)
    )
  }
}
