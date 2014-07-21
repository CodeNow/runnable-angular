var config = {
  ipaddress: "runnable3.net",
  port: "3111",
  type: "filibuster",
  pid: 896,
  host: 'http://api.runnable3.net'
};

config.proxyPort = process.env.NODE_ENV === 'production' ? 3000 : 3030;

Object.freeze(config);

module.exports = config;
