const test = require('ava')
const ltGulpPages = require('..')

// TODO: Implement module test
test('<test-title>', t => {
  const err = t.throws(() => ltGulpPages(100), TypeError)
  t.is(err.message, 'Expected a string, got number')

  t.is(ltGulpPages('w'), 'w@zce.me')
  t.is(ltGulpPages('w', { host: 'wedn.net' }), 'w@wedn.net')
})
