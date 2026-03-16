import express from 'express'
import { authenticate } from './app.js'

const app = express()
const port = 3000

app.set("trust proxy", 1);

app.use(express.json())

app.listen(port, () => {
  console.log(`Auth app listening on port ${port}`)
})

app.get('/auth', (req, res) => {
  res.send('Hello AUTH!')
})

app.post('/auth/login', async (req, res) => {
  console.log('HTTPS:', req.secure)
  if (req.secure) console.log('HTTPS used!')
  const token = await authenticate(req.body.email, req.body.password)
  if (!token) return res.status(401).json({error: 'Ivalid credentials'})
  res.json(token)
})

app.use((req) => {
  if (req.secure) console.log('HTTPS used!')
})

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err)
  res.status(500).send('Error in the authentication service!');
});


