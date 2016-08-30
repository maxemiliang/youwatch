'use strict'

const Joi = require('joi')
const Boom = require('boom')
const DataStore = require('nedb')
const db = new DataStore({ filename: './chat.db', autoload: true })

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
      reply.view('index')
    }
  },

  {
    method: 'POST',
    path: '/room/create',
    config: {
      validate: {
        payload: {
          username: Joi.string().alphanum().min(5).max(30).required(),
          roomname: Joi.string().alphanum().min(5).max(15).required()
        }
      },
      handler: (request, reply) => {
        let room = {
          creator: request.payload.username,
          roomname: request.payload.roomname,
          users: [],
          links: []
        }
        db.find({roomname: request.payload.roomname}, (err, result) => {
          if (err) throw err
          if (result[0] === undefined) {
            db.insert(room, (err, newRoom) => {
              if (err) throw err
              reply.redirect('/room/' + request.payload.roomname)
            })
          } else {
            reply.redirect('/')
          }
        })
      }
    }
  },

  {
    method: 'GET',
    path: '/room/{roomname}',
    config: {
      validate: {
        params: {
          roomname: Joi.string().alphanum().min(5).max(15).required()
        }
      },
      handler: (request, reply) => {
        db.findOne({roomname: request.params.roomname}, (err, room) => {
          if (err) throw err
          if (room !== null) {
            reply.view('room', {roomname: room.roomname})
          } else {
            reply.redirect('/')
          }
        })
      }
    }
  },

  {
    method: 'POST',
    path: '/room/join',
    handler: (request, reply) => {
      reply.redirect('/room/' + request.payload.roomname)
    }
  }
]
