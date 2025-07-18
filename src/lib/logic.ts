import * as propositional from 'propositional'
import * as AST from 'propositional/lib/syntax/ast'
import { toString as prettyFormula } from 'propositional/lib/transform/toString'

export class Operator {
  static all: Operator[] = []

  static readonly CONDITIONAL = new Operator('→', 'conditional', '=>', '⇒')
  static readonly BICONDITIONAL = new Operator('↔', 'bi-conditional', '<=>', '⇔')
  static readonly DISJUNCTION = new Operator('∨', 'disjunction', '|')
  static readonly CONJUNCTION = new Operator('&', 'conjunction', null, '∧')
  static readonly NEGATION = new Operator('-', 'negation', '!', '¬', false)

  constructor(
    public readonly symbol: string,
    public readonly label: string,
    private readonly _libChar: string | null = null,
    private readonly _prettyLibChar: string | null = null,
    public readonly isBinary: boolean = true,
  ) {
    Operator.all.push(this)
  }

  private get libChar(): string {
    return this._libChar || this.symbol
  }

  private get prettyLibChar(): string {
    return this._prettyLibChar || this.symbol
  }

  toString(): string {
    return this.symbol
  }

  public static findBySymbol(symbol: string): Operator {
    const found = Operator.all.find(
      (operator) =>
        operator.symbol === symbol || (operator['libChar'] && operator['libChar'] === symbol),
    )
    if (!found) {
      throw new Error('Operator not found')
    }
    return found
  }
}

type LineEvalFunction = {
  (exp: AST.Expression, justifications: Line[], proof: Proof): boolean
}

export class Rule {
  static all: Rule[] = []

  static readonly ASSUMPTION = new Rule('A', 'Assumption', () => true)
  static readonly ARROW_OUT = new Rule('→ O', 'Arrow Out', evalArrowOut)
  static readonly ARROW_IN = new Rule('→ I', 'Arrow In', evalArrowIn, true)
  static readonly BICONDITIONAL_OUT = new Rule('↔ O', 'Biconditional Out', evalBiconditionalOut)
  static readonly BICONDITIONAL_IN = new Rule('↔ I', 'Biconditional In', evalBiconditionalIn)
  static readonly OR_OUT = new Rule('∨ O', 'Wedge Out', evalOrOut)
  static readonly OR_IN = new Rule('∨ I', 'Wedge In', evalOrIn)
  static readonly AND_OUT = new Rule('& O', 'Ampersand/And Out', evalAndOut)
  static readonly AND_IN = new Rule('& I', 'Ampersand/And In', evalAndIn)
  static readonly NEGATION_OUT = new Rule('- O', 'Dash Out', evalNegationOut, true)
  static readonly NEGATION_IN = new Rule('- I', 'Dash In', evalNegationIn, true)
  static readonly SUPPOSITION = new Rule('S', 'Supposition', evalSupposition)
  static readonly MODUS_TOLLENS = new Rule('MT', 'Modus Tollens', evalModusTollens)
  static readonly DISJUNCTIVE_ARGUMENT = new Rule(
    'DA',
    'Disjunctive Argument',
    evalDisjunctiveArgument,
  )
  static readonly CONJUNCTIVE_ARGUMENT = new Rule(
    'CA',
    'Conjunctive Argument',
    evalConjunctiveArgument,
  )
  static readonly CHAIN_RULE = new Rule('CH', 'Chain Rule', evalChainRule)
  static readonly DOUBLE_NEGATION = new Rule('DN', 'Double Negation', evalDoubleNegation)
  static readonly DEMORGANS_LAW = new Rule('DM', "Demorgan's Law", evalDemorgansLaw)
  static readonly ARROW = new Rule('AR', 'Arrow', evalArrow)
  static readonly CONTRAPOSITION = new Rule('CN', 'Contraposition', evalContraposition)

  constructor(
    public readonly shorthand: string,
    public readonly label: string,
    public readonly evalFunc: LineEvalFunction,
    public readonly clearsSupposition: boolean = false,
  ) {
    Rule.all.push(this)
  }

