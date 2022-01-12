import {
  ASTNode,
  AndNode,
  AtomNode,
  CheckErrorNode,
  CheckMemberOfNode,
  CheckNode,
  CheckSatisfiedNode,
  CheckWithinNode,
  CondNode,
  DefnNode,
  DefnStructNode,
  DefnVarNode,
  EllipsisFunAppNode,
  EllipsisNode,
  FunAppNode,
  IfNode,
  LambdaNode,
  OrNode,
  VarNode,
  isDefnNode
} from "./ast.js";
import {
  AtomSExpr,
  ListSExpr,
  SExpr,
  isAtomSExpr,
  isListSExpr
} from "./sexpr.js";
import {
  CE_TEST_NOT_TOP_LEVEL_ERR,
  CN_ELSE_NOT_LAST_CLAUSE_ERR,
  CN_EXPECTED_TWO_PART_CLAUSE_ERR,
  DF_DUPLICATE_VARIABLE_ERR,
  DF_EXPECTED_AT_LEAST_ONE_PARAM_ERR,
  DF_EXPECTED_EXPR_ERR,
  DF_EXPECTED_FUNCTION_BODY_ERR,
  DF_EXPECTED_FUNCTION_NAME_ERR,
  DF_EXPECTED_VARIABLE_ERR,
  DF_EXPECTED_VAR_OR_FUN_NAME_ERR,
  DF_TOO_MANY_EXPRS_ERR,
  DF_TOO_MANY_FUNCTION_BODIES_ERR,
  DS_DUPLICATE_FIELD_NAME,
  DS_EXPECTED_FIELD_NAMES_ERR,
  DS_EXPECTED_FIELD_NAME_ERR,
  DS_EXPECTED_STRUCT_NAME_ERR,
  DS_EXTRA_PARTS_ERR,
  ES_NOT_IN_COND_ERR,
  FA_ARITY_ERR,
  FA_MIN_ARITY_ERR,
  FC_EXPECTED_FUNCTION_ERR,
  IF_EXPECTED_THREE_PARTS_ERR,
  QU_EXPECTED_EXPRESSION,
  QU_EXPECTED_POST_QUOTE_ERR,
  SX_EXPECTED_OPEN_PAREN_ERR,
  SX_NOT_TOP_LEVEL_DEFN_ERR
} from "./error.js";
import {
  RExactReal,
  RPrimFunConfig,
  RString,
  RSymbol,
  R_EMPTY_LIST,
  R_FALSE,
  R_TRUE
} from "./rvalue.js";
import {
  Stage,
  StageError,
  StageOutput
} from "./pipeline.js";
import {
  Token,
  TokenType
} from "./token.js";
import {
  PRIMITIVE_TEST_FUNCTIONS
} from "./environment.js";
import {
  Program
} from "./program.js";

export {
  ParseSExpr
};

class ParseSExpr implements Stage<SExpr[], Program> {
  level = 0;

  run(input: StageOutput<SExpr[]>): StageOutput<Program> {
    this.level = 0;
    try {
      return new StageOutput(this.processSExprs(input.output));
    } catch (e) {
      if (e instanceof StageError) {
        return new StageOutput(<Program><unknown>null, [e]);
      } else {
        throw e;
      }
    }
  }

  private processSExprs(sexprs: SExpr[]): Program {
    const defns: DefnNode[] = [];
    const nodes: ASTNode[] = [];
    for (const sexpr of sexprs) {
      const node = this.toNode(sexpr);
      if (isDefnNode(node)) { defns.push(node); }
      nodes.push(node);
    }
    return new Program(defns, nodes);
  }

  private toNode(sexpr: SExpr): ASTNode {
    this.level++;
    const node = this.toNodeHelper(sexpr);
    this.level--;
    return node;
  }

