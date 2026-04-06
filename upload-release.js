const fs = require('fs');
const https = require('https');

const token = process.env.GITHUB_TOKEN;
const repo = 'Alexglv2000/linux-market';
const tag = 'v1.2.3';

async function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body || '{}') }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function uploadFile(uploadUrl, filePath, fileName) {
  const stats = fs.statSync(filePath);
  const options = {
    hostname: 'uploads.github.com',
    path: uploadUrl.replace('https://uploads.github.com', '').split('{')[0] + '?name=' + fileName,
    method: 'POST',
    headers: {
      'Authorization': 'token ' + token,
      'Content-Type': 'application/octet-stream',
      'Content-Length': stats.size,
      'User-Agent': 'NodeJS'
    }
  };
  
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const req = https.request(options, (res) => {
      res.on('end', resolve);
    });
    req.on('error', reject);
    fileStream.pipe(req);
  });
}

async function run() {
  console.log('Creando release...');
  const release = await request({
    hostname: 'api.github.com',
    path: '/repos/' + repo + '/releases',
    method: 'POST',
    headers: { 'Authorization': 'token ' + token, 'User-Agent': 'NodeJS', 'Content-Type': 'application/json' }
  }, JSON.stringify({ tag_name: tag, name: 'v1.2.3 STABLE', body: 'Linux Market POS Professional Release' }));

  if (release.status !== 201) {
     console.error('Error creando release:', release.data);
     if (release.status === 422) console.log('La release ya existe, intentando usar la existente...');
     else return;
  }

  // Obtener la release si ya existe o es nueva
  const latest = await request({
    hostname: 'api.github.com',
    path: '/repos/' + repo + '/releases/tags/' + tag,
    headers: { 'Authorization': 'token ' + token, 'User-Agent': 'NodeJS' }
  });

  const uploadUrl = latest.data.upload_url;
  console.log('Subiendo archivos...');
  await uploadFile(uploadUrl, 'linux-market.deb', 'linux-market.deb');
  console.log('DEB subido.');
  await uploadFile(uploadUrl, 'linux-market.rpm', 'linux-market.rpm');
  console.log('RPM subido.');
  await uploadFile(uploadUrl, 'linux-market.tar.gz', 'linux-market.tar.gz');
  console.log('TAR.GZ subido.');
  console.log('¡Todo listo!');
}

run();
