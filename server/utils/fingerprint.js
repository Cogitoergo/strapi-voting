const GeoipLite = require("geoip-lite");
const ua = require('useragent');

module.exports = {
  getAcceptHeaders (req) {
    return {
      accept: req.headers["accept"],
      language: req.headers["accept-language"],
    }
  },
  getUserAgent (req) {
    const agent = ua.parse(req.headers["user-agent"]);
    return {
      browser: {
        family: agent.family,
        version: agent.major,
      },
      device: {
        family: agent.device.family,
        version: agent.device.major,
      },
      os: {
        family: agent.os.family,
        major: agent.os.major,
        minor: agent.os.minor,
      }
    }
  },
  getGeoIp (req) {
    const ip = (req.headers["x-forwarded-for"] || "").split(",").pop() ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      req.ip;
    const geo = GeoipLite.lookup(ip);
    return {
      ip: ip ? ip : null,
      country: geo ? geo.country : null
    }
  }
}