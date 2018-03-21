'use strict'

const Joi = require('joi')
const Boom = require('boom')
const DataStore = require('nedb')
const db = new DataStore({ filename: './../chat.json', autoload: true })
const uuid = require('uuid')

// Routes

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
      reply.view('index', { err: request.yar.flash('err') })
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
        },
        failAction: (request, reply, source, error) => {
          request.yar.flash('err', error.data.details[0].message)
          reply.redirect('/')
        }
      },
      handler: (request, reply) => {
        let hostuuid = uuid.v4()
        let room = {
          creator: request.payload.username.toLowerCase(),
          host_uuid: hostuuid,
          roomname: request.payload.roomname.toLowerCase(),
          users: [],
          urls: []
        }
        db.find({roomname: request.payload.roomname.toLowerCase()}, (err, result) => {
          if (err) throw err
          if (result[0] === undefined) {
            db.insert(room, (err, newRoom) => {
              if (err) throw err
              reply.redirect('/room/' + request.payload.roomname.toLowerCase()).state('data', { uuid: hostuuid })
            })
          } else {
            request.yar.flash('err', 'roomname already taken!')
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
        },
        failAction: (request, reply, source, error) => {
          request.yar.flash('err', error.data.details[0].message)
          reply.redirect('/')
        }
      },
      handler: (request, reply) => {
        db.findOne({ roomname: request.params.roomname.toLowerCase() }, (err, room) => {
          if (err) throw err
          if (room !== null) {
            reply.view('room', { roomname: room.roomname.toLowerCase() })
          } else {
            request.yar.flash('err', 'Error Joining room')
            reply.redirect('/')
          }
        })
      }
    }
  },

  {
    method: 'POST',
    path: '/room/join',
    config: {
      validate: {
        payload: {
          username: Joi.string().alphanum().min(5).max(30).required(),
          roomname: Joi.string().alphanum().min(5).max(15).required()
        },
        failAction: (request, reply, source, error) => {
          request.yar.flash('err', error.data.details[0].message)
          reply.redirect('/')
        }
      },
      handler: (request, reply) => {
        db.findOne({ roomname: request.payload.roomname.toLowerCase() }, (err, room) => {
          if (err) throw err
          if (room !== null) {
            let found = room.users.some(el => {
              return el.name === request.payload.username.toLowerCase()
            })
            let host_check = (request.payload.username === room.creator)
            if (!found && !host_check) {
              let useruuid = uuid.v4()
              db.update({ roomname: room.roomname.toLowerCase() }, { $push: { users: { name: request.payload.username.toLowerCase(), uuid: useruuid } } }, {}, (err, updated) => {
                if (err) throw err
                reply.redirect('/room/' + request.payload.roomname.toLowerCase()).state('data', { uuid: useruuid })
              })
            } else {
              request.yar.flash('err', 'Username Taken')
              reply.redirect('/')
            }
          } else {
            request.yar.flash('err', 'Room not found')
            reply.redirect('/')
          }
        })
      }
    }
  }
]
