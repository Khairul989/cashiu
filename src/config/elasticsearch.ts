import env from '#start/env'

export default {
  node: env.get('ELASTICSEARCH_URL', 'http://localhost:9200'),
  requestTimeout: 30000, // in milliseconds
}
