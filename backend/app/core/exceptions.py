class DocumentProcessingError(Exception):
    """文档处理过程中发生的错误"""
    pass


class EmbeddingError(Exception):
    """文本嵌入生成过程中发生的错误"""
    pass


class VectorDBError(Exception):
    """向量数据库操作过程中发生的错误"""
    pass


class LLMError(Exception):
    """LLM调用过程中发生的错误"""
    pass
