var config = {
  secret: '2ee06c48087b66a4',
  cookie_name: 'sid.dlmm'
};

if (process.env.NODE_ENV === 'QAS') {
} else if (process.env.NODE_ENV === 'PRD') {
}

module.exports = config;