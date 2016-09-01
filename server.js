'use strict'

/*

  YouWatch: v0.1.0
  creator and maintainer: maxemiliang <contact@maxemiliang.me>
  install & run: 'npm install', 'npm start'
  runs by default on: 0.0.0.0:1337

*/

const Hapi = require('hapi')
const server = new Hapi.Server()
const views = require('./routes/index.js')
const DataStore = require('nedb')
const db = new DataStore({ filename: './chat.db', autoload: true })
const yar = require('yar')

server.connection({ port: 1337 })
const io = require('socket.io')(server.listener)

server.state('data', {
  ttl: null,
  isSecure: false,
  isHttpOnly: false,
  encoding: 'base64json',
  clearInvalid: false,
  strictHeader: false
})

var options = {
  storeBlank: false,
  cookieOptions: {
    password: 'this-is-a-really-secure-password-yes-i-agree-hope-its-long-enough', // very secure, yes (In prod please change me!) :P
    isSecure: false,
    isHttpOnly: false
  }
}


// configure the server to use cookies
server.register({ register: yar, options: options }, (err) => { 
  if (err) throw err
})

// create a socket handler at '/ws' namespace
let chat = io.of('/ws').on('connection', function (socket) {
  socket.on('join-room', data => {
    socket.join(data.roomname)
    io.of('/ws').in(data.roomname).clients((err, clients) => {
      if (err) throw err
      chat.to(data.roomname).emit('users', clients.length)
    })
  })

  socket.on('add:video', data => {
    console.log(data)
  })

  socket.on('disconnect', function () {
    io.of('/ws.uuid').in(socket.allRooms).clients((err, clients) => {
      if (err) throw err
      chat.to(socket.allRooms).emit('users', clients.length)
    })
  })
})

// serving static content
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

// serving handlebar templates
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

// starting the hapi server
server.start((err) => {
  if (err) throw err
  console.log('Server running at:' + server.info.uri)
})
