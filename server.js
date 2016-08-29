'use strict'

const Hapi = require('hapi')
const server = new Hapi.Server()
const joi = require('joi')
const boom = require('boom')
const nes = require('nes')

server.connection({ port: 1337 })


server.register(require('vision'), (err) => {
  if (err) {
      console.log('Failed to load vision.')
  }
  server.views({
    engines: { html: require('handlebars') },
    path: __dirname + '/views'
  })
})

server.start((err) => {
  if (err) throw err
  console.log('Server running at:' + server.info.uri)
})
