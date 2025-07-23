// test.mjs
import * as sst from 'sst'
import * as aws from 'sst/aws/realtime'
import * as client from 'sst/aws/client'
import * as task from 'sst/aws/task'

console.log('sst', Object.keys(sst))
console.log('sst/aws', Object.keys(aws))
console.log('sst/client', Object.keys(client))
console.log('sst/task', Object.keys(task))
