import axios from 'axios'
import JSZip from 'jszip'

// TODO: 支持 gitee

function getGitlabZip(url) {
  // master or main
  if (/^https:\/\/.+?\/.+?\/[^\/]+\/?$/.test(url)) {
    // https://github.com/axios/axios =>
    // https://github.com/axios/axios/archive/refs/heads/master.zip
    return url + '/archive/refs/heads/master.zip'
  }
  // 分支
  if (/^https:\/\/.+?\/.+?\/[^\/]+\/tree\/[^\/]+$/.test(url)) {
    // https://github.com/axios/axios/tree/next =>
    // https://github.com/axios/axios/archive/refs/heads/next.zip
    return url.replace('/tree/', '/archive/refs/heads/') + '.zip'
  }
}

function getGithubZip(url) {
  // master or main
  if (/^https:\/\/github\.com\/.+?\/[^\/]+\/?$/.test(url)) {
    // https://github.com/axios/axios =>
    // https://github.com/axios/axios/archive/refs/heads/master.zip
    return url + '/archive/refs/heads/master.zip'
  }
  // 分支
  if (/^https:\/\/github\.com\/.+?\/[^\/]+\/tree\/[^\/]+$/.test(url)) {
    // https://github.com/axios/axios/tree/next =>
    // https://github.com/axios/axios/archive/refs/heads/next.zip
    return url.replace('/tree/', '/archive/refs/heads/') + '.zip'
  }
  return ''
}

function formatGitUrl(url) {
  const match = url.match(/^git@(.+?):(.+?)\/(.+?)\.git$/)
  if (match) {
    return `https://${match[1]}/${match[2]}/${match[3]}`
  }
  return ''
}

// git@github.com:axios/axios.git
function getZipUrl(gitUrl) {
  const url = gitUrl.startsWith('git@') ? formatGitUrl(gitUrl) : gitUrl
  if (!/^https?:\/\//.test(url)) {
    const zipUrl = url.startsWith('https://github.com/') ? getGithubZip(url) : getGitlabZip(url)
    if (zipUrl) {
      return zipUrl
    }
  }

  throw new Error('不支持的 git 地址：' + gitUrl)
}

async function downloadFiles(gitUrl) {
  const zipUrl = getZipUrl(gitUrl)
  const response = await axios({
    method: 'get',
    url: zipUrl,
    responseType: 'arraybuffer'
  })
  const zipData = await JSZip.loadAsync(response.data)
  return zipData.files
}

export default downloadFiles
