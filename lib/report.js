import FS from 'fs'
import Path from 'path'
import formatTime from '1kb/formatTime.js'
import Config from './config.js'

const formatList = files => '  - ' + files.join('\r\n  - ')

export default function report(workData, stat) {
  const time = Config.initweFlag.replace('{time}', formatTime(new Date()))

  console.log('\n' + time)
  console.log('本次初始化共：')
  console.log(`- 创建文件 ${stat.create.length} 个`)
  if (workData.overwrite) {
    console.log(`- 覆盖文件 ${stat.overwrite.length} 个`)
  } else {
    console.log(`- 跳过文件 ${stat.skip.length} 个`)
  }

  if (workData.report) {
    const reportFile = Path.join(workData._dest, Config.reportFile)
    const content = [time]
    content.push(`\r\n### 创建文件 ${stat.create.length} 个\r\n`)
    stat.create.length && content.push(formatList(stat.create))
    if (workData.overwrite) {
      content.push(`\r\n### 覆盖文件 ${stat.overwrite.length} 个\r\n`)
      stat.overwrite.length && content.push(formatList(stat.overwrite))
    } else {
      content.push(`\r\n### 跳过文件 ${stat.skip.length} 个\r\n`)
      stat.skip.length && content.push(formatList(stat.skip))
    }
    content.push('') // 末尾空行
    FS.writeFileSync(reportFile, content.join('\r\n'), 'utf-8')
  }

  const initFile = workData._initFile
  if (initFile && FS.existsSync(initFile)) {
    let fc = FS.readFileSync(initFile, 'utf-8')
    fc = fc.replace(/^### INITWE AT .+\r?\n/, '')
    FS.writeFileSync(initFile, time + '\r\n' + fc, 'utf-8')
  }
}
