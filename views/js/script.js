'use strict'

let Nes = require('nes')

let client = new Nes.Client('ws://localhost:1337')
client.connect((err) => {
  if (err) console.log('error creating websocket')
})
