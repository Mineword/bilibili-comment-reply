// bilibili-comment-reply/scripts/send_reply.mjs
// B站评论回复发送脚本

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COOKIE_FILE = resolve(__dirname, '..', 'cookie.txt');

async function loadCookie() {
  try {
    const raw = await readFile(COOKIE_FILE, 'utf-8');
    const lines = raw.trim().split(/\r?\n/).filter(Boolean);
    const parts = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('=')) {
        parts.push(trimmed.split(';')[0].trim());
      }
    }
    return parts.join('; ');
  } catch {
    console.error('❌ Cookie 文件不存在: ' + COOKIE_FILE);
    process.exit(1);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--oid') result.oid = args[++i];
    if (args[i] === '--root') result.root = args[++i];
    if (args[i] === '--parent') result.parent = args[++i];
    if (args[i] === '--message') result.message = args[++i];
  }
  return result;
}

async function main() {
  const { oid, root, parent, message } = parseArgs();

  if (!oid || !root || !parent || !message) {
    console.error('用法: node send_reply.mjs --oid <aid> --root <根rpid> --parent <父rpid> --message "内容"');
    console.error('示例: node send_reply.mjs --oid 12345 --root 67890 --parent 67890 --message "谢谢支持"');
    process.exit(1);
  }

  if (message.length > 233) {
    console.error('❌ 回复内容超过233字符限制，当前: ' + message.length + '字符');
    process.exit(1);
  }

  const cookie = await loadCookie();

  console.log('📤 发送评论回复...');
  console.log(`   视频 oid: ${oid}`);
  console.log(`   根评论: ${root}`);
  console.log(`   回复目标: ${parent}`);
  console.log(`   内容: ${message}`);
  console.log();

  const body = new URLSearchParams({
    oid,
    type: '1',
    root,
    parent,
    message,
    plat: '1',
    csrf: cookie.match(/bili_jct=([^;]+)/)?.[1] || ''
  });

  const resp = await fetch('https://api.bilibili.com/x/v2/reply/add', {
    method: 'POST',
    headers: {
      'Cookie': cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.bilibili.com/video/av' + oid,
      'Origin': 'https://www.bilibili.com'
    },
    body: body.toString()
  });

  const data = await resp.json();
  if (data.code === 0 && data.data) {
    console.log('✅ 回复成功！');
    console.log(`   回复 rpid: ${data.data.rpid}`);
  } else {
    console.error('❌ 回复失败:', data.code, data.message);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
