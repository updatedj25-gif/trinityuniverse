import React, { useState, useEffect } from 'react';
import { Home, Menu, BookOpen, Download, Star, ChevronLeft, ChevronRight, Search, ShoppingCart, Trash2, X } from 'lucide-react';

interface LibraryPageProps {
  onGoHome: () => void;
  onToggleSidebar?: () => void;
}

interface EbookEntry {
  id: number;
  title: string;
  slug: string;
  author: string;
  niche: string;
  price: number;
  file_key: string | null;
  cover_filename: string | null;
  is_featured: number;
  tag: string | null;
  publication_year: number | null;
}

const LIBRARY_PAGE_SIZE = 20;
const CART_STORAGE_KEY = 'trinity_library_cart';

const NICHE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Spirituality & Hidden Knowledge': { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  'Advanced Science':                { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200' },
  'Hidden Physics':                  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200' },
  'Technology':                      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Holistic & Biological Wellness':  { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200' },
  'Forex':                           { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  'Education':                       { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  'General Business':                { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  'Government':                      { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
};

function priceLabel(price: number): string {
  if (price === 0) return 'FREE';
  return `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
}

// Build the URL to serve a file from the Worker's R2 proxy
function r2Url(key: string): string {
  return `/api/r2/${key}`;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onGoHome, onToggleSidebar }) => {
  const [books, setBooks]       = useState<EbookEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<string>('All');
  const [selected, setSelected] = useState<EbookEntry | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [cart, setCart] = useState<EbookEntry[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);

  const currentPage = 1;

  useEffect(() => {
    fetch('/api/library/catalog')
      .then(r => r.json())
      .then((data: EbookEntry[]) => { setBooks(data); setLoading(false); })
      .catch(() => { setError('Failed to load library catalog.'); setLoading(false); });
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const firstPageBooks = books.slice(0, LIBRARY_PAGE_SIZE);
  const niches = ['All', ...Array.from(new Set(firstPageBooks.map(b => b.niche)))];

  const filtered = firstPageBooks.filter(b => {
    const matchSearch = !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      (b.niche || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || b.niche === filter;
    return matchSearch && matchFilter;
  });

  const handleImgError = (id: number) =>
    setImgErrors(prev => ({ ...prev, [id]: true }));

  const addToCart = (book: EbookEntry) => {
    if (book.price === 0 || cart.some(item => item.id === book.id)) return;
    setCart(prev => [...prev, book]);
    setCartOpen(true);
    setSelected(null);
  };

  const removeFromCart = (bookId: number) => {
    setCart(prev => prev.filter(book => book.id !== bookId));
  };

  const cartTotal = cart.reduce((total, book) => total + book.price, 0);

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#FAF7F2] select-none overflow-hidden">

      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <header className="w-full border-b border-stone-200/60 bg-[#FAF7F2] px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 min-h-[48px] shrink-0">
        {onToggleSidebar && (
          <button onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-stone-200/50 transition-colors cursor-pointer shrink-0">
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        <button onClick={onGoHome}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-stone-200/60 border border-stone-200/80 bg-white shadow-2xs transition-all cursor-pointer shrink-0">
          <Home className="w-4 h-4 text-[#A36224]" />
          <span className="text-xs sm:text-sm font-medium">Home</span>
        </button>

        <div className="flex-1 flex items-center justify-center gap-2">
          <BookOpen className="w-4 h-4 text-[#A36224]" />
          <h1 className="text-sm sm:text-lg font-serif tracking-wider font-semibold text-slate-800">
            Trinity Universe Library
          </h1>
          <span className="text-xs font-mono text-slate-400 border border-stone-300 rounded px-1.5 py-0.5 bg-white hidden sm:inline">
            Page {currentPage}
          </span>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setCartOpen(prev => !prev)}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200/80 bg-white text-slate-700 hover:text-[#8a511f] hover:border-[#A36224]/40 shadow-2xs transition-all cursor-pointer"
            aria-expanded={cartOpen}
            aria-label={`Shopping cart with ${cart.length} books`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-semibold">Cart</span>
            {cart.length > 0 && (
              <span className="absolute -right-2 -top-2 min-w-5 h-5 px-1 rounded-full bg-[#A36224] text-white text-[10px] font-bold flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>

          {cartOpen && (
            <div className="absolute right-0 top-11 z-40 w-[min(88vw,340px)] rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Your library cart</p>
                  <p className="text-[11px] text-slate-500">{cart.length} paid {cart.length === 1 ? 'book' : 'books'}</p>
                </div>
                <button onClick={() => setCartOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-stone-100 cursor-pointer" aria-label="Close cart">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {cart.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <ShoppingCart className="w-7 h-7 mx-auto mb-2 text-stone-300" />
                  <p className="text-xs text-slate-500">Your cart is empty.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Add a paid book from its detail window.</p>
                </div>
              ) : (
                <>
                  <div className="max-h-60 overflow-y-auto divide-y divide-stone-100">
                    {cart.map(book => (
                      <div key={book.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-12 rounded-md overflow-hidden shrink-0 bg-stone-100">
                          {book.cover_filename && (
                            <img src={r2Url(book.cover_filename)} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 line-clamp-2">{book.title}</p>
                          <p className="text-xs font-bold text-[#8a511f] mt-1">{priceLabel(book.price)}</p>
                        </div>
                        <button onClick={() => removeFromCart(book.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" aria-label={`Remove ${book.title}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-[#FAF7F2] border-t border-stone-100">
                    <span className="text-xs text-slate-500">Total</span>
                    <span className="text-base font-bold text-slate-900">${cartTotal.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="shrink-0 text-xs text-slate-500 hidden sm:block">
          {books.length} titles
        </div>
      </header>

      {/* ── Search + Filter Bar ──────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 sm:px-6 py-3 bg-[#F6F3EE] border-b border-stone-200/50 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search titles, authors…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-[#A36224]/50 transition-colors"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {niches.map(n => (
            <button key={n}
              onClick={() => setFilter(n)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer font-medium ${
                filter === n
                  ? 'bg-[#A36224] text-white border-[#A36224]'
                  : 'bg-white text-slate-600 border-stone-200 hover:border-[#A36224]/40'
              }`}>
              {n === 'All' ? 'All Niches' : n}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#A36224] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-serif">Loading library…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Page label */}
            <p className="text-xs text-slate-400 mb-4 font-mono">
               Showing {filtered.length} of {Math.min(books.length, LIBRARY_PAGE_SIZE)} titles — Page {currentPage}
            </p>

            {/* ── Book Grid ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-5">
              {filtered.map(book => {
                const nc = NICHE_COLORS[book.niche] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
                const isFree = book.price === 0;
                const hasFile = !!book.file_key;
                const coverUrl = book.cover_filename ? r2Url(book.cover_filename) : null;
                const imgFailed = imgErrors[book.id];

                return (
                  <div key={book.id}
                    onClick={() => setSelected(book)}
                    className="group flex flex-col cursor-pointer rounded-xl overflow-hidden border border-stone-200/80 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

                    {/* Cover Image */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-stone-200">
                      {coverUrl && !imgFailed ? (
                        <img
                          src={coverUrl}
                          alt={book.title}
                          onError={() => handleImgError(book.id)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        /* Fallback cover if image fails */
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-slate-700 to-slate-900">
                          <BookOpen className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-xs text-slate-300 font-serif leading-tight line-clamp-3">{book.title}</p>
                        </div>
                      )}

                      {/* Featured badge */}
                      {book.is_featured === 1 && (
                        <div className="absolute top-1.5 left-1.5">
                          <span className="flex items-center gap-0.5 bg-amber-400/90 backdrop-blur-sm text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5" />Featured
                          </span>
                        </div>
                      )}

                      {/* Price badge */}
                      <div className="absolute top-1.5 right-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${
                          isFree ? 'bg-emerald-500/90 text-white' : 'bg-white/90 text-slate-800'
                        }`}>
                          {priceLabel(book.price)}
                        </span>
                      </div>

                      {/* Book number */}
                      <div className="absolute bottom-1.5 left-1.5">
                        <span className="text-[9px] font-mono bg-black/40 text-white backdrop-blur-sm px-1 py-0.5 rounded">
                          #{book.id}
                        </span>
                      </div>
                    </div>

                    {/* Book Info */}
                    <div className="p-2 flex flex-col gap-1 flex-1">
                      <p className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-2 font-serif">
                        {book.title}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{book.author}</p>
                      <div className="mt-auto pt-1">
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${nc.bg} ${nc.text} ${nc.border}`}>
                          {book.niche}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Page indicator */}
            <div className="mt-8 flex items-center justify-center gap-3 text-xs text-slate-500">
              <button disabled className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-slate-400 cursor-not-allowed">
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="font-mono bg-[#A36224] text-white px-3 py-1.5 rounded-lg font-semibold">1</span>
              <button disabled className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-slate-400 cursor-not-allowed">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </main>

      {/* ── Book Detail Modal ─────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>

            {/* Cover strip */}
            <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
              {selected.cover_filename && !imgErrors[selected.id] ? (
                <img
                  src={r2Url(selected.cover_filename)}
                  alt={selected.title}
                  className="w-full h-full object-cover opacity-70"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <BookOpen className="w-16 h-16 text-slate-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-serif font-bold text-lg leading-tight line-clamp-2">{selected.title}</p>
                <p className="text-slate-300 text-sm mt-0.5">{selected.author}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-xs hover:bg-black/60 transition-colors cursor-pointer">
                ✕
              </button>
            </div>

            {/* Details */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  (NICHE_COLORS[selected.niche] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }).bg
                } ${(NICHE_COLORS[selected.niche] || { bg: '', text: 'text-slate-700', border: '' }).text} ${
                  (NICHE_COLORS[selected.niche] || { bg: '', text: '', border: 'border-slate-200' }).border
                }`}>
                  {selected.niche}
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {priceLabel(selected.price)}
                </span>
              </div>

              {selected.publication_year && (
                <p className="text-xs text-slate-500">Published: {selected.publication_year}</p>
              )}

              {selected.tag && (
                <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  #{selected.tag}
                </span>
              )}

              {selected.price === 0 && selected.file_key ? (
                <a
                  href={r2Url(selected.file_key)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#A36224] hover:bg-[#8a511f] text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                   Download Free
                </a>
              ) : selected.price > 0 ? (
                <button
                  onClick={() => addToCart(selected)}
                  disabled={cart.some(book => book.id === selected.id)}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold text-sm transition-colors cursor-pointer ${
                    cart.some(book => book.id === selected.id)
                      ? 'bg-emerald-600 cursor-default'
                      : 'bg-[#A36224] hover:bg-[#8a511f]'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {cart.some(book => book.id === selected.id) ? 'Added to Cart' : 'Add to Cart'}
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-100 text-slate-400 text-sm">
                  File not available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
