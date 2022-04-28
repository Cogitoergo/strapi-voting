const { getGeoIp, getAcceptHeaders, getUserAgent } = require("../utils/fingerprint");
const traverse = require("traverse");
const { x64 } = require("murmurhash3js");

module.exports = () => {
  return async (ctx, next) => {
    const { req } = ctx;
    const geoip = getGeoIp(req);
    const useragent = getUserAgent(req);
    const acceptheaders = getAcceptHeaders(req);
    const components = {
      geoip,
      useragent,
      acceptheaders
    }
    const leaves = traverse(components)
      .reduce(function (acc, x) {
        if (this.isLeaf) acc.push(x);
        return acc;
      }, []);
    const hash = x64.hash128(leaves.join("~~~"));
    ctx.req.fingerprint = {
      hash,
      components
    };
    await next();
  };
};