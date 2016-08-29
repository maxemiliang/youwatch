module.exports = [
  {
    method: 'GET',
    path: '/ws/meme',
    config: {
      id: 'meme',
      handler: (request, reply) => {
        reply('hello')
      }
    }
  }
]
