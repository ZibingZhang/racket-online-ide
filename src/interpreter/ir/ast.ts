/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DF_PREVIOUSLY_DEFINED_NAME_ERR,
  RQ_MODULE_NOT_FOUND_ERR
} from "../error";
import {
  Scope,
  VariableType
} from "../data/scope";
import {
  AtomSExpr
} from "./sexpr";
import {
  Global
} from "../global";
import {
  Keyword
} from "../data/keyword";
import {
  RValue
} from "../values/rvalue";
import {
  SourceSpan
} from "../data/sourcespan";
import {
  StageError
} from "../data/stage";

export {
  ASTNode,
  AndNode,
  AtomNode,
  CheckErrorNode,
  CheckMemberOfNode,
  CheckNode,
  CheckRangeNode,
  CheckSatisfiedNode,
  CheckWithinNode,
  CondNode,
  DefnNode,
  DefnStructNode,
  DefnVarNode,
  DExprNode,
  EllipsisFunAppNode,
  EllipsisNode,
  ExprNode,
  FunAppNode,
  IfNode,
  LambdaNode,
  LetNode,
  LocalNode,
  OrNode,
  RequireNode,
  VarNode,
  isCheckNode,
  isDefnNode,
  isLambdaNode,
  isRequireNode,
  isVarNode,
  ASTNodeVisitor
};

type ASTNode =
  | CheckNode
  | DefnNode
  | ExprNode;

type DefnNode =
| DefnStructNode
| DefnVarNode;
type ExprNode =
  | AndNode
  | AtomNode
  | CondNode
  | EllipsisFunAppNode
  | EllipsisNode
  | FunAppNode
  | IfNode
  | LambdaNode
  | LetNode
  | LocalNode
  | OrNode
  | VarNode;

type DExprNode =
  | ExprNode

abstract class ASTNodeBase {
  used = false;

  constructor(
    readonly sourceSpan: SourceSpan
  ) {}

  abstract accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T;

  isTemplate(): boolean {
    return false;
  }

  use() {
    this.used = true;
  }
}

class AndNode extends ASTNodeBase {
  constructor(
    readonly args: ASTNodeBase[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitAndNode(this, args);
  }

  isTemplate(): boolean {
    return this.args.some(arg => arg.isTemplate());
  }
}

class AtomNode extends ASTNodeBase {
  constructor(
    readonly rval: RValue,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitAtomNode(this, args);
  }
}

class CheckNode extends ASTNodeBase {
  constructor(
    readonly name: string,
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitCheckNode(this, args);
  }
}

class CheckErrorNode extends CheckNode {
  constructor(
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckError, args, sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitCheckErrorNode(this, args);
  }
}

class CheckMemberOfNode extends CheckNode {
  constructor(
    readonly arg: ASTNode,
    readonly testValNode: ASTNode,
    readonly testAgainstValNodes: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckMemberOf, [testValNode, ...testAgainstValNodes], sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitCheckMemberOfNode(this, args);
  }
}

class CheckRangeNode extends CheckNode {
  constructor(
    readonly arg: ASTNode,
    readonly testValNode: ASTNode,
    readonly lowerBoundValNode: ASTNode,
    readonly upperBoundValNode: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckRange, [testValNode, lowerBoundValNode, upperBoundValNode], sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitCheckRangeNode(this, args);
  }
}

class CheckSatisfiedNode extends CheckNode {
  constructor(
    readonly arg: ASTNode,
    readonly testValNode: ASTNode,
    readonly testFnNode: ASTNode,
    readonly testFnName: string,
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckSatisfied, [testValNode, testFnNode], sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitCheckSatisfiedNode(this, args);
  }
}

class CheckWithinNode extends CheckNode {
  constructor(
    readonly arg: ASTNode,
    readonly actualNode: ASTNode,
    readonly expectedNode: ASTNode,
    readonly withinNode: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(Keyword.CheckWithin, [actualNode, expectedNode, withinNode], sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitCheckWithinNode(this, args);
  }
}

class CondNode extends ASTNodeBase {
  constructor(
    readonly questionAnswerClauses: [ASTNode, ASTNode][],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitCondNode(this, args);
  }

