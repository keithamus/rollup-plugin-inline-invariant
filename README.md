## rollup-plugin-inline-invairant

If you use the [`invariant`](https://npm.im/invariant) library, then this rollup plugin is the plugin for you!

This transforms any `invariant()` callsite to the native `throw` equivalent:

```js
// Before
invariant(foo, "Foo isnt available!")
```

```js
// After
if (!(foo)) { throw new Error("invariant: Foo isnt available!"); }
```

