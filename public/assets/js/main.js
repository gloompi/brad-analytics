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

function getDistributedData(data) {
  const mobileData = data.filter(({ agent }) => agent === 'mobile');
  const desktopData = data.filter(({ agent }) => agent !== 'mobile');
  const mobile75P = p75(mobileData.sort((a, b) => a.val - b.val).map(({ val }) => val));
  const desktop75P = p75(desktopData.sort((a, b) => a.val - b.val).map(({ val }) => val));

  return { mobile75P, desktop75P };
}

function originSummary({ clsData, lcpData, fidData }) {
  const clsContainer = document.querySelector('#cls');
  const lcpContainer = document.querySelector('#lcp');
  const fidContainer = document.querySelector('#fid');

  const cls = getDistributedData(clsData);
  const lcp = getDistributedData(lcpData);
  const fid = getDistributedData(fidData);

  // Origin summary
  [
    { container: clsContainer, data: cls, threshold: thresholds.CLS[0] },
    { container: lcpContainer, data: lcp, threshold: thresholds.LCP[0] },
    { container: fidContainer, data: fid, threshold: thresholds.FID[0] },
  ].forEach(({ container, data, threshold }) => {
    const desktopMessage = createMessage(data.desktop75P, threshold);
    const mobileMessage = createMessage(data.mobile75P, threshold);
    const desktopHeader = document.createElement('h3');
    const mobileHeader = document.createElement('h3');
    
    container.appendChild(desktopHeader.appendChild(document.createTextNode('Desktop: ')))
    container.appendChild(desktopMessage);
    container.appendChild(mobileHeader.appendChild(document.createTextNode('Mobile: ')))
    container.appendChild(mobileMessage);
  });
};

function pagesSummary({ clsData, fidData, lcpData }) {
  const container = document.querySelector('#pagesContainer');

  const pages = [
    { data: clsData, name: 'CLS' },
    { data: fidData, name: 'FID' },
    { data: lcpData, name: 'LCP' },
  ].reduce((acc, { data, name }) => {
    data.forEach((metric) => {
      if (acc[metric.url]) {
        if (acc[metric.url][name]) {
          acc[metric.url][name].push(metric);
        } else {
          acc[metric.url][name] = [metric];
        }
      } else {
        acc[metric.url] = {};
        acc[metric.url][name] = [metric]
      }
    });

    return acc;
  }, {});

  Object.entries(pages).forEach(([name, { CLS = [], LCP = [], FID = [] }]) => {
    const liElem = document.createElement('li');
    const h2 = document.createElement('h2');

    const cls = getDistributedData(CLS);
    const lcp = getDistributedData(LCP);
    const fid = getDistributedData(FID);
    
    h2.appendChild(document.createTextNode(name));
    liElem.appendChild(h2);
    liElem.classList.add('metrics__item');

    [
      { name: 'CLS', data: cls, threshold: thresholds.CLS[0] },
      { name: 'LCP', data: lcp, threshold: thresholds.LCP[0] },
      { name: 'FID', data: fid, threshold: thresholds.FID[0] },
    ].forEach(({ name, data, threshold }) => {
      const metricTitle = document.createElement('strong');
      const desktopMessage = createMessage(data.desktop75P, threshold);
      const mobileMessage = createMessage(data.mobile75P, threshold);
      const desktopHeader = document.createElement('h3');
      const mobileHeader = document.createElement('h3');
      const br = document.createElement('br');
      
      liElem.appendChild(metricTitle.appendChild(document.createTextNode(name)));
      liElem.appendChild(br);
      liElem.appendChild(desktopHeader.appendChild(document.createTextNode('Desktop: ')));
      liElem.appendChild(desktopMessage);
      liElem.appendChild(mobileHeader.appendChild(document.createTextNode('Mobile: ')));
      liElem.appendChild(mobileMessage);
    });

    container.appendChild(liElem);
  });
};

(function() {
  document.addEventListener('DOMContentLoaded', async () => {
    const { data: clsData } = await fetchData(metrics.CLS);
    const { data: lcpData } = await fetchData(metrics.LCP);
    const { data: fidData } = await fetchData(metrics.FID);

    originSummary({ clsData, lcpData, fidData });
    // pagesSummary({ clsData, lcpData, fidData });
  });
}());
