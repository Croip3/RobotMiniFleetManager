import express from 'express'
import { authenticate } from './app.js'

const app = express()
const port = 3000

app.use(express.json())

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

app.get('/auth', (req, res) => {
  res.send('Hello AUTH!')
})

app.post('/auth/login', async (req, res) => {
  const token = await authenticate(req.body.email, req.body.password)
  if (!token) return res.status(401).json({error: 'Ivalid credentials'})
  res.json(token)
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).send('Error in the authentication service!');
});


