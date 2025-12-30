"""
PDF text extraction and text cleaning utilities.
"""
import re
from typing import List
from pathlib import Path
import pypdf


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF file.
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        Extracted text as a string
        
    Raises:
        Exception: If PDF reading fails
    """
    try:
        print(f"[EXTRACT] Opening PDF: {file_path}")
        text_content = []
        with open(file_path, 'rb') as file:
            pdf_reader = pypdf.PdfReader(file)
            page_count = len(pdf_reader.pages)
            print(f"[EXTRACT] PDF has {page_count} pages")
            
            for i, page in enumerate(pdf_reader.pages):
                print(f"[EXTRACT] Reading page {i+1}/{page_count}...")
                text = page.extract_text()
                if text:
                    text_content.append(text)
                    print(f"[EXTRACT] Page {i+1}: extracted {len(text)} characters")
        
        full_text = "\n".join(text_content)
        print(f"[EXTRACT] Total extracted: {len(full_text)} characters")
        return full_text
    except Exception as e:
        print(f"[EXTRACT] ERROR: {str(e)}")
        raise Exception(f"Failed to extract text from PDF: {str(e)}")


def clean_text(text: str) -> str:
    """
    Clean extracted text by removing excessive whitespace.
    
    Args:
        text: Raw extracted text
        
    Returns:
        Cleaned text with normalized whitespace
    """
    # Remove excessive newlines (more than 2 consecutive)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove excessive spaces (more than 2 consecutive)
    text = re.sub(r' {3,}', ' ', text)
    
    # Remove tabs and replace with spaces
    text = text.replace('\t', ' ')
    
    # Strip leading/trailing whitespace from each line
    lines = [line.strip() for line in text.split('\n')]
    
    # Remove empty lines
    lines = [line for line in lines if line]
    
    return '\n'.join(lines)


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    """
    Split text into chunks while preserving sentence boundaries where possible.
    
    Args:
        text: Text to chunk
        chunk_size: Target chunk size in characters (default: 800)
        overlap: Overlap between chunks in characters (default: 100)
        
    Returns:
        List of text chunks
    """
    print(f"[CHUNK] Starting chunking: {len(text)} chars, chunk_size={chunk_size}, overlap={overlap}")
    
    if len(text) <= chunk_size:
        print(f"[CHUNK] Text is small, returning as single chunk")
        return [text]
    
    chunks = []
    start = 0
    text_length = len(text)
    max_iterations = 10000  # Safety limit
    iteration = 0
    
    while start < text_length and iteration < max_iterations:
        iteration += 1
        
        # Calculate end position
        end = min(start + chunk_size, text_length)
        
        if end >= text_length:
            # Last chunk
            chunk = text[start:].strip()
            if chunk:
                chunks.append(chunk)
            print(f"[CHUNK] Chunk {len(chunks)}: last chunk, {len(chunk)} chars")
            break
        
        # Try to find sentence boundary near the end
        sentence_endings = ['. ', '.\n', '! ', '!\n', '? ', '?\n']
        
        best_split = end
        for ending in sentence_endings:
            pos = text.rfind(ending, start, end)
            if pos != -1 and pos > start:
                best_split = pos + len(ending)
                break
        
        # If no sentence boundary found, try to break at word boundary
        if best_split == end:
            space_pos = text.rfind(' ', start + int(chunk_size * 0.5), end)
            newline_pos = text.rfind('\n', start + int(chunk_size * 0.5), end)
            
            if space_pos > start:
                best_split = space_pos + 1
            elif newline_pos > start:
                best_split = newline_pos + 1
        
        # Extract chunk
        chunk = text[start:best_split].strip()
        if chunk:
            chunks.append(chunk)
        
        # Calculate next start position - ensure we always advance
        next_start = best_split - overlap
        if next_start <= start:
            next_start = start + max(1, chunk_size // 2)  # Force advance
        start = next_start
        
        if iteration % 10 == 0:
            print(f"[CHUNK] Progress: {len(chunks)} chunks, position {start}/{text_length}")
    
    print(f"[CHUNK] Completed: {len(chunks)} chunks created")
    return chunks


def extract_and_chunk_pdf(file_path: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    """
    Extract text from PDF, clean it, and chunk it.
    
    Args:
        file_path: Path to the PDF file
        chunk_size: Target chunk size in characters
        overlap: Overlap between chunks in characters
        
    Returns:
        List of text chunks
    """
    print(f"[EXTRACT] Starting extraction for: {file_path}")
    
    # Extract text
    raw_text = extract_text_from_pdf(file_path)
    
    print(f"[EXTRACT] Cleaning text...")
    # Clean text
    cleaned_text = clean_text(raw_text)
    print(f"[EXTRACT] Cleaned text: {len(cleaned_text)} characters")
    
    print(f"[EXTRACT] Chunking text...")
    # Chunk text
    chunks = chunk_text(cleaned_text, chunk_size=chunk_size, overlap=overlap)
    print(f"[EXTRACT] Created {len(chunks)} chunks")
    
    return chunks