  private toNodeHelper(sexpr: SExpr): ASTNode {
    if (isAtomSExpr(sexpr)) {
      switch (sexpr.token.type) {
        case TokenType.TRUE: {
          return new AtomNode(
            R_TRUE,
            sexpr.sourceSpan
          );
        }
        case TokenType.FALSE: {
          return new AtomNode(
            R_FALSE,
            sexpr.sourceSpan
          );
        }
        case TokenType.INTEGER: {
          return new AtomNode(
            new RExactReal(BigInt(sexpr.token.text.replace(".", ""))),
            sexpr.sourceSpan
          );
        }
        case TokenType.RATIONAL: {
          const parts = sexpr.token.text.split("/");
          return new AtomNode(
            new RExactReal(BigInt(parts[0]), BigInt(parts[1])),
            sexpr.sourceSpan
          );
        }
        case TokenType.DECIMAL: {
          const [whole, decimal] = sexpr.token.text.split(".");
          const scalar = 10n ** BigInt(decimal.length);
          const wholeBigInt = BigInt(whole);
          if (wholeBigInt < 0) {
            return new AtomNode(
              new RExactReal(wholeBigInt * scalar - BigInt(decimal), scalar),
              sexpr.sourceSpan
            );
          } else {
            return new AtomNode(
              new RExactReal(wholeBigInt * scalar + BigInt(decimal), scalar),
              sexpr.sourceSpan
            );
          }
        }
        case TokenType.STRING: {
          return new AtomNode(
            new RString(sexpr.token.text.slice(1, -1)),
            sexpr.sourceSpan
          );
        }
        case TokenType.NAME: {
          return new VarNode(sexpr.token.text, sexpr.sourceSpan);
        }
        case TokenType.KEYWORD: {
          switch (sexpr.token.text) {
            case "else":
              throw new StageError(
                ES_NOT_IN_COND_ERR,
                sexpr.sourceSpan
              );
            default:
              throw new StageError(
                SX_EXPECTED_OPEN_PAREN_ERR(sexpr.token.text),
                sexpr.sourceSpan
              );
          }
        }
        case TokenType.PLACEHOLDER: {
          return new EllipsisNode(sexpr, sexpr.sourceSpan);
        }
        default:
          throw "illegal state: unhandled token type";
      }
    } else {
      const leadingSExpr = sexpr.subExprs[0];
      if (!leadingSExpr) {
        throw new StageError(
          FC_EXPECTED_FUNCTION_ERR(),
          sexpr.sourceSpan
        );
      }
      if (isListSExpr(leadingSExpr)) {
        throw new StageError(
          FC_EXPECTED_FUNCTION_ERR(leadingSExpr),
          leadingSExpr.sourceSpan
        );
      }
      switch (leadingSExpr.token.type) {
        case TokenType.PLACEHOLDER: {
          return new EllipsisFunAppNode(leadingSExpr, sexpr.sourceSpan);
        }
        case TokenType.NAME: {
          if (leadingSExpr.token.text === "quote") {
            if (!sexpr.subExprs[1]) {
              throw new StageError(
                QU_EXPECTED_EXPRESSION,
                sexpr.sourceSpan
              );
            }
            return this.toQuoteNode(sexpr, sexpr.subExprs[1]);
          } else {
            return new FunAppNode(
              new VarNode(leadingSExpr.token.text, leadingSExpr.sourceSpan),
              sexpr.subExprs.slice(1).map(sexpr => this.toNode(sexpr)),
              sexpr.sourceSpan
            );
          }
        }
        case TokenType.KEYWORD: {
          switch (leadingSExpr.token.text) {
            case "and": {
              if (sexpr.subExprs.length - 1 < 2) {
                throw new StageError(
                  FA_MIN_ARITY_ERR("and", 2, sexpr.subExprs.length - 1),
                  leadingSExpr.sourceSpan
                );
              }
              return new AndNode(
                sexpr.subExprs.slice(1).map(sexpr => this.toNode(sexpr)),
                sexpr.sourceSpan
              );
            }
            case "check-error":
            case "check-expect":
            case "check-member-of":
            case "check-random":
            case "check-satisfied":
            case "check-within": {
              return this.toCheckNode(leadingSExpr.token.text, sexpr);
            }
            case "cond": {
              return this.toCondNode(sexpr);
            }
            case "define": {
              if (!this.atTopLevel()) {
                throw new StageError(
                  SX_NOT_TOP_LEVEL_DEFN_ERR("define"),
                  sexpr.sourceSpan
                );
              }
              return this.toDefnNode(sexpr);
            }
            case "define-struct": {
              if (!this.atTopLevel()) {
                throw new StageError(
                  SX_NOT_TOP_LEVEL_DEFN_ERR("define-struct"),
                  sexpr.sourceSpan
                );
              }
              return this.toDefnStructNode(sexpr);
            }
            case "else": {
              throw new StageError(
                ES_NOT_IN_COND_ERR,
                leadingSExpr.sourceSpan
              );
            }
            case "if": {
              if (sexpr.subExprs.length - 1 !== 3) {
                throw new StageError(
                  IF_EXPECTED_THREE_PARTS_ERR(sexpr.subExprs.length - 1),
                  sexpr.sourceSpan
                );
              }
              return new IfNode(
                this.toNode(sexpr.subExprs[1]),
                this.toNode(sexpr.subExprs[2]),
                this.toNode(sexpr.subExprs[3]),
                sexpr.sourceSpan
              );
            }
            case "or": {
              if (sexpr.subExprs.length - 1 < 2) {
                throw new StageError(
                  FA_MIN_ARITY_ERR("or", 2, sexpr.subExprs.length - 1),
                  leadingSExpr.sourceSpan
                );
              }
              return new OrNode(
                sexpr.subExprs.slice(1).map(sexpr => this.toNode(sexpr)),
                sexpr.sourceSpan
              );
            }
            default:
              throw "illegal state: non-existent keyword";
          }
        }
        default: {
          throw new StageError(
            FC_EXPECTED_FUNCTION_ERR(leadingSExpr),
            leadingSExpr.sourceSpan
          );
        }
      }
    }
  }

