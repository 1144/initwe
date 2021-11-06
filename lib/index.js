import Path from 'path'
import Config from './config.js'
import ConfigLoader from './configLoader.js'
import Event from './event.js'
import work from './work.js'
import report from './report.js'

function main() {
  const cwd = process.cwd()
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
    initData._initFile = initFile
  }

  if (!initData.from) {
    throw new Error('init.yml 中没有指定模板项目，请配置 `from` 字段指定')
  }

  // _src and _dest
  const src = initData.src
  const dest = Path.join(cwd, initData.dest)
  initData._src = src.endsWith('/') ? src.slice(0, -1) : src
  initData._dest = dest.endsWith('/') ? dest.slice(0, -1) : dest

  initData._cwd = cwd

  // console.log(initData)
  bindEvent()
  work(initData)
}

function bindEvent() {
  Event.on('step', step => {
    console.log(Config.initSteps[step])
  })

  const stat = {
    skip: [],
    overwrite: [],
    create: [],
  }
  Event.on('skip-file', file => stat.skip.push(file))
  Event.on('overwrite-file', file => stat.overwrite.push(file))
  Event.on('create-file', file => stat.create.push(file))

  Event.on('done', workData => {
    Event.emit('step', 'done')
    report(workData, stat)
  })
}

main()
