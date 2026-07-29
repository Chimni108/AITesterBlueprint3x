"""Per-source-type chunking strategies. Sizes are approximate tokens
(1 token ~ 0.75 words); we work in words internally."""
import re


def _words_for(tokens: int) -> int:
    return max(1, int(tokens * 0.75))


def chunk_sliding(text: str, chunk_tokens: int, overlap_tokens: int) -> list[str]:
    """Generic sliding window over words — prose, transcripts, chart exports."""
    words = text.split()
    size, overlap = _words_for(chunk_tokens), _words_for(overlap_tokens) if overlap_tokens else 0
    if len(words) <= size:
        return [text] if text.strip() else []
    chunks, start = [], 0
    while start < len(words):
        chunks.append(" ".join(words[start : start + size]))
        if start + size >= len(words):
            break
        start += size - overlap
    return chunks


def chunk_markdown(text: str, chunk_tokens: int, overlap_tokens: int) -> list[str]:
    """Split on headings first so sections stay coherent; heading prefixes each chunk."""
    sections = re.split(r"(?m)^(?=#{1,3} )", text)
    chunks = []
    for section in sections:
        if not section.strip():
            continue
        heading_match = re.match(r"^(#{1,3} .+)$", section, re.M)
        heading = heading_match.group(1) if heading_match else ""
        for piece in chunk_sliding(section, chunk_tokens, overlap_tokens):
            if heading and not piece.startswith(heading):
                piece = f"{heading}\n{piece}"
            chunks.append(piece)
    return chunks


_CODE_BOUNDARY = re.compile(
    r"^\s*(public |private |protected |static |class |interface |enum "
    r"|def |async def |function |const |export |describe\(|it\(|test\(|@Test|@pytest)",
)


def chunk_code(text: str, chunk_tokens: int) -> list[str]:
    """Group lines into chunks that break only at class/method/function boundaries."""
    target = _words_for(chunk_tokens)
    lines = text.splitlines()
    chunks, current, current_words = [], [], 0
    for line in lines:
        line_words = len(line.split()) or 1
        at_boundary = bool(_CODE_BOUNDARY.match(line))
        if current and at_boundary and current_words + line_words > target:
            chunks.append("\n".join(current))
            current, current_words = [], 0
        current.append(line)
        current_words += line_words
        if current_words > target * 3:  # pathological file with no boundaries
            chunks.append("\n".join(current))
            current, current_words = [], 0
    if current and "\n".join(current).strip():
        chunks.append("\n".join(current))
    return chunks


_LOG_MARKER = re.compile(r"(ERROR|FAILED|FAILURE|Exception|Traceback|AssertionError)", re.I)


def chunk_log(text: str, chunk_tokens: int) -> list[str]:
    """Extract windows around failure markers; fall back to sliding if none found."""
    lines = text.splitlines()
    marker_idx = [i for i, line in enumerate(lines) if _LOG_MARKER.search(line)]
    if not marker_idx:
        return chunk_sliding(text, chunk_tokens, 0)

    windows, used_until = [], -1
    for i in marker_idx:
        start = max(i - 10, used_until + 1, 0)
        end = min(i + 30, len(lines))
        if windows and start <= used_until:
            windows[-1] = (windows[-1][0], end)  # merge overlapping windows
        else:
            windows.append((start, end))
        used_until = end - 1

    chunks = []
    for start, end in windows:
        block = "\n".join(lines[start:end]).strip()
        if block:
            chunks.extend(chunk_sliding(block, chunk_tokens, 0))
    return chunks
