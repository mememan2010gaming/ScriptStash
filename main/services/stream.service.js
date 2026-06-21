const YTDlpWrap = require('yt-dlp-wrap').default

let ytDlp = null

async function getStreamUrl(videoUrl) {
  if (!ytDlp) {
    try {
      ytDlp = new YTDlpWrap()
    } catch {
      await YTDlpWrap.downloadFromGithub()
      ytDlp = new YTDlpWrap()
    }
  }

  const output = await ytDlp.execPromise([
    videoUrl,
    '--get-url',
    '-f',
    'best[ext=mp4]/best[vcodec!=none][acodec!=none]/best',
    '--no-warnings',
  ])

  const firstUrl = output.trim().split('\n')[0]
  if (!firstUrl) throw new Error('yt-dlp returned no URL')
  return firstUrl
}

module.exports = { getStreamUrl }
