import {
  RPrimFun,
  RString,
  RSymbol,
  RValue,
  TypeName,
  isRSymbol,
  toRBoolean
} from "../rvalue";

export {
  RPFSymbolToString,
  RPFAreSymbolsEqual,
  RPFSymbolHuh
};

class RPFSymbolToString extends RPrimFun {
  constructor() {
    super("symbol->string", { arity: 1, onlyArgTypeName: TypeName.Symbol });
  }

  call(args: RValue[]): RValue {
    return new RString((<RSymbol>args[0]).val);
  }
}

class RPFAreSymbolsEqual extends RPrimFun {
  constructor() {
    super("symbol=?", { arity: 2, allArgsTypeName: TypeName.Symbol });
  }

  call(args: RValue[]): RValue {
    return toRBoolean((<RSymbol>args[0]).val === (<RSymbol>args[1]).val);
  }
}

class RPFSymbolHuh extends RPrimFun {
  constructor() {
    super("symbol?", { arity: 1 });
  }

  call(args: RValue[]): RValue {
    return toRBoolean(isRSymbol(args[0]));
  }
}