  evaluate(formula: Formula, justifications: Line[], proof: Proof): boolean {
    return this.evalFunc(formula.ast, justifications, proof)
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

export class Formula {
  public readonly ast: AST.Expression
  _text: string | null = null

  constructor(text: string) {
    try {
      this.ast = new propositional.Formula(Formula.normalizeForParsing(text)).ast
    } catch (error) {
      const message = error instanceof Error ? error.message : (error as string).toString()
      throw new Error(Formula.normalize(message))
    }
  }

  get text() {
    if (!this._text) {
      this._text = Formula.normalize(prettyFormula(this.ast, true), true)
    }
    return this._text
  }

  toString(): string {
    return this.text
  }

  valueOf(): string {
    return this.text
  }

  static normalize(text: string, fromPretty: boolean = false): string {
    let str = Operator.all
      .toReversed()
      .filter((o: Operator) => o['libChar'])
      .reduce((t: string, operator: Operator) => {
        return t.replaceAll(operator[fromPretty ? 'prettyLibChar' : 'libChar'], operator.symbol)
      }, text)
    if (str.charAt(0) === '(' && str.slice(-1) === ')') {
      str = str.substring(1, str.length - 1)
    }
    return str.trim()
  }

  private static normalizeForParsing(text: string): string {
    return Operator.all
      .toReversed()
      .filter((o: Operator) => o['libChar'])
      .reduce(
        (t: string, operator: Operator) => t.replaceAll(operator.symbol, operator['libChar']),
        text,
      )
  }
}

export class Line {
  public readonly formula: Formula
  public readonly rule: Rule

  constructor(
    public readonly index: number,
    formula: Formula | string,
    rule: Rule | string,
    public readonly justifications: number[] = [],
  ) {
    this.formula = formula instanceof Formula ? formula : new Formula(formula)
    this.rule = rule instanceof Rule ? rule : Rule.findByShorthand(rule)
    this.justifications = justifications.toSorted()
  }

  dependencies(proof: Proof): number[] {
    if (this.justifications.length <= 0) {
      return [this.index]
    }
    const lines = proof.lines
    const deps = [
      ...new Set(this.justifications.flatMap((i) => lines[i].dependencies(proof))),
    ].toSorted()
    return this.rule.clearsSupposition
      ? deps.filter(
          (l) =>
            !this.justifications.includes(l) ||
            lines[l].rule.valueOf() !== Rule.SUPPOSITION.valueOf(),
        )
      : deps
  }

  toString(): string {
    return `${this.formula} [${this.justifications}][${this.rule}]`
  }
}

export class Proof {
  public readonly assumptions: Line[]
  public readonly conclusion: Formula
  public readonly deductions: Line[] = []

  constructor(assumptions: Formula[] | Line[] | string[], conclusion: Formula | string) {
    this.assumptions = assumptions.map((assumption, index) => {
      return assumption instanceof Line ? assumption : new Line(index, assumption, Rule.ASSUMPTION)
    })
    this.conclusion = conclusion instanceof Formula ? conclusion : new Formula(conclusion)
  }

  /**
   * Return all lines of the proof, including assumptions.
   */
  get lines() {
    return this.assumptions.concat(this.deductions)
  }

  addDeduction(formula: string | Formula, rule: Rule | string, justifications: number[] = []) {
    const lines = this.lines
    const deduction = new Line(lines.length, formula, rule, justifications)
    if (
      !deduction.rule.evaluate(
        deduction.formula,
        deduction.justifications.map((index) => lines[index]),
        this,
      )
    ) {
      throw new Error(`Invalid deduction: ${deduction}`)
    }
    this.deductions.push(deduction)
  }

  clear() {
    this.deductions.length = 0
  }

  qed(): boolean {
    if (this.deductions.length <= 0) {
      return false
    }

    const lastLine = this.deductions[this.deductions.length - 1]
    if (this.conclusion.valueOf() !== lastLine.formula.valueOf()) {
      return false
    }

    const lines = this.lines
    const lastLineDependencies = lastLine.dependencies(this).map((i) => lines[i])
    return !lastLineDependencies.some((l) => l.rule.valueOf() === Rule.SUPPOSITION.valueOf())
  }
}

/***************************
 * Rule evaluation functions
 ***************************/

function evalArrowOut(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 2) {
    return false
  }

  const justExps = justifications.map((j) => j.formula.ast)
  const orderedJust = [justExps, justExps.toReversed()].find(([a, b]) => {
    return a instanceof AST.BinaryExpression && prettyFormula(a.left) === prettyFormula(b)
  })
  if (!orderedJust) {
    return false
  }

  const [mainJust] = orderedJust

  return isConditional(mainJust) && prettyFormula(mainJust.right) === prettyFormula(exp)
}

function evalArrowIn(exp: AST.Expression, justifications: Line[], proof: Proof): boolean {
  if (justifications.length !== 2) {
    return false
  }

  if (!isConditional(exp)) {
    return false
  }

  const suppositionIndex = justifications.findIndex((j) => j.rule.valueOf() === Rule.SUPPOSITION.valueOf())
  if (suppositionIndex === -1) {
    return false
  }

  const supposition = justifications[suppositionIndex]
  const consequent = justifications[suppositionIndex ? 0 : 1]
  const dependencies = consequent.dependencies(proof)

  if (!dependencies.includes(supposition.index)) {
    return false
  }

  return (
    prettyFormula(exp.left) === prettyFormula(supposition.formula.ast) &&
    prettyFormula(exp.right) === prettyFormula(consequent.formula.ast)
  )
}

function evalBiconditionalOut(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 1) {
    return false
  }

