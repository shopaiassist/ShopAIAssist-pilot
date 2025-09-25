from typing import List, Dict, Union, Tuple


class Block:
    """
    A block is a node in the layout tree. It can be a paragraph, a list item, a table, or a section header.
    This is the base class for all blocks such as Paragraph, ListItem, Table, Section.

    Attributes
    ----------
    tag: str
        tag of the block e.g. para, list_item, table, header
    level: int
        level of the block in the layout tree
    page_idx: int
        page index of the block in the document. It starts from 0 and is -1 if the page number is not available
    block_idx: int
        id of the block as returned from the server. It starts from 0 and is -1 if the id is not available
    top: float
        top position of the block in the page and it is -1 if the position is not available - only available for tables
    left: float
        left position of the block in the page and it is -1 if the position is not available - only available for tables
    bbox: [float]
        bounding box of the block in the page and it is [] if the bounding box is not available
    sentences: list
        list of sentences in the block
    children: list
        list of immediate child blocks, but not the children of the children
    parent: Block
        parent of the block
    block_json: dict
        json returned by the parser API for the block
    """

    tag: str

    def __init__(self, block_json=None):
        self.tag = block_json["tag"] if block_json and "tag" in block_json else None
        self.level = block_json["level"] if block_json and "level" in block_json else -1
        self.page_idx = block_json["page_idx"] if block_json and "page_idx" in block_json else -1
        self.block_idx = block_json["block_idx"] if block_json and "block_idx" in block_json else -1
        self.top = block_json["top"] if block_json and "top" in block_json else -1
        self.left = block_json["left"] if block_json and "left" in block_json else -1
        self.bbox = block_json["bbox"] if block_json and "bbox" in block_json else []
        self.sentences = block_json["sentences"] if block_json and "sentences" in block_json else []
        self.children = []
        self.parent = None
        self.block_json = block_json

    def add_child(self, node):
        """
        Adds a child to the block. Sets the parent of the child to self.
        """
        self.children.append(node)
        node.parent = self

    def to_html(self, include_children=False, recurse=False):
        """
        Converts the block to html. This is a virtual method and should be implemented by the derived classes.
        """
        pass

    def to_text(self, include_children=False, recurse=False):
        """
        Converts the block to text. This is a virtual method and should be implemented by the derived classes.
        """
        pass

    def parent_chain(self):
        """
        Returns the parent chain of the block consisting of all the parents of the block until the root.
        """
        chain = []
        parent = self.parent
        while parent:
            chain.append(parent)
            parent = parent.parent
        chain.reverse()
        return chain

    def parent_text(self):
        """
        Returns the text of the parent chain of the block. This is useful for adding section information to the text.
        """
        parent_chain = self.parent_chain()
        header_texts = []
        para_texts = []
        for p in parent_chain:
            if p.tag == "header":
                header_texts.append(p.to_text())
            elif p.tag in ["list_item", "para"]:
                para_texts.append(p.to_text())
        text = " > ".join(header_texts)
        if len(para_texts) > 0:
            text += "\n".join(para_texts)
        return text

    def to_context_text(self, include_section_info=True):
        """
        Returns the text of the block with section information. This provides context to the text.
        """
        text = ""
        if include_section_info:
            text += self.parent_text() + "\n"
        if self.tag in ["list_item", "para", "table"]:
            text += self.to_text(include_children=True, recurse=True)
        else:
            text += self.to_text()
        return text

    def iter_children(self, node, level, node_visitor):
        """
        Iterates over all the children of the node and calls the node_visitor function on each child.
        """
        for child in node.children:
            node_visitor(child)
            # print("-"*level, child.tag, f"({len(child.children)})", child.to_text())
            if child.tag not in ["list_item", "para", "table"]:
                self.iter_children(child, level + 1, node_visitor)

    def paragraphs(self):
        """
        Returns all the paragraphs in the block. This is useful for getting all the paragraphs in a section.
        """
        paragraphs = []

        def para_collector(node):
            if node.tag == "para":
                paragraphs.append(node)

        self.iter_children(self, 0, para_collector)
        return paragraphs

    def chunks(self):
        """
        Returns all the chunks in the block. Chunking automatically splits the document into paragraphs, lists, and tables without any prior knowledge of the document structure.
        """
        chunks = []

        def chunk_collector(node):
            if node.tag in ["para", "list_item", "table"]:
                chunks.append(node)

        self.iter_children(self, 0, chunk_collector)
        return chunks

    def tables(self):
        """
        Returns all the tables in the block. This is useful for getting all the tables in a section.
        """
        tables = []

        def chunk_collector(node):
            if node.tag in ["table"]:
                tables.append(node)

        self.iter_children(self, 0, chunk_collector)
        return tables

    def sections(self):
        """
        Returns all the sections in the block. This is useful for getting all the sections in a document.
        """
        sections = []

        def chunk_collector(node):
            if node.tag in ["header"]:
                sections.append(node)

        self.iter_children(self, 0, chunk_collector)
        return sections