  isTemplate(): boolean {
    return this.questionAnswerClauses.some(clause => clause[0].isTemplate() || clause[1].isTemplate());
  }
}

class EllipsisFunAppNode extends ASTNodeBase {
  constructor(
    readonly placeholder: AtomSExpr,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitEllipsisFunAllNode(this, args);
  }

  isTemplate(): boolean {
    return true;
  }
}

class EllipsisNode extends ASTNodeBase {
  constructor(
    readonly placeholder: AtomSExpr,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitEllipsisNode(this, args);
  }

  isTemplate(): boolean {
    return true;
  }
}

class FunAppNode extends ASTNodeBase {
  constructor(
    readonly fn: ASTNode,
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitFunAppNode(this, args);
  }

  isTemplate(): boolean {
    return this.args.some(arg => arg.isTemplate());
  }
}

class IfNode extends ASTNodeBase {
  constructor(
    readonly question: ASTNode,
    readonly trueAnswer: ASTNode,
    readonly falseAnswer: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitIfNode(this, args);
  }

  isTemplate(): boolean {
    return this.question.isTemplate() || this.trueAnswer.isTemplate() || this.falseAnswer.isTemplate();
  }
}

class LambdaNode extends ASTNodeBase {
  name: string | null;

  constructor(
    name: string | null,
    readonly params: string[],
    readonly body: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
    this.name = name;
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitLambdaNode(this, args);
  }

  isTemplate(): boolean {
    return this.body.isTemplate();
  }
}

class LetNode extends ASTNodeBase {
  constructor(
    readonly name: string,
    readonly bindings: [VarNode, ASTNode][],
    readonly body: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitLetNode(this, args);
  }
}

class LocalNode extends ASTNodeBase {
  constructor(
    readonly defns: DefnNode[],
    readonly body: ASTNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitLocalNode(this, args);
  }

  isTemplate(): boolean {
    return this.defns.some(defn => defn.isTemplate()) || this.body.isTemplate();
  }
}

class OrNode extends ASTNodeBase {
  constructor(
    readonly args: ASTNode[],
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitOrNode(this, args);
  }

  isTemplate(): boolean {
    return this.args.some(arg => arg.isTemplate());
  }
}

class RequireNode extends ASTNodeBase {
  global = new Global();

  constructor(
    readonly name: string,
    readonly nameSourceSpan: SourceSpan,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitRequireNode(this, args);
  }

  addToScope(scope: Scope): void {
    const module = this.global.modules.get(this.name);
    if (!module) {
      throw new StageError(
        RQ_MODULE_NOT_FOUND_ERR(this.name),
        this.nameSourceSpan
      );
    }
    for (const procedure of module.procedures) {
      if (!scope.has(procedure.getName())) {
        scope.set(procedure.getName(), VariableType.PrimitiveFunction);
      }
    }
    for (const name of module.data.keys()) {
      if (!scope.has(name)) {
        scope.set(name, VariableType.Data);
      }
    }
  }
}

class VarNode extends ASTNodeBase {
  constructor(
    readonly name: string,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitVarNode(this, args);
  }
}

abstract class DefnNodeBase extends ASTNodeBase {
  constructor(
    readonly name: string,
    readonly nameSourceSpan: SourceSpan,
    readonly sourceSpan: SourceSpan
  ) {
    super(sourceSpan);
  }

  addToScope(scope: Scope): void {
    if (scope.has(this.name)) {
      throw new StageError(
        DF_PREVIOUSLY_DEFINED_NAME_ERR(this.name),
        this.nameSourceSpan
      );
    }
  }
}

class DefnStructNode extends DefnNodeBase {
  constructor(
    readonly name: string,
    readonly nameSourceSpan: SourceSpan,
    readonly fields: string[],
    readonly sourceSpan: SourceSpan
  ) {
    super(
      name,
      nameSourceSpan,
      sourceSpan
    );
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitDefnStructNode(this, args);
  }

