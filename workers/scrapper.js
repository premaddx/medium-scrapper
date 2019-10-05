const cheerio = require('cheerio');

const { parseUrl } = rootRequire('utils');
const { HOSTNAME } = rootRequire('constants');
const { urlStoreDAO } = rootRequire('dao');
const { makeRequest, makeBaseUrlRequest } = rootRequire('services').request; // eslint-disable-line

function extractHrefTag(obj, set) {
  Object.keys(obj).forEach(key => {
    if (obj[key].type === 'tag' && obj[key].name === 'a' &&
      obj[key].attribs && obj[key].attribs.href) set.add(obj[key].attribs.href);
    if (obj[key].children) extractHrefTag(obj[key].children, set);
  });
}

function processHTML(html) {
  const $ = cheerio.load(html);
  const obj = $('body').children();
  const set = new Set([]);
  extractHrefTag(obj, set);
  return set;
}

function enrichInsertArray(urls) {
  const parsedUrls = [];
  const urlCount = {};
  const queryParams = {};
  urls.forEach(url => {
    const { href, hostname, pathname, query, origin } = parseUrl(url);
    const key = `${origin}${pathname}`;
    if (hostname === HOSTNAME) {
      if (urlCount[key]) {
        urlCount[key] += 1;
        Object.keys(query).forEach(param => queryParams[key].add(param));
        const arr = [];
        queryParams[key].forEach(value => arr.push(value));
        parsedUrls.forEach(elem => {
          if (elem.url === key) {
            elem.count = urlCount[key];
            elem.params = arr;
          }
        });
      } else {
        urlCount[key] = 1;
        queryParams[key] = new Set(Object.keys(query || {}));
        parsedUrls.push({
          url: key,
          href,
          origin,
          pathname,
          count: urlCount[key],
          params: Object.keys(query || {}),
        });
      }
    }
  });
  return parsedUrls;
}

async function init() {
  try {
    // flush all data from DB
    await urlStoreDAO.deleteMany({});

    const html = await makeBaseUrlRequest();
    const urls = processHTML(html);
    const parsedUrls = enrichInsertArray(urls);
    // process parsedUrls object and make entry in DB
    await urlStoreDAO.batchInsert(parsedUrls);
  } catch (e) {
    logger.error(`Error while running scrapper - ${e}`);
  }
}

module.exports = init;
