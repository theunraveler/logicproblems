import * as propositional from 'propositional'
import * as AST from 'propositional/lib/syntax/ast';
import { toString as prettyFormula } from 'propositional/lib/transform/toString'

export class Operator {
  static all: Operator[] = [];

  static readonly CONDITIONAL = new Operator('→', 'conditional', '=>', '⇒');
  static readonly BICONDITIONAL = new Operator('↔', 'bi-conditional', '<=>', '⇔');
  static readonly DISJUNCTION = new Operator('∨', 'disjunction', '|');
  static readonly CONJUNCTION = new Operator('&', 'conjunction', null, '∧');
  static readonly NEGATION = new Operator('-', 'negation', '!', '¬', false);

  constructor(
    public readonly symbol: string,
    public readonly label: string,
    private readonly _libChar: string | null = null,
    private readonly _prettyLibChar: string | null = null,
    public readonly isBinary: boolean = true
  ) {
    this.symbol = symbol;
    this.label = label;
    this._libChar = _libChar;
    this._prettyLibChar = _prettyLibChar;
    this.isBinary = isBinary;
    Operator.all.push(this);
  }

  private get libChar(): string {
    return this._libChar || this.symbol;
  }

  private get prettyLibChar(): string {
    return this._prettyLibChar || this.symbol;
  }

  toString(): string {
    return this.symbol;
  }

  public static findBySymbol(symbol: string): Operator {
    const found = Operator.all.find(
      (operator) => operator.symbol === symbol || (operator['libChar'] && operator['libChar'] === symbol)
    );
    if (!found) {
      throw new Error('Operator not found');
    }
    return found;
  }
}

type LineEvalFunction = {
    (formula: Formula, justifications: Formula[]): boolean;
};

export class Rule {
  static all: Rule[] = [];

  static readonly ASSUMPTION = new Rule('A', 'Assumption', () => true);
  static readonly ARROW_OUT = new Rule('→ O', 'Arrow Out', evalArrowOut);
  static readonly ARROW_IN = new Rule('→ I', 'Arrow In', evalArrowIn);
  static readonly BICONDITIONAL_OUT = new Rule('↔ O', 'Biconditional Out', evalBiconditionalOut);
  static readonly BICONDITIONAL_IN = new Rule('↔ I', 'Biconditional In', evalBiconditionalIn);
  static readonly OR_OUT = new Rule('∨ O', 'Or Out', evalOrOut);
  static readonly OR_IN = new Rule('∨ I', 'Or In', evalOrIn);
  static readonly AND_OUT = new Rule('& O', 'And Out', evalAndOut);
  static readonly AND_IN = new Rule('& I', 'And In', evalAndIn);
  static readonly NEGATION_OUT = new Rule('- O', 'Negation Out', evalNegationOut);
  static readonly NEGATION_IN = new Rule('- I', 'Negation In', evalNegationIn);
  static readonly SUPPOSITION = new Rule('S', 'Supposition', evalSupposition);
  static readonly MODUS_TOLLENS = new Rule('MT', 'Modus Tollens', evalModusTollens);
  static readonly DISJUNCTIVE_ARGUMENT = new Rule('DA', 'Disjunctive Argument', evalDisjunctiveArgument);
  static readonly CONJUNCTIVE_ARGUMENT = new Rule('CA', 'Conjunctive Argument', evalConjunctiveArgument);
  static readonly CHAIN_RULE = new Rule('CH', 'Chain Rule', evalChainRule);
  static readonly DOUBLE_NEGATION = new Rule('DN', 'Double Negation', evalDoubleNegation);
  static readonly DEMORGANS_LAW = new Rule('DM', "Demorgan's Law", evalDemorgansLaw);
  static readonly ARROW = new Rule('AR', 'Arrow', evalArrow);
  static readonly CONTRAPOSITION = new Rule('CN', 'Contraposition', evalContraposition);

  constructor(
    public readonly shorthand: string,
    public readonly label: string,
    private readonly evalFunc: LineEvalFunction,
  ) {
    this.shorthand = shorthand;
    this.label = label;
    this.evalFunc = evalFunc;
    Rule.all.push(this);
  }

  evaluate(formula: Formula, justifications: Formula[]): boolean {
    return this.evalFunc(formula, justifications);
  }

  toString() {
    return this.shorthand;
  }

  public static findByShorthand(shorthand: string): Rule {
    const found = Rule.all.find((rule) => rule.shorthand === shorthand);
    if (!found) {
      throw new Error('Rule not found');
    }
    return found;
  }
}

