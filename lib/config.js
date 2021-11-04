
const initOptionYML = 'init-option.yml'

const initweFlag = '### INITWE AT {time} ###'

const defaultData = {
  init: 'init.yml',
  templateTag: '<? ?>',
  from: '',
  src: '',
  dest: './',
  overwrite: false,
  report: true,
  filter: '',
  data: {},
}

export default {
  initOptionYML,
  initweFlag,
  defaultData,
}
