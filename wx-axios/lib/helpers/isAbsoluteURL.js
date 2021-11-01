

function isAbsoluteURL(url){
    // 只要是http开头或者是https开头的都认为是绝对地址
    return /^https?:\/\//i.test(url)
}

export default isAbsoluteURL