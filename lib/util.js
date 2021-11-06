import FS from 'fs'

/** 创建文件目录 */
function makeDir(path) {
  if (!FS.existsSync(path)) {
    FS.mkdirSync(path, { recursive: true })
  }
}

/** 去掉文件目录末尾的`/` */
function trimSlash(str) {
  return str.endsWith('/') ? str.slice(0, -1) : str
}

export default {
  makeDir,
  trimSlash,
}
