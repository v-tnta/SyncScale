const crypto = require('crypto');

crypto.generateKeyPair('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'der'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
}, (err, publicKey, privateKey) => {
  if (err) throw err;
  const publicKeyBase64 = publicKey.toString('base64');
  console.log('PublicKey (key for manifest):', publicKeyBase64);
});
