## 1. 架构设计

```mermaid
graph TB
    subgraph Frontend["前端层"]
        React["React + TypeScript"]
        Tailwind["TailwindCSS"]
        WSClient["WebSocket Client"]
    end

    subgraph Backend["后端层 FastAPI"]
        API["REST API"]
        WS["WebSocket Server"]
        Auth["认证模块"]
        Chat["聊天服务"]
        RAG["RAG 检索服务"]
    end

    subgraph Data["数据层"]
        SQLite["SQLite 数据库"]
        VectorDB["ChromaDB 向量数据库"]
        Embedding["Embedding 模型"]
    end

    subgraph External["外部服务"]
        LLM["LLM API（DeepSeek/OpenAI 兼容）"]
    end

    React --> API
    React --> WSClient
    WSClient <--> WS
    API --> Auth
    API --> Chat
    API --> RAG
    Auth --> SQLite
    Chat --> SQLite
    WS --> Chat
    RAG --> VectorDB
    RAG --> Embedding
    RAG --> LLM
```

## 2. 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 + TypeScript | 组件化开发，类型安全 |
| 样式方案 | TailwindCSS 3 | 原子化 CSS，快速构建界面 |
| 构建工具 | Vite 5 | 极速 HMR 开发体验 |
| 后端框架 | Python FastAPI | 异步高性能，原生 WebSocket 支持 |
| 实时通信 | WebSocket | 聊天室消息实时推送 |
| ORM | SQLAlchemy + aiosqlite | 异步数据库操作 |
| 数据库 | SQLite | 轻量级，无需额外部署 |
| 向量数据库 | ChromaDB | 嵌入式向量存储，适合 RAG |
| Embedding | sentence-transformers | 本地文本向量化 |
| LLM | DeepSeek API（OpenAI 兼容） | 免费额度，中文能力强 |
| AI 框架 | LangChain | RAG 链路编排 |

## 3. 路由定义

| 路由 | 页面 | 说明 |
|------|------|------|
| `/login` | 登录页 | 用户名输入，进入系统 |
| `/` | 首页 | 聊天室列表 + 侧边导航 |
| `/chat/:roomId` | 聊天室 | 用户间群聊 |
| `/ai` | AI 助手 | 与 AI 对话 + RAG |
| `/knowledge` | 知识库 | 文档上传与管理 |

## 4. API 定义

### 4.1 REST API

```typescript
// 用户
POST   /api/auth/login        // { username: string } → { token: string, user: User }
GET    /api/auth/me           // → { user: User }

// 聊天室
GET    /api/rooms             // → { rooms: Room[] }
POST   /api/rooms             // { name: string } → { room: Room }
POST   /api/rooms/join        // { room_id: number } → { room: Room }
GET    /api/rooms/:id/messages // → { messages: Message[] }

// AI 对话
POST   /api/ai/chat           // { message: string, knowledge_ids?: number[] } → SSE Stream
GET    /api/ai/history        // → { conversations: Conversation[] }

// 知识库
POST   /api/knowledge/upload  // FormData { file: File } → { document: Document }
GET    /api/knowledge/documents // → { documents: Document[] }
DELETE /api/knowledge/:id     // → { success: boolean }
```

### 4.2 WebSocket 协议

```typescript
// 客户端 → 服务端
type ClientMessage =
  | { type: "join_room"; room_id: number; username: string }
  | { type: "leave_room"; room_id: number }
  | { type: "chat_message"; room_id: number; content: string }

// 服务端 → 客户端
type ServerMessage =
  | { type: "user_joined"; username: string; users: string[] }
  | { type: "user_left"; username: string; users: string[] }
  | { type: "new_message"; id: number; username: string; content: string; created_at: string }
  | { type: "error"; message: string }
```

## 5. 服务端架构

```mermaid
graph TB
    subgraph API["API 层"]
        AuthRouter["Auth Router"]
        RoomRouter["Room Router"]
        AIRouter["AI Router"]
        KnowledgeRouter["Knowledge Router"]
        WSRouter["WebSocket Router"]
    end

    subgraph Service["服务层"]
        AuthService["AuthService"]
        ChatService["ChatService"]
        AIService["AIService"]
        RAGService["RAGService"]
    end

    subgraph Repo["数据访问层"]
        UserRepo["UserRepo"]
        RoomRepo["RoomRepo"]
        MessageRepo["MessageRepo"]
        DocumentRepo["DocumentRepo"]
    end

    AuthRouter --> AuthService
    RoomRouter --> ChatService
    WSRouter --> ChatService
    AIRouter --> AIService
    KnowledgeRouter --> RAGService
    AIService --> RAGService

    AuthService --> UserRepo
    ChatService --> RoomRepo
    ChatService --> MessageRepo
    RAGService --> DocumentRepo
```

## 6. 数据模型

### 6.1 ER 图

```mermaid
erDiagram
    User {
        int id PK
        string username UK
        string token
        datetime created_at
    }

    Room {
        int id PK
        string name
        int created_by FK
        datetime created_at
    }

    Message {
        int id PK
        int room_id FK
        int user_id FK
        string content
        datetime created_at
    }

    RoomMember {
        int id PK
        int room_id FK
        int user_id FK
        datetime joined_at
    }

    Document {
        int id PK
        int user_id FK
        string filename
        string filepath
        int chunk_count
        datetime created_at
    }

    User ||--o{ Message : sends
    User ||--o{ RoomMember : belongs
    User ||--o{ Document : uploads
    Room ||--o{ Message : contains
    Room ||--o{ RoomMember : has
```

### 6.2 DDL

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    token TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE room_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    chunk_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 7. 项目目录结构

```
ChatHome/
├── frontend/                    # React 前端
│   ├── src/
│   │   ├── components/          # 通用组件
│   │   ├── pages/               # 页面组件
│   │   ├── hooks/               # 自定义 Hooks
│   │   ├── services/            # API 调用
│   │   ├── store/               # 状态管理
│   │   ├── types/               # TypeScript 类型
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
├── backend/                     # Python 后端
│   ├── app/
│   │   ├── api/                 # 路由层
│   │   ├── services/            # 业务服务
│   │   ├── models/              # 数据模型
│   │   ├── core/                # 核心配置
│   │   └── main.py
│   ├── data/                    # 数据文件（SQLite, ChromaDB）
│   ├── uploads/                 # 上传文档
│   ├── requirements.txt
│   └── .env
└── .trae/
    └── documents/
```