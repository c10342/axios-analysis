import {forEach} from '../utils'


function transformData(data,headers,method,fns){
    forEach(fns,(fn)=>{
        data = fn(data,headers,method)
    })
    return data
}

export default transformData