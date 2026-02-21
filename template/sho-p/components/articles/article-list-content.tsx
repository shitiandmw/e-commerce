"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { articles } from "@/lib/data/articles"
import { cn } from "@/lib/utils"

const categoryFilters = ["全部", "雪茄快訊", "品味生活", "品鑑指南", "Podcast"] as const

export function ArticleListContent() {
  const [activeCategory, setActiveCategory] = useState<string>("全部")

  const filteredArticles = activeCategory === "全部"
    ? articles
    : articles.filter(a => a.category === activeCategory)

  return (
    <div>
      {/* Hero */}
      <div className="relative h-48 md:h-56 overflow-hidden bg-card">
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-background" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-8 lg:px-6">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">Time for Shares</p>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">茄時分享</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg leading-relaxed">
              探索雪茄世界的最新資訊、品鑑指南和生活品味文章
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-border/30 mb-8 scrollbar-hide">
          {categoryFilters.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 text-sm whitespace-nowrap transition-colors shrink-0",
                activeCategory === cat
                  ? "bg-gold/10 text-gold border border-gold/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {filteredArticles.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {filteredArticles.map((article, index) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className={cn(
                  "group",
                  index === 0 && activeCategory === "全部" && "md:col-span-2"
                )}
              >
                <div className={cn(
                  index === 0 && activeCategory === "全部"
                    ? "grid md:grid-cols-2 gap-6"
                    : "flex flex-col"
                )}>
                  <div className={cn(
                    "relative overflow-hidden",
                    index === 0 && activeCategory === "全部" ? "aspect-[16/10]" : "aspect-[16/9]"
                  )}>
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-gold/90 text-primary-foreground text-[10px] font-medium px-2 py-1 tracking-wider">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "flex flex-col justify-center",
                    index === 0 && activeCategory === "全部" ? "py-4" : "mt-4"
                  )}>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                      <span>{article.date}</span>
                      <span className="text-border">|</span>
                      <span>{article.readTime}</span>
                    </div>
                    <h2 className={cn(
                      "font-serif font-bold text-foreground leading-snug group-hover:text-gold transition-colors",
                      index === 0 && activeCategory === "全部" ? "text-xl md:text-2xl" : "text-base"
                    )}>
                      {article.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                    <div className="mt-4 text-xs text-gold group-hover:text-gold-light transition-colors">
                      閱讀全文 &rarr;
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">此分類暫無文章</p>
            <button
              onClick={() => setActiveCategory("全部")}
              className="mt-4 text-sm text-gold hover:text-gold-light transition-colors"
            >
              查看全部文章
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
