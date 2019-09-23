const walk = require('acorn-walk')
const MagicString = require('magic-string')
const {createFilter} = require('rollup-pluginutils')
const {relative} = require('path')
module.exports = function transfromInvariantCalls({include, exclude, dir = ''} = {}) {
  const filter = createFilter(include, exclude)
  return {
    name: 'inlineInvariant',
    transform(code, id) {
      if (!filter(id)) return null
      if (!code.includes('invariant(')) return null
      const ast = this.parse(code, {locations: true})
      const magicString = new MagicString(code)
      walk.simple(ast, {
        CallExpression(node) {
          if (!node.callee || node.callee.name !== 'invariant') return
          let message = `${relative(dir, id)}:${node.loc.start.line}`
          if (node.arguments.length === 2) {
            message = `${node.arguments[1].value} -- ${message}`
            magicString.remove(node.arguments[0].end, node.arguments[1].end)
          }
          magicString.overwrite(node.start, node.start + 10, `if (!(`)
          magicString.prependRight(node.end, `) { throw new Error("invariant: ${message}"); }`)
        }
      })
      return { code: magicString.toString(), map: magicString.generateMap({ hires: true }) }
    }
  }
}
