'use strict'

let $ = require('jquery')

let socket = io.connect('http://' + location.host + '/ws')

let room = window.location.pathname.split('/')[2]

socket.on('connect', () => {
  socket.emit('join-room', room)
})

socket.on('users', (data) => {
  $('#users-online').text('users online: ' + data)
})
