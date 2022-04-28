const { isArray } = require('lodash');
const { REGEX } = require('../../utils/constants')
module.exports = {
  buildConfigQueryProp(prop) {
    let queryProp = prop;
    if (prop && isArray(prop)) {
      queryProp = prop.join('.');
    }
    return queryProp;
  },
  getRelatedGroups: related => related.split(REGEX.relatedUid).filter(s => s && s.length > 0),
  checkForExistingId (ids, relation) {
    console.log('[checkForExistingId]', ids, relation)
    const filtered = ids.filter(item => item.related === relation)
    console.log('[checkForExistingId filtered]', filtered)
    return filtered.length > 0
  }
}