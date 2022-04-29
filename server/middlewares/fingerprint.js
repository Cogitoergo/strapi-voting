const { getGeoIp, getAcceptHeaders, getUserAgent } = require("../utils/fingerprint");
const traverse = require("traverse");
const { x64 } = require("murmurhash3js");

module.exports = () => {
  return async (ctx, next) => {
    const { req, request } = ctx;
    const geoip = getGeoIp(req || request);
    const useragent = getUserAgent(req || request);
    const acceptheaders = getAcceptHeaders(req || request);
    const components = {
      geoip,
      useragent,
      acceptheaders
    }
    console.log('Comps', components)
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
    ctx.request.fingerprint = {
      hash,
      components
    };
    await next();
  };
};