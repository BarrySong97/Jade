# 下载公司 Logo 脚本

## 📖 使用说明

这个脚本会自动从你的 API 下载所有公司的 Logo 并保存到 `src/assets/experiences/` 目录。

### 🔍 第一步：找到你的 API 域名

从你提供的 JSON 数据来看，图片 URL 格式为：
```
/api/media/file/favicon%20(4).png
```

这是一个相对路径。你需要找到完整的 API 域名，例如：
- `https://api.yourwebsite.com`
- `https://yourwebsite.com`
- `http://localhost:3000`

### 🚀 第二步：运行脚本

```bash
# 使用 pnpm（推荐）
pnpm download-logos https://your-api-domain.com

# 或直接使用 node
node scripts/download-company-logos.js https://your-api-domain.com
```

**示例：**
```bash
# 如果你的 API 在 https://cms.example.com
pnpm download-logos https://cms.example.com

# 如果你的 API 在本地
pnpm download-logos http://localhost:3000
```

### ✅ 脚本会下载的文件

1. `mazo-ai.png` - Mazo AI Logo
2. `signerlabs.png` - Signerlabs Logo
3. `sobey.png` - 成都索贝数码科技股份有限公司 Logo
4. `shenrui.png` - 成都深瑞同华科技有限公司 Logo

### 🔐 如果需要身份验证

如果你的 API 需要身份验证（例如需要 Token），你需要修改脚本添加请求头：

打开 `scripts/download-company-logos.js`，找到 `fetch(fullUrl)` 这一行，修改为：

```javascript
const response = await fetch(fullUrl, {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    // 或其他需要的请求头
  }
});
```

### 🐛 故障排查

如果下载失败，请检查：

1. **API URL 是否正确**
   - 在浏览器中尝试访问：`https://your-api-domain.com/api/media/file/Group%205-1.png`
   - 如果能看到图片，说明 URL 正确

2. **是否需要身份验证**
   - 如果浏览器提示需要登录，说明需要添加认证头（见上文）

3. **CORS 问题**
   - 服务器端脚本通常不会遇到 CORS 问题
   - 如果有问题，可以尝试直接在浏览器下载后手动保存

4. **网络连接**
   - 确保可以访问 API 服务器
   - 如果是本地服务器，确保服务正在运行

### 💡 提示

- 脚本会自动创建 `src/assets/experiences/` 目录（如果不存在）
- 已存在的文件会被覆盖
- 脚本使用 Node.js 内置的 `fetch` API（Node.js 18+ 支持）