  const justExps = justifications.map((j) => j.formula.ast)
  const just = justExps[0]
  if (!isBiconditional(just)) {
    return false
  }

  if (!isConditional(exp)) {
    return false
  }

  const expLeft = prettyFormula(exp.left)
  const expRight = prettyFormula(exp.right)
  const justLeft = prettyFormula(just.left)
  const justRight = prettyFormula(just.right)
  return (
    (expLeft === justLeft && expRight === justRight) ||
    (expLeft === justRight && expRight === justLeft)
  )
}

function evalBiconditionalIn(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 2) {
    return false
  }

  if (!isBiconditional(exp)) {
    return false
  }

  const justExps = justifications.map((j) => j.formula.ast)
  if (!justExps.every((e) => isConditional(e))) {
    return false
  }

  const justExpsStr = justExps.map((e) => prettyFormula(e))
  const expLeft = prettyFormula(exp.left)
  const expRight = prettyFormula(exp.right)

  return (
    justExpsStr.includes(`(${expLeft}${Operator.CONDITIONAL['libChar']}${expRight})`) &&
    justExpsStr.includes(`(${expRight}${Operator.CONDITIONAL['libChar']}${expLeft})`)
  )
}

function evalOrOut(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 3) {
    return false
  }

  const justExps = justifications.map((j) => j.formula.ast)
  const orJustIndex = justExps.findIndex((e) => isDisjunction(e))
  if (orJustIndex === -1) {
    return false
  }
  const [orJust] = justExps.splice(orJustIndex, 1)
  if (!isDisjunction(orJust)) {
    return false
  }

  if (!justExps.every((e) => isConditional(e))) {
    return false
  }

  const expStr = prettyFormula(exp)

  if (!justExps.every((e) => prettyFormula(e.right) === expStr)) {
    return false
  }

  const orJustParts = [orJust.left, orJust.right].map((p) => prettyFormula(p)).sort()
  const justExpLefts = justExps.map((e) => prettyFormula(e.left)).sort()
  return orJustParts.every((val, index) => val === justExpLefts[index])
}

function evalOrIn(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 1) {
    return false
  }

  if (!isDisjunction(exp)) {
    return false
  }

  const justExp = prettyFormula(justifications[0].formula.ast)

  return prettyFormula(exp.left) === justExp || prettyFormula(exp.right) === justExp
}

function evalAndOut(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 1) {
    return false
  }

  const just = justifications[0].formula.ast
  if (!isConjunction(just)) {
    return false
  }

  const expStr = prettyFormula(exp)
  return prettyFormula(just.left) === expStr || prettyFormula(just.right) === expStr
}

function evalAndIn(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 2) {
    return false
  }

  if (!isConjunction(exp)) {
    return false
  }

  const expLeft = prettyFormula(exp.left)
  const expRight = prettyFormula(exp.right)
  const justExps = justifications.map((j) => prettyFormula(j.formula.ast))

  return justExps.includes(expLeft) && justExps.includes(expRight)
}

