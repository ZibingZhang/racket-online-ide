import {
  Global
} from "../global";
import {
  RValue
} from "../values/rvalue";
import {
  SC_USED_BEFORE_DEFINITION_ERR
} from "../error";
import {
  SETTINGS
} from "../settings";
import {
  SourceSpan
} from "./sourcespan";
import {
  StageError
} from "./stage";

export {
  Environment
};

class Environment {
  parentEnv: Environment | undefined;
  private global = new Global();
  private map: Map<string, RValue> = new Map();

  constructor(parentEnv?: Environment) {
    this.parentEnv = parentEnv;
  }

  set(name: string, value: RValue) {
    this.map.set(name, value);
  }

  get(name: string, sourceSpan: SourceSpan): RValue {
    const val = this.map.get(name);
    if (val) {
      return val;
    } else if (!this.parentEnv) {
      if (
        !SETTINGS.primitives.blackList.includes(name)
        && this.global.primitiveEnvironment.map.has(name)
      ) {
        return this.global.primitiveEnvironment.get(name, sourceSpan);
      } else {
        throw new StageError(
          SC_USED_BEFORE_DEFINITION_ERR(name),
          sourceSpan
        );
      }
    } else {
      return this.parentEnv.get(name, sourceSpan);
    }
  }

  delete(name: string) {
    this.map.delete(name);
  }

  copy(): Environment {
    const env = new Environment();
    for (const entry of this.map) {
      env.set(entry[0], entry[1]);
    }
    /* eslint-disable @typescript-eslint/no-this-alias */
    let ancestorEnv: Environment | null = this;
    while (ancestorEnv.parentEnv) {
      ancestorEnv = ancestorEnv.parentEnv;
      for (const [key, value] of ancestorEnv.map) {
        if (!env.map.has(key)) {
          env.set(key, value);
        }
      }
    }
    return env;
  }

  has(name: string): boolean {
    return this.map.has(name)
      || (this.parentEnv && this.parentEnv.has(name))
      || (
        !SETTINGS.primitives.blackList.includes(name)
        && this.global.primitiveEnvironment.map.has(name)
      );
  }
}
