/**
 * Fun times. This is mostly taken from https://github.com/p2js/propositional
 * but modified to include more symbols and a more opinionated AST.
 */

import * as ast from './ast'

export const parse = (text: string) => parseTokenStream(tokenize(text))

const parseTokenStream = (tokenStream: Token[]): ast.Expression => {
  let currentToken = 0

  const peek = () => tokenStream[currentToken]
  const previous = () => tokenStream[currentToken - 1]
  const advance = () => tokenStream[currentToken++]

  const check = (type: TokenType) =>
    currentToken >= tokenStream.length ? false : peek().type == type
  const match = (...types: TokenType[]) => {
    for (const type of types) {
      if (check(type)) {
        advance()
        return true
      }
    }
    return false
  }
  const expect = (type: TokenType, message: string) => {
    if (check(type)) return advance()
    throw Error('[' + (peek()?.lexeme || 'end') + '] ' + message)
  }

  // Grammar implementation
  function expression(): ast.Expression {
    return binary()
  }

  function binary(): ast.Expression {
    let left = unary()

    while (match(TokenType.AND, TokenType.OR, TokenType.IF, TokenType.IFF)) {
      const expClass = TOKEN_TO_NODE[previous().type as BinaryTokenType]
      left = new expClass(left, unary())
    }

    return left
  }

  function unary(): ast.Expression {
    if (match(TokenType.NOT)) {
      return new ast.Negation(unary())
    }
    return primary()
  }

  function primary() {
    // literals
    if (match(TokenType.VARIABLE)) {
      return new ast.Atom(previous().lexeme)
    }
    // groupings
    if (match(TokenType.PAREN_L)) {
      const inner = expression()
      expect(TokenType.PAREN_R, 'unclosed grouping')
      return inner
    }
    // something else
    const token = peek()?.lexeme
    if (token) {
      throw Error('Unexpected token ' + token)
    } else {
      throw Error('Unexpected end of input')
    }
  }

  const expr = expression()

  if (peek()?.lexeme) {
    throw Error('Unexpected token ' + peek().lexeme)
  }

  return expr
}

enum TokenType {
  PAREN_L,
  PAREN_R,
  NOT,
  AND,
  OR,
  IF,
  IFF,
  VARIABLE,
}

type BinaryTokenType = TokenType.AND | TokenType.OR | TokenType.IF | TokenType.IFF
type BinaryExpSubclass = {
  new (...params: ConstructorParameters<typeof ast.BinaryExpression>): ast.BinaryExpression
}

const TOKEN_TO_NODE: Record<BinaryTokenType, BinaryExpSubclass> = {
  [TokenType.AND]: ast.Conjunction,
  [TokenType.OR]: ast.Disjunction,
  [TokenType.IF]: ast.Conditional,
  [TokenType.IFF]: ast.Biconditional,
}

class Token {
  constructor(
    public type: TokenType,
    public lexeme: string,
  ) {}
}

function isLetter(c: string) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = []

  let current = 0 // Current token
  let start = 0 // Start of current lexeme

  const advance = () => source[current++]
  const match = (char: string) => {
    if (current > source.length || source[current] != char) return false
    current++
    return true
  }
  // const peek = (n = 0) => {
  //     if (current + n > source.length) return '\0';
  //     return source[current + n];
  // }
  const addToken = (type: TokenType, lexeme = source.substring(start, current)) => {
    tokens.push(new Token(type, lexeme))
  }

  while (current < source.length) {
    // Beginning of current lexeme
    start = current
    const char = advance()

    switch (char) {
      // parentheses
      case '(':
        addToken(TokenType.PAREN_L)
        break
      case ')':
        addToken(TokenType.PAREN_R)
        break

      // logical operators
      case '-':
      case '!':
      case '~':
      case '¬':
        addToken(TokenType.NOT)
        break
      case '∨':
      case '|':
        addToken(TokenType.OR)
        break
      case '&':
      case 'Λ':
        addToken(TokenType.AND)
        break
      case '→':
        addToken(TokenType.IF)
        break
      case '=':
        if (match('>')) {
          addToken(TokenType.IF)
          break
        }
        throw Error('expected > after =')
      case '↔':
        addToken(TokenType.IFF)
        break
      case '<':
        if (match('=') && match('>')) {
          addToken(TokenType.IFF)
          break
        }
        throw Error('expected => after <')
      // ignore
      case ' ':
      case '\t':
      case '\r':
      case '\n':
        break
      default:
        if (isLetter(char)) {
          addToken(TokenType.VARIABLE)
          break
        }
        throw Error('Unexpected character ' + char)
    }
  }

  return tokens
}
