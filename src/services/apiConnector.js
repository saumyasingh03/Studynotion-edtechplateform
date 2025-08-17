// import axios from "axios"

// export const axiosInstance =axios.create({});

// export const apiConnector=(method,url,bodyData,headers,params)=>{
//        return axiosInstance({
//                  method:`${method}`,
//                  url:`${url}`,
//                  data:bodyData? bodyData:null,
//                  headers:headers?headers:null,
//                  params:params?params:null,
//        });
// }


// src/services/apiConnector.js
import axios from "axios";

// Shared axios instance
export const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL || "", // ensure Vercel env set
  withCredentials: true, // keep true if you use cookies; harmless for header auth
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Generic API connector
export const apiConnector = async (method, url, bodyData = null, headers = {}, params = {}) => {
  try {
    const config = {
      method,
      url,
      data: bodyData !== null ? bodyData : undefined,
      headers: Object.keys(headers).length ? headers : undefined,
      params: Object.keys(params).length ? params : undefined,
    };

    return await axiosInstance(config);
  } catch (err) {
    console.error("[apiConnector] request failed:", { method, url, err });
    throw err;
  }
};
