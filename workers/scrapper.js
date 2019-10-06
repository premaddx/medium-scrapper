const cheerio = require('cheerio');
const moment = require('moment');

const { parseUrl, toObjectId } = rootRequire('utils');
const {
  HOSTNAME,
  BASEURL,
  DEFAULT_ORIGIN,
  CONCURRENCY_LIMIT,
  DRAFT,
  ERROR,
  PROCESSED,
  IN_PROCESS,
} = rootRequire('constants');
const { urlStoreDAO } = rootRequire('dao');
const { makeRequest, makeBaseUrlRequest } = rootRequire('services').request;

let ctr = 0; // eslint-disable-line
setInterval(() => {
  // logger.info(`Concurrency at interval of 2 seconds is ------> ${ctr}`);
}, 2000);

// Recursively extract the href attribute from a tag in a given html
function extractHrefTag(obj, resultantArr) {
  Object.keys(obj).forEach(key => {
    if (obj[key].type === 'tag' && obj[key].name === 'a' &&
      obj[key].attribs && obj[key].attribs.href) resultantArr.push(obj[key].attribs.href);
    if (obj[key].children) extractHrefTag(obj[key].children, resultantArr);
  });
}

// invoke all the process which are to be concurrently invoked
function invokeConcurrentRequests(obj) {
  Object.keys(obj).forEach(key => obj[key](key));
}

// parse the html using cheerio - recursively extract href from body
function processHTML(html) {
  const $ = cheerio.load(html);
  const obj = $('body').children();
  const resultantArr = [];
  extractHrefTag(obj, resultantArr);
  return resultantArr;
}

// enrich insert array with count and params of each url
function enrichInsertArray(urls) {
  const parsedUrls = [];
  const urlCount = {};
  const queryParams = {};
  urls.forEach(url => {
    const { hostname, pathname, query, origin: parsedOrigin } = parseUrl(url); // parse URL
    const origin = parsedOrigin && parsedOrigin.toUpperCase() !== 'NULL' ? parsedOrigin : DEFAULT_ORIGIN;
    const key = `${origin}${pathname}`;
    if (hostname === HOSTNAME) { // match the hostname of url with medium.com
      if (urlCount[key]) {
        // if url is already encountered then just increase the count and enrich the params
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
        // if url is encountered for the first time initialize the insert obj for the url
        urlCount[key] = 1;
        queryParams[key] = new Set(Object.keys(query || {}));
        parsedUrls.push({
          url: key,
          origin,
          pathname,
          count: urlCount[key],
          params: Object.keys(query || {}),
          status: DRAFT,
          created_at: moment(Date.now())._d,
          updated_at: moment(Date.now())._d,
        });
      }
    }
  });
  return parsedUrls;
}

// picking the next url for crawling - status as DRAFT and order by created_at ascending
function pickNextUrlForExecution() {
  return urlStoreDAO.find({
    baseQuery: { status: DRAFT },
    sortQuery: { created_at: 1 },
    limitQuery: 1,
  });
}

// failure callback handler

async function failureCallback(err, url) {
  ctr -= 1;
  logger.info(`Error while fetching for ${url}`);
  // update the url status as ERROR
  await urlStoreDAO.findOneAndUpdate({ url }, { $set: { status: ERROR } });
  // pick the next url for execution
  const nextProcess = await pickNextUrlForExecution();
  if (nextProcess.length > 0) {
    ctr += 1;
    makeRequest(nextProcess[0].url, successCallback, failureCallback)(nextProcess[0].url); // eslint-disable-line
  }
}

// enrich the insert and update object
function enrichInsertAndUpdateObj(transforParsedUrlObject, result) {
  const updatePromiseArr = [];
  // check if the urls already exists in DB -
  // if true then update the count and params
  // else insert those
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
  return updatePromiseArr;
}

// success callback handler

async function successCallback(html, url) {
  ctr -= 1;
  try {
    // update the url status as PROCESSED and extract the href from the html
    await urlStoreDAO.findOneAndUpdate({ url }, { $set: { status: PROCESSED } });
    const urls = processHTML(html);
    const parsedUrls = enrichInsertArray(urls);
    const transforParsedUrlObject = {};
    parsedUrls.forEach(obj => {
      transforParsedUrlObject[obj.url] = obj;
    });
    // find if the urls extracted already exisyts in DB
    const result = await urlStoreDAO.find({
      baseQuery: { url: { $in: Object.keys(transforParsedUrlObject) } },
    });
    // iterate through the result and then enrich update/insert object
    const updatePromiseArr = enrichInsertAndUpdateObj(transforParsedUrlObject, result);
    const insertArr = [];
    Object.keys(transforParsedUrlObject).forEach(key => {
      insertArr.push(transforParsedUrlObject[key]);
    });
    // insert if not exists in DB
    if (insertArr.length > 0) await urlStoreDAO.batchInsert(insertArr);
    // update the count and params of url if already exists
    if (updatePromiseArr.length > 0) await Promise.all(updatePromiseArr);
    // pick the next url for crawling
    const nextProcess = await pickNextUrlForExecution();
    // update the current pick to IN_PROCESS
    if (nextProcess.length > 0) {
      ctr += 1;
      await urlStoreDAO.findByIdAndUpdate(toObjectId(nextProcess[0]._id), {
        $set: {
          status: IN_PROCESS,
        },
      });
      makeRequest(nextProcess[0].url, successCallback, failureCallback)(nextProcess[0].url);
    }
  } catch (e) {
    logger.error(e.message);
  }
}

async function init() {
  try {
    // flush all data from DB
    await urlStoreDAO.deleteMany({});

    const { pathname, query, origin } = parseUrl(BASEURL);
    // update the status of BASEURL as IN_PROCESS in DB
    const baseUrlInsertObj = await urlStoreDAO.save({
      url: BASEURL,
      origin,
      pathname,
      count: 1,
      params: Object.keys(query),
      status: IN_PROCESS,
    });

    const html = await makeBaseUrlRequest();
    const urls = processHTML(html);
    // after parsing update the status to PROCESSED
    await urlStoreDAO.findByIdAndUpdate(toObjectId(baseUrlInsertObj._id), {
      $set: {
        status: PROCESSED,
      },
    });
    const parsedUrls = enrichInsertArray(urls);
    const processObj = {};
    parsedUrls.forEach((obj, index) => {
      // enque urls to be parsed - upto the concurrency limit and set their status to IN_PROCESS
      if (index < CONCURRENCY_LIMIT) {
        processObj[obj.url] = makeRequest(obj.url, successCallback, failureCallback);
        obj.status = IN_PROCESS;
        ctr += 1;
      }
    });
    await urlStoreDAO.batchInsert(parsedUrls);
    invokeConcurrentRequests(processObj);
  } catch (e) {
    logger.error(`Error while running scrapper - ${e}`);
  }
}

module.exports = init;
