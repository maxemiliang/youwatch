'use strict'

const Hapi = require('hapi')
const server = new Hapi.Server()
const views = require('./routes/index.js')

server.connection({ port: 1337 })
const io = require('socket.io')(server.listener)

let chat = io.of('/ws').on('connection', function (socket) {
  socket.on('join-room', (room) => {
    socket.join(room)
    // chat.to(room).emit('users', { users: chat.sockets.adapter.rooms['my_room'].length })
    console.dir(io.sockets.adapter.rooms)
  })

  socket.on('disconnect', function () {
    chat.emit('user disconnected')
  })
})

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

server.start((err) => {
  if (err) throw err
  console.log('Server running at:' + server.info.uri)
})
