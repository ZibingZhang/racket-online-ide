(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("racket", function (config) {
  let untilDelimiter = /^[^\s\"'\(\[{\)\]};#]*/;
  let openBrackets = "([{";
  let closeBrackets = ")]}";
  let booleanLiteral = /^(t|true|True|f|false|False)$/;
  let specialForm = /^(and|check-expect|check-random|check-within|check-member-of|check-range|check-satisfied|check-error|cond|define|define-struct|if|lambda|or|quote|require)$/;
  let numLiteral = /^[+\-]?(\.\d+|\d+(\.\d*|\/\d+)?)$/;

  // unclosed block comments should be "error", but aren't
  function tokenComment(depth) {
    return function(stream, state) {
      var m = stream.match(/^.*?(#\||\|#)/)
      if (!m) stream.skipToEnd()
      else if (m[1] == "#|") state.tokenize = tokenComment(depth + 1)
      else if (depth > 0) state.tokenize = tokenComment(depth - 1)
      else state.tokenize = tokenBase
      return "comment"
    }
  }

  function tokenBase(stream, state) {
    if (stream.eatSpace()) { return null; }

    let ch = stream.next();
    if (openBrackets.includes(ch) || closeBrackets.includes(ch)) { return "bracket"; }
    if (ch == ";") { stream.skipToEnd(); return "comment"; }
    if (ch == "'") { return "keyword"; }
    if (ch == "\"") {
      ch = stream.next();
      while (ch != "\"") {
        if (stream.eol()) { return "error"; }
        ch = stream.next();
      }
      return "string";
    }
    if (ch == "#") {
      if (stream.eatSpace()) { return "error"; }

      ch = stream.next();
      if (ch == ";") { return "comment"; }
      if (ch == "|") {
        state.tokenize = tokenComment(0);
        return state.tokenize(stream, state);
      }

      let poundName = ch + stream.match(untilDelimiter)[0];
      if (poundName.match(booleanLiteral)) { return "atom"; }
      return "error";
    }

    let name = ch + stream.match(untilDelimiter);
    if (name.match(specialForm)) { return "keyword"; }
    if (name.match(numLiteral)) { return "number"; }
    if (name == "...") return "punctuation";
    return null;
  }

  return {
    startState: function () {
      return {ctx: {prev: null, start: 0, indentTo: 0}, lastType: null, tokenize: tokenBase};
    },

    token: function (stream, state) {
      let style = state.tokenize(stream, state);
      return style;
    },

    indent: function (state, _textAfter) {
      return 0;
    },

    closeBrackets: {pairs: "()[]{}\"\""},
    lineComment: ";;",
    blockCommentStart: "#|",
    blockCommentEnd: "|#"
  };
});

CodeMirror.defineMIME("text/x-common-lisp", "commonlisp");

});
