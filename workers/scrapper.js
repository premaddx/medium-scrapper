const cheerio = require('cheerio');
const moment = require('moment');

const { parseUrl, toObjectId } = rootRequire('utils');
const { HOSTNAME, BASEURL } = rootRequire('constants');
const { urlStoreDAO } = rootRequire('dao');
const { makeRequest, makeBaseUrlRequest } = rootRequire('services').request;

function extractHrefTag(obj, set) {
  Object.keys(obj).forEach(key => {
    if (obj[key].type === 'tag' && obj[key].name === 'a' &&
      obj[key].attribs && obj[key].attribs.href) set.add(obj[key].attribs.href);
    if (obj[key].children) extractHrefTag(obj[key].children, set);
  });
}

function invokeConcurrentRequests(obj) {
  Object.keys(obj).forEach(key => obj[key](key));
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
          status: 'DRAFT',
          created_at: moment(Date.now())._d,
          updated_at: moment(Date.now())._d,
        });
      }
    }
  });
  return parsedUrls;
}

function pickNextUrlForExecution() {
  return urlStoreDAO.find({
    baseQuery: { status: 'DRAFT' },
    sortQuery: { created_at: 1 },
    limitQuery: 1,
  });
}

async function failureCallback(err, url) {
  logger.info(`Error while fetching for ${url}`);
  await urlStoreDAO.findOneAndUpdate({ url }, { $set: { status: 'ERROR' } });
  const nextProcess = await pickNextUrlForExecution();
  if (nextProcess.length > 0) makeRequest(nextProcess[0].url, successCallback, failureCallback)(nextProcess[0].url); // eslint-disable-line
}


async function successCallback(html, url) {
  logger.info(`Fetched successfully for ${url}`);
  await urlStoreDAO.findOneAndUpdate({ url }, { $set: { status: 'PROCESSED' } });
  const urls = processHTML(html);
  const parsedUrls = enrichInsertArray(urls);
  const transforParsedUrlObject = {};
  parsedUrls.forEach(obj => {
    transforParsedUrlObject[obj.url] = obj;
  });
  const result = await urlStoreDAO.find({
    baseQuery: { url: { $in: Object.keys(transforParsedUrlObject) } },
  });
  // iterate through the result and then enrich update/insert object
  const updatePromiseArr = [];
  result.forEach(obj => {
    if (transforParsedUrlObject[obj.url]) {
      const set = new Set([...transforParsedUrlObject[obj.url].params, ...obj.params]);
      const params = [];
      set.forEach(elem => params.push(elem));
      updatePromiseArr.push(urlStoreDAO.findByIdAndUpdate(toObjectId(obj._id), {
        $set: {
          count: (obj.count + transforParsedUrlObject[obj.url].count),
          params,
        },
      }));
      delete transforParsedUrlObject[obj.url];
    }
  });
  if (updatePromiseArr.length > 0) await Promise.all(updatePromiseArr);
  const insertArr = [];
  Object.keys(transforParsedUrlObject).forEach(key => {
    insertArr.push(transforParsedUrlObject[key]);
  });
  if (insertArr.length > 0) await urlStoreDAO.batchInsert(insertArr);
  const nextProcess = await pickNextUrlForExecution();
  if (nextProcess.length > 0) makeRequest(nextProcess[0].url, successCallback, failureCallback)(nextProcess[0].url);
}

async function init() {
  try {
    // flush all data from DB
    await urlStoreDAO.deleteMany({});

    const { href, pathname, query, origin } = parseUrl(BASEURL);
    const baseUrlInsertObj = await urlStoreDAO.save({
      url: BASEURL,
      href,
      origin,
      pathname,
      count: 1,
      params: Object.keys(query),
      status: 'IN_PROCESS',
    });

    const html = await makeBaseUrlRequest();
    const urls = processHTML(html);
    // update the status to PROCESSED
    await urlStoreDAO.findByIdAndUpdate(toObjectId(baseUrlInsertObj._id), {
      $set: {
        status: 'PROCESSED',
      },
    });
    const parsedUrls = enrichInsertArray(urls);
    const processObj = {};
    parsedUrls.forEach((obj, index) => {
      if (index < 5) {
        processObj[obj.url] = makeRequest(obj.url, successCallback, failureCallback);
        obj.status = 'IN_PROCESS';
      }
    });
    await urlStoreDAO.batchInsert(parsedUrls);
    invokeConcurrentRequests(processObj);
  } catch (e) {
    logger.error(`Error while running scrapper - ${e}`);
  }
}

module.exports = init;
