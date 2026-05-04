---
name: bilibili-comment-reply
description: |
  B站评论全功能技能：查看@通知、回复评论、发布新评论、AI草拟。
  触发词：B站评论、@我的评论、查看B站通知、回复评论、发评论、bilibili comment
metadata:
  openclaw:
    emoji: "💬"
    requires:
      bins: ["node"]
---

# B站评论全功能技能

监控B站「@我的」评论通知、回复评论、发布新评论，AI帮忙草拟内容。

## 前置要求

| 条件 | 说明 |
|------|------|
| **Cookie** | 需要 B站 `SESSDATA`（登录凭证）和 `bili_jct`（CSRF token） |
| **Cookie文件** | `{SKILL_DIR}/cookie.txt`，每行一个字段 |
| **Node.js** | 18+ |

### cookie.txt 格式（已验证）

```
SESSDATA=xxxx%2C...
bili_jct=xxxxxxxxxxxxxxxxxx
```

### 获取 Cookie

1. Chrome 登录 bilibili.com
2. F12 → Application → Cookies → `https://www.bilibili.com`
3. 复制 `SESSDATA` 和 `bili_jct` 的 Value

## 三大功能

### 1️⃣ check — 查看 @我的通知

```bash
node "{SKILL_DIR}/scripts/check_mentions.mjs"
```

输出：评论者、内容、视频标题、链接、oid/rpid/root 等回复参数。

**流程：** 展示列表 → 询问是否需要回复

### 2️⃣ reply — 回复指定评论

```bash
node "{SKILL_DIR}/scripts/send_reply.mjs" --oid <aid> --root <根rpid> --parent <目标rpid> --message "内容"
```

**流程：** 用户指定回复哪条 → AI草拟1-3个候选 → 用户确认 → 发送

### 3️⃣ post — 发布新评论（一级评论）

直接调用 API（无需 root/parent）：

```bash
node -e "const{readFile}=require('fs/promises');(async()=>{const c=await readFile('{SKILL_DIR}/cookie.txt','utf-8');const p=c.trim().split(/\r?\n/).filter(Boolean).map(l=>l.trim().split(';')[0].trim()).join('; ');const csrf=p.match(/bili_jct=([^;]+)/)?.[1];const body=new URLSearchParams({oid:'<aid>',type:'1',message:'<内容>',plat:'1',csrf});const r=await fetch('https://api.bilibili.com/x/v2/reply/add',{method:'POST',headers:{'Cookie':p,'Content-Type':'application/x-www-form-urlencoded','User-Agent':'Mozilla/5.0','Referer':'https://www.bilibili.com/video/<BV号>','Origin':'https://www.bilibili.com'},body:body.toString()});console.log(JSON.stringify(await r.json(),null,2))})()"
```

**流程：** 用户提供视频链接 → 提取BV号/aid → AI草拟评论 → 用户确认 → 发送

## 参数说明

| 参数 | 含义 |
|------|------|
| `oid` | 视频 aid（AV号） |
| `type` | 1=视频, 12=专栏, 17=动态 |
| `root` | 根评论 rpid（一级评论则 root=rpid） |
| `parent` | 要回复的评论 rpid |
| `csrf` | cookie 中的 bili_jct 值 |
| `plat` | 1=网页 |

## 视频链接 → aid 转换

短链 b23.tv 会重定向到完整链接，从中提取 BV号，再调 API 获取 aid：

```
GET https://api.bilibili.com/x/web-interface/view?bvid=BVxxxxxx
```

## 注意事项

- ⚠️ **发送前必须用户确认**，不可自动发送
- ⚠️ 评论内容不超过 **233 字符**
- ⚠️ Cookie 过期需重新获取
- 🔒 Cookie 仅本地使用，不外传
