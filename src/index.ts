import app from './app'
import config from './utils/config'

const port = config.PORT || 3000

app.listen(port, () => {
  console.log('App listening on port ' + port)
})