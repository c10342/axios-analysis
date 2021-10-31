

function isCancel(data) {
  return !!(data && data.__CANCEL__)
}

export default isCancel
