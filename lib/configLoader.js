/**
 * 加载配置文件：init.yml, init-option.yml
 */
import FS from 'fs'
import YAML from 'yaml'
import Type from '1kb/type'

const regexExt = /\.yml$/

function loadYamlFc(file) {
  if (FS.existsSync(file)) {
    return FS.readFileSync(file, 'utf-8')
  } else {
    const path = file.replace(regexExt, '.yaml')
    if (FS.existsSync(path)) {
      return FS.readFileSync(path, 'utf-8')
    }
  }
  return ''
}

/** 加载 init.yml */
function loadInit(file) {
  const fc = loadYamlFc(file)
  if (fc) {
    try {
      return YAML.parse(fc)
    } catch (err) {
      throw new Error('解析 init.yml 发生错误')
    }
  }

  throw new Error('当前目录没有 init.yml 文件')
}

/** 加载 init-option.yml */
async function loadInitOption(file) {
  if (!file) {
    return null
  }

  if (typeof file !== 'string') {
    const res = await file.async('string')
      .then(fc => YAML.parse(fc))
      .catch(err => {
        throw new Error('解析 init-option.yml 时发生错误：' + err.message)
      })
    return res
  }

  const fc = loadYamlFc(file)
  if (fc) {
    try {
      return YAML.parse(fc)
    } catch (err) {
      throw new Error('解析 init-option.yml 时发生错误：' + err.message)
    }
  }

  return null
}

function getWorkData(initData, initOption) {
  const workData = Object.assign({}, initData)

  // _src and _dest
  if (workData._src.endsWith('/')) {
    workData._src = workData._src.slice(0, -1)
  }
  if (workData._dest.endsWith('/')) {
    workData._dest = workData._dest.slice(0, -1)
  }

  // templateTag
  if (initOption.templateTag) {
    workData.templateTag = initOption.templateTag.trim()
  }
  const tag = workData.templateTag.split(/\s+/)
  if (tag.length < 2) {
    throw Error('templateTag error')
  }
  workData._openTag = tag[0]
  workData._closeTag = tag[1]

  // filter
  let { filter } = initData
  if (filter) {
    if (!Array.isArray(filter)) {
      const filterOption = initOption.filter || {}
      filter = filterOption[filter] || filterOption.$default || []
    }
    workData._filter = filter.length ? hanldeFilter(filter) : false
  } else {
    workData._filter = false
  }

  // transfer
  workData._transfer = hanldeTransfer(initData.transfer)

  // data
  const { data } = initOption
  if (data) {
    const dataConfig = initData.data || {}
    const mergedData = {}
    Object.keys(data).forEach(prop => {
      const configValue = dataConfig[prop]
      if (Type.isPlainObject(data[prop])) {
        mergedData[prop] = data[prop][configValue] || configValue || data[prop].$default
      } else {
        mergedData[prop] = configValue || data[prop]
      }
    })
    workData.data = mergedData
  }

  return workData
}

function hanldeFilter(filter) {
  const yes = []
  const no = []

  filter.forEach(item => {
    if (item[0] === '-') {
      no.push(item.slice(1).trim())
    } else {
      yes.push(item.trim())
    }
  })

  return { yes, no }
}

function hanldeTransfer(transfer) {
  if (Array.isArray(transfer)) {
    const dest = Object.create(null)
  
    transfer.forEach(item => {
      const trans = item.split('->')
      if (trans.length > 1) {
        dest[trans[0].trim()] = trans[1].trim()
      }
    })

    return dest
  }

  return false
}

export default {
  loadInit,
  loadInitOption,
  getWorkData,
}
