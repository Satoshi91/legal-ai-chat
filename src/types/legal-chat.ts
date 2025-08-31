// 実際のAPIに合わせたシンプルな型定義
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 参考文献表示用のメッセージ型
export interface ReferenceUrlMessage {
  id: string;
  role: 'reference_url';
  content: string;  // 表示テキスト
  url: string;      // リンクURL
  timestamp: Date;
}

export interface LegalChatRequest {
  messages: ChatMessage[];
  max_context_docs?: number;
}

export interface ContextDocument {
  document: string;
  similarity_score: number;
  metadata: {
    ArticleNum: number;
    ArticleTitle: string;
    LawID: string;
    LawTitle: string;
    LawType: string;
    filename: string;
    original_text: string;
    revisionID: string;
    updateDate: string;
  };
}

export interface LegalChatResponse {
  user_query: string;
  ai_response: string;
  context_documents: ContextDocument[];
  total_context_docs: number;
}

export interface LegalChatError {
  error: string;
  detail?: string;
  details?: string;
}