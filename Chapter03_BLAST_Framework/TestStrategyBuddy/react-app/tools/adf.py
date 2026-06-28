import re


def _flatten(node):
    if node is None:
        return ""
    if isinstance(node, str):
        return node
    node_type = node.get("type")
    if node_type == "text":
        return node.get("text", "")
    children = "".join(_flatten(child) for child in node.get("content", []))
    if node_type in ("paragraph", "heading"):
        return f"{children}\n"
    if node_type == "listItem":
        return f"- {children}"
    if node_type in ("bulletList", "orderedList"):
        return f"{children}\n"
    if node_type == "hardBreak":
        return "\n"
    return children


def adf_to_plain_text(adf_doc):
    if not adf_doc:
        return ""
    if isinstance(adf_doc, str):
        return adf_doc
    text = _flatten(adf_doc)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def plain_text_to_adf(text):
    paragraphs = [p for p in text.split("\n\n") if p.strip()]
    content = [
        {"type": "paragraph", "content": [{"type": "text", "text": p.strip()}]}
        for p in paragraphs
    ] or [{"type": "paragraph", "content": []}]
    return {"type": "doc", "version": 1, "content": content}
