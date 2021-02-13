const fs = require('fs')
const path = require('path')

const tmpRoot = path.resolve(__dirname, '../.tmp')

module.exports.ensure = async function (dirPath) {
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