class Paragraph(Block):
    """
    A paragraph is a block of text. It can have children such as lists. A paragraph has tag 'para'.
    """

    def __init__(self, para_json):
        super().__init__(para_json)

    def to_text(self, include_children=False, recurse=False):
        """
        Converts the paragraph to text. If include_children is True, then the text of the children is also included. If recurse is True, then the text of the children's children are also included.

        Parameters
        ----------
        include_children: bool
            If True, then the text of the children are also included
        recurse: bool
            If True, then the text of the children's children are also included
        """
        para_text = "\n".join(self.sentences)
        if include_children:
            for child in self.children:
                para_text += "\n" + child.to_text(include_children=recurse, recurse=recurse)
        return para_text

    def to_html(self, include_children=False, recurse=False):
        """
        Converts the paragraph to html. If include_children is True, then the html of the children is also included. If recurse is True, then the html of the children's children are also included.

        Parameters
        ----------
        include_children: bool
            If True, then the html of the children are also included
        recurse: bool
            If True, then the html of the children's children are also included
        """
        html_str = "<p>"
        html_str = html_str + "\n".join(self.sentences)
        if include_children:
            if len(self.children) > 0:
                html_str += "<ul>"
                for child in self.children:
                    html_str = html_str + child.to_html(include_children=recurse, recurse=recurse)
                html_str += "</ul>"
        html_str = html_str + "</p>"
        return html_str


class Section(Block):
    """
    A section is a block of text. It can have children such as paragraphs, lists, and tables. A section has tag 'header'.

    Attributes
    ----------
    title: str
        title of the section
    """

    def __init__(self, section_json):
        super().__init__(section_json)
        self.title = "\n".join(self.sentences)

    def to_text(self, include_children=False, recurse=False):
        """
        Converts the section to text. If include_children is True, then the text of the children is also included. If recurse is True, then the text of the children's children are also included.

        Parameters
        ----------
        include_children: bool
            If True, then the text of the children are also included
        recurse: bool
            If True, then the text of the children's children are also included
        """
        text = self.title
        if include_children:
            for child in self.children:
                text += "\n" + child.to_text(include_children=recurse, recurse=recurse)
        return text

    def to_html(self, include_children=False, recurse=False):
        """
        Converts the section to html. If include_children is True, then the html of the children is also included. If recurse is True, then the html of the children's children are also included.

        Parameters
        ----------
        include_children: bool
            If True, then the html of the children are also included
        recurse: bool
            If True, then the html of the children's children are also included
        """
        html_str = f"<h{self.level + 1}>"
        html_str = html_str + self.title
        html_str = html_str + f"</h{self.level + 1}>"
        if include_children:
            for child in self.children:
                html_str += child.to_html(include_children=recurse, recurse=recurse)
        return html_str


class ListItem(Block):
    """
    A list item is a block of text. It can have child list items. A list item has tag 'list_item'.
    """

    def __init__(self, list_json):
        super().__init__(list_json)

    def to_text(self, include_children=False, recurse=False):
        """
        Converts the list item to text. If include_children is True, then the text of the children is also included. If recurse is True, then the text of the children's children are also included.

        Parameters
        ----------
        include_children: bool
            If True, then the text of the children are also included
        recurse: bool
            If True, then the text of the children's children are also included
        """
        text = "\n".join(self.sentences)
        if include_children:
            for child in self.children:
                text += "\n" + child.to_text(include_children=recurse, recurse=recurse)
        return text

    def to_html(self, include_children=False, recurse=False):
        """
        Converts the list item to html. If include_children is True, then the html of the children is also included. If recurse is True, then the html of the children's children are also included.

        Parameters
        ----------
        include_children: bool
            If True, then the html of the children are also included
        recurse: bool
            If True, then the html of the children's children are also included
        """
        html_str = f"<li>"
        html_str = html_str + "\n".join(self.sentences)
        if include_children:
            if len(self.children) > 0:
                html_str += "<ul>"
                for child in self.children:
                    html_str = html_str + child.to_html(include_children=recurse, recurse=recurse)
                html_str += "</ul>"
        html_str = html_str + f"</li>"
        return html_str