export class Formula {
  public readonly ast: AST.Expression;
  _text: string | null = null;

  constructor(text: string) {
    try {
      this.ast = new propositional.Formula(Formula.normalizeForParsing(text)).ast;
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : (error as string).toString();
      throw new Error(Formula.normalize(message));
    }
  }

  get text() {
    if (!this._text) {
      this._text = Formula.normalize(prettyFormula(this.ast, true), true);
    }
    return this._text
  }

  toString(): string {
    return this.text;
  }

  valueOf(): string {
    return this.text;
  }

  private static normalize(text: string, fromPretty: boolean = false): string {
    let str = Operator.all.toReversed()
      .filter((o: Operator) => o['libChar'])
      .reduce((t: string, operator: Operator) => {
        return t.replaceAll(operator[fromPretty ? 'prettyLibChar' : 'libChar'], operator.symbol)
      }, text);
    if (str.charAt(0) === '(' && str.slice(-1) === ')') {
        str = str.substring(1, str.length - 1);
    }
    return str.trim();
  }

  private static normalizeForParsing(text: string): string {
    return Operator.all.toReversed()
      .filter((o: Operator) => o['libChar'])
      .reduce((t: string, operator: Operator) => t.replaceAll(operator.symbol, operator['libChar']), text);
  }
}

export class Line {
  public readonly formula: Formula;
  public readonly rule: Rule;
  public readonly justifications: number[];

  constructor(
    formula: Formula | string,
    rule: Rule | string,
    justifications: number[] = [],
  ) {
    this.formula = formula instanceof Formula
      ? formula
      : new Formula(formula);
    this.rule = rule instanceof Rule
      ? rule
      : Rule.findByShorthand(rule);
    this.justifications = justifications.sort();
  }
}

export class Proof {
  public readonly assumptions: Line[];
  public readonly conclusion: Formula;
  _deductions: Line[] = [];

  constructor(
    assumptions: Line[] | string[],
    conclusion: Formula | string,
  ) {
    this.assumptions = assumptions.map((assumption) => {
      return assumption instanceof Line
        ? assumption
        : new Line(assumption, Rule.ASSUMPTION);
    });
    this.conclusion = conclusion instanceof Formula
      ? conclusion
      : new Formula(conclusion);
  }

  /**
   * Return all lines of the proof, including assumptions.
   */
  get lines() {
    return this.assumptions.concat(this._deductions);
  }

  addDeduction(deduction: Line) {
    const lines = this.lines;
    const isValid = deduction.rule.evaluate(
      deduction.formula,
      deduction.justifications.map((index) => lines[index].formula)
    );

    if (!isValid) {
      throw new Error('Invalid deduction');
    }

    this._deductions.push(deduction);
    return this;
  }

  qed(): boolean {
    return this.conclusion.valueOf() === this._deductions[this._deductions.length - 1]?.formula?.valueOf();
  }
}

/***************************
 * Rule evaluation functions
 ***************************/

function evalArrowOut(formula: Formula, justifications: Formula[]): boolean {
  if (justifications.length !== 2) {
    return false;
  }

  const justificationExps = justifications.map((j) => j.ast);
  const orderedJust = [justificationExps, justificationExps.toReversed()].find(([a, b]) => {
    return a instanceof AST.BinaryExpression && prettyFormula(a.left) === prettyFormula(b);
  });
  if (!orderedJust) {
    return false;
  }

  const exp = formula.ast;
  const [ mainJust, ] = orderedJust;

  return (
    isConditional(mainJust) && prettyFormula(mainJust.right) === prettyFormula(exp)
  );
}

function evalArrowIn(formula: Formula, justifications: Formula[]): boolean {
  return false;
}

function evalBiconditionalOut(formula: Formula, justifications: Formula[]): boolean {
  if (justifications.length !== 1) {
    return false;
  }

  const just = justifications[0].ast;
  if (!isBiconditional(just)) {
    return false;
  }

  const exp = formula.ast;
  if (!isConditional(exp)) {
    return false;
  }

  const expLeft = prettyFormula(exp.left);
  const expRight = prettyFormula(exp.right);
  const justLeft = prettyFormula(just.left);
  const justRight = prettyFormula(just.right);
  return (
    (expLeft === justLeft && expRight === justRight) ||
    (expLeft === justRight && expRight === justLeft)
  );
}

