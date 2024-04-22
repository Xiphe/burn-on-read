/** @type {import('esbuild').BuildOptions} */
module.exports = {
  external: [
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb',
    'aws-sdk/clients/dynamodb',
  ],
};
