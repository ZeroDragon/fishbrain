Fish Brain
===

A pure javascript in-memory database with support to save into file system.  
This database is designed only for SMALL quantities of data (say 20mb = 2,621,440 characters).  
Database files are just JSON files.

## Install

`npm i -S fishbrain`


## Instance

```
const Fishbrain = require('fishbrain')
```

To create a small fish with memory-only database (will forget everything when restart)

```
const smallFish = new Fishbrain('memory')
```

To create a big fish with file-system database (will persist)

```
const bigFish = new FishBrain('path_to_your_dbfile')
```
Your dbfile can be anything, no extension required and inside its just a plain JSON text file.


To keep a low memory footprint you can pass an optional shallow value when creating your brain  

```
const bigFish = new FishBrain('path_to_your_dbfile', false)
```
your DB in filesystem will still have all data, but your copy in memory will only have reserved values

## Create and Update
```
set(object)
```
If no `_id` is provided in the object when setting the record, a new record will be created and a new id will be returned.  
If an existing `_id` is provided, it will replace matching keys and insert new ones.  
If an un-existing `_id` is provided, it will create a new record with that `_id`.  
If the existing record has value `_protected`, it will not be updated.  

## Read
```
get(query[, projection])  
```
When calling `get` with a query object, will return all items that match.  
When calling `get` with an empty object, will return all items in the database.  
When setting a projection, only the specified fields will be returned.  

## Delete
```
del(query)
```
When called with no query or empty query, will return with no action done.
When called with a query object, all items matching that query will be removed from the DB

## flush
```
flush()
```
Will delete all records from DB

## Reserved keys
```
_id is used to create or update records
_ttl is used to set a time to live (see examples)
_protected is used to protect a value from being updated, but you still can delete it

```

## Examples
```
const Fishbrain = require('fishbrain')
const fish = new Fishbrain('memory')

const id = fish.set({mykey: 'my value'})
const row1 = fish.get({_id: id})
// row1 = [{_id:<some uuid>, mykey: 'my value'}]

fish.set({_id: id, otherValue: 'yay'})
const row2 = fish.get({_id: id})
// row2 = [{_id:<some uuid>, mykey: 'my value', otherValue: 'yay'}]

fish.set({_id:'customText', bar:'foo'})
const row3 = fish.get({_id: `customText`})
// row3 = [{_id:'customText', bar:'foo'}]

const allRows = fish.get({})
// allRows = [
// 	{_id:<some uuid>, mykey: 'my value', otherValue: 'yay'},
// 	{_id:'customText', bar:'foo'}
// ]

const allRowsProjected = fish.get({},['bar'])
// allRowsProjected = [
// 	{bar: undefined},
// 	{bar: 'foo'}
// ]

const threeSecondsFromNow = new Date().getTime() / 1000 + 3
const dory = fish.set({
  _ttl: threeSecondsFromNow,
  nemo: 'P. Sherman 42 Wallaby Way, Sydney'
})
const result = fish.get({_id: dory},['nemo'])
// result = [{nemo: 'P. Sherman 42 Wallaby Way, Sydney'}]

setTimeout(() => {
  const result2 = fish.get({_id: dory},['nemo'])
  // result2 = []
},5000)

fish.del({bar:'foo'}) // all records with bar: 'foo' gone
fish.flush() // all gone
```