function evalBiconditionalIn(formula: Formula, justifications: Formula[]): boolean {
  if (justifications.length !== 2) {
    return false;
  }

  const exp = formula.ast;
  if (!isBiconditional(exp)) {
    return false;
  }

  const justExps = justifications.map((j) => j.ast)
  if (!justExps.every((e) => isConditional(e))) {
    return false;
  }

  const justExpsStr = justExps.map((e) => prettyFormula(e));
  const expLeft = prettyFormula(exp.left);
  const expRight = prettyFormula(exp.right);

  return (
    justExpsStr.includes(`(${expLeft}${Operator.CONDITIONAL['libChar']}${expRight})`) &&
    justExpsStr.includes(`(${expRight}${Operator.CONDITIONAL['libChar']}${expLeft})`)
  );
}

function evalOrOut(formula: Formula, justifications: Formula[]): boolean {
  if (justifications.length !== 3) {
    return false;
  }

  const justExps = justifications.map((j) => j.ast);
  const orJustIndex = justExps.findIndex(
    (e) => e instanceof AST.BinaryExpression && e.operator.lexeme === Operator.DISJUNCTION['libChar']
  )
  if (orJustIndex === -1) {
    return false;
  }
  const [ orJust ] = justExps.splice(orJustIndex, 1);

  if (!justExps.every((e) => isConditional(e))) {
    return false;
  }

  const exp = prettyFormula(formula.ast);

  if (!justExps.every((e) => prettyFormula(e.right) === exp)) {
    return false;
  }

  const orJustParts = [orJust.left, orJust.right].map((p) => prettyFormula(p)).sort();
  const justExpLefts = justExps.map((e) => prettyFormula(e.left)).sort();
  return orJustParts.every((val, index) => val === justExpLefts[index]);
}

function evalOrIn(formula: Formula, justifications: Formula[]): boolean {
  if (justifications.length !== 1) {
    return false;
  }

  const exp = formula.ast;
  if (!(exp instanceof AST.BinaryExpression) || exp.operator.lexeme !== Operator.DISJUNCTION['libChar']) {
    return false;
  }

  const justExp = prettyFormula(justifications[0].ast);

  return prettyFormula(exp.left) === justExp || prettyFormula(exp.right) === justExp;
}

function evalAndOut(formula: Formula, justifications: Formula[]): boolean {
  if (justifications.length !== 1) {
    return false;
  }

  const just = justifications[0].ast;
  if (!(just instanceof AST.BinaryExpression) || just.operator.lexeme !== Operator.CONJUNCTION['libChar']) {
    return false;
  }

  const exp = prettyFormula(formula.ast);
  return prettyFormula(just.left) === exp || prettyFormula(just.right) === exp;
}

function evalAndIn(formula: Formula, justifications: Formula[]): boolean {
  if (justifications.length !== 2) {
    return false;
  }

  const exp = formula.ast;

  if (!(exp instanceof AST.BinaryExpression) || exp.operator.lexeme !== Operator.CONJUNCTION['libChar']) {
    return false;
  }

  const expLeft = prettyFormula(exp.left);
  const expRight = prettyFormula(exp.right);
  const justExps = justifications.map((j) => prettyFormula(j.ast));

  return justExps.includes(expLeft) && justExps.includes(expRight);
}

function evalNegationOut(formula: Formula, justifications: Formula[]): boolean {
  return false;
}

function evalNegationIn(formula: Formula, justifications: Formula[]): boolean {
  return false;
}

function evalSupposition(formula: Formula, justifications: Formula[]): boolean {
  return true;
}

function evalModusTollens(formula: Formula, justifications: Formula[]): boolean {
  if (justifications.length !== 2) {
    return false;
  }

  const exp = formula.ast;

  if (!isNegation(exp)) {
    return false;
  }

  const expInner = prettyFormula(exp.inner);

  const justExps = justifications.map((e) => e.ast);
  const negationJustIndex = justExps.findIndex((e) => isNegation(e));
  if (negationJustIndex === -1) {
    return false;
  }

  const negationJust = justExps[negationJustIndex];
  const conditionalJust = justExps[negationJustIndex ? 0 : 1];

  return (
    isConditional(conditionalJust) &&
    prettyFormula(conditionalJust.left) === expInner &&
    prettyFormula(conditionalJust.right) === prettyFormula(negationJust.inner)
  );
}

