const uuidv4 = require('uuid/v4')
const { saveProcess, upgradeFish, querier, forgetMe } = require('./bigFish')
const path = require('path')

class Brain {
  constructor (filePath) {
    if (filePath !== 'memory') {
      this.filePath = path.join(__dirname, filePath)
    } else {
      this.filePath = filePath
    }
    this.brain = upgradeFish(this.filePath)
  }
  set (data) {
    let newItm = null
    if (data._id) {
      const existing = this.brain.find(({_id}) => _id === data._id)
      if (!existing) {
        newItm = JSON.parse(JSON.stringify(data))
        this.brain.push(newItm)
      } else {
        const existing = JSON.parse(JSON.stringify(this.brain.find(({_id}) => _id === data._id)))
        newItm = JSON.parse(JSON.stringify(Object.assign(existing, data)))
        this.brain = this.brain.map(itm => {
          if (itm._id === data._id) return existing
          return itm
        })
      }
    } else {
      newItm = Object.assign({_id: uuidv4()}, JSON.parse(JSON.stringify(data)))
      this.brain.push(newItm)
    }
    saveProcess.push({database: this.filePath, data: this.brain})
    return newItm._id
  }
  get (query, projection = []) {
    const brain = forgetMe(this.brain, {database: this.filePath})
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
    const toDelete = querier(this.brain, query).map(itm => itm._id)
    this.brain = this.brain.filter(itm => toDelete.indexOf(itm._id) === -1)
    saveProcess.push({database: this.filePath, data: this.brain})
  }
  flush () {
    this.brain = []
    saveProcess.push({database: this.filePath, data: this.brain})
  }
}

module.exports = Brain
