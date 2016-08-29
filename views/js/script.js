'use strict'

let Nes = require('nes')

let client = new Nes.Client('ws://localhost')
client.connect((err) => {
  client.request('hello', (err, payload) => {   // Can also request '/h'
    if (err) console.log('There was an error connecting') 
  })
})
