import Path from 'path'
import Config from './config.js'
import ConfigLoader from './configLoader.js'
import work from './work.js'

async function main() {
  const cwd = process.cwd()
  console.log('cwd:', cwd)
  console.log('process.argv:', process.argv)
  const cmdArgv = process.argv
  const initData = Config.defaultData

  // 与命令行参数合并
  if (cmdArgv.length > 2) {
    Object.assign(initData, parseCmdArgv(cmdArgv.slice(2)))
  } else {
    initData.initFile = Path.join(cwd, initData.init)
    Object.assign(initData, ConfigLoader.loadInit(initData.initFile))
  }

  if (initData.local) {
    // 加载本地模板的配置
    initData.__src = Path.join(cwd, initData.local, initData.src)
    initData.initOptionFile = Path.join(initData.__src, Config.initOptionYML)
  } else if (initData.git) {
    // todo 下载远程模板
    initData.initOptionFile = Path.join(cwd, initData.local, Config.initOptionYML)
    // initConfigData = ConfigLoader.loadInitOption(initData.initOptionFile)
  } else {
    throw new Error('no src')
  }

  initData.__dest = Path.join(cwd, initData.dest)
  console.log(initData)

  const initOption = ConfigLoader.loadInitOption(initData.initOptionFile)
  console.log(initOption)

  const workData = ConfigLoader.getWorkData(initData, initOption)
  console.log(workData)

  work(workData)
}

main()
