const fs = require('fs')
const path = require('path')

const tmpRoot = path.resolve(__dirname, '../.tmp')

let tmpRootProm
const ensureTmpRoot = async function () {
  const createTmpRoot = async () => {
    try {
      await fs.promises.mkdir(tmpRoot)
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err
      }
    }
  }
  tmpRootProm = tmpRootProm || createTmpRoot()
  return tmpRootProm
}

module.exports.ensure = async function (dirPath) {
  await ensureTmpRoot()
  const dirs = dirPath.split(/[\\/]/)
  let full = '.'
  for (let dir of dirs) {
    try {
      full = path.join(full, dir)
      await fs.promises.mkdir(path.resolve(tmpRoot, full))
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err
      }
    }
  }
  return path.resolve(tmpRoot, full)
}
