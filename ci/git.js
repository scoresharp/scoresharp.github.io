const path = require('path')
const childProcess = require('child_process')

const exec = function (cmd, args, options) {
  return new Promise((resolve, reject) => {
    const proc = childProcess.exec(cmd, args, options)
    proc.on('error', reject)
    proc.on('exit', code => {
      if (code > 0) {
        return reject(new Error(`Failed to execute command ${cmd}, because it returned with code ${code}`))
      }
      resolve()
    })
  })
}

const push = async function (dir, token) {
  const options = {
    cwd: path.resolve(__dirname, '..', dir)
  }
  dir = dir || 'scoresharp.github.io.git'
  await exec('git', ['add', '--all'], options)
  await exec('git', ['commit', '-m', `Push update to ${dir} at ${Date.now()}`], options)
  await exec('git', ['push', `https://${token}@github.com/scoresharp/${dir}.git`], options)
}

module.exports.push = push
