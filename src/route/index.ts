import router from './router'
import './user'
import './room'
import './game'

router.of('api')

router.on('Knock Knock', async () => {
  return "Who's there?"
})

router.otherwise(async () => {
  throw new Error('You shall not pass.')
})
