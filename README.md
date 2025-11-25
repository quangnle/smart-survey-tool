# Smart Survey Builder

Công cụ xây dựng khảo sát thông minh với logic phân nhánh (branching logic).

## ✨ Tính năng

- ✅ Tạo và quản lý câu hỏi
- ✅ Hỗ trợ node thông báo (info nodes)
- ✅ Liên kết câu hỏi với logic phân nhánh
- ✅ Kéo thả để sắp xếp câu hỏi và câu trả lời
- ✅ Xem trước survey (preview)
- ✅ Visualize flow chart với D3.js
- ✅ Export/Import survey dạng JSON
- ✅ UI hiện đại với Tailwind CSS

## 🚀 Cách sử dụng

### Chạy local

#### Cách 1: VS Code Live Server
1. Cài extension "Live Server" trong VS Code
2. Click chuột phải vào `index.html` → "Open with Live Server"

#### Cách 2: Node.js
```bash
# Dùng npx (không cần cài đặt)
npx http-server -p 8000 -o

# Hoặc dùng server.js
node server.js
```

#### Cách 3: Python
```bash
python -m http.server 8000
```

Sau đó mở browser: `http://localhost:8000`

### Deploy lên GitHub Pages

1. **Push code lên GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/username/smart-survey-tool.git
   git push -u origin main
   ```

2. **Bật GitHub Pages:**
   - Vào repository trên GitHub
   - Settings → Pages
   - Source: chọn branch `main` và folder `/ (root)`
   - Click Save

3. **Truy cập:**
   - URL sẽ là: `https://username.github.io/smart-survey-tool/`

## 📁 Cấu trúc project

```
smart-survey-tool/
├── index.html              # Main HTML file
├── js/
│   ├── main.js            # Entry point
│   ├── config/            # Configuration
│   ├── state/             # State management
│   ├── models/            # Data models
│   ├── ui/                # UI components
│   ├── features/          # Features (survey, chart, drag-drop)
│   └── services/          # Services (file I/O, linking)
├── server.js               # Development server
└── package.json           # Node.js config
```

## 🛠️ Công nghệ sử dụng

- **HTML5** - Structure
- **Tailwind CSS** - Styling (via CDN)
- **Vanilla JavaScript** - ES6 Modules
- **D3.js** - Chart visualization

## 📝 License

MIT License

