import express from 'express'

const app = express()

app.get('/', async (req, res) => {
    res.send('Welcome to Express!')
})

app.listen(3211, async () => {
    console.log('Start server port:3211')
})