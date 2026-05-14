function transactionId() {
  return 'tvskh' + new Date().toISOString().replace(/[-:T.Z]/g, '').slice(2, 14) + String(Math.random()).slice(2, 6);
}

module.exports = { transactionId };
