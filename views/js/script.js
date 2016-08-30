'use strict'

let $ = require('jquery')

let socket = io.connect('http://localhost:1337/ws')

let room = window.location.pathname.split('/')[2]

socket.on('connect', () => {
  socket.emit('join-room', room)
})

socket.on('users', (data) => {
  console.log(data)
})
