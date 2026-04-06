// 引入所有解码插件（确保它们已转换为 CommonJS）
const PluginCommon = require('./plugin/common.js');
const PluginJjencode = require('./plugin/jjencode.js');
const PluginSojson = require('./plugin/sojson.js');
const PluginSojsonV7 = require('./plugin/sojsonv7.js');
const PluginObfuscator = require('./plugin/obfuscator.js');
const PluginAwsc = require('./plugin/awsc.js');

// 统一解码处理函数
function decode(plugin, code) {
  try {
    const result = plugin(code);
    if (!result) throw new Error('解码失败');
    return { code: 1, msg: 'success', data: result };
  } catch (err) {
    console.error(err);
    return { code: 0, msg: err.message };
  }
}

// 解析 URL 编码参数
function parseUrlEncoded(body) {
  const params = new URLSearchParams(body);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

// 异步解析请求体（支持 JSON 和 URL 编码）
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        if (!body) return resolve({});
        
        const contentType = req.headers['content-type'] || '';
        
        // JSON 格式
        if (contentType.includes('application/json')) {
          resolve(JSON.parse(body));
        }
        // URL 编码格式
        else if (contentType.includes('application/x-www-form-urlencoded')) {
          resolve(parseUrlEncoded(body));
        }
        // 默认尝试 JSON，失败则尝试 URL 编码
        else {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(parseUrlEncoded(body));
          }
        }
      } catch (err) {
        reject(new Error('Invalid request body'));
      }
    });
    req.on('error', reject);
  });
}

// Vercel 函数入口
module.exports = async (req, res) => {
  // 设置 CORS 头（方便测试）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = req.url;

  // 健康检查
  if (url === '/' && req.method === 'GET') {
    res.status(200).json({
      status: 'ok',
      service: 'js-decoder',
      endpoints: [
        '/decode/common', '/decode/jj', '/decode/sojson',
        '/decode/v7', '/decode/Obfuscator', '/decode/awsc'
      ]
    });
    return;
  }

  // 解码接口必须为 POST
  if (req.method !== 'POST') {
    res.status(405).json({ code: 0, msg: 'Method Not Allowed' });
    return;
  }

  // 解析请求体
  let body;
  try {
    body = await parseBody(req);
  } catch {
    res.status(400).json({ code: 0, msg: 'Invalid request body' });
    return;
  }

  const sourceCode = body.code;
  if (!sourceCode || typeof sourceCode !== 'string') {
    res.status(400).json({ code: 0, msg: 'Missing or invalid "code" field' });
    return;
  }

  // 路由分发
  let result;
  switch (url) {
    case '/decode/common':
      result = decode(PluginCommon, sourceCode);
      break;
    case '/decode/jj':
      result = decode(PluginJjencode, sourceCode);
      break;
    case '/decode/sojson':
      result = decode(PluginSojson, sourceCode);
      break;
    case '/decode/v7':
      result = decode(PluginSojsonV7, sourceCode);
      break;
    case '/decode/Obfuscator':
      result = decode(PluginObfuscator, sourceCode);
      break;
    case '/decode/awsc':
      result = decode(PluginAwsc, sourceCode);
      break;
    default:
      res.status(404).json({ code: 0, msg: 'Not Found' });
      return;
  }

  res.status(result.code === 1 ? 200 : 500).json(result);
};
