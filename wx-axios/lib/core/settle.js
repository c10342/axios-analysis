import createError from "./createError";

function settle(resolve, reject, response) {
  const validateStatus = response.config.validateStatus;
  if (!validateStatus || validateStatus(response)) {
    resolve(response);
  } else {
    reject(
      createError(
        `Request failed with status code ${response.status}`,
        response.config,
        null,
        response.request,
        response
      )
    );
  }
}

export default settle;
