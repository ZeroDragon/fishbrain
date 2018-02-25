var Fishbrain = require('fishbrain')
var fish = new Fishbrain('memory')

var id = fish.set({hello: 'world'})
fish.set({_id: 'custom', key: 'value'})
fish.set({_id: 'custom', key: 'value', other: 'another'})
fish.set({_id: 'custom', key: 'value nope'})
console.log(fish.get({}))
