'use strict'

let YouTubePlayer = require('youtube-player')

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

socket.on('add:error', () => {
  $('.error-grid').append('<br><div class="cell -12of12 error-url"><div class="alert alert-error">youtube video already in queue</div>').children().fadeOut(5000, () => {
    $('.error-grid').children().remove()
  })
})

socket.on('add:success', () => {
  $('.error-grid').append('<br><div class="cell -12of12 error-url"><div class="alert alert-success">youtube video added to queue</div>').children().fadeOut(5000, () => {
    $('.error-grid').children().remove()
  })
})

$('.send').on('click', () => {
  let url = $('.url-input').val()
  if (url !== undefined || url !== '') {
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
    var match = url.match(regExp)
    if (match && match[2].length === 11) {
      socket.emit('add:video', { roomname: room, uuid: id, video: url })
      $('.url-input').val('')
    } else {
      $('.error-grid').append('<br><div class="cell -12of12 error-url"><div class="alert alert-error">youtube url invalid</div>').children().fadeOut(5000, () => {
        $('.error-grid').children().remove()
      })
    }
  }
})


// TODO: Fix youtube player
let player = YouTubePlayer('player', {
    height: '390',
    width: '100%',
    videoId: '_Z1Krfww5eE'
})

player.on('stateChange', (e) => {
  let currentTime = e.target.getCurrentTime()
  if (e.data === 0) { // ended
    socket.emit('video:ended', { roomname: room, uuid: id })
  } else if (e.data === 1) { // playing
    socket.emit('video:playing', { roomname: room, uuid: id, time: currentTime })
  } else if (e.data === 2) { // paused
    socket.emit('video:paused', { roomname: room, uuid: id, time: currentTime })
  }
})


socket.on('video:pause', time => {
  player.pauseVideo().then((e) => {
    e.seekTo(time, true)
  })
})

socket.on('video:play', time => {
  player.playVideo().then((e) => {
    // playing
  })
})

socket.on('video:change', (data) => {
  console.log(data)
})