class TableCell(Block):
    """
    A table cell is a block of text. It can have child paragraphs. A table cell has tag 'table_cell'.
    A table cell is contained within table rows.
    """

    def __init__(self, cell_json):
        super().__init__(cell_json)
        self.col_span = cell_json["col_span"] if "col_span" in cell_json else 1
        self.cell_value = cell_json["cell_value"]
        if not isinstance(self.cell_value, str):
            self.cell_node = Paragraph(self.cell_value)
        else:
            self.cell_node = None

    def to_text(self):
        """
        Returns the cell value of the text. If the cell value is a paragraph node, then the text of the node is returned.
        """
        cell_text = self.cell_value
        if self.cell_node:
            cell_text = self.cell_node.to_text()
        return cell_text

    def to_html(self):
        """
        Returns the cell value ashtml. If the cell value is a paragraph node, then the html of the node is returned.
        """
        cell_html = self.cell_value
        if self.cell_node:
            cell_html = self.cell_node.to_html()
        if self.col_span == 1:
            html_str = f"<td colSpan={self.col_span}>{cell_html}</td>"
        else:
            html_str = f"<td>{cell_html}</td>"
        return html_str


class TableRow(Block):
    """
    A table row is a block of text. It can have child table cells.
    """

    def __init__(self, row_json):
        self.cells = []
        if row_json["type"] == "full_row":
            cell = TableCell(row_json)
            self.cells.append(cell)
        else:
            for cell_json in row_json["cells"]:
                cell = TableCell(cell_json)
                self.cells.append(cell)

    def to_text(self, include_children=False, recurse=False):
        """
        Returns text of a row with text from all the cells in the row delimited by '|'
        """
        cell_text = ""
        for cell in self.cells:
            cell_text = cell_text + " | " + cell.to_text()
        return cell_text

    def to_html(self, include_children=False, recurse=False):
        """
        Returns html for a <tr> with html from all the cells in the row as <td>
        """
        html_str = "<tr>"
        for cell in self.cells:
            html_str = html_str + cell.to_html()
        html_str = html_str + "</tr>"
        return html_str


class TableHeader(Block):
    """
    A table header is a block of text. It can have child table cells.
    """

    def __init__(self, row_json):
        super().__init__(row_json)
        self.cells = []
        for cell_json in row_json["cells"]:
            cell = TableCell(cell_json)
            self.cells.append(cell)

    def to_text(self, include_children=False, recurse=False):
        """
        Returns text of a row with text from all the cells in the row delimited by '|' and the header row is delimited by '---'
        Text is returned in markdown format.
        """
        cell_text = ""
        for cell in self.cells:
            cell_text = cell_text + " | " + cell.to_text()
        cell_text += "\n"
        for cell in self.cells:
            cell_text = cell_text + " | " + "---"
        return cell_text

    def to_html(self, include_children=False, recurse=False):
        """
        Returns html for a <th> with html from all the cells in the row as <td>
        """
        html_str = "<th>"
        for cell in self.cells:
            html_str = html_str + cell.to_html()
        html_str = html_str + "</th>"
        return html_str


class Table(Block):
    """
    A table is a block of text. It can have child table rows. A table has tag 'table'.
    """

    def __init__(self, table_json, parent):
        # self.title = parent.name
        super().__init__(table_json)
        self.rows = []
        self.headers = []
        self.name = table_json["name"]
        if "table_rows" in table_json:
            for row_json in table_json["table_rows"]:
                if row_json["type"] == "table_header":
                    row = TableHeader(row_json)
                    self.headers.append(row)
                else:
                    row = TableRow(row_json)
                    self.rows.append(row)

    def to_text(self, include_children=False, recurse=False):
        """
        Returns text of a table with text from all the rows in the table delimited by '\n'
        """
        text = ""
        for header in self.headers:
            text = text + header.to_text() + "\n"
        for row in self.rows:
            text = text + row.to_text() + "\n"
        return text

    def to_html(self, include_children=False, recurse=False):
        """
        Returns html for a <table> with html from all the rows in the table as <tr>
        """
        html_str = "<table>"
        for header in self.headers:
            html_str = html_str + header.to_html()
        for row in self.rows:
            html_str = html_str + row.to_html()
        html_str = html_str + "</table>"
        return html_str


