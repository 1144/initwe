import FS from 'fs'

const argHandlers = {
  src: value => value,
  dest: value => value,
  overwrite: value => value !== 'false',
  report: value => value !== 'false',
  filter: value => value,
}

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

/** 解析命令参数 */
function parseCmdArgv(argv) {
  const args = {
    from: argv[0]
  }
  const len = argv.length
  for (let i = 1; i < len; i++) {
    const arg = (argv[i].slice(2) + '=').split('=')
    if (argHandlers.hasOwnProperty(arg[0])) {
      args[arg[0]] = argHandlers[arg[0]](arg[1])
    }
  }

  return args
}

export default {
  makeDir,
  trimSlash,
  parseCmdArgv,
}
