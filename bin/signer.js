/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs')
const jwcrypto = require('jwcrypto')
const config = require('../config')
const DOMAIN = config.get('domain')

require('jwcrypto/lib/algs/rs')
require('jwcrypto/lib/algs/ds')

const _privKey = jwcrypto.loadSecretKey(fs.readFileSync(config.get('secretKeyFile')))

process.on('message', function (message) {
  if (message.crash === true) { throw new Error('FML') }
  if (message.duration < 1 || typeof(message.duration) !== 'number') {
    return process.send({ err: { message: 'bad duration' } })
  }
  if (!message.email || typeof(message.email) !== 'string') {
    return process.send({ err: { message: 'bad email' } })
  }
  if (!message.uid || typeof(message.uid) !== 'string') {
    return process.send({ err: { message: 'bad uid' } })
  }
  try {
    var now = Date.now()
    jwcrypto.cert.sign(
      {
        publicKey: jwcrypto.loadPublicKeyFromObject(message.publicKey),
        principal: { email: message.email, uid: message.uid },
        //TODO: kA, etc
      },
      {
        issuer: DOMAIN,
        issuedAt: new Date(now),
        expiresAt: new Date(now + message.duration)
      },
      null,
      _privKey,
      function (err, cert) {
        process.send({ err: err, cert: cert})
      }
    )
  }
  catch (e) {
    return process.send({ err: e })
  }
})

process.on(
  'uncaughtException',
  function (err) {
    process.exit(8)
  }
)
