function combineURLs(baseURL, relativeURL) {
  if (relativeURL) {
    return `${baseURL.replace(/\/+$/, "")}/${relativeURL.replace(/\/+$/, "")}`;
  }
  return baseURL;
}

export default combineURLs;
