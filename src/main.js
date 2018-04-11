const uuidv4 = require('uuid/v4')
const { cleanData, realSaveProcess, saveProcess, upgradeFish, querier, forgetMe } = require('./bigFish')
const fs = require('fs')
const path = require('path')

class Brain {
  constructor (filePath, opts) {
    let options = {splitAt: -1, acumSize: 0}
    if (opts) {
      options = Object.assign(options, opts)
    }
    this.realConst(filePath, options)
  }
  realConst (filePath, opts) {
    let options = opts
    this.filePath = filePath
    this.realFilePath = filePath
    if (filePath !== 'memory') {
      this.filePath = path.join(process.cwd(), this.realFilePath)
    } else {
      this.filePath = filePath
    }
    this.brain = upgradeFish(this.filePath)
    this.options = options
    saveProcess.drain = () => {
      const dirName = path.dirname(this.filePath)
      const files = fs.readdirSync(dirName)
      const originalFileName = path.basename(this.realFilePath).split('.part')[0]
      const originalFile = path.join(path.dirname(this.filePath), originalFileName)
      let init = null
      try {
        init = JSON.parse(fs.readFileSync(originalFile, {encoding: 'utf8'}))
      } catch (e) {
        return
      }
      let acum = files
        .filter(file => file.indexOf(originalFileName) !== -1)
        .filter(file => file.indexOf('.part') !== -1)
      if (acum.length === 0) {
        if (this.finished) this.finished()
      }
      acum = acum
        .map(file => {
          const rawFile = fs.readFileSync(
            path.join(
              path.dirname(this.filePath), file
            ),
            {encoding: 'utf8'}
          )
          return JSON.parse(rawFile)
        })
        .reduce((prev, current) => prev.concat(current), init)
      acum = cleanData(acum)
      realSaveProcess({database: originalFile, data: acum}, () => {
        files
          .filter(file => file.indexOf(originalFileName) !== -1)
          .filter(file => file.indexOf('.part') !== -1)
          .forEach(file => {
            fs.unlinkSync(
              path.join(
                path.dirname(this.filePath), file
              )
            )
          })
        if (this.finished) this.finished()
      })
    }
  }
  set (data) {
    const { options } = this
    let newItm = null
    let brain = this.brain
    if (data._id) {
      let existing = brain.find(({_id}) => _id === data._id)
      if (!existing) {
        newItm = JSON.parse(JSON.stringify(data))
        brain.push(newItm)
      } else {
        existing = JSON.parse(JSON.stringify(existing))
        if (existing._protected === true) return existing._id
        newItm = JSON.parse(JSON.stringify(Object.assign(existing, data)))
        brain = brain.map(itm => {
          if (itm._id === data._id) return existing
          return itm
        })
      }
    } else {
      newItm = Object.assign({_id: uuidv4()}, JSON.parse(JSON.stringify(data)))
      brain.push(newItm)
    }
    saveProcess.push({database: this.filePath, data: brain})
    if (brain.length === options.splitAt) {
      this.options.acumSize += brain.length
      let index = parseInt(this.realFilePath.split('.part.').pop(), 10) || 0
      index = `000000${index + 1}`.slice(-6)
      const rFile = this.realFilePath.split('.part.')[0]
      this.realConst(`${rFile}.part.${index}`, this.options)
      return newItm._id
    }
    this.brain = brain
    return newItm._id
  }
  get (query, projection = []) {
    let brain = []
    brain = forgetMe(this.brain, {database: this.filePath})
    const data = querier(brain, query)
    if (projection.length === 0) return JSON.parse(JSON.stringify(data))
    return data.map(itm => {
      const tmp = {}
      projection.forEach(k => {
        tmp[k] = itm[k]
      })
      return tmp
    })
  }
  del (query = {}) {
    if (Object.keys(query).length === 0) return
    let brain = this.brain
    const toDelete = querier(brain, query).map(itm => itm._id)
    this.brain = this.brain.filter(itm => toDelete.indexOf(itm._id) === -1)
    saveProcess.push({database: this.filePath, data: this.brain})
    this.brain = this.brain
  }
  flush () {
    this.brain = []
    saveProcess.push({database: this.filePath, data: this.brain})
  }
}

module.exports = Brain
