import { Expression } from '@/logic/ast'
import { parse } from '@/logic/parse'
import * as rules from '@/logic/rules'

type EvalFunction = {
  (exp: Expression, justifications: Line[], proof: Proof): void
}

export class InvalidDeductionError extends Error {}

export class Rule {
  static all: Rule[] = []

  static readonly ASSUMPTION = new Rule('A', 'Assumption', () => {}, 0)
  static readonly ARROW_OUT = new Rule('→ O', 'Arrow Out', rules.arrowOut, 2)
  static readonly ARROW_IN = new Rule('→ I', 'Arrow In', rules.arrowIn, 2, true)
  static readonly BICONDITIONAL_OUT = new Rule('↔ O', 'Biconditional Out', rules.biconditionalOut, 1)
  static readonly BICONDITIONAL_IN = new Rule('↔ I', 'Biconditional In', rules.biconditionalIn, 2)
  static readonly OR_OUT = new Rule('∨ O', 'Wedge Out', rules.wedgeOut, 3)
  static readonly OR_IN = new Rule('∨ I', 'Wedge In', rules.wedgeIn, 1)
  static readonly AND_OUT = new Rule('& O', 'Ampersand/And Out', rules.andOut, 1)
  static readonly AND_IN = new Rule('& I', 'Ampersand/And In', rules.andIn, 2)
  static readonly NEGATION_OUT = new Rule('- O', 'Dash Out', rules.negationOut, 2, true)
  static readonly NEGATION_IN = new Rule('- I', 'Dash In', rules.negationIn, 2, true)
  static readonly SUPPOSITION = new Rule('S', 'Supposition', () => {}, 0)
  static readonly MODUS_TOLLENS = new Rule('MT', 'Modus Tollens', rules.modusTollens, 2)
  static readonly DISJUNCTIVE_ARGUMENT = new Rule(
    'DA',
    'Disjunctive Argument',
    rules.disjunctiveArgument,
    2,
  )
  static readonly CONJUNCTIVE_ARGUMENT = new Rule(
    'CA',
    'Conjunctive Argument',
    rules.conjunctiveArgument,
    2,
  )
  static readonly CHAIN_RULE = new Rule('CH', 'Chain Rule', rules.chainRule, 2)
  static readonly DOUBLE_NEGATION = new Rule('DN', 'Double Negation', rules.doubleNegation, 1)
  static readonly DEMORGANS_LAW = new Rule('DM', "Demorgan's Law", rules.demorgansLaw, 1)
  static readonly ARROW = new Rule('AR', 'Arrow', rules.arrow, 1)
  static readonly CONTRAPOSITION = new Rule('CN', 'Contraposition', rules.contraposition, 1)

  constructor(
    public readonly shorthand: string,
    public readonly label: string,
    public readonly evalFunc: EvalFunction,
    public readonly requiredJustifications: number,
    public readonly resolvesSupposition: boolean = false,
  ) {
    Rule.all.push(this)
  }

  evaluate(formula: Expression, justifications: Line[], proof: Proof) {
    if (justifications.length !== this.requiredJustifications) {
      throw new InvalidDeductionError(
        `Rule requires ${this.requiredJustifications} justification${this.requiredJustifications === 1 ? '' : 's'}`,
      )
    }
    this.evalFunc(formula, justifications, proof)
  }

  valueOf(): string {
    return this.shorthand
  }

  toString(): string {
    return this.shorthand
  }

  public static findByShorthand(shorthand: string): Rule {
    const trimmedShorthand = shorthand.replaceAll(' ', '')
    const found = Rule.all.find((rule) => rule.shorthand.replaceAll(' ', '') === trimmedShorthand)
    if (!found) {
      throw new Error('Rule not found')
    }
    return found
  }
}

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
