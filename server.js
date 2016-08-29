'use strict'

const Hapi = require('hapi')
const server = new Hapi.Server()
const joi = require('joi')
const boom = require('boom')
const nes = require('nes')
const views = require('./routes/index.js')
const ws = require('./routes/socket.js')

server.connection({ port: 1337 })

server.register(require('inert'), (err) => {
  if (err) {
    console.log('Failed to load inert.')
  }

  // style.css
  server.route({
    method: 'GET',
    path: '/css/style.css',
    handler: (request, reply) => {
      reply.file('./views/css/style.css')
    }
  })

  // hack.css
  server.route({
    method: 'GET',
    path: '/css/hack.css',
    handler: (request, reply) => {
      reply.file('./node_modules/hack/dist/hack.css')
    }
  })

  // js
  server.route({
    method: 'GET',
    path: '/dist/bundle.js',
    handler: (request, reply) => {
      reply.file('./views/js/dist/bundle.js')
    }
  })
})

server.register(require('vision'), (err) => {
  if (err) {
      console.log('Failed to load vision.')
  }

  server.views({
    engines: { hbs: require('handlebars') },
    path: __dirname + '/views',
    partialsPath: __dirname + '/views/partials'
  })

  server.route(views)
})

server.register(nes, (err) => {
  if (err) {
    console.log('Failed to load nes.')
  }

  server.route(ws)
})

server.start((err) => {
  if (err) throw err
  console.log('Server running at:' + server.info.uri)
})