  addToScope(scope: Scope, allowShadow = false): void {
    if (!allowShadow) {
      super.addToScope(scope);
      if (scope.has(`make-${this.name}`)) {
        throw new StageError(
          DF_PREVIOUSLY_DEFINED_NAME_ERR(`make-${this.name}`),
          this.sourceSpan
        );
      }
      if (scope.has(`${this.name}?`)) {
        throw new StageError(
          DF_PREVIOUSLY_DEFINED_NAME_ERR(`${this.name}?`),
          this.sourceSpan
        );
      }
      this.fields.forEach(field => {
        if (scope.has(`${this.name}-${field}`)) {
          throw new StageError(
            DF_PREVIOUSLY_DEFINED_NAME_ERR(`${this.name}-${field}`),
            this.sourceSpan
          );
        }
      });
    }
    scope.set(this.name, VariableType.StructureType);
    scope.set(
      `make-${this.name}`,
      VariableType.UserDefinedFunction
    );
    scope.set(
      `${this.name}?`,
      VariableType.UserDefinedFunction
    );
    this.fields.forEach(field => {
      scope.set(
        `${this.name}-${field}`,
        VariableType.UserDefinedFunction
      );
    });
  }
}

class DefnVarNode extends DefnNodeBase {
  constructor(
    readonly name: string,
    readonly nameSourceSpan: SourceSpan,
    readonly value: ExprNode,
    readonly sourceSpan: SourceSpan
  ) {
    super(
      name,
      nameSourceSpan,
      sourceSpan
    );
  }

  accept<T>(visitor: ASTNodeVisitor<T>, ...args: any[]): T {
    return visitor.visitDefnVarNode(this, args);
  }

  isTemplate(): boolean {
    return this.value.isTemplate();
  }

  addToScope(scope: Scope, allowShadow = false): void {
    if (!allowShadow) {
      super.addToScope(scope);
    }
    if (this.value instanceof LambdaNode) {
      scope.set(
        this.name,
        VariableType.UserDefinedFunction
      );
    } else {
      scope.set(this.name, VariableType.Data);
    }
  }
}

function isCheckNode(node: ASTNode) {
  return node instanceof CheckNode;
}

function isDefnNode(node: ASTNode): node is DefnNode {
  return node instanceof DefnStructNode
    || node instanceof DefnVarNode;
}

function isLambdaNode(node: ASTNode): node is LambdaNode {
  return node instanceof LambdaNode;
}

function isRequireNode(node: ASTNode): node is RequireNode {
  return node instanceof RequireNode;
}

function isVarNode(node: ASTNode): node is VarNode {
  return node instanceof VarNode;
}

abstract class ASTNodeVisitor<T> {
  abstract visitAndNode(node: AndNode, ...args: any[]): T;
  abstract visitAtomNode(node: AtomNode, ...args: any[]): T;
  abstract visitCheckNode(node: CheckNode, ...args: any[]): T;
  visitCheckErrorNode(node: CheckErrorNode, ..._: any[]): T {
    return this.visitCheckNode(node);
  }
  visitCheckMemberOfNode(node: CheckMemberOfNode, ..._: any[]): T {
    return this.visitCheckNode(node);
  }
  visitCheckRangeNode(node: CheckRangeNode, ..._: any[]): T {
    return this.visitCheckNode(node);
  }
  visitCheckSatisfiedNode(node: CheckSatisfiedNode, ..._: any[]): T {
    return this.visitCheckNode(node);
  }
  visitCheckWithinNode(node: CheckWithinNode, ..._: any[]): T {
    return this.visitCheckNode(node);
  }
  abstract visitCondNode(node: CondNode, ...args: any[]): T;
  abstract visitDefnVarNode(node: DefnVarNode, ...args: any[]): T;
  abstract visitDefnStructNode(node: DefnStructNode, ...args: any[]): T;
  abstract visitEllipsisFunAllNode(node: EllipsisFunAppNode, ...args: any[]): T;
  abstract visitEllipsisNode(node: EllipsisNode, ...args: any[]): T;
  abstract visitFunAppNode(node: FunAppNode, ...args: any[]): T;
  abstract visitIfNode(node: IfNode, ...args: any[]): T;
  abstract visitLambdaNode(node: LambdaNode, ...args: any[]): T;
  abstract visitLetNode(node: LetNode, ...args: any[]): T;
  abstract visitLocalNode(node: LocalNode, ...args: any[]): T;
  abstract visitOrNode(node: OrNode, ...args: any[]): T;
  abstract visitRequireNode(node: RequireNode, ...args: any[]): T;
  abstract visitVarNode(node: VarNode, ...args: any[]): T;
}
