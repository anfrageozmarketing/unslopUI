import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

// Text is edited as formatted text; the vault keeps markdown. These two functions are the only bridge.
const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '*', strongDelimiter: '**' });
td.use(gfm);
export const htmlToMd = (html) => td.turndown(String(html || '')).replace(/^(\s*[-*+]|\s*\d+\.)\s{2,}/gm, '$1 ').replace(/\n{3,}/g, '\n\n').trim();
