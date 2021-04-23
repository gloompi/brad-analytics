const metrics = Object.freeze({
  CLS: 'CLS',
  LCP: 'LCP',
  FID: 'FID',
});

const thresholds = Object.freeze({
  LCP: [2500, 4000],
  FID: [100, 300],
  CLS: [0.1, 0.25],
});

function p(percentile, values) {
  return values[Math.floor((values.length) * (percentile / 100))];
};

function p75(values) {
  if (values && values.length > 8) {
    return p(75, values);
  }
  return '-'; // Insufficient data
};

function fetchData(metric) {
  return fetch(`/analytics/${metric}`)
    .then(data => data.json())
    .catch(err => console.error(err));
};

function createMessage(val, threshold) {
  const node = document.createElement('span');
  node.style = `padding: 15px 25px; border-radius: 10px; color: #fff; background-color: ${val === '-' ? 'orange' : val < threshold ? 'green' : 'red'}`;
  node.appendChild(document.createTextNode(val.slice(0, 4)));

  const p = document.createElement('p');
  p.appendChild(document.createTextNode('75th percentile value: '));
  p.appendChild(node);
  p.appendChild(document.createTextNode(`threshold is ${threshold}`))

  return p;
}

(function() {
  document.addEventListener('DOMContentLoaded', async () => {
    const clsContainer = document.querySelector('#cls');
    const lcpContainer = document.querySelector('#lcp');
    const fidContainer = document.querySelector('#fid');

    const { data: clsData } = await fetchData(metrics.CLS);
    const { data: lcpData } = await fetchData(metrics.LCP);
    const { data: fidData } = await fetchData(metrics.FID);

    const clsMobile = clsData.filter(({ agent }) => agent === 'mobile');
    const clsDesktop = clsData.filter(({ agent }) => agent !== 'mobile');
    const lcpMobile = lcpData.filter(({ agent }) => agent === 'mobile');
    const lcpDesktop = lcpData.filter(({ agent }) => agent !== 'mobile');
    const fidMobile = fidData.filter(({ agent }) => agent === 'mobile');
    const fidDesktop = fidData.filter(({ agent }) => agent !== 'mobile');

    const clsMobile75thPercentile = p75(clsMobile.sort((a, b) => a.val - b.val).map(({ val }) => val));
    const clsDesktop75thPercentile = p75(clsDesktop.sort((a, b) => a.val - b.val).map(({ val }) => val));
    const lcpMobile75thPercentile = p75(lcpMobile.sort((a, b) => a.val - b.val).map(({ val }) => val));
    const lcpDesktop75thPercentile = p75(lcpDesktop.sort((a, b) => a.val - b.val).map(({ val }) => val));
    const fidMobile75thPercentile = p75(fidMobile.sort((a, b) => a.val - b.val).map(({ val }) => val));
    const fidDesktop75thPercentile = p75(fidDesktop.sort((a, b) => a.val - b.val).map(({ val }) => val));

    [
      { container: clsContainer, desktop: clsDesktop75thPercentile, mobile: clsMobile75thPercentile, threshold: thresholds.CLS[0] },
      { container: lcpContainer, desktop: lcpDesktop75thPercentile, mobile: lcpMobile75thPercentile, threshold: thresholds.LCP[0] },
      { container: fidContainer, desktop: fidDesktop75thPercentile, mobile: fidMobile75thPercentile, threshold: thresholds.FID[0] },
    ].forEach(({ container, desktop, mobile, threshold }) => {
      const desktopMessage = createMessage(desktop, threshold);
      const mobileMessage = createMessage(mobile, threshold);
      const desktopHeader = document.createElement('h3');
      const mobileHeader = document.createElement('h3');
      
      container.appendChild(desktopHeader.appendChild(document.createTextNode('Desktop: ')))
      container.appendChild(desktopMessage);
      container.appendChild(mobileHeader.appendChild(document.createTextNode('Mobile: ')))
      container.appendChild(mobileMessage);
    });
  });
}());