  private toCheckNode(checkName: string, sexpr: ListSExpr): CheckNode {
    // (check-... ...)
    if (!this.atTopLevel()) {
      throw new StageError(
        CE_TEST_NOT_TOP_LEVEL_ERR(checkName),
        sexpr.sourceSpan
      );
    }
    const config = <RPrimFunConfig>PRIMITIVE_TEST_FUNCTIONS.get(checkName);
    if (config.arity && sexpr.subExprs.length - 1 !== config.arity) {
      throw new StageError(
        FA_ARITY_ERR(checkName, config.arity, sexpr.subExprs.length - 1),
        sexpr.sourceSpan
      );
    }
    if (config.minArity && sexpr.subExprs.length - 1 < config.minArity) {
      throw new StageError(
        FA_MIN_ARITY_ERR(checkName, config.minArity, sexpr.subExprs.length - 1),
        sexpr.sourceSpan
      );
    }
    if (config.maxArity && sexpr.subExprs.length - 1 > config.maxArity) {
      throw new StageError(
        FA_ARITY_ERR(checkName, config.maxArity, sexpr.subExprs.length - 1),
        sexpr.sourceSpan
      );
    }
    switch (checkName) {
      case "check-error": {
        return new CheckErrorNode(
          sexpr.subExprs.slice(1).map(sexpr => this.toNode(sexpr)),
          sexpr.sourceSpan
        );
      }
      case "check-member-of": {
        return new CheckMemberOfNode(
          this.toNode(
            new ListSExpr(
              [
                new AtomSExpr(
                  new Token(TokenType.NAME, "member", sexpr.sourceSpan),
                  sexpr.sourceSpan
                ),
                sexpr.subExprs[1],
                new ListSExpr(
                  [
                    new AtomSExpr(
                      new Token(TokenType.NAME, "list", sexpr.sourceSpan),
                      sexpr.sourceSpan
                    ),
                    ...sexpr.subExprs.slice(2)
                  ],
                  sexpr.sourceSpan
                )
              ],
              sexpr.sourceSpan
            )
          ),
          this.toNode(sexpr.subExprs[1]),
          sexpr.subExprs.slice(2).map(sexpr => this.toNode(sexpr)),
          sexpr.sourceSpan
        );
      }
      case "check-satisfied": {
        return new CheckSatisfiedNode(
          this.toNode(
            new ListSExpr(
              [
                sexpr.subExprs[2],
                sexpr.subExprs[1]
              ],
              sexpr.sourceSpan
            )
          ),
          this.toNode(sexpr.subExprs[1]),
          sexpr.subExprs[2].stringify(),
          sexpr.sourceSpan
        );
      }
      case "check-within": {
        return new CheckWithinNode(
          this.toNode(
            new ListSExpr(
              [
                new AtomSExpr(
                  new Token(TokenType.NAME, "equal~?", sexpr.sourceSpan),
                  sexpr.sourceSpan
                ),
                sexpr.subExprs[1],
                sexpr.subExprs[2],
                sexpr.subExprs[3]
              ],
              sexpr.sourceSpan
            )
          ),
          this.toNode(sexpr.subExprs[1]),
          this.toNode(sexpr.subExprs[2]),
          this.toNode(sexpr.subExprs[3]),
          sexpr.sourceSpan
        );
      }
      default: {
        return new CheckNode(
          checkName,
          sexpr.subExprs.slice(1).map(sexpr => this.toNode(sexpr)),
          sexpr.sourceSpan
        );
      }
    }
  }

