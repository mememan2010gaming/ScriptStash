const YTDlpWrap = require('yt-dlp-wrap')

async function getStreamUrl(videoUrl) {
  let ytDlp
  try {
    ytDlp = new YTDlpWrap()
  } catch {
    throw new Error('yt-dlp is not available')
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
