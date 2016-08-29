'use strict'

const Hapi = require('hapi')
const server = new Hapi.Server()
const joi = require('joi')
const boom = require('boom')

server.connection({ port: 1337 })

