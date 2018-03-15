jest.mock('fs', () => {
  const mFs = require('memfs').fs
  return mFs
})
const fs = require('fs')
const { saveProcess, upgradeFish, querier, forgetMe, cleanMemory } = require('./bigFish')

describe('upgradeFish', () => {
  it('should return [] when no dbFile', () => {
    const existing = upgradeFish('/myDb')
    expect(existing).toEqual([])
  })
  it('should return [] when dbFile empty', () => {
    fs.writeFileSync('/myDb', '')
    const existing = upgradeFish('/myDb')
    expect(existing).toEqual([])
  })
  it('should return data when dbFile exists', () => {
    fs.writeFileSync('/myDb', JSON.stringify([{_id: 'something', key: 'value'}]))
    const existing = upgradeFish('/myDb')
    expect(existing).toEqual([{_id: 'something', key: 'value'}])
  })
})

describe('saveProcess', () => {
  it('should skip when memoryDB', async () => {
    const data = [{_id: 'something else', key: 'value'}]
    saveProcess.push({database: 'memory', data})
    await new Promise(resolve => {
      saveProcess.drain = () => {
        expect(upgradeFish('memory')).toEqual([])
        resolve()
      }
    })
  })
  it('should save when no dbFile', async () => {
    fs.unlinkSync('/myDb')
    const data = [{_id: 'something else', key: 'value'}]
    saveProcess.push({database: '/myDb', data})
    await new Promise(resolve => {
      saveProcess.drain = () => {
        expect(upgradeFish('/myDb')).toEqual(data)
        resolve()
      }
    })
  })
  it('should save when existing dbFile', async () => {
    const data = [{_id: 'something else more', key: 'value'}]
    saveProcess.push({database: '/myDb', data})
    await new Promise(resolve => {
      saveProcess.drain = () => {
        expect(upgradeFish('/myDb')).toEqual(data)
        resolve()
      }
    })
  })
})

describe('query explorer', () => {
  it('should return all records', () => {
    const origin = [{id: 1}, {id: 2}, {id: 3}]
    const result = querier(origin, {})
    expect(result).toEqual(origin)
  })
  it('should return one record', () => {
    const origin = [{id: 1}, {id: 2}, {id: 3}]
    const result = querier(origin, {id: 2})
    expect(result).toEqual([{id: 2}])
  })
  it('should return two records', () => {
    const origin = [{id: 1, other: true}, {id: 2, other: true}, {id: 3}]
    const result = querier(origin, {other: true})
    expect(result).toEqual([{id: 1, other: true}, {id: 2, other: true}])
  })
})

describe('forgetMe', () => {
  it('should remove only expired items', async () => {
    const origin = [
      {id: 1, other: true},
      {id: 2, other: true, _ttl: 'custom key'},
      {id: 3, _ttl: new Date().getTime() / 1000 - 10}
    ]
    const cleanData = forgetMe(origin, {database: '/myDb'})
    const cleanData2 = forgetMe(cleanData, {database: '/myDb'})
    await new Promise(resolve => {
      saveProcess.drain = () => {
        resolve()
      }
    })
    expect(cleanData).toEqual([
      {id: 1, other: true},
      {id: 2, other: true, _ttl: 'custom key'}
    ])
    expect(cleanData2).toEqual([
      {id: 1, other: true},
      {id: 2, other: true, _ttl: 'custom key'}
    ])
  })
})

describe('cleanMemory', () => {
  it('should return same value is is shallow', () => {
    const input = {_id: 'test', val: 'bool', _ttl: 12345, _protected: true}
    const result = cleanMemory([input], true)
    expect(result).toEqual([input])
  })
  it('should return stripped values', () => {
    const input = {_id: 'test', val: 'bool', _ttl: 12345, _protected: true}
    const result = cleanMemory([input], false)
    expect(result).toEqual([{
      _id: 'test',
      _ttl: 12345,
      _protected: true
    }])
  })
})
