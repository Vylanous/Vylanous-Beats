import { useState } from "react";
import { Link } from "wouter";
import { Instagram, Youtube, Music2, Mail, Check } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setDone(true);
      setEmail("");
    } catch {
      setDone(true);
    }
  };

  return (
    <footer className="relative border-t border-white/[0.06] bg-vb-black mt-24">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <img src="/brand/logo-full-transparent.png" alt="Vylanous Beats" className="h-24 w-auto -ml-2" />
          <p className="font-body text-vb-muted max-w-sm mt-3">
            Premium hip-hop beats. Rhythmic expression, melodious compositions, affordable licensing for
            independent artists.
          </p>
          <p className="font-body text-sm text-vb-muted mt-4 flex items-center gap-2">
            <Mail size={15} className="text-vb-purple-bright" />
            vylanousbeats@gmail.com
          </p>
        </div>

        <div>
          <h4 className="font-sub uppercase tracking-widest text-vb-silver text-lg mb-4">Explore</h4>
          <ul className="space-y-2.5 font-body text-vb-muted">
            <li><Link to="/beats" className="hover:text-vb-purple-bright">Beat Catalog</Link></li>
            <li><Link to="/licensing" className="hover:text-vb-purple-bright">Licensing</Link></li>
            <li><Link to="/about" className="hover:text-vb-purple-bright">About</Link></li>
            <li><Link to="/cart" className="hover:text-vb-purple-bright">Cart</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-sub uppercase tracking-widest text-vb-silver text-lg mb-4">Get New Drops</h4>
          {done ? (
            <p className="font-body text-vb-purple-bright flex items-center gap-2">
              <Check size={16} /> You're on the list.
            </p>
          ) : (
            <form onSubmit={subscribe} className="flex flex-col gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-vb-ink border border-white/10 rounded-lg px-3 py-2.5 text-sm font-body focus:border-vb-purple outline-none"
              />
              <button className="font-sub uppercase tracking-wider py-2.5 rounded-lg bg-vb-purple text-white hover:bg-vb-purple-bright transition-colors">
                Subscribe
              </button>
            </form>
          )}
          <div className="flex gap-3 mt-5">
            {[Instagram, Youtube, Music2].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid place-items-center w-9 h-9 rounded-lg bg-vb-ink border border-white/10 text-vb-silver hover:text-vb-purple-bright hover:border-vb-purple/60 transition-colors"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-vb-muted text-sm font-body">
          <p>© {new Date().getFullYear()} Vylanous Beats. All rights reserved.</p>
          <p className="font-sub uppercase tracking-wider">Prod. Vylanous Beats</p>
        </div>
      </div>
    </footer>
  );
}