class LayoutReader:
    """
    Reads the layout tree from the json returned by the parser API.
    """

    def debug(self, pdf_root):
        def iter_children(node, level):
            for child in node.children:
                print("-" * level, child.tag, f"({len(child.children)})", child.to_text())
                iter_children(child, level + 1)

        iter_children(pdf_root, 0)

    def read(self, blocks_json):
        """
        Reads the layout tree from the json returned by the parser API. Constructs a tree of Block objects.
        """
        root = Block()
        parent = None
        parent_stack = [root]
        prev_node = root
        parent = root
        list_stack = []
        for block in blocks_json:
            if block["tag"] != "list_item" and len(list_stack) > 0:
                list_stack = []
            if block["tag"] == "para":
                node = Paragraph(block)
                parent.add_child(node)
            elif block["tag"] == "table":
                node = Table(block, prev_node)
                parent.add_child(node)
            elif block["tag"] == "list_item":
                node = ListItem(block)
                # add lists as children to previous paragraph
                # this handles examples like - The following items need to be addressed: 1) item 1 2) item 2 etc.
                if prev_node.tag == "para" and prev_node.level == node.level:
                    list_stack.append(prev_node)
                # sometimes there are lists within lists in legal documents
                elif prev_node.tag == "list_item":
                    if node.level > prev_node.level:
                        list_stack.append(prev_node)
                    elif node.level < prev_node.level:
                        while len(list_stack) > 0 and list_stack.pop().level > node.level:
                            pass
                        # list_stack.append(node)
                if len(list_stack) > 0:
                    list_stack[-1].add_child(node)
                else:
                    parent.add_child(node)

            elif block["tag"] == "header":
                node = Section(block)
                if node.level > parent.level:
                    parent_stack.append(node)
                    parent.add_child(node)
                else:
                    while len(parent_stack) > 1 and parent_stack.pop().level > node.level:
                        pass
                    parent_stack[-1].add_child(node)
                    parent_stack.append(node)
                parent = node
            prev_node = node

        return root


class Document:
    """
    A document is a tree of blocks. It is the root node of the layout tree.
    """

    def __init__(self, blocks_json):
        self.reader = LayoutReader()
        self.root_node = self.reader.read(blocks_json)
        self.json = blocks_json
        self._top_sections = self._get_top_sections()

    def chunks(self):
        """
        Returns all the chunks in the document. Chunking automatically splits the document into paragraphs, lists, and tables without any prior knowledge of the document structure.
        """
        return self.root_node.chunks()

    def tables(self):
        """
        Returns all the tables in the document. This is useful for getting all the tables in a document.
        """
        return self.root_node.tables()

    def sections(self):
        """
        Returns all the sections in the document. This is useful for getting all the sections in a document.
        """
        return self.root_node.sections()

    def top_sections(self):
        """
        Return the top sections of the document. A section is considered a top section if it is not a child of any other section in the document.
        """
        return self._top_sections

    def to_text(self, include_duplicates=False):
        """
        Returns text of a document by iterating through all the sections '\n'
        :param include_duplicates: bool
            If True, then text of all the sections is included. If False, then only the text of the top sections is included.
        """
        text = ""

        if include_duplicates:
            for section in self.sections():
                text = text + section.to_text(include_children=True, recurse=True) + "\n"
        else:
            for section in self._top_sections:
                text = text + section.to_text(include_children=True, recurse=True) + "\n"

        return text

    def to_html(self, include_duplicates=False):
        """
        Returns html for the document by iterating through all the sections
        :param include_duplicates: bool
            If True, then html of all the sections is included. If False, then only the html of the top sections is included.
        """
        html_str = "<html>"

        if include_duplicates:
            for section in self.sections():
                html_str = html_str + section.to_html(include_children=True, recurse=True)
        else:
            for section in self._top_sections:
                html_str = html_str + section.to_html(include_children=True, recurse=True)

        html_str = html_str + "</html>"
        return html_str

    def _get_top_sections(self):
        """
        Get the top sections of the document. A section is considered a top section if it is not a child of any other section in the document.
        """
        top_sections = list()
        sections = self.sections()
        sections_len = len(sections)

        # Iterate over all the sections
        for i in range(sections_len):
            is_top_section = True  # Assume current section is a top section

            # Check if the current section is a child of any other section
            for j in range(sections_len):
                if i != j:
                    if sections[i] in sections[j].children:
                        # If current section is a child of any other section, then it is not a top section
                        is_top_section = False
                        break

            if is_top_section:
                # Append the top section to the list of top sections
                top_sections.append(sections[i])

        return top_sections