  private toCondNode(sexpr: ListSExpr): CondNode {
    // (cond ...)
    const questionAnswerClauses: [ASTNode, ASTNode][] = [];
    if (sexpr.subExprs.length - 1 === 0) {
      throw new StageError(
        CN_EXPECTED_TWO_PART_CLAUSE_ERR(),
        sexpr.sourceSpan
      );
    }
    for (const [idx, token] of sexpr.subExprs.slice(1).entries()) {
      if (!isListSExpr(token) || token.subExprs.length !== 2) {
        throw new StageError(
          CN_EXPECTED_TWO_PART_CLAUSE_ERR(token),
          token.sourceSpan
        );
      }
      const questionSExpr = token.subExprs[0];
      if (isAtomSExpr(questionSExpr)
        && questionSExpr.token.type === TokenType.KEYWORD
        && questionSExpr.token.text === "else"
      ) {
        if (idx < sexpr.subExprs.length - 2) {
          throw new StageError(
            CN_ELSE_NOT_LAST_CLAUSE_ERR,
            token.sourceSpan
          );
        }
        questionAnswerClauses.push([new AtomNode(R_TRUE, questionSExpr.sourceSpan), this.toNode(token.subExprs[1])]);
      } else {
        questionAnswerClauses.push([this.toNode(questionSExpr), this.toNode(token.subExprs[1])]);
      }
    }
    return new CondNode(questionAnswerClauses, sexpr.sourceSpan);
  }

  private toDefnNode(sexpr: ListSExpr): DefnNode {
    // (define ...)
    if (sexpr.subExprs.length - 1 === 0) {
      throw new StageError(
        DF_EXPECTED_VAR_OR_FUN_NAME_ERR(),
        sexpr.sourceSpan
      );
    }
    let name = sexpr.subExprs[1];
    if (isAtomSExpr(name)) {
      // (define variable-name ...)
      if (name.token.type !== TokenType.NAME) {
        throw new StageError(
          DF_EXPECTED_VAR_OR_FUN_NAME_ERR(name),
          name.sourceSpan
        );
      }
      if (sexpr.subExprs.length - 1 === 1) {
        throw new StageError(
          DF_EXPECTED_EXPR_ERR(name.token.text),
          sexpr.sourceSpan
        );
      }
      if (sexpr.subExprs.length - 1 > 2) {
        throw new StageError(
          DF_TOO_MANY_EXPRS_ERR(name.token.text, sexpr.subExprs.length - 3),
          sexpr.subExprs[3].sourceSpan
        );
      }
      return new DefnVarNode(
        name.token.text,
        name.sourceSpan,
        this.toNode(sexpr.subExprs[2]),
        sexpr.sourceSpan
      );
    } else {
      // (define (function-name ...) ...)
      const nameAndArgs = name;
      if (nameAndArgs.subExprs.length === 0) {
        throw new StageError(
          DF_EXPECTED_FUNCTION_NAME_ERR(),
          sexpr.sourceSpan
        );
      }
      name = nameAndArgs.subExprs[0];
      if (!isAtomSExpr(name) || name.token.type !== TokenType.NAME) {
        throw new StageError(
          DF_EXPECTED_FUNCTION_NAME_ERR(name),
          sexpr.sourceSpan
        );
      }
      if (nameAndArgs.subExprs.length - 1 === 0) {
        throw new StageError(
          DF_EXPECTED_AT_LEAST_ONE_PARAM_ERR,
          nameAndArgs.sourceSpan
        );
      }
      const params: string[] = [];
      for (const arg of nameAndArgs.subExprs.slice(1)) {
        if (!isAtomSExpr(arg) || arg.token.type !== TokenType.NAME) {
          throw new StageError(
            DF_EXPECTED_VARIABLE_ERR(arg),
            arg.sourceSpan
          );
        }
        if (params.includes(arg.token.text)) {
          throw new StageError(
            DF_DUPLICATE_VARIABLE_ERR(arg.token.text),
            arg.sourceSpan
          );
        }
        params.push(arg.token.text);
      }
      if (sexpr.subExprs.length - 1 === 1) {
        throw new StageError(
          DF_EXPECTED_FUNCTION_BODY_ERR,
          sexpr.sourceSpan
        );
      }
      if (sexpr.subExprs.length - 1 > 2) {
        throw new StageError(
          DF_TOO_MANY_FUNCTION_BODIES_ERR(sexpr.subExprs.length - 3),
          sexpr.subExprs[3].sourceSpan
        );
      }
      return new DefnVarNode(
        name.token.text,
        name.sourceSpan,
        new LambdaNode(
          params,
          this.toNode(sexpr.subExprs[2]),
          sexpr.subExprs[2].sourceSpan
        ),
        sexpr.sourceSpan
      );
    }
  }

