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
      throw new Error('init.yml error')
    }
  }

  throw new Error('no init.yml')
}

/** 加载 init-option.yml */
function loadInitOption(file) {
  const fc = loadYamlFc(file)
  if (fc) {
    try {
      return YAML.parse(fc)
    } catch (err) {
      throw new Error('init-option.yml error')
    }
  }

  throw new Error('no init-option.yml')
}

function getWorkData(initData, initOption) {
  const workData = Object.assign({}, initData)

  // __src and __dest
  if (workData.__src.endsWith('/')) {
    workData.__src = workData.__src.slice(0, -1)
  }
  if (workData.__dest.endsWith('/')) {
    workData.__dest = workData.__dest.slice(0, -1)
  }

  // templateTag
  if (initOption.templateTag) {
    workData.templateTag = initOption.templateTag.trim()
  }
  const tag = workData.templateTag.split(/\s+/)
  if (tag.length < 2) {
    throw Error('templateTag error')
  }
  workData.__openTag = tag[0]
  workData.__closeTag = tag[1]

  // filter
  let { filter } = initData
  if (filter) {
    if (!Array.isArray(filter)) {
      const filterOption = initOption.filter || {}
      filter = filterOption[filter] || filterOption.$default || []
    }
    workData.__filter = filter.length ? hanldeFilter(filter) : false
  } else {
    workData.__filter = false
  }

  // transfer
  workData.__transfer = hanldeTransfer(initData.transfer)

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
