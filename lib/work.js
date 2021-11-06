import FS from 'fs'
import Path from 'path'
import Micromatch from 'micromatch'
import { setTag, compile } from 'small-tpl'
import Config from './config.js'
import ConfigLoader from './configLoader.js'
import downloadFiles from './downloadFiles.js'
import Event from './event.js'

const { initOptionYML } = Config

async function work(initData) {
  const fromData = await handleFrom(initData)
  const { absSrc, files } = fromData
  const optionFilePath = Path.join(absSrc, initOptionYML)
  let initOption
  if (files) {
    const optionFile = files[optionFilePath]
    if (optionFile) {
      delete files[optionFilePath]
      initOption = ConfigLoader.loadInitOption(await optionFile.async('string'), true)
    }
  } else {
    initOption = ConfigLoader.loadInitOption(optionFilePath)
  }

  const workData = ConfigLoader.getWorkData(initData, initOption || {})
  // console.log(workData)
  const dest = initData._dest
  const filter = workData._filter
  const transfer = workData._transfer
  const srcLen = absSrc.length + 1 // 加上末尾`/`的长度

  makeDir(dest)
  setTag(workData._openTag, workData._closeTag)

  const handleDir = dir => {
    FS.readdirSync(dir).forEach(filename => {
      const filePath = Path.join(dir, filename)
      const relPath = filePath.slice(srcLen) // 相对项目根的路径
      // console.log('relPath:', relPath)
      if (relPath !== initOptionYML
        && (!filter || isKeep(relPath, filter))) {
        const newPath = transferPath(relPath, transfer)
        if (FS.statSync(filePath).isFile()) {
          handleFile(filePath, dest, newPath, workData)
        } else {
          makeDir(Path.join(dest, newPath))
          handleDir(filePath)
        }
      }
    })
  }

  const handleZipFiles = () => {
    for (const filePath in files) {
      let relPath = filePath.slice(srcLen) // 相对项目根的路径
      if (relPath.endsWith('/')) {
        relPath = relPath.slice(0, -1)
      }
      if (!relPath) {
        continue
      }
      if (!filter || isKeep(relPath, filter)) {
        const newPath = transferPath(relPath, transfer)
        const file = files[filePath]
        if (file.dir) {
          makeDir(Path.join(dest, newPath))
        } else {
          handleFile(file, dest, newPath, workData)
        }
      }
    }
  }

  if (files) {
    Event.emit('step', 'initing')
    handleZipFiles()
    Event.emit('done', workData)
  } else {
    if (FS.existsSync(absSrc)) {
      Event.emit('step', 'initing')
      handleDir(absSrc)
      Event.emit('done', workData)
    } else {
      throw new Error('模板项目里找不到`src`指定的路径：' + absSrc)
    }
  }
}

async function handleFrom(initData) {
  const { from, _src } = initData

  if (isUrl(from)) {
    Event.emit('step', 'downloading', from)
    const files = await downloadFiles(from)
    let zipRoot = ''
    for (const filePath in files) {
      zipRoot = filePath.includes('/') ? filePath.split('/')[0] : ''
      break
    }
    const absSrc = Path.join(zipRoot, _src)
    return {
      absSrc,
      files: _src ? filterFilesBySrc(files, absSrc + '/') : files,
    }
  }

  const localPath = getLocalPath(initData._cwd, from)
  if (localPath) {
    Event.emit('step', 'loadingLocal', localPath)
    return {
      absSrc: Path.join(localPath, _src), // src 的绝对路径
      files: null,
    }
  }

  throw new Error('找不到模板项目：' + from)
}

// 判断模板项目路径是否URL
function isUrl(from) {
  return /^https?:\/\//.test(from) || from.startsWith('git@')
}

function getLocalPath(cwd, from) {
  const path = Path.join(cwd, from)
  if (from[0] === '.') {
    return FS.existsSync(path) ? path : ''
  }
  if (FS.existsSync(from)) {
    return from
  }
  return FS.existsSync(path) ? path : ''
}

function filterFilesBySrc(files, src) {
  const srcFiles = Object.create(null)
  Object.keys(files).forEach(filePath => {
    if (filePath.startsWith(src)) {
      srcFiles[filePath] = files[filePath]
    }
  })
  return srcFiles
}

function makeDir(path) {
  if (!FS.existsSync(path)) {
    FS.mkdirSync(path, { recursive: true })
  }
}

async function handleFile(file, dest, newPath, workData) {
  const path = Path.join(dest, newPath)
  if (FS.existsSync(path)) {
    if (!workData.overwrite) {
      Event.emit('skip-file', newPath)
      return
    }
    Event.emit('overwrite-file', newPath)
  } else {
    const i = newPath.lastIndexOf('/')
    if (i > 0) {
      makeDir(Path.join(dest, newPath.slice(0, i)))
    }
    Event.emit('create-file', newPath)
  }

  let fc = typeof file === 'string'
    ? FS.readFileSync(file, 'utf-8')
    : await file.async('string')
  if (fc.includes(workData._openTag)) {
    const render = compile(fc, { uglify: false })
    fc = render(workData.data)
  }
  FS.writeFileSync(path, fc, 'utf-8')
}

function isKeep(path, filter) {
  if (Micromatch.isMatch(path, filter.yes)) {
    return true
  }

  if (Micromatch.isMatch(path, filter.no)) {
    return false
  }

  return true
}

function transferPath(path, transfer) {
  return transfer && transfer[path] || path
}

export default work
