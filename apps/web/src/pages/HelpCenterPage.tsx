import { useState, useMemo } from 'react';
import { knowledgeBase, kbCategories, type KBArticle } from '@/data/knowledgeBase';
import { IconSearch, IconHelp, IconDocument, IconSparkles, IconTarget, IconChart, IconAccounts, IconReports, IconMail } from '@/components/ui/Icons';

const categoryIcons: Record<string, typeof IconHelp> = {
  rocket: IconSparkles,
  chart: IconChart,
  accounts: IconAccounts,
  target: IconTarget,
  reports: IconReports,
  sparkles: IconSparkles,
  help: IconHelp,
};

export function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setShowContact(false);
      setContactSubmitted(false);
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
    }, 3000);
  };

  const filtered = useMemo(() => {
    let articles = knowledgeBase;
    if (selectedCategory) {
      articles = articles.filter((a) => a.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      articles = articles.filter(
        (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
      );
    }
    return articles;
  }, [search, selectedCategory]);

  if (selectedArticle) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Help Center
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-brand-100 px-3 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 capitalize">
              {selectedArticle.category.replace('-', ' ')}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedArticle.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedArticle.description}</p>
          <div className="mt-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {selectedArticle.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
          <IconHelp className="h-3.5 w-3.5" />
          Help Center
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">How can we help you?</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Search articles, browse categories, or watch tutorials.</p>
      </div>

      {/* Search */}
      <div className="relative mx-auto max-w-xl">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search help articles..."
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Categories */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kbCategories.map((cat) => {
          const Icon = categoryIcons[cat.icon] || IconHelp;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`rounded-xl border p-4 text-left transition-all ${
                selectedCategory === cat.id
                  ? 'border-brand-500 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
              }`}
            >
              <Icon className="h-5 w-5 text-brand-600 mb-2" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{cat.name}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{cat.description}</p>
            </button>
          );
        })}
      </div>

      {/* Video Tutorials Placeholder */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3 text-center">
          <IconVideo className="h-8 w-8 text-slate-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Video Tutorials Coming Soon</h3>
            <p className="text-xs text-slate-500">We're working on video walkthroughs to help you get started.</p>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => setShowContact(!showContact)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <IconMail className="h-5 w-5 text-brand-600" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Contact Support</h3>
              <p className="text-xs text-slate-500">Can't find what you're looking for? Send us a message.</p>
            </div>
          </div>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`h-4 w-4 text-slate-400 transition-transform ${showContact ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {showContact && (
          <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
            {contactSubmitted ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-emerald-600"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Message sent!</p>
                <p className="text-xs text-slate-500">We'll respond within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="How can we help?"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                  <textarea
                    id="contact-message"
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Describe your issue or question..."
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Articles */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {search || selectedCategory ? 'Search Results' : 'Popular Articles'}
        </h2>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <IconSearch className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">No articles found. Try a different search term.</p>
          </div>
        ) : (
          filtered.map((article) => (
            <button
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{article.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{article.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize dark:bg-slate-800 dark:text-slate-400">
                  {article.category.replace('-', ' ')}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function IconVideo(props: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}
