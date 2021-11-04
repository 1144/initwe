import FS from 'fs'
import Path from 'path'
import Micromatch from 'micromatch'
import { setTag, compile } from 'small-tpl'
import Config from './config.js'
import ConfigLoader from './configLoader.js'
import downloadFiles from './downloadFiles.js'

const { initOptionYML } = Config

function work(cwd, initData) {
  const fromData = handleFrom(cwd, initData)
  const { files, src } = fromData
  const initOption = files
    ? ConfigLoader.loadInitOption(files[initOptionYML])
    : ConfigLoader.loadInitOption(Path.join(src, initOptionYML))
  console.log(initOption)
  const workData = ConfigLoader.getWorkData(initData, initOption)
  console.log(workData)

  const dest = Path.join(cwd, initData.dest)
  const filter = workData._filter
  const transfer = workData._transfer
  const srcLen = src.length + 1 // 加上末尾`/`的长度

  makeDir(dest)
  setTag(workData._openTag, workData._closeTag)

  const handleDir = dir => {
    FS.readdirSync(dir).forEach(filename => {
      const filePath = Path.join(dir, filename)
      const relativePath = filePath.slice(srcLen)
      console.log('relativePath:', relativePath)

      if (relativePath !== initOptionYML
        && (!filter || isKeep(relativePath, filter))) {
        const newPath = transferPath(relativePath, transfer)
        if (FS.statSync(filePath).isFile()) {
          handleFile(filePath, dest, newPath, workData)
        } else {
          makeDir(Path.join(dest, newPath))
          handleDir(filePath)
        }
      }
    })
  }

  const handleFiles = () => {

  }

  if (files) {
    delete files[initOptionYML]
    handleFiles()
  } else {
    handleDir(src)
  }
}

function handleFrom(cwd, initData) {
  const { from, src } = initData
  if (isUrl(from)) {
    const files = downloadFiles(from)
    return {
      src: '',
      files: src ? filterFilesBySrc(files, src) : files,
    }
  }

  const localPath = getLocalPath(cwd, from)
  if (localPath) {
    return {
      src: Path.join(localPath, src),
      files: null,
    }
    // initData.initOptionFile = Path.join(initData._src, initOptionYML)
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
  const res = Object.create(null)
  const srcDir = src.endsWith('/') ? src : src + '/'
  const srcLen = srcDir.length

  Object.keys(files).forEach(filename => {
    if (filename.startsWith(srcDir)) {
      const newFn = filename.slice(srcLen)
      newFn && (res[newFn] = files[filename])
    }
  })

  return res
}

function makeDir(path) {
  if (!FS.existsSync(path)) {
    FS.mkdirSync(path, { recursive: true })
  }
}

function handleFile(srcPath, dest, newPath, workData) {
  const path = Path.join(dest, newPath)
  console.log('handleFile:', path)
  if (FS.existsSync(path)) {
    if (!workData.overwrite) {
      // skip stat
      console.log('skip file:', path)
      return
    }
    // overwrite stat
    console.log('overwrite file:', path)
  } else {
    const i = newPath.lastIndexOf('/')
    if (i > 0) {
      makeDir(Path.join(dest, newPath.slice(0, i)))
    }
  }

  let fc = FS.readFileSync(srcPath, 'utf-8')
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
