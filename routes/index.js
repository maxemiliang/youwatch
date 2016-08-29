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
    path: '/create/room',
    handler: (reply, request) => {
      reply('hello')
    }
  }
]
