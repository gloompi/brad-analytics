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

(function() {
  document.addEventListener('DOMContentLoaded', async () => {
    const clsContainer = document.querySelector('#cls');
    const lcpContainer = document.querySelector('#lcp');
    const fidContainer = document.querySelector('#fid');

    const { data: clsData } = await fetchData(metrics.CLS);
    const { data: lcpData } = await fetchData(metrics.LCP);
    const { data: fidData } = await fetchData(metrics.FID);
    
    const cls75thPercentile = p75(clsData.sort((a, b) => a.val - b.val).map(({ val }) => val));
    const lcp75thPercentile = p75(lcpData.sort((a, b) => a.val - b.val).map(({ val }) => val));
    const fid75thPercentile = p75(fidData.sort((a, b) => a.val - b.val).map(({ val }) => val));

    [
      { container: clsContainer, val: cls75thPercentile, threshold: thresholds.CLS[0] },
      { container: lcpContainer, val: lcp75thPercentile, threshold: thresholds.LCP[0] },
      { container: fidContainer, val: fid75thPercentile, threshold: thresholds.FID[0] },
    ].forEach(({ container, val, threshold }) => {
      const node = document.createElement('span');
      node.style = `padding: 15px 25px; border-radius: 10px; color: #fff; background-color: ${val < threshold ? 'green' : 'red'}`;
      node.appendChild(document.createTextNode(val));
      container.appendChild(document.createTextNode('75th percentile value: '));
      container.appendChild(node);
      container.appendChild(document.createTextNode(`threshold is ${threshold}`));
    });
  });
}());
