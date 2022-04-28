import { request } from "@strapi/helper-plugin";
import pluginId from "../pluginId";

const fetchContentTypes = async () => {
  try {
    const data = await request(`/${pluginId}/content-types`, { method: "GET" });
    return data;
  } catch (error) {
    return null;
  }
};

const fetchCollection = async (uid) => {
  console.log('[API] Strapi-Voting: fetchCollection', uid)
  try {
    const data = await request(`/${pluginId}/${uid}`, { method: "GET" });
    return data;
  } catch (error) {
    return null;
  }
};

const vote = async (uid, id) => {
  console.log('[API] Strapi-Voting: vote', uid, id)
  try {
    const data = await request(`/${pluginId}/${uid}:${id}/vote`, { method: "POST" });
    return data;
  } catch (error) {
    console.log('ERROR', error);
  }
};

export {
  fetchContentTypes,
  fetchCollection,
  vote
}
