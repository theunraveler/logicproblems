import * as propositional from 'propositional'

export class Operator {
  static all: Operator[] = [];

  static readonly CONDITIONAL = new Operator('→', 'conditional');
  static readonly BICONDITIONAL = new Operator('↔', 'bi-conditional');
  static readonly DISJUNCTION = new Operator('∨', 'disjunction');
  static readonly CONJUNCTION = new Operator('&', 'conjunction');
  static readonly NEGATION = new Operator('-', 'negation', false);

  constructor(
    public readonly symbol: string,
    public readonly label: string,
    public readonly isBinary: boolean = true
  ) {
    this.symbol = symbol;
    this.label = label;
    this.isBinary = isBinary;
    Operator.all.push(this);
  }

  toString(): string {
    return this.symbol;
  }
}

export class Rule {
  static all: Rule[] = [];

  static readonly ASSUMPTION = new Rule('A', 'Assumption');
  static readonly ARROW_OUT = new Rule('→ O', 'Arrow Out');
  static readonly ARROW_IN = new Rule('→ I', 'Arrow In');
  static readonly BICONDITIONAL_OUT = new Rule('↔ O', 'Biconditional Out');
  static readonly BICONDITIONAL_IN = new Rule('↔ I', 'Biconditional In');
  static readonly OR_OUT = new Rule('∨ O', 'Or Out');
  static readonly OR_IN = new Rule('∨ I', 'Or In');
  static readonly AND_OUT = new Rule('& O', 'And Out');
  static readonly AND_IN = new Rule('& I', 'And In');
  static readonly NEGATION_OUT = new Rule('- O', 'Negation Out');
  static readonly NEGATION_IN = new Rule('- I', 'Negation In');
  static readonly SUPPOSITION = new Rule('S', 'Supposition');
  static readonly MODUS_TOLLENS = new Rule('MT', 'Modus Tollens');
  static readonly DISJUNCTIVE_ARGUMENT = new Rule('DA', 'Disjunctive Argument');
  static readonly CONJUNCTIVE_ARGUMENT = new Rule('CA', 'Conjunctive Argument');
  static readonly CHAIN_RULE = new Rule('CH', 'Chain Rule');
  static readonly DOUBLE_NEGATION = new Rule('DN', 'Double Negation');
  static readonly DEMORGANS_LAW = new Rule('DM', "Demorgan's Law");
  static readonly ARROW = new Rule('AR', 'Arrow');
  static readonly CONTRAPOSITION = new Rule('CN', 'Contraposition');

  constructor(
    public readonly shorthand: string,
    public readonly label: string
  ) {
    this.shorthand = shorthand;
    this.label = label;
    Rule.all.push(this);
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
  _parsed: propositional.Formula | null = null;

  static readonly _TRANS = {
    '→': '=>',
    '↔': '<=>',
    '∨': '|',
    '-': '!',
  };

  constructor(
    public readonly text: string
  ) {
    this.text = Formula.normalize(text);
  }

  checkWellFormed() {
    if (this._parsed) {
      return;
    }
    try {
      this._parsed = new propositional.Formula(Formula.normalizeForParsing(this.text));
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : (error as string).toString();
      throw new Error(Formula.normalize(message));
    }
  }

  toString(): string {
    return this.text;
  }

  valueOf(): string {
    return this.text;
  }

  private static normalize(text: string): string {
    return Object.entries(Formula._TRANS).reduce(
      (t, [to, from]) => t.replace(from, to),
      text
    );
  }

  private static normalizeForParsing(text: string): string {
    return Object.entries(Formula._TRANS).reduce(
      (t, [from, to]) => t.replace(from, to),
      text
    );
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
    // TODO: Validate line.
    this._deductions.push(deduction);
    return this;
  }

  isValid(): boolean {
    return true;
  }

  qed(): boolean {
    return this.conclusion.valueOf() === this._deductions[this._deductions.length - 1]?.formula?.valueOf();
  }
}
