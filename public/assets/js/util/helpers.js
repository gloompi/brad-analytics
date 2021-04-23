function p(percentile, values) {
  return values[Math.floor((values.length) * (percentile / 100))];
}

function p75(values) {
  if (values && values.length > 8) {
    return p(75, values);
  }
  return '-'; // Insufficient data
}

module.exports = {
  p,
  p75,
};
