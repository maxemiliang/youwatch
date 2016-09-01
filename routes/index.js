'use strict'

const Joi = require('joi')
const Boom = require('boom')
const DataStore = require('nedb')
const db = new DataStore({ filename: './chat.db', autoload: true })
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
          request.yar.flash('err', 'username must be min 5 characters and max 30 characters. roomname must be min 5 characters and max 15 characters')
          reply.redirect('/')
        }
      },
      handler: (request, reply) => {
        let hostuuid = uuid.v4()
        let room = {
          creator: request.payload.username,
          host_uuid: hostuuid,
          roomname: request.payload.roomname,
          users: [],
          links: []
        }
        db.find({roomname: request.payload.roomname}, (err, result) => {
          if (err) throw err
          if (result[0] === undefined) {
            db.insert(room, (err, newRoom) => {
              if (err) throw err
              reply.state('data', { uuid: hostuuid }).redirect('/room/' + request.payload.roomname)
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
        },
        failAction: (request, reply, source, error) => {
          request.yar.flash('err', 'username must be min 5 characters and max 30 characters. roomname must be min 5 characters and max 15 characters and must exist')
          reply.redirect('/')
        }
      },
      handler: (request, reply) => {
        db.findOne({roomname: request.params.roomname}, (err, room) => {
          if (err) throw err
          if (room !== null) {
            reply.view('room', {roomname: room.roomname})
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
          request.yar.flash('err', 'username must be min 5 characters and max 30 characters. roomname must be min 5 characters and max 15 characters')
          reply.redirect('/')
        }
      },
      handler: (request, reply) => {
        db.findOne({ roomname: request.payload.roomname }, (err, room) => {
          if (err) throw err
          if (room !== null) {
            let found = room.users.some((el) => {
              return el.name === request.payload.username
            })
            if (!found) {
              let useruuid = uuid.v4()
              db.update({ roomname: room.roomname }, { $push: { users: { name: request.payload.username, uuid: useruuid } } }, {}, (err, updated) => {
                if (err) throw err
                reply.redirect('/room/' + request.payload.roomname).state('data', { uuid: useruuid })
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