function evalNegationOut(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 2) {
    return false
  }

  const orderedJusts = [justifications, justifications.toReversed()].find(([a, b]) => {
    return a.rule.valueOf() === Rule.SUPPOSITION.valueOf() && isContradiction(b.formula.ast)
  })
  if (!orderedJusts) {
    return false
  }

  const suppositionExp = orderedJusts[0].formula.ast
  return isNegation(suppositionExp) && prettyFormula(suppositionExp.inner) === prettyFormula(exp)
}

function evalNegationIn(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 2) {
    return false
  }

  if (!isNegation(exp)) {
    return false
  }

  const orderedJusts = [justifications, justifications.toReversed()].find(([a, b]) => {
    return a.rule.valueOf() === Rule.SUPPOSITION.valueOf() && isContradiction(b.formula.ast)
  })
  if (!orderedJusts) {
    return false
  }

  const suppositionExp = orderedJusts[0].formula.ast
  return prettyFormula(exp.inner) === prettyFormula(suppositionExp)
}

function evalSupposition(exp: AST.Expression, justifications: Line[]): boolean {
  return justifications.length === 0
}

function evalModusTollens(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 2) {
    return false
  }

  if (!isNegation(exp)) {
    return false
  }

  const expInner = prettyFormula(exp.inner)
  const justExps = justifications.map((j) => j.formula.ast)
  const negationJustIndex = justExps.findIndex((e) => isNegation(e))
  if (negationJustIndex === -1) {
    return false
  }

  const negationJust = justExps[negationJustIndex]
  const conditionalJust = justExps[negationJustIndex ? 0 : 1]

  return (
    isNegation(negationJust) &&
    isConditional(conditionalJust) &&
    prettyFormula(conditionalJust.left) === expInner &&
    prettyFormula(conditionalJust.right) === prettyFormula(negationJust.inner)
  )
}

function evalDisjunctiveArgument(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 2) {
    return false
  }

  const justExps = justifications.map((j) => j.formula.ast)
  const orderedJusts = [justExps, justExps.toReversed()].find(([a, b]) => {
    if (!isNegation(b)) {
      return false
    }
    const bExp = prettyFormula(b.inner)
    return isDisjunction(a) && (prettyFormula(a.left) === bExp || prettyFormula(a.right) === bExp)
  })
  if (!orderedJusts) {
    return false
  }

  const disjunctionJust = orderedJusts[0]
  const expStr = prettyFormula(exp)
  return (
    isDisjunction(disjunctionJust) &&
    (prettyFormula(disjunctionJust.left) === expStr ||
      prettyFormula(disjunctionJust.right) === expStr)
  )
}

function evalConjunctiveArgument(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 2) {
    return false
  }

  if (!isNegation(exp)) {
    return false
  }

  const justExps = justifications.map((j) => j.formula.ast)
  const orderedJusts = [justExps, justExps.toReversed()].find(([a, b]) => {
    const bStr = prettyFormula(b)
    return (
      isNegation(a) &&
      isConjunction(a.inner) &&
      (prettyFormula(a.inner.left) === bStr || prettyFormula(a.inner.right) === bStr)
    )
  })
  if (!orderedJusts) {
    return false
  }

  const conjunctionJust = orderedJusts[0]
  const innerStr = prettyFormula(exp.inner)
  return (
    isNegation(conjunctionJust) &&
    isConjunction(conjunctionJust.inner) &&
    (prettyFormula(conjunctionJust.inner.left) === innerStr ||
      prettyFormula(conjunctionJust.inner.right) === innerStr)
  )
}

function evalChainRule(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 2) {
    return false
  }

  if (!isConditional(exp)) {
    return false
  }

  const justExps = justifications.map((j) => j.formula.ast)
  if (!justExps.every((e) => isConditional(e))) {
    return false
  }

  const expLeft = prettyFormula(exp.left)
  const firstJustIndex = justExps.findIndex((e) => prettyFormula(e.left) === expLeft)
  if (firstJustIndex === -1) {
    return false
  }
  const expRight = prettyFormula(exp.right)
  const firstJust = justExps[firstJustIndex]
  const secondJust = justExps[firstJustIndex ? 0 : 1]
  const firstJustLeft = prettyFormula(firstJust.left)
  const firstJustRight = prettyFormula(firstJust.right)
  const secondJustLeft = prettyFormula(secondJust.left)
  const secondJustRight = prettyFormula(secondJust.right)

  return (
    firstJustLeft === expLeft && firstJustRight === secondJustLeft && secondJustRight === expRight
  )
}

