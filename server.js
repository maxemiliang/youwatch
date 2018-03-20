'use strict'

/*

  YouWatch: v0.1.4
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

// for cookies sent between sockets
server.state('data', {
  ttl: null,
  isSecure: false,
  isHttpOnly: false,
  encoding: 'base64json',
  clearInvalid: false,
  strictHeader: false
})

// this is for the flash cookies mainly
var options = {
  storeBlank: false,
  cookieOptions: {
    password: 'this-is-a-really-secure-password-yes-i-agree-hope-its-long-enough', // very secure, yes (In prod please change me!) :P
    isSecure: false,
    isHttpOnly: false
  }
}

let decode = (base64) => {
  return new Buffer(base64, 'base64').toString('ascii')
}

// configure the server to use cookies
server.register({ register: yar, options: options }, (err) => {
  if (err) throw err
})

// create a socket handler at '/ws' namespace
let chat = io.of('/ws').on('connection', function (socket) {
  socket.on('join-room', data => {
    socket.join(data.roomname)
    socket.room = data.roomname
    db.findOne({ roomname: data.roomname }, (err, data) => {
      if (err) throw err
      if (data.urls.length > 0) {
        io.of('/ws').to(socket.id).emit('video:change', {urls: data.urls[0]})
      } else {
        io.of('/ws').to(socket.id).emit('queue:empty')
      }
    });
    io.of('/ws').in(data.roomname).clients((err, clients) => {
      if (err) throw err
      chat.to(data.roomname).emit('users', clients.length)

    })
  })

  socket.on('add:video', data => {
    db.findOne({ roomname: data.roomname }, (err, room) => {
      if (err) throw err
      if (room === null) {
        socket.emit('add:error')
        console.log('room is null')
        return
      }
      console.log(room)
      // let uuid_decoded = new Buffer(data.uuid, 'base64').toString().split(':')[1].slice(0, -1)
      let found = room.urls.some(el => {
        return el === data.video
      })
      // TODO: make this work
      // let isUser = room.users.some(el => {
      //   console.log(el.uuid + ' = ' + uuid_decoded)
      //   return el.uuid === uuid_decoded
      // })
      if (found) {
        socket.emit('add:inque')
        return false
      }
      if (room.urls.length === 0) {
        db.update({ roomname: room.roomname.toLowerCase() }, { $push: { urls: data.video } }, {}, (err, updated) => {
          if (err) throw err
          if (updated === 1) {
            socket.emit('add:success')
            console.log('queue empty emitting new video to all clients')
            socket.emit('video:change', { urls: data.video })
          } else {
            socket.emit('add:error')
          }
        })
      }
      db.update({ roomname: room.roomname.toLowerCase() }, { $push: { urls: data.video } }, {}, (err, updated) => {
        if (err) throw err
        if (updated === 1) {
          socket.emit('add:success')
        } else {
          socket.emit('add:error')
        }
      })
    })
  })

  socket.on('video:paused', (data) => {
    let uuid = decode(data.uuid)
    console.log("pause event",uuid.split('"')[3])
    db.findOne({ roomname: data.roomname.toLowerCase() }, (err, room) => {
      if (err) throw err
      if (room === null) return false
      if (room.host_uuid === uuid.split('"')[3]) {
        console.log("sending pause event")
        chat.to(data.roomname.toLowerCase()).emit('video:pause', data.time)
      }
    })
  })


  socket.on('video:playing', (data) => {
    let uuid = decode(data.uuid)
    console.log("play event",uuid.split('"')[3])
    db.findOne({ roomname: data.roomname.toLowerCase() }, (err, room) => {
      if (err) throw err
      if (room === null) return false
      if (room.host_uuid === uuid.split('"')[3]) {
        console.log("sending play event")
        chat.to(data.roomname.toLowerCase()).emit('video:play', data.time)
      }
    })
  })

  socket.on('video:ended', (data) => {
    let uuid = decode(data.uuid)
    console.log("end event",uuid.split('"')[3])
    db.findOne({ roomname: data.roomname.toLowerCase() }, (err, room) => {
      if (err) throw err
      if (room === null) return false
      if (room.host_uuid === uuid.split('"')[3]) {
        let oldUrls = room.urls
        if (oldUrls.length > 1) {
          oldUrls.shift()
          let newUrls = oldUrls
          console.log(newUrls)
        }
        let newUrls = oldUrls
        db.update({ roomname: data.roomname.toLowerCase() }, { $set: { urls: newUrls } }, {}, (err, updated) => {
          if (err) throw err
          db.findOne({ roomname: data.roomname.toLowerCase() }, (err, data) => {
            if (err) throw err
            if (data.urls.length > 0) {
              chat.to(data.roomname.toLowerCase()).emit('video:change', { urls: data.urls[0] })
            } else {
              chat.to(data.roomname.toLowerCase()).emit('queue:empty')
            }
          })
          console.log("sending end event event")
        })
      }
    })
  })

  socket.on('disconnect', function () {
    io.of('/ws').in(socket.room).clients((err, clients) => {
      if (err) throw err
      chat.to(socket.room).emit('users', clients.length)
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
