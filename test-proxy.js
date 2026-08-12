const { ProxyAgent } = require('undici');
const agent = new ProxyAgent('http://fixie:1DUZEWZyTCkL8HB@criterium.usefixie.com:80');
fetch('https://api.ipify.org?format=json', { dispatcher: agent }).then(res => res.json()).then(console.log).catch(console.error);
