
export const parseMessages = (msg: string | undefined): string | undefined => {
  return msg?.replace('## message', '')
    .replace('## retrieved_urls', 'Sources')
    .replace('/?!#$(&^feedback:', '')
    .replace('/?!#$(&^query:', '')
    .replace('## open_ticket', '')
    .replace('-False', '')
    .replace('-True', '').trim();
};