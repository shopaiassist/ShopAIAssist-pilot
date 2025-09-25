"""Parses XML tax return files into manageable text chunks.

This module provides functionality to:
    - Clean XML namespaces.
    - Recursively process XML elements.
    - Create context-aware chunks of a specified token size.
    - Identify file types (IRS or State returns).

Each chunk maintains parent path context to ensure proper interpretation even when
separated from the complete document. The module is designed to work with tokenizers
to accurately measure and limit chunk sizes for downstream processing.

Functions:
    clean_namespace: Removes namespace prefixes from XML tags.
    process_xml_for_chunks: Recursively processes XML elements into context-aware chunks.
    parse_xml_file: Main entry point for parsing XML files into structured chunks.
"""

import xml.etree.ElementTree as ET


def clean_namespace(tag):
    """Remove namespace from XML tag."""
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def process_xml_for_chunks(
    element, tokenizer, max_tokens=1024, depth=0, parent_path=None, current_chunk=None, chunks=None
):
    """Process XML elements recursively and create chunks with full parent path context.

    Args:
        element: The XML element to process
        tokenizer: Tokenizer to measure token length
        max_tokens: Maximum tokens per chunk
        depth: Current depth in the XML tree
        parent_path: List of parent elements [(depth, tag, attrs)]
        current_chunk: Current chunk being built
        chunks: List of completed chunks

    Returns:
        List of text chunks
    """
    if parent_path is None:
        parent_path = []
    if current_chunk is None:
        current_chunk = []
    if chunks is None:
        chunks = []

    tag = clean_namespace(element.tag)

    attributes = element.attrib if element.attrib else {}
    text = element.text.strip() if element.text and element.text.strip() else None

    indent = "\t" * depth
    line = f"{indent}{tag}"

    if attributes:
        attr_parts = []
        for k, v in attributes.items():
            attr_parts.append(f"{k}='{v}'")
        if attr_parts:
            line += f" [{', '.join(attr_parts)}]"

    if text:
        line += f": {text}"

    current_chunk_text = "\n".join(current_chunk + [line])
    current_tokens = len(tokenizer.encode(current_chunk_text))

    if current_tokens > max_tokens and current_chunk:
        chunks.append("\n".join(current_chunk))
        current_chunk = []

        for p_depth, p_tag, p_attrs in parent_path:
            p_indent = "\t" * p_depth
            p_line = f"{p_indent}{p_tag}"

            if p_attrs:
                p_attr_parts = []
                for k, v in p_attrs.items():
                    p_attr_parts.append(f"{k}='{v}'")
                if p_attr_parts:
                    p_line += f" [{', '.join(p_attr_parts)}]"

            current_chunk.append(p_line)

        current_chunk.append(line)
    else:
        current_chunk.append(line)

    new_parent_path = parent_path + [(depth, tag, attributes)]

    for child in element:
        current_chunk, chunks = process_xml_for_chunks(
            child, tokenizer, max_tokens, depth + 1, new_parent_path, current_chunk, chunks
        )

    # add the last chunk if not empty
    if depth == 0 and current_chunk:
        chunks.append("\n".join(current_chunk))

    return current_chunk, chunks


def parse_xml_file(xml_str, file_name, tokenizer, max_chunk_size=1024):
    """Parse an XML file and extract content in chunks.

    Args:
        xml_str: XML string to parse
        file_name: Name of the XML file
        tokenizer: Tokenizer to measure chunk size
        max_chunk_size: Maximum size of each chunk in tokens

    Returns:
        List of dictionaries with chunked content
    """
    try:
        root = ET.fromstring(xml_str)
        _, content_chunks = process_xml_for_chunks(root, tokenizer, max_chunk_size)

        result = []
        for i, chunk_content in enumerate(content_chunks):
            result.append(
                {
                    "file_name": file_name,
                    "chunk_index": i + 1,
                    "total_chunks": len(content_chunks),
                    "content": chunk_content,
                }
            )
        return result

    except ET.ParseError as e:
        print(f"Error parsing {file_name}: {str(e)}")
        raise e