function evalDisjunctiveArgument(formula: Formula, justifications: Formula[]): boolean {
  if (justifications.length !== 2) {
    return false;
  }

  const justExps = justifications.map((e) => e.ast);
  const orderedJusts = [justExps, justExps.toReversed()].find(([ a, b ]) => {
    if (!isNegation(b)) {
      return false;
    }
    const bExp = prettyFormula(b.inner);
    return isDisjunction(a) && (
      prettyFormula(a.left) === bExp || prettyFormula(a.right) === bExp
    );
  });
  if (!orderedJusts) {
    return false;
  }

  const disjunctionJust = orderedJusts[0];
  const exp = prettyFormula(formula.ast);
  return (
    prettyFormula(disjunctionJust.left) === exp ||
    prettyFormula(disjunctionJust.right) === exp
  );

}

function evalConjunctiveArgument(formula: Formula, justifications: Formula[]): boolean {
  if (justifications.length !== 2) {
    return false;
  }

  const exp = formula.ast;

  if (!isNegation(exp)) {
    return false;
  }

  const justExps = justifications.map((e) => e.ast);
  const orderedJusts = [justExps, justExps.toReversed()].find(([ a, b ]) => {
    const bStr = prettyFormula(b);
    return isNegation(a) && isConjunction(a.inner) && (
      prettyFormula(a.inner.left) === bStr || prettyFormula(a.inner.right) === bStr
    );
  });
  if (!orderedJusts) {
    return false;
  }

  const conjunctionJust = orderedJusts[0];
  const innerStr = prettyFormula(exp.inner);
  return (
    prettyFormula(conjunctionJust.inner.left) === innerStr ||
    prettyFormula(conjunctionJust.inner.right) === innerStr
  );
}

function evalChainRule(formula: Formula, justifications: Formula[]): boolean {
  if (justifications.length !== 2) {
    return false;
  }

  const exp = formula.ast;
  if (!isConditional(exp)) {
    return false;
  }

  const justExps = justifications.map((e) => e.ast);
  if (!justExps.every((e) => isConditional(e))) {
    return false;
  }

  const expLeft = prettyFormula(exp.left);
  const firstJustIndex = justExps.findIndex((e) => prettyFormula(e.left) === expLeft);
  if (firstJustIndex === -1) {
    return false;
  }
  const expRight = prettyFormula(exp.right);
  const firstJust = justExps[firstJustIndex];
  const secondJust = justExps[firstJustIndex ? 0 : 1];
  const firstJustLeft = prettyFormula(firstJust.left);
  const firstJustRight = prettyFormula(firstJust.right);
  const secondJustLeft = prettyFormula(secondJust.left);
  const secondJustRight = prettyFormula(secondJust.right);

  return (
    firstJustLeft === expLeft &&
    firstJustRight === secondJustLeft &&
    secondJustRight === expRight
  );
}

function evalDoubleNegation(formula: Formula, justifications: Formula[]): boolean {
  if (justifications.length !== 1) {
    return false;
  }

  const [ justification ] = justifications;
  const exp = prettyFormula(formula.ast);
  const justExp = prettyFormula(justification.ast);
  const doubleNegation = Operator.NEGATION['libChar'].repeat(2);

  return (
    exp === `${doubleNegation}${justExp}` || `${doubleNegation}${exp}` === justExp
  )
}

function evalDemorgansLaw(formula: Formula, justifications: Formula[]): boolean {
  return false;
}

function evalArrow(formula: Formula, justifications: Formula[]): boolean {
  return false;
}

function evalContraposition(formula: Formula, justifications: Formula[]): boolean {
  return false;
}

function isNegation(exp: AST.Expression): boolean {
  return exp instanceof AST.UnaryExpression && exp.operator.lexeme === Operator.NEGATION['libChar'];
}

function isConditional(exp: AST.Expression): boolean {
  return exp instanceof AST.BinaryExpression && exp.operator.lexeme === Operator.CONDITIONAL['libChar'];
}

function isBiconditional(exp: AST.Expression): boolean {
  return exp instanceof AST.BinaryExpression && exp.operator.lexeme === Operator.BICONDITIONAL['libChar'];
}

function isConjunction(exp: AST.Expression): boolean {
  return exp instanceof AST.BinaryExpression && exp.operator.lexeme === Operator.CONJUNCTION['libChar'];
}

function isDisjunction(exp: AST.Expression): boolean {
  return exp instanceof AST.BinaryExpression && exp.operator.lexeme === Operator.DISJUNCTION['libChar'];
}