function evalDoubleNegation(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 1) {
    return false
  }

  const justification = justifications[0].formula.ast
  const expStr = prettyFormula(exp)
  const justExp = prettyFormula(justification)
  const doubleNegation = Operator.NEGATION['libChar'].repeat(2)

  return expStr === `${doubleNegation}${justExp}` || `${doubleNegation}${expStr}` === justExp
}

function evalDemorgansLaw(
  exp: AST.Expression,
  justifications: Line[],
  proof: Proof,
  tryReciprocal: boolean = true,
): boolean {
  if (justifications.length !== 1) {
    return false
  }

  const justification = justifications[0].formula.ast
  // If this rule doesn't pass, try it's reciprocal, since the rule works both
  // ways.
  const returnFalse = () =>
    tryReciprocal
      ? evalDemorgansLaw(
          justification,
          [new Line(0, prettyFormula(exp), Rule.ASSUMPTION)],
          proof,
          false,
        )
      : false

  if (!isNegation(justification)) {
    return returnFalse()
  }

  if (
    !(
      (isConjunction(exp) && isDisjunction(justification.inner)) ||
      (isDisjunction(exp) && isConjunction(justification.inner))
    )
  ) {
    return returnFalse()
  }

  if (
    isNegation(justification.inner.left) &&
    isNegation(justification.inner.right) &&
    !isNegation(exp.left) &&
    !isNegation(exp.right) &&
    prettyFormula(justification.inner.left.inner) === prettyFormula(exp.left) &&
    prettyFormula(justification.inner.right.inner) === prettyFormula(exp.right)
  ) {
    return true
  }

  if (
    !isNegation(justification.inner.left) &&
    !isNegation(justification.inner.right) &&
    isNegation(exp.left) &&
    isNegation(exp.right) &&
    prettyFormula(justification.inner.left) === prettyFormula(exp.left.inner) &&
    prettyFormula(justification.inner.right) === prettyFormula(exp.right.inner)
  ) {
    return true
  }

  return returnFalse()
}

function evalArrow(
  exp: AST.Expression,
  justifications: Line[],
  proof: Proof,
  tryReciprocal: boolean = true,
): boolean {
  if (justifications.length !== 1) {
    return false
  }

  const justification = justifications[0].formula.ast
  // If this rule doesn't pass, try it's reciprocal, since the rule works both
  // ways.
  const returnFalse = () =>
    tryReciprocal
      ? evalArrow(justification, [new Line(0, prettyFormula(exp), Rule.ASSUMPTION)], proof, false)
      : false

  const conditionalJust = isNegation(justification) ? justification.inner : justification
  if (!isConditional(conditionalJust)) {
    return returnFalse()
  }

  // -A ∨ B from A → B
  if (
    !isNegation(justification) &&
    !isNegation(conditionalJust.left) &&
    !isNegation(conditionalJust.right) &&
    isDisjunction(exp) &&
    isNegation(exp.left) &&
    !isNegation(exp.right) &&
    prettyFormula(conditionalJust.left) === prettyFormula(exp.left.inner) &&
    prettyFormula(conditionalJust.right) === prettyFormula(exp.right)
  ) {
    return true
  }

  // A ∨ B from -A → B
  if (
    !isNegation(justification) &&
    isNegation(conditionalJust.left) &&
    !isNegation(conditionalJust.right) &&
    isDisjunction(exp) &&
    !isNegation(exp.left) &&
    !isNegation(exp.right) &&
    prettyFormula(conditionalJust.left.inner) === prettyFormula(exp.left) &&
    prettyFormula(conditionalJust.right) === prettyFormula(exp.right)
  ) {
    return true
  }

  // -(A & -B) from A → B
  if (
    !isNegation(justification) &&
    isNegation(exp) &&
    !isNegation(conditionalJust.left) &&
    !isNegation(conditionalJust.right) &&
    isConjunction(exp.inner) &&
    !isNegation(exp.inner.left) &&
    isNegation(exp.inner.right) &&
    prettyFormula(conditionalJust.left) === prettyFormula(exp.inner.left) &&
    prettyFormula(conditionalJust.right) === prettyFormula(exp.inner.right.inner)
  ) {
    return true
  }

  // A & -B from -(A → B)
  if (
    isNegation(justification) &&
    !isNegation(conditionalJust.left) &&
    !isNegation(conditionalJust.right) &&
    isConjunction(exp) &&
    !isNegation(exp.left) &&
    isNegation(exp.right) &&
    prettyFormula(conditionalJust.left) === prettyFormula(exp.left) &&
    prettyFormula(conditionalJust.right) === prettyFormula(exp.right.inner)
  ) {
    return true
  }

  return returnFalse()
}

