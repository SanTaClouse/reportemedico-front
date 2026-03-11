interface ArticleBodyProps {
  html: string
}

export default function ArticleBody({ html }: ArticleBodyProps) {
  return (
    <div
      className="article-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
