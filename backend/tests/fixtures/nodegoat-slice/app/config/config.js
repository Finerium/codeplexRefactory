// NodeGoat-shaped config slice. Intentional hardcoded secrets for Nemesis test.
// DO NOT USE THESE STRINGS ANYWHERE ELSE.
'use strict';

const dbUrl = "mongodb://admin:p@ssw0rd@localhost:27017/nodegoat";
const apiKey = "AKIAIOSFODNN7EXAMPLE";
const stripeKey = "sk_live_1234567890abcdefghijklmnopqr";

module.exports = {
  dbUrl: dbUrl,
  apiKey: apiKey,
  stripeKey: stripeKey,
};
