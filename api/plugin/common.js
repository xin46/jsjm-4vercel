const { parse } = require('@babel/parser');
const _generate = require('@babel/generator');
const generator = _generate.default;
const _traverse = require('@babel/traverse');
const traverse = _traverse.default;
const deleteUnreachableCode = require('../visitor/delete-unreachable-code.js');
const deleteNestedBlocks = require('../visitor/delete-nested-blocks.js');
const calculateConstantExp = require('../visitor/calculate-constant-exp.js');
const calculateRString = require('../visitor/calculate-rstring.js');

function decodeCommon(code) {
  let ast;
  try {
    ast = parse(code, { errorRecovery: true });
  } catch (e) {
    console.error(`Cannot parse code: ${e.reasonCode}`);
    return null;
  }
  traverse(ast, deleteUnreachableCode);
  traverse(ast, deleteNestedBlocks);
  traverse(ast, calculateConstantExp);
  traverse(ast, calculateRString);
  code = generator(ast).code;
  return code;
}

module.exports = decodeCommon;