  private toDefnStructNode(sexpr: ListSExpr): DefnStructNode {
    // (define-struct ...)
    if (sexpr.subExprs.length - 1 === 0) {
      throw new StageError(
        DS_EXPECTED_STRUCT_NAME_ERR(),
        sexpr.sourceSpan
      );
    }
    const name = sexpr.subExprs[1];
    if (!isAtomSExpr(name) || name.token.type !== TokenType.NAME) {
      throw new StageError(
        DS_EXPECTED_STRUCT_NAME_ERR(name),
        name.sourceSpan
      );
    }
    if (sexpr.subExprs.length - 1 === 1) {
      throw new StageError(
        DS_EXPECTED_FIELD_NAMES_ERR(),
        sexpr.sourceSpan
      );
    }
    const fieldNamesSExpr = sexpr.subExprs[2];
    if (!isListSExpr(fieldNamesSExpr)) {
      throw new StageError(
        DS_EXPECTED_FIELD_NAMES_ERR(fieldNamesSExpr),
        fieldNamesSExpr.sourceSpan
      );
    }
    const fieldNames: string[] = [];
    for (const fieldNameSExpr of fieldNamesSExpr.subExprs) {
      if (
        !isAtomSExpr(fieldNameSExpr)
        || (fieldNameSExpr.token.type !== TokenType.NAME && fieldNameSExpr.token.type !== TokenType.KEYWORD)
      ) {
        throw new StageError(
          DS_EXPECTED_FIELD_NAME_ERR(fieldNameSExpr),
          fieldNameSExpr.sourceSpan
        );
      }
      if (fieldNames.includes(fieldNameSExpr.token.text)) {
        throw new StageError(
          DS_DUPLICATE_FIELD_NAME(fieldNameSExpr.token.text),
          fieldNameSExpr.sourceSpan
        );
      }
      fieldNames.push(fieldNameSExpr.token.text);
    }
    if (sexpr.subExprs.length - 1 > 2) {
      throw new StageError(
        DS_EXTRA_PARTS_ERR(sexpr.subExprs.length - 3),
        sexpr.subExprs[3].sourceSpan
      );
    }
    return new DefnStructNode(
      name.token.text,
      name.sourceSpan,
      fieldNames,
      sexpr.sourceSpan
    );
  }

  private toQuoteNode(sexpr: SExpr, quotedSexpr: SExpr): AtomNode {
    // '...
    if (isAtomSExpr(quotedSexpr)) {
      if (
        quotedSexpr.token.type === TokenType.NAME
        || quotedSexpr.token.type === TokenType.KEYWORD
      ) {
        return new AtomNode(
          new RSymbol(quotedSexpr.token.text),
          quotedSexpr.sourceSpan
        );
      } else {
        throw new StageError(
          QU_EXPECTED_POST_QUOTE_ERR(quotedSexpr),
          sexpr.sourceSpan
        );
      }
    } else {
      if (quotedSexpr.subExprs.length > 0) {
        throw new StageError(
          QU_EXPECTED_POST_QUOTE_ERR(quotedSexpr),
          sexpr.sourceSpan
        );
      } else {
        return new AtomNode(
          R_EMPTY_LIST,
          sexpr.sourceSpan
        );
      }
    }
  }

  private atTopLevel() {
    return this.level === 1;
  }
}
