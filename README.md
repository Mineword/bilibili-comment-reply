# bilibili-comment-reply

B站 @评论监控 + AI回复 技能

## 功能

- 📬 查看 @我的评论通知
- 💬 AI 帮你写回复草稿
- ✍️ 自动回复评论

## 使用方法

1. 配置 Cookie（cookie.txt 写入你的 SESSDATA 和 bili_jct）
2. 运行脚本查看通知：
   ```bash
   node scripts/check_mentions.mjs
   ```
3. 回复评论：
   ```bash
   node scripts/send_reply.mjs <评论ID> <回复内容>
   ```

## 配置 Cookie

登录 B站后，F12 → Application → Cookies → SESSDATA 和 bili_jct

## License

MIT
