'use strict'

const Hapi = require('hapi')
const server = new Hapi.Server()
const views = require('./routes/index.js')
const DataStore = require('nedb')
const db = new DataStore({ filename: './chat.db', autoload: true })

server.connection({ port: 1337 })
const io = require('socket.io')(server.listener)

let chat = io.of('/ws').on('connection', function (socket) {
  socket.on('join-room', (room) => {
    socket.join(room)
    socket.allRooms = room
    // TODO
    // db.findOne({ roomname: room }, (err, res) => {
    //   if (err) throw err
    //   if (res[0] !== undefined) {
    //     db.update({roomname: room}, { users: res[0].users.push({}) }  
          io.of('/ws').in(room).clients((err, clients) => {
            if (err) throw err
            chat.to(room).emit('users', clients.length)
          })
    //     })
    //   }
    // })
  })

  socket.on('disconnect', function () {
    io.of('/ws').in(socket.allRooms).clients((err, clients) => {
      if (err) throw err
      chat.to(socket.allRooms).emit('users', clients.length)
    })
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
