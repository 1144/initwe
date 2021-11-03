import FS from 'fs'
import Path from 'path'
import Micromatch from 'micromatch'
import { setTag, compile } from 'small-tpl'
import Config from './config.js'

const { initOptionYML } = Config

function work(workData) {
  const src = workData.__src
  const dest = workData.__dest
  const filter = workData.__filter
  const transfer = workData.__transfer
  const srcLen = src.length + 1 // 加上末尾`/`的长度

  if (!FS.existsSync(src)) {
    throw new Error('no src')
  }

  makeDir(dest)
  setTag(workData.__openTag, workData.__closeTag)

  const hanldeDir = dir => {
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
          hanldeDir(filePath)
        }
      }
    })
  }

  hanldeDir(src)
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
  if (fc.includes(workData.__openTag)) {
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
