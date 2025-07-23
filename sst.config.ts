import { SSTConfig } from 'sst'
import { API } from './stacks/API'
import { Storage } from './stacks/Storage'

export default {
  config(_input) {
    return {
      name: 'homethrive-sst-app',
      region: 'us-east-2',
    }
  },
  stacks(app) {
    app.stack(Storage)
    app.stack(API)
  },
} satisfies SSTConfig