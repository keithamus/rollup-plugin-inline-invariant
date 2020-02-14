const rollup = require('rollup')
const inlineInvariant = require('./')
const assert = require('assert')
const pkgJson = require('./package.json')

async function testTransform() {
  const bundle = await rollup.rollup({
    input: 'fixtures/index.js',
    plugins: [inlineInvariant()],
  })
  const {output} = await bundle.generate({ format: 'iife' })
  assert.deepEqual(output[0].code.split('\n').slice(3, -3), [
    '\tif (!(window)) { throw new Error("invariant: fixtures/index.js:1"); }',
    '\tif (!(console)) { throw new Error("invariant: fixtures/index.js:2"); }',
  ])
}

async function testCaching() {
  let cache = {
    plugins: {
      [`${pkgJson.name}@${pkgJson.version}`]: {
        [__dirname + '/fixtures/index.js']: [
          0,
          {
            code: 'invariant(window)\ninvariant(console)\n',
            result: {
              // Poison the cache to test the transform caches correctly
              code: 'foobar()',
              map: null
            }
          }
        ]
      }
    }
  }
  const bundle = await rollup.rollup({
    cache,
    input: 'fixtures/index.js',
    plugins: [inlineInvariant()],
  })
  const {output} = await bundle.generate({ format: 'iife' })
  assert.deepEqual(output[0].code.split('\n').slice(3, -3), [
    '\tfoobar();',
  ])
}

(async function test() {
  for(const test of [testTransform, testCaching]) {
    console.log(test.name + ':')
    await test()
    console.log('PASS')
  }
  await testTransform()
  await testCaching()
}()).then(_ => process.exit(0), e => console.error('FAIL\n', e) || process.exit(1))
