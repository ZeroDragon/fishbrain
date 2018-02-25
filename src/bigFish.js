const { writeFile, readFileSync, unlink, existsSync } = require('fs')
const { queue, series } = require('async')
const uuidv4 = require('uuid/v4')

const saveProcess = queue(({database, data}, cb) => {
  if (database === 'memory') {
    cb()
    return
  }
  const tmpFile = `${database}${uuidv4()}.bak`
  series({
    checkFile: (callback) => {
      if (!existsSync(database)) {
        writeFile(database, '', callback)
      } else {
        callback(null, true)
      }
    },
    copyFile: (callback) => {
      const tmp = readFileSync(database)
      writeFile(tmpFile, tmp, callback)
    },
    writeFile: (callback) => writeFile(database, JSON.stringify(data, false, 2), callback),
    unlink: (callback) => unlink(tmpFile, callback)
  }, cb)
}, 1)

const upgradeFish = (database) => {
  if (database === 'memory') return []
  if (existsSync(database)) {
    return JSON.parse(readFileSync(database, {encoding: 'utf8'}) || '[]')
  }
  return []
}

const querier = (init, query, count = 0) => {
  const length = Object.keys(query).length
  if (length === 0) return init
  const filter = {}
  filter.key = Object.keys(query)[count]
  filter.match = query[filter.key]
  const tmp = init.filter(itm => itm[filter.key] === filter.match)
  if (count < length) {
    return querier(tmp, query, count + 1)
  } else {
    return tmp
  }
}

const forgetMe = (data, {database}) => {
  const now = new Date().getTime() / 1000
  const retval = data.filter(itm => {
    if (!isNaN(itm._ttl)) {
      return itm._ttl >= now
    } else {
      return true
    }
  })
  if (data.length !== retval.length) saveProcess.push({database, data: retval})
  return retval
}

module.exports = {
  saveProcess,
  upgradeFish,
  querier,
  forgetMe
}
