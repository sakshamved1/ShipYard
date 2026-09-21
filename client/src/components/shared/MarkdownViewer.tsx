import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

// Custom schema ensuring javascript: links and dangerous attributes are disallowed
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a || []),
      ["target", "_blank"],
      ["rel", "noopener noreferrer"],
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
  },
};

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className = "" }) => {
  return (
    <div className={`prose dark:prose-invert max-w-none text-sm text-foreground/90 leading-relaxed break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
