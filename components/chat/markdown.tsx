import { Fragment } from "react";

/**
 * Minimal, safe Markdown renderer for assistant replies.
 * Builds React elements only (no dangerouslySetInnerHTML), so model output
 * can never inject HTML. Supports headings, lists, bold, italic, inline code,
 * fenced code blocks, links (http/https only), blockquotes and paragraphs.
 */

function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*\s][^*]*\*)|(_[^_\s][^_]*_)|(\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;
    if (match[1]) {
      nodes.push(
        <code key={key} className="rounded bg-background/70 px-1 py-0.5 font-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (match[2] || match[3]) {
      nodes.push(<strong key={key}>{inline(token.slice(2, -2), key)}</strong>);
    } else if (match[4] || match[5]) {
      nodes.push(<em key={key}>{inline(token.slice(1, -1), key)}</em>);
    } else if (match[6]) {
      const label = token.slice(1, token.indexOf("]("));
      nodes.push(
        <a key={key} href={match[7]} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-primary underline underline-offset-2">
          {label}
        </a>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "code"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "p"; text: string };

function parse(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
      i++;
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*•]\s+/, ""));
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      blocks.push({ type: "ol", items });
      continue;
    }
    if (/^>\s?/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) body.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ type: "quote", text: body.join(" ") });
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const body: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(```|#{1,4}\s|\s*[-*•]\s+|\s*\d+[.)]\s+|>)/.test(lines[i])
    ) {
      body.push(lines[i++]);
    }
    blocks.push({ type: "p", text: body.join("\n") });
  }
  return blocks;
}

export function Markdown({ content }: { content: string }) {
  const blocks = parse(content);
  return (
    <div className="space-y-3 text-small leading-6 [&>*:first-child]:mt-0">
      {blocks.map((block, index) => {
        const key = `b${index}`;
        switch (block.type) {
          case "heading":
            return (
              <p key={key} className={block.level <= 2 ? "mt-4 font-serif text-h3" : "mt-3 font-semibold"}>
                {inline(block.text, key)}
              </p>
            );
          case "code":
            return (
              <pre key={key} className="overflow-x-auto rounded-lg bg-background/80 p-3 font-mono text-caption leading-5">
                <code>{block.text}</code>
              </pre>
            );
          case "ul":
            return (
              <ul key={key} className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{inline(item, `${key}-${itemIndex}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="list-decimal space-y-1 pl-5 marker:text-muted-foreground">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{inline(item, `${key}-${itemIndex}`)}</li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote key={key} className="border-l-2 border-gold pl-3 text-muted-foreground">
                {inline(block.text, key)}
              </blockquote>
            );
          default:
            return (
              <p key={key}>
                {block.text.split("\n").map((part, partIndex, all) => (
                  <Fragment key={partIndex}>
                    {inline(part, `${key}-${partIndex}`)}
                    {partIndex < all.length - 1 ? <br /> : null}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