function evalContraposition(exp: AST.Expression, justifications: Line[]): boolean {
  if (justifications.length !== 1) {
    return false
  }

  const justification = justifications[0].formula.ast

  if (!isConditional(justification) || !isConditional(exp)) {
    return false
  }

  // -B → -A from A → B
  if (
    !isNegation(justification.left) &&
    !isNegation(justification.right) &&
    isNegation(exp.left) &&
    isNegation(exp.right) &&
    prettyFormula(exp.left.inner) === prettyFormula(justification.right) &&
    prettyFormula(exp.right.inner) === prettyFormula(justification.left)
  ) {
    return true
  }

  // B → A from -A → -B
  if (
    isNegation(justification.left) &&
    isNegation(justification.right) &&
    !isNegation(exp.left) &&
    !isNegation(exp.right) &&
    prettyFormula(justification.left.inner) === prettyFormula(exp.right) &&
    prettyFormula(justification.right.inner) === prettyFormula(exp.left)
  ) {
    return true
  }

  // -B → A from -A → B
  if (
    isNegation(justification.left) &&
    !isNegation(justification.right) &&
    isNegation(exp.left) &&
    !isNegation(exp.right) &&
    prettyFormula(justification.left.inner) === prettyFormula(exp.right) &&
    prettyFormula(justification.right) === prettyFormula(exp.left.inner)
  ) {
    return true
  }

  // B → -A from A → -B
  if (
    !isNegation(justification.left) &&
    isNegation(justification.right) &&
    !isNegation(exp.left) &&
    isNegation(exp.right) &&
    prettyFormula(justification.left) === prettyFormula(exp.right.inner) &&
    prettyFormula(justification.right.inner) === prettyFormula(exp.left)
  ) {
    return true
  }

  return false
}

function isNegation(exp: AST.Expression): exp is AST.UnaryExpression {
  return exp instanceof AST.UnaryExpression && exp.operator.lexeme === Operator.NEGATION['libChar']
}

function isConditional(exp: AST.Expression): exp is AST.BinaryExpression {
  return (
    exp instanceof AST.BinaryExpression && exp.operator.lexeme === Operator.CONDITIONAL['libChar']
  )
}

function isBiconditional(exp: AST.Expression): exp is AST.BinaryExpression {
  return (
    exp instanceof AST.BinaryExpression && exp.operator.lexeme === Operator.BICONDITIONAL['libChar']
  )
}

function isConjunction(exp: AST.Expression): exp is AST.BinaryExpression {
  return (
    exp instanceof AST.BinaryExpression && exp.operator.lexeme === Operator.CONJUNCTION['libChar']
  )
}

function isDisjunction(exp: AST.Expression): exp is AST.BinaryExpression {
  return (
    exp instanceof AST.BinaryExpression && exp.operator.lexeme === Operator.DISJUNCTION['libChar']
  )
}

function isContradiction(exp: AST.Expression): exp is AST.BinaryExpression {
  if (!isConjunction(exp)) {
    return false
  }
  const pairs = [
    [exp.left, exp.right],
    [exp.right, exp.left],
  ]
  return !!pairs.find(([a, b]) => isNegation(a) && prettyFormula(a.inner) === prettyFormula(b))
}
