
import combineURLs from '../helpers/combineURLs'
import isAbsoluteURL from '../helpers/isAbsoluteURL'
function buildFullPath(baseURL, requestedURL){
    if(baseURL && !isAbsoluteURL(requestedURL)){
        return combineURLs(baseURL,requestedURL)
    }
    return requestedURL
}

export default buildFullPath