// bilibili-comment-reply/scripts/check_mentions.mjs
// B站 @我的评论通知检查脚本 v2

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
      if (trimmed.includes('=')) parts.push(trimmed.split(';')[0].trim());
    }
    return parts.join('; ');
  } catch {
    console.error('❌ Cookie 文件不存在: ' + COOKIE_FILE);
    process.exit(1);
  }
}

function formatTime(ts) {
  if (!ts) return '未知时间';
  const d = new Date(ts * 1000);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  if (diff < 2592000) return Math.floor(diff / 86400) + '天前';
  return d.toLocaleDateString('zh-CN');
}

function truncate(str, len = 60) {
  if (!str) return '(无)';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

async function main() {
  const cookie = await loadCookie();
  console.log('🔍 正在检查 B站 @我的 评论通知...\n');

  const resp = await fetch('https://api.bilibili.com/x/msgfeed/at?ps=20&pn=1', {
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://message.bilibili.com/'
    }
  });

  const data = await resp.json();
  if (data.code !== 0) {
    console.error('❌ API 错误:', data.code, data.message);
    process.exit(1);
  }

  const items = data.data?.items;
  if (!items || items.length === 0) {
    console.log('📭 暂无新的 @通知');
    return;
  }

  console.log(`📬 找到 ${items.length} 条 @通知\n`);
  console.log('─'.repeat(40));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const user = item.user || {};
    const detail = item.item || {};
    const uname = user.nickname || '未知';
    const uid = user.mid || '';
    const biz = detail.business || '未知';
    const title = detail.title || '(无标题)';
    const source = detail.source_content || '';
    const uri = detail.uri || '';
    const time = formatTime(item.at_time);

    // 提取回复所需参数
    const businessId = detail.business_id;  // 1=视频 12=专栏 等
    const subjectId = detail.subject_id;    // 评论所属对象ID (如 aid)
    const rootId = detail.root_id;          // 根评论 rpid
    const targetId = detail.target_id;      // 目标评论 rpid
    const sourceId = detail.source_id;      // 源评论 rpid

    // 回复的 rpid: 优先 target_id，否则 source_id
    const replyRpid = targetId || sourceId;
    // root: 根评论 rpid
    const rootRpid = rootId || replyRpid;

    console.log(`\n[${i + 1}] 👤 ${uname} (UID: ${uid})`);
    console.log(`    ⏰ ${time}`);
    console.log(`    📂 类型: ${biz} (ID: ${businessId})`);
    console.log(`    🎬 内容: ${truncate(title)}`);
    console.log(`    💬 @内容: ${truncate(source, 50)}`);
    console.log(`    🔗 ${truncate(uri, 70)}`);
    console.log(`    📎 subject_id=${subjectId} rpid=${replyRpid} root=${rootRpid}`);
  }

  console.log('\n' + '─'.repeat(40));

  // JSON 输出
  const jsonOutput = items.map((item, i) => ({
    index: i + 1,
    uname: item.user?.nickname || '未知',
    uid: item.user?.mid || '',
    business: item.item?.business || '',
    business_id: item.item?.business_id,
    title: item.item?.title || '',
    source_content: item.item?.source_content || '',
    uri: item.item?.uri || '',
    time: formatTime(item.at_time),
    at_time: item.at_time,
    subject_id: item.item?.subject_id,
    rpid: item.item?.target_id || item.item?.source_id,
    root: item.item?.root_id || item.item?.target_id || item.item?.source_id
  }));
  console.log('\n<!-- JSON_START -->');
  console.log(JSON.stringify(jsonOutput, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
