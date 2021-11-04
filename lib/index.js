import Path from 'path'
import Config from './config.js'
import ConfigLoader from './configLoader.js'
import work from './work.js'

function main() {
  const cwd = process.cwd()
  console.log('cwd:', cwd)
  console.log('process.argv:', process.argv)
  const cmdArgv = process.argv
  const initData = Config.defaultData

  // 与命令行参数合并；命令行参数与init.yml只能二选一
  if (cmdArgv.length > 2) {
    const cmdArgv = parseCmdArgv(cmdArgv.slice(2))
    Object.assign(initData, cmdArgv)
  } else {
    const initFile = Path.join(cwd, initData.init)
    Object.assign(initData, ConfigLoader.loadInit(initFile))
  }

  if (!initData.from) {
    throw new Error('init.yml 中没有指定模板项目，请配置 `from` 字段指定')
  }

  console.log(initData)
  work(cwd, initData)
}

main()
