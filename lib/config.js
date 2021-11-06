
const initOptionYML = 'init-option.yml'

const initweFlag = '### INITWE AT {time} ###'

const reportFile = 'init-report.md'

const defaultData = {
  init: 'init.yml',
  templateTag: '<? ?>',
  from: '',
  src: '',
  dest: './',
  overwrite: false,
  report: false,
  filter: '',
  data: {},
}

const initSteps = {
  downloading: '1/3 正在下载模板项目...',
  loadingLocal: '1/3 正在加载模板项目...',
  initing: '2/3 正在初始化项目文件...',
  done: '3/3 完成',
}

export default {
  initOptionYML,
  initweFlag,
  defaultData,
  initSteps,
  reportFile,
}
