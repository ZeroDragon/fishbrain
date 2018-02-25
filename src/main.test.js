jest.mock('./bigFish', () => {
  const actualBigFish = require.requireActual('./bigFish')
  return {
    saveProcess: {
      push: jest.fn()
    },
    upgradeFish: jest.fn(() => []),
    querier: actualBigFish.querier,
    forgetMe: actualBigFish.forgetMe
  }
})

const { saveProcess, upgradeFish } = require('./bigFish')
const Brain = require('./main')

let mockFish = null

describe('start and insert', () => {
  it('should create a database instance', () => {
    mockFish = new Brain('../database/test')
    expect(upgradeFish).toHaveBeenCalled()
    expect(mockFish).toBeInstanceOf(Brain)
  })
  it('should add a new record', () => {
    mockFish.set({testKey: 'value'})
    expect(saveProcess.push).toHaveBeenCalled()
    expect(mockFish.brain).toEqual([{
      _id: expect.any(String),
      testKey: 'value'
    }])
  })
})

describe('get record', () => {
  it('should get a record', () => {
    const {_id} = mockFish.brain[0]
    const existing = mockFish.get({_id})
    expect(existing).toEqual([{
      _id: expect.any(String),
      testKey: 'value'
    }])
  })
  it('should get a record with projection', () => {
    const {_id} = mockFish.brain[0]
    const existing = mockFish.get({_id}, ['testKey'])
    expect(existing).toEqual([{
      testKey: 'value'
    }])
  })
  it('should get all records', () => {
    mockFish.set({testKey: 'other'})
    expect(mockFish.get({}).length).toBe(2)
  })
  it('should get only one by value', () => {
    const existing = mockFish.get({testKey: 'other'})
    expect(existing).toEqual([{
      _id: expect.any(String),
      testKey: 'other'
    }])
  })
})

describe('update record', () => {
  it('should update an existing value', () => {
    const existing = mockFish.get({testKey: 'other'})[0]
    existing.moreData = 'more'
    mockFish.set(existing)
    const updated = mockFish.get({testKey: 'other'})
    expect(updated).toEqual([{
      _id: expect.any(String),
      testKey: 'other',
      moreData: 'more'
    }])
    expect(mockFish.get({}).length).toBe(2)
  })
  it('should update existing with custom id', () => {
    const customId = mockFish.set({_id: 'custom', value: 'something'})
    expect(customId).toBe('custom')
    expect(mockFish.get({}).length).toBe(3)
  })
})

describe('deleting', () => {
  it('should not delete anything when query not set', () => {
    mockFish.del()
    mockFish.del({})
    expect(mockFish.get({}).length).toBe(3)
  })
  it('should delete one element by query', () => {
    mockFish.del({moreData: 'more'})
    expect(mockFish.get({}).length).toBe(2)
  })
  it('should flush the memory', () => {
    mockFish.flush()
    expect(mockFish.get({}).length).toBe(0)
  })
})
