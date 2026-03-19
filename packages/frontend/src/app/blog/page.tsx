import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock, User } from 'lucide-react'
import { SiteHeader } from '@/components/navigation/site-header'
import { SiteFooter } from '@/components/navigation/site-footer'
import { GradientText } from '@/components/ui/gradient-text'

export const metadata: Metadata = {
  title: 'Blog - OpenConductor',
  description: 'Insights on AI agent identity, compliance infrastructure, and the agent economy from the OpenConductor team.',
  openGraph: {
    title: 'Blog - OpenConductor',
    description: 'Insights on AI agent identity, compliance infrastructure, and the agent economy.',
  },
}

interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readTime: string
  author: string
  tags: string[]
  featured?: boolean
}

const posts: BlogPost[] = [
  {
    slug: 'jensen-is-right-every-company-needs-an-openclaw-strategy',
    title: "Jensen Is Right — Every Company Needs an OpenClaw Strategy. Here's What He Didn't Say.",
    description: 'Every OpenClaw agent needs a Trust Stack. Identity, compliance, and billing for the agent economy — shipped as an npm package.',
    date: '2026-03-17',
    readTime: '8 min',
    author: 'Shawn',
    tags: ['GTC 2026', 'OpenClaw', 'Trust Stack', 'EU AI Act'],
    featured: true,
  },
]

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BlogPage() {
  const featured = posts.find((p) => p.featured)
  const rest = posts.filter((p) => !p.featured)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-6">
                <GradientText>Blog</GradientText>
              </h1>
              <p className="text-lg text-muted-foreground">
                Insights on AI agent identity, compliance infrastructure, and the agent economy.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Post */}
        {featured && (
          <section className="container mx-auto px-4 pb-16">
            <Link
              href={`/blog/${featured.slug}`}
              className="block group"
            >
              <div className="glass rounded-2xl p-8 md:p-12 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                <div className="flex flex-wrap gap-2 mb-4">
                  {featured.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight mb-4 group-hover:text-primary transition-colors">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground text-lg mb-6 max-w-3xl">
                  {featured.description}
                </p>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {featured.author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(featured.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {featured.readTime}
                  </span>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                  Read article <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Remaining Posts Grid */}
        {rest.length > 0 && (
          <section className="container mx-auto px-4 pb-20">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block group"
                >
                  <div className="glass rounded-xl p-6 border border-primary/10 hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-bold font-display mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatDate(post.date)}</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="container mx-auto px-4 pb-20">
          <div className="glass rounded-2xl p-8 md:p-12 text-center border border-primary/10">
            <h2 className="text-2xl font-bold font-display mb-4">
              Stay in the loop
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Follow us for updates on Trust Stack, ERC-8004, and the agent economy.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://x.com/OpenConductor"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Follow on X ↗
              </a>
              <a
                href="https://dev.to/epicmotionsd"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-primary/20 text-foreground font-semibold text-sm hover:bg-muted/60 transition-colors"
              >
                DEV.to ↗
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
