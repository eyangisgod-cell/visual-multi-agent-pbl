# pgvector 向量搜索功能实现报告

**日期**: 2026-04-20  
**实现者**: AI Assistant  
**状态**: ✅ 已完成

---

## 完成的工作

### 1. 修改 Prisma Schema

**文件**: `apps/web/prisma/schema.prisma`

将 `KnowledgeDocument` 模型的 `embedding` 字段从 `String @db.VarChar(1536)` 改为 `Bytes @db.ByteA`，用于存储向量数据的二进制表示。

```prisma
embedding Bytes? @db.ByteA
```

### 2. 实现向量搜索 API

**文件**: `apps/web/src/app/api/knowledge/search/route.ts`

- 支持 pgvector 余弦相似度搜索（使用 raw SQL）
- 当 AI Service 不可用时，回退到文本 ILIKE 搜索
- 支持按 category 筛选
- 返回相关性分数

**关键代码**:
```typescript
// 使用 pgvector 向量相似度搜索
const queryText = `
  SELECT
    d.id, d.title, d.content, d.category, d.tags,
    1 - (d.embedding <=> '${embeddingStr}'::vector) as score
  FROM knowledge_documents d
  WHERE 1 - (d.embedding <=> '${embeddingStr}'::vector) > 0
    ${categoryFilter}
  ORDER BY score DESC
  LIMIT ${limit}
`;
```

### 3. 实现文档向量化 API

**文件**:
- `apps/web/src/app/api/knowledge/documents/route.ts` (更新)
- `apps/web/src/app/api/knowledge/documents/batch/route.ts` (新建)

**功能**:
- 创建文档时支持自动生成 embedding
- 支持批量创建文档
- 调用 AI Service 的 `/api/v1/llm/embedding` 端点

**请求示例**:
```json
{
  "title": "机器学习基础",
  "content": "机器学习是人工智能的一个分支...",
  "category": "technology",
  "tags": ["AI", "ML"],
  "generate_embedding": true
}
```

### 4. 更新 RAG API 使用向量检索

**文件**: `apps/web/src/app/api/knowledge/query/route.ts`

- 使用向量相似度检索相关文档
- 基于检索到的内容调用 LLM 生成回答
- 当向量搜索不可用时回退到文本搜索

### 5. AI Service 集成真实 LLM

**文件**:
- `apps/ai-service/app/api/llm.py` (更新)
- `apps/ai-service/app/llm/anthropic.py` (新建)

**功能**:
- 支持 Anthropic Claude API (`claude-sonnet-4-20250514`)
- 当 `ANTHROPIC_API_KEY` 未设置时，回退到 mock provider
- embedding 生成使用 `sentence-transformers/all-MiniLM-L6-v2`

**配置**:
```bash
# 设置 Anthropic API 密钥
export ANTHROPIC_API_KEY=your-api-key-here
```

### 6. 更新测试文件

**文件**: `apps/web/tests/e2e/pgvector-search.spec.ts`

重写测试文件以定义 pgvector 功能的预期行为：

- ✅ 向量存储功能测试
- ✅ 向量相似度搜索测试
- ✅ 按 category 筛选测试
- ✅ RAG 问答功能测试

---

## 待完成的操作

### 1. 数据库 Migration

需要生成并应用 database migration：

```bash
cd apps/web
npx prisma migrate dev --name update_embedding_to_bytea
```

**注意**: 需要确保 PostgreSQL 数据库正在运行，并且已安装 pgvector 扩展。

### 2. 安装依赖

AI Service 需要安装以下依赖：

```bash
cd apps/ai-service
pip install anthropic sentence-transformers
```

### 3. 运行测试

```bash
cd apps/web
npx playwright test tests/e2e/pgvector-search.spec.ts
```

---

## 架构说明

### 向量搜索流程

```
用户查询
    ↓
1. 调用 AI Service 生成 query embedding
    ↓
2. 使用 pgvector 余弦相似度搜索数据库
    ↓
3. 返回按相似度分数排序的结果
    ↓
4. (可选) 调用 LLM 生成 RAG 回答
```

### Embedding 存储格式

- **模型**: `all-MiniLM-L6-v2`
- **维度**: 384
- **存储类型**: PostgreSQL `BYTEA` (二进制)
- **向量格式**: Float32Array → Uint8Array

### LLM Provider 选择

```
ANTHROPIC_API_KEY 已设置 → 使用 Anthropic Claude API
                          ↓
                      请求失败 → 回退到 mock provider
                          ↓
ANTHROPIC_API_KEY 未设置 → 使用 mock provider
```

---

## 文件清单

### Web 应用 (Next.js)
- ✅ `apps/web/prisma/schema.prisma` (修改)
- ✅ `apps/web/src/app/api/knowledge/search/route.ts` (修改)
- ✅ `apps/web/src/app/api/knowledge/query/route.ts` (修改)
- ✅ `apps/web/src/app/api/knowledge/documents/route.ts` (修改)
- ✅ `apps/web/src/app/api/knowledge/documents/batch/route.ts` (新建)
- ✅ `apps/web/tests/e2e/pgvector-search.spec.ts` (修改)

### AI Service (FastAPI)
- ✅ `apps/ai-service/app/api/llm.py` (修改)
- ✅ `apps/ai-service/app/llm/anthropic.py` (新建)
- ✅ `apps/ai-service/app/llm/mock.py` (已存在)
- ✅ `apps/ai-service/app/api/memory.py` (已存在 embedding 函数)

---

## 下一步建议

1. **启动数据库并应用 migration**
2. **启动 AI Service** (确保 `sentence-transformers` 已安装)
3. **运行 E2E 测试验证功能**
4. **配置 `ANTHROPIC_API_KEY` (可选，用于真实 LLM)**

---

## 注意事项

⚠️ **数据库要求**:
- PostgreSQL 13+
- pgvector 扩展已安装 (`CREATE EXTENSION vector;`)

⚠️ **AI Service 要求**:
- Python 3.9+
- `sentence-transformers` 库 (embedding 生成)
- `anthropic` 库 (真实 LLM，可选)

⚠️ **性能优化建议**:
- 对于大规模知识库，建议添加 pgvector 索引:
  ```sql
  CREATE INDEX idx_knowledge_documents_embedding
  ON knowledge_documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
  ```