class Node:
    """
    A node in the document tree.

    Attributes
    ----------
    - `tag`: The tag of the node which is the type of the block. Example: `root`, `section`, `paragraph`, etc.
    - `node_text`: The text contained only in this node.
    - `subtree_text`: The text contained in the subtree rooted at this node.
    - `subtree_token_count`: The number of tokens in the `subtree_text`.
    - `children`: A list of child nodes.
    - `page_idx`: The page index of the block in the document.
    - `max_page_idx`: The maximum page index of a node in the subtree rooted at this node.
    """

    def __init__(
        self,
        block: Union[Block, None] = None,
        tokenizer=None,
        children: Union[List["Node"], None] = None,
        section_only_chunking: bool = True,
    ):
        if (block is None) and (children is not None):
            # Root node
            self.tag = "root"
            self.page_idx = 0
            self.max_page_idx = self.page_idx
            self.children = children
            self.node_text = ""
            self.subtree_text = ""
            for child in children:
                self.subtree_text += child.subtree_text + "\n"
                self.max_page_idx = max(self.max_page_idx, child.max_page_idx)

            subtree_tokens = tokenizer.encode(self.subtree_text) if tokenizer is not None else None

            self.subtree_token_count = len(subtree_tokens) if tokenizer is not None else None

        elif block is not None:
            # Non-root node
            self.node_text = block.to_text(include_children=False, recurse=False)

            self.subtree_text = block.to_text(include_children=True, recurse=True)
            subtree_tokens = tokenizer.encode(self.subtree_text) if tokenizer is not None else None
            self.subtree_token_count = len(subtree_tokens) if tokenizer is not None else None

            self.children = []
            self.tag = block.tag
            self.page_idx = block.page_idx
            self.max_page_idx = self.page_idx
            if section_only_chunking and isinstance(block, Section):
                self.children = [Node(tokenizer=tokenizer, block=child) for child in block.children]
                self.max_page_idx = max([self.max_page_idx] + [child.max_page_idx for child in self.children])

            else:
                self.children = [Node(tokenizer=tokenizer, block=child) for child in block.children]
                self.max_page_idx = max([self.max_page_idx] + [child.max_page_idx for child in self.children])

        else:
            raise ValueError("Either block or children should be provided")


