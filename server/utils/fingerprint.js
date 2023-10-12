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
      string: req.headers["user-agent"],
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
    const ip = (req.headers["x-forwarded-for"] || "").split(",").shift() ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      req.ip;
    // console.log('============ FINGERPRINT ============')
    // console.log('[IPS] 1:', req.headers["x-forwarded-for"])
    // console.log('[IPS] 2:', req.connection?.remoteAddress)
    // console.log('[IPS] 3:', req.socket?.remoteAddress)
    // console.log('[IPS] 4:', req.connection?.socket?.remoteAddress)
    // console.log('[IPS] 5:', req.ip)
    // console.log('========== END FINGERPRINT ==========')
    const geo = GeoipLite.lookup(ip);
    if (!geo && ip && (ip === '217.117.31.15' || ip === '192.168.51.1' || ip === '193.41.197.4' || ip === '193.41.197.160' || ip === '193.41.197.201' || ip === '192.168.19.112' || ip === '192.168.19.151' || ip === '192.168.19.85' || ip === '193.41.197.160')) {
      return {
        ip: ip,
        country: 'ADMIN'
      }
    } else {
      return {
        ip: ip ? ip : null,
        country: geo ? geo.country : null
      }
    }
  }
}