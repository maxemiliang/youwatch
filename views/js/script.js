'use strict'

let $ = require('jquery')

let socket = io.connect('http://' + location.host + '/ws')

let room = window.location.pathname.split('/')[2]

const id = document.cookie.split(';')[0].split('=')[1]

socket.on('connect', () => {
  socket.emit('join-room', { roomname: room, uuid: id })
})

socket.on('users', data => {
  $('#users-online').text('users online: ' + data)
})

$('.send').on('click', () => {
  let url = $('.url-input').val()
  if (url !== undefined || url !== '') {
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match && match[2].length == 11) {
      socket.emit('add:video', { roomname: room, uuid: id, video: url })
      $('.url-input').val('')
    } else {
      $('.error-grid').append('<br><div class="cell -12of12 error-url"><div class="alert alert-error">youtube url invalid</div>').children().fadeOut(5000, () => {
        $('.error-grid').children().remove()
      })
    }
  }
})
