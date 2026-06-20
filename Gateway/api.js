const axios = require("axios");
require('dotenv').config();

const BASEURLS = {
  base1: process.env.AUTH_BASE_URL,
  base2: process.env.TASK_BASE_URL,
  base3: process.env.GROUP_BASE_URL,
};

const headers = {
  "Content-Type": "application/json",
};

const createAPIinstance = (baseURL) => {
  return axios.create({ baseURL, withCredentials: true, headers: { ...headers } });
};

const authapi = createAPIinstance(BASEURLS.base1);
const taskapi = createAPIinstance(BASEURLS.base2);
const groupapi = createAPIinstance(BASEURLS.base3);

module.exports = { authapi, taskapi, groupapi };