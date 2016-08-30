module.exports = [
  {
    method: 'GET',
    path: '/ws/meme',
    config: {
      id: 'link',
      handler: (request, reply) => {
        reply('hello')
      }
    }
  }
]