class DocTree:
    """
    A tree representation of the document useful for the following tasks:
    - Getting the text of the document
    - Getting the HTML of the document
    - Getting the elements like tables, sections, etc.
    - Creating chunks of the document **especially** useful for a RAG pipeline.

    Attributes
    ----------
    `doc`: Document
        The document object.
    `tokenizer`: Tokenizer or None
        A tokenizer object containing the `encode` and `decode` methods. The `encode` method takes a string as an input and returns a list of tokens. The `decode` method takes a list of tokens as an input and returns a string.
    `file_name`: str or None
        The name of the file from which the document is read.
    `section_only_chunking`: bool
        If True, then the chunking is done only at the section level. If False, then other blocks such as paragraphs, lists, and tables are also chunked when necessary.
    `json`: dict
        The json returned by the parser API.

    Refer [this](https://github.com/tr/labs_onesource-smartPDFParser) for more details.
    """

    def __init__(
        self, doc: Document, tokenizer=None, file_name: Union[str, None] = None, section_only_chunking: bool = True
    ):
        self.doc = doc
        self.json = doc.json
        self.file_name = file_name
        self.tokenizer = tokenizer
        self.section_only_chunking = section_only_chunking

        self._top_sections = doc.top_sections()
        top_sections_nodes = [
            Node(block=section, tokenizer=tokenizer, section_only_chunking=section_only_chunking)
            for section in self._top_sections
        ]

        self.root_node = Node(
            tokenizer=tokenizer, children=top_sections_nodes, section_only_chunking=section_only_chunking
        )

        self._total_nodes = self._get_total_nodes()

    def to_text(self, include_duplicates=False):
        """
        Parameters
        ----------
        `include_duplicates`: bool
            If True, then the text of all the sections is included. If False, then only the text of the top sections is included. Default value is `False` (recommended).

        Returns
        ----------
        The content of the document in plain-text/markdown format.
        """
        if include_duplicates:
            return self.doc.to_text(include_duplicates=include_duplicates)

        # If include_duplicates is False, then return the text of the top sections which is already stored in the root node
        return self.root_node.subtree_text

    def to_html(self, include_duplicates=False):
        """
        Parameters
        ----------
        `include_duplicates`: bool
            If True, then the HTML of all the sections is included. If False, then only the HTML of the top sections is included. Default value is `False` (recommended).

        Returns
        ----------
        The content of the document in HTML format.
        """
        return self.doc.to_html(include_duplicates=include_duplicates)

    def tables(self) -> List[Table]:
        """
        Returns all the tables in the document. This is useful for getting all the tables in a document.
        """
        return self.doc.tables()

    def sections(self) -> List[Section]:
        """
        Returns all the sections in the document. This is useful for getting all the sections in a document.
        """
        return self.doc.sections()

    def top_sections(self) -> List[Section]:
        """
        Returns the top sections of the document. A section is considered a top section if it is not a child of any other section in the document.
        """
        return self._top_sections

    def get_total_nodes(self) -> int:
        """
        Get the total number of nodes in the tree.
        """
        return self._total_nodes

    def get_chunks(
        self, chunk_size=4096, simple_chunk_overlap=50, verbose=False, postprocess=True, include_file_name=True
    ) -> List[Dict]:
        """
        Splits the document into meaningful chunks, each containing at most `chunk_size` tokens.

        This method overcomes the limitations of simple chunking, where the chunks are created by splitting the document based on the `chunk_size`, which doesn't ensure that the chunk contains complete information of a block (section/paragraph/table) of the document, which is very crucial in RAGs.

        The algorithm takes advantage of the tree structure of the document and tries to keep the chunks as "complete" as possible i.e., it tries to keep one block (section/paragraph/table) of the document in one chunk as much as possible. If a block is too large to fit in a single chunk, then it will be split into multiple chunks using simple chunking.

        To maintain the context of the chunks (which is helpful in semantic retrieval), the file name and the section names are included in the chunks.

        It also tries to minimize the number of chunks by combining as many blocks as possible in a single chunk. This is very helpful in RAGs where the lesser the number of chunks, the more information is present in a single chunk and therefore, the LLM has more information to generate the answer.

        To locate the chunks in the document, this method returns the index of the starting and ending page of every chunk in the document.

        Parameters
        ----------
        `chunk_size`: int
            The maximum number of tokens allowed in a chunk.
        `verbose`: bool
            If True, print the number of times simple chunking is done.
        `postprocess`: bool
            If True, combine consecutive chunks until their combined tokens' length is less than the chunk size.
        `simple_chunk_overlap`: int
            The number of tokens by which the chunks overlap if simple chunking is done.
        `include_file_name`: bool
            If True, include the file name in the chunks. The ".pdf" extension is removed from the file nam while including it in the chunks.
            Note: This is helpful for maintaining the context of the chunks, especially helpful in RAGs.

        Returns
        ----------
        A list of chunks where each chunk is a dictionary containing the following keys:
        - `content`: The text content of the chunk.
        - `start_page`: The starting page index of the chunk in the document.
        - `end_page`: The ending page index of the chunk in the document.
        - `sections_info`: A list of the name of the sections contained in the chunk.

        Refer [this](https://github.com/tr/labs_onesource-smartPDFParser) for more details.
        """
        if self.tokenizer is None:
            raise ValueError("To get the chunks of the document, please construct the DocTree object with a tokenizer")

        chunks = list()
        n_simple_chunking = [0]

        if include_file_name:
            # Remove .pdf from the file name
            if self.file_name is not None:
                if self.file_name.endswith(".pdf"):
                    curr_text = self.file_name[:-4] + "\n"
                else:
                    curr_text = self.file_name + "\n"
            else:
                curr_text = ""

        self._get_chunks_util(
            node=self.root_node,
            curr_text=curr_text,
            chunks=chunks,
            chunk_size=chunk_size,
            n_simple_chunking=n_simple_chunking,
            simple_chunk_overlap=simple_chunk_overlap,
        )

        if verbose:
            print(f"Simple chunking is done {n_simple_chunking[0]} times")

        if postprocess:
            chunks = self._postprocess_chunks(chunks=chunks, chunk_size=chunk_size)

        return chunks

    def _postprocess_chunks(self, chunks: List[Dict], chunk_size: int):
        """
        Keep combining consecutive chunks until their combined tokens' length is less than the chunk size.
        """
        if self.tokenizer is None:
            raise ValueError("To get the chunks of the document, please construct the DocTree object with a tokenizer")

        chunks_len = len(chunks)
        combined_chunks = []
        i = 0

        while i < chunks_len:
            combined_chunk_txt = chunks[i]["content"]
            min_page_idx = chunks[i]["start_page"]
            max_page_idx = chunks[i]["end_page"]
            sections_info = chunks[i]["sections_info"]

            j = i + 1

            while j < chunks_len:
                temp_combined_chunk_txt = combined_chunk_txt + " " + chunks[j]["content"]

                temp_combined_chunk_len = len(self.tokenizer.encode(temp_combined_chunk_txt))

                if temp_combined_chunk_len > chunk_size:
                    break
                else:
                    combined_chunk_txt = temp_combined_chunk_txt
                    max_page_idx = chunks[j]["end_page"]
                    sections_info.extend(chunks[j]["sections_info"])
                    j += 1

            chnk = {
                "content": combined_chunk_txt,
                "start_page": min_page_idx,
                "end_page": max_page_idx,
                "sections_info": sections_info,
            }
            combined_chunks.append(chnk)

            i = j

        return combined_chunks

    def _get_chunks_util(
        self,
        node: Node,
        curr_text: str,
        chunks: List[Dict],
        chunk_size: int,
        n_simple_chunking: List[int],
        simple_chunk_overlap: int,
    ):
        """
        Utility function to get the chunks of the document.
        Parameters
        ----------
        `curr_text`: str
            The text to which the text of (some of) the nodes present in the subtree rooted at `node` will be appended.
        `chunks`: List
            The list of chunks to which the chunks will be appended.
        `chunk_size`: int
            The maximum number of tokens in a chunk.
        `n_simple_chunking`: List
            A list containing a single element. This element will be incremented by 1 if simple chunking is done. This is passed as a list and not as an integer because of the pass-by-reference nature of lists in Python and pass-by-value nature of integers in Python.
        `simple_chunk_overlap`: int
            The number of tokens by which the chunks overlap if simple chunking is done.

        Returns `None`.
        """
        if self.tokenizer is None:
            raise ValueError("To get the chunks of the document, please construct the DocTree object with a tokenizer")

        # curr_text will always end with "\n"
        total_text = curr_text + node.subtree_text
        total_token_count = len(self.tokenizer.encode(total_text))

        if total_token_count > chunk_size:
            # If the total word count exceeds the chunk size
            children_len = len(node.children)

            if children_len == 0:
                # If no children, then simple chunking of total_text
                # Use _get_simple_chunks function
                text_to_chunk = total_text

                n_simple_chunking[0] += 1

                simple_chunks = self._get_simple_chunks(
                    text=text_to_chunk, chunk_size=chunk_size, chunk_overlap=simple_chunk_overlap
                )

                sections_info = [self._refine_section(curr_text)]

                chunks.extend(
                    [
                        {
                            "content": chnk_text,
                            "start_page": node.page_idx + 1,
                            "end_page": node.max_page_idx + 1,
                            "sections_info": sections_info,
                        }
                        for chnk_text in simple_chunks
                    ]
                )
            else:
                # If children, then try to include as many children as possible
                curr_text += node.node_text + "\n"
                chunk_txt = curr_text

                child_idx = 0
                n_child_included = 0
                min_page_idx = -1
                max_page_idx = -1

                while child_idx < children_len:
                    temp_chunk_txt = chunk_txt + node.children[child_idx].subtree_text + "\n"
                    temp_chunk_len = len(self.tokenizer.encode(temp_chunk_txt))

                    if temp_chunk_len > chunk_size:
                        if n_child_included == 0:
                            # If only one children exceeds the chunk size
                            # Then call the function recursively
                            self._get_chunks_util(
                                node=node.children[child_idx],
                                curr_text=curr_text,
                                chunks=chunks,
                                chunk_size=chunk_size,
                                n_simple_chunking=n_simple_chunking,
                                simple_chunk_overlap=simple_chunk_overlap,
                            )
                            child_idx += 1

                        else:
                            # If multiple children exceed the chunk size
                            # Then add the current chunk to the chunks list

                            chnk = {
                                "content": chunk_txt,
                                "start_page": min_page_idx + 1,
                                "end_page": max_page_idx + 1,
                                "sections_info": [self._refine_section(curr_text)],
                            }

                            chunks.append(chnk)

                            chunk_txt = curr_text
                            min_page_idx = -1
                            max_page_idx = -1
                            n_child_included = 0

                    else:
                        # If the chunk size is not exceeded, then include the child
                        chunk_txt = temp_chunk_txt

                        if min_page_idx == -1:
                            min_page_idx = node.children[child_idx].page_idx

                        max_page_idx = node.children[child_idx].max_page_idx

                        n_child_included += 1
                        child_idx += 1

                if n_child_included > 0:
                    # If there are any children left
                    # Then add the current chunk to the chunks list
                    chnk = {
                        "content": chunk_txt,
                        "start_page": min_page_idx + 1,
                        "end_page": max_page_idx + 1,
                        "sections_info": [self._refine_section(curr_text)],
                    }

                    chunks.append(chnk)
        else:
            # If the total word count does not exceed the chunk size
            # Then add the subtree_text of the node to the curr_text
            # And add it to the chunks list

            chnk = {
                "content": total_text,
                "start_page": node.page_idx + 1,
                "end_page": node.max_page_idx + 1,
                "sections_info": [self._refine_section(curr_text)],
            }
            chunks.append(chnk)

        return

    def _get_simple_chunks(self, text: str, chunk_size: int, chunk_overlap: int):
        """
        Get the chunks of the text using simple chunking.
        """
        if self.tokenizer is None:
            raise ValueError("To get the chunks of the document, please construct the DocTree object with a tokenizer")

        # Get the tokens for the text
        tokens = self.tokenizer.encode(text)
        tokens_len = len(tokens)
        text_chunks = []
        i = 0

        while i < tokens_len:
            if i + chunk_size > tokens_len:
                chunk = self.tokenizer.decode(tokens[i:])
            else:
                chunk = self.tokenizer.decode(tokens[i : i + chunk_size])

            text_chunks.append(chunk)
            i += chunk_size - chunk_overlap

        return text_chunks

    def _refine_section(self, section: str):
        """
        Refine the section name by removing '\n' and using '>' to indicate the hierarchy.
        """
        import re

        # Replace multiple '\n' with a single '\n'
        section = re.sub(r"\n+", "\n", section)
        words = section.split("\n")
        words = [word for word in words if word != ""]
        return " > ".join(words)

    def print_tree(self):
        """
        Prints the tree structure of the document.
        - If the tokenizer is provided, print the tag and the token count of the node and the tag and the token count of all the children.
        - If the tokenizer is not provided, print the tag of the node and the tag of all the children
        """
        self._print_tree_util(node=self.root_node)
        return

    def _print_tree_util(self, node: Node):
        """
        Utility function to print the tree structure of the document.
        """
        # If tokenizer is provided, print the tag and the token count of the node and the tag and the token count of all the children

        if self.tokenizer is not None:
            print(f"{node.tag} ({node.subtree_token_count}) - ", end="")
            print("[", end="")
            for child in node.children:
                print(f"{child.tag} ({child.subtree_token_count}), ", end="")
            print("]")

        # If the tokenizer is not provided, print the tag of the node and the tag of all the children
        else:
            print(f"{node.tag} - ", end="")
            print("[", end="")
            for child in node.children:
                print(f"{child.tag}, ", end="")
            print("]")

        # Recursively call the function on all the children
        for child in node.children:
            self._print_tree_util(node=child)

        return

    def _get_total_nodes(self):
        """
        Get the total number of nodes in the tree.
        """
        return self._get_total_nodes_util(node=self.root_node)

    def _get_total_nodes_util(self, node: Node):
        """
        Utility function to get the total number of nodes in the tree.
        """
        total_nodes = 1
        for child in node.children:
            total_nodes += self._get_total_nodes_util(node=child)
        return total_nodes
