var config = {
  cookie: {
    name: 'sid.puny',
    secret: '2ee06c48087b66a4'
  }
};

if (process.env.NODE_ENV === 'QAS') {
} else if (process.env.NODE_ENV === 'PRD') {
}

module.exports = config;