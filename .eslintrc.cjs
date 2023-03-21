/**
 * @author   thepoy
 * @file     .eslintrc.js
 * @created  2023-03-08 15:12:41
 * @modified 2023-03-10 09:48:01
 */
"use strict";

const OFF = 0;
const WARNING = 1;
const ERROR = 2;

module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["plugin:react/recommended", "standard-with-typescript"],
  overrides: [],
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.node.json"],
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "padding-line-between-statements": [
      "error",
      { blankLine: "always", prev: "*", next: "return" }, // return 前必须空一行
      { blankLine: "always", prev: ["const", "let", "var"], next: "*" }, // 变量声名之后必须空一行
      {
        blankLine: "any",
        prev: ["const", "let", "var"],
        next: ["const", "let", "var"],
      }, // 变量声名之后必须空一行
    ],
    "function-paren-newline": [WARNING, "consistent"],
    "@typescript-eslint/no-misused-promises": [
      ERROR,
      {
        checksVoidReturn: false,
      },
    ],
    "react/jsx-curly-newline": WARNING,
    "react/jsx-indent": [WARNING, 2],
    "react/jsx-indent-props": [WARNING, 2],
    "react/jsx-max-props-per-line": [
      ERROR,
      {
        maximum: {
          single: 3,
          multi: 1,
        },
      },
    ],
    "react/jsx-closing-bracket-location": WARNING,
    "react/jsx-no-useless-fragment": ERROR,
    "react/jsx-one-expression-per-line": [
      WARNING,
      {
        allow: "single-child",
      },
    ],
    "react/jsx-newline": [
      WARNING,
      {
        prevent: true,
        allowMultilines: true,
      },
    ],
    "react/jsx-tag-spacing": [
      WARNING,
      {
        beforeClosing: "never",
      },
    ],
    "react/destructuring-assignment": [WARNING, "always"],
    "react/jsx-wrap-multilines": [
      WARNING,
      {
        declaration: "parens-new-line",
        assignment: "parens-new-line",
        return: "parens-new-line",
        arrow: "parens-new-line",
        condition: "parens-new-line",
        logical: "parens-new-line",
        prop: "parens-new-line",
      },
    ],
    "react/no-access-state-in-setstate": ERROR,
    "react/jsx-first-prop-new-line": [WARNING, "multiline-multiprop"],
    "react/jsx-curly-brace-presence": WARNING,
  },
};
