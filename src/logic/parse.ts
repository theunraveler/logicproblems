/**
 * Fun times. This is mostly taken from https://github.com/p2js/propositional
 * but modified to include more symbols and a more opinionated AST.
 */

import * as ast from '@/logic/ast'

export const parse = (text: string) => parseTokenStream(tokenize(text))

const parseTokenStream = (tokenStream: Token[]): ast.Expression => {
  let currentToken = 0

  const current = () => tokenStream[currentToken]
  const previous = () => tokenStream[currentToken - 1]
  const advance = () => tokenStream[currentToken++]

  const match = (...types: TokenType[]): boolean => {
    if (currentToken >= tokenStream.length) {
      return false
    }

    for (const type of types) {
      if (current().type === type) {
        advance()
        return true
      }
    }
    return false
  }

  // Grammar implementation
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
      const inner = binary()
      if (!match(TokenType.PAREN_R)) {
        throw Error('Unclosed parenthesis')
      }
      return inner
    }
    // something else
    const token = current()?.lexeme
    if (token) {
      throw Error('Unexpected token ' + token)
    } else {
      throw Error('Unexpected end of input')
    }
  }

  const expr = binary()

  if (current()?.lexeme) {
    throw Error('Unexpected token ' + current().lexeme)
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

  const addToken = (type: TokenType, lexeme = source.substring(start, current)) => {
    tokens.push(new Token(type, lexeme))
  }

  while (current < source.length) {
    start = current
    const char = advance()

    switch (true) {
      case char === '(':
        addToken(TokenType.PAREN_L)
        break
      case char === ')':
        addToken(TokenType.PAREN_R)
        break
      case ['-', '!', '~', '¬'].includes(char):
        addToken(TokenType.NOT)
        break
      case ['∨', '|'].includes(char):
        addToken(TokenType.OR)
        break
      case ['&', 'Λ'].includes(char):
        addToken(TokenType.AND)
        break
      case char === '→' || (char === '=' && match('>')):
        addToken(TokenType.IF)
        break
      case char === '↔' || (char === '<' && match('=') && match('>')):
        addToken(TokenType.IFF)
        break
      case char.trim() === '':
        break
      case isLetter(char):
        addToken(TokenType.VARIABLE)
        break
      default:
        throw Error('Unexpected character ' + char)
    }
  }

  return tokens
}
