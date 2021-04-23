const isMobile = {
  Android: function(agent) {
      return agent.match(/Android/i);
  },
  BlackBerry: function(agent) {
      return agent.match(/BlackBerry/i);
  },
  iOS: function(agent) {
      return agent.match(/iPhone|iPad|iPod/i);
  },
  Opera: function(agent) {
      return agent.match(/Opera Mini/i);
  },
  Windows: function(agent) {
      return agent.match(/IEMobile/i) || agent.match(/WPDesktop/i);
  },
  any: function(agent) {
      return (isMobile.Android(agent) || isMobile.BlackBerry(agent) || isMobile.iOS(agent) || isMobile.Opera(agent) || isMobile.Windows(agent));
  }
};

module.exports = { isMobile };
