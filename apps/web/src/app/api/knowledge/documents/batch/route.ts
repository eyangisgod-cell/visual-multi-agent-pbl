import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/knowledge/documents/batch - 批量创建知识库文档
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documents, generate_embedding = false } = body;

    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: 'Documents array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // 批量生成 embeddings（如果请求）
    const createdDocuments = [];

    for (const doc of documents) {
      const { title, content, category, tags } = doc;

      if (!title || !content) {
        continue; // 跳过无效文档
      }

      // 生成 embedding（如果请求）
      let embedding: number[] | null = null;
      if (generate_embedding) {
        try {
          const embeddingResponse = await fetch(`${AI_SERVICE_URL}/api/v1/llm/embedding`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: `${title} ${content}` }),
            timeout: 30000,
          });

          if (embeddingResponse.ok) {
            const embeddingData = await embeddingResponse.json();
            embedding = embeddingData.embedding;
          }
        } catch (error) {
          console.warn(`Failed to generate embedding for "${title}":`, error);
          // Continue without embedding for this document
        }
      }

      // 将 embedding 转换为 Float32Array 用于 ByteA 存储
      let embeddingBytes: Uint8Array | null = null;
      if (embedding) {
        const float32Array = new Float32Array(embedding);
        embeddingBytes = new Uint8Array(float32Array.buffer);
      }

      // 创建文档
      const document = await prisma.knowledgeDocument.create({
        data: {
          title,
          content,
          category: category || null,
          tags: tags || [],
          embedding: embeddingBytes,
        },
      });

      createdDocuments.push({
        id: document.id,
        title: document.title,
        content: document.content,
        category: document.category,
        tags: document.tags,
        embedding: embedding || null,
        createdAt: document.createdAt,
      });
    }

    return NextResponse.json(createdDocuments, { status: 201 });
  } catch (error) {
    console.error('Error creating batch documents:', error);
    return NextResponse.json(
      { error: 'Failed to create batch documents' },
      { status: 500 }
    );
  }
}
