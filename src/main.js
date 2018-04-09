const uuidv4 = require('uuid/v4')
const { saveProcess, upgradeFish, querier, forgetMe, cleanMemory } = require('./bigFish')
const path = require('path')

class Brain {
  constructor (filePath, opts = true) {
    let options = opts
    if(typeof opts !== 'object') {
      options = {
        shallow: opts,
        splitAt: -1
      }
    }
    if (filePath !== 'memory') {
      this.filePath = path.join(process.cwd(), filePath)
    } else {
      this.filePath = filePath
    }
    this.brain = upgradeFish(this.filePath)
    this.options = options
  }
  set (data) {
    const { options } = this
    let newItm = null
    if (data._id) {
      let brain = this.brain
      if (!options.shallow)
        brain = forgetMe(upgradeFish(this.filePath), {database: this.filePath})
      let existing = brain.find(({_id}) => _id === data._id)
      if (!existing) {
        newItm = JSON.parse(JSON.stringify(data))
        this.brain.push(newItm)
      } else {
        existing = JSON.parse(JSON.stringify(existing))
        if (existing._protected === true) return existing._id
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
    this.brain = cleanMemory(this.brain, options.shallow)
    return newItm._id
  }
  get (query, projection = []) {
    const { options } = this
    let brain = []
    if (!options.shallow) {
      brain = forgetMe(upgradeFish(this.filePath), {database: this.filePath})
    } else {
      brain = forgetMe(this.brain, {database: this.filePath})
    }
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
    const { options } = this
    let brain = []
    if (!options.shallow) {
      brain = upgradeFish(this.filePath)
    } else {
      brain = this.brain
    }
    const toDelete = querier(brain, query).map(itm => itm._id)
    this.brain = this.brain.filter(itm => toDelete.indexOf(itm._id) === -1)
    saveProcess.push({database: this.filePath, data: this.brain})
    this.brain = cleanMemory(this.brain, options.shallow)
  }
  flush () {
    this.brain = []
    saveProcess.push({database: this.filePath, data: this.brain})
  }
}

module.exports = Brain
