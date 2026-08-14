import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2, ShoppingBag } from "lucide-react";

interface FourthwallVariant {
  id: string;
  name: string;
  unitPrice: { value: number; currency: string };
}

interface FourthwallProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  state: { type: "AVAILABLE" | "SOLD_OUT" };
  images: { transformedUrl: string; url: string }[];
  variants: FourthwallVariant[];
}

interface ProductResponse {
  results: FourthwallProduct[];
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export function FourthwallMerch({
  collection = "all",
  currency = "USD",
  shopDomain = "vylanous-shop.fourthwall.com",
}: {
  collection?: string;
  currency?: string;
  shopDomain?: string;
}) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["fourthwall-products", collection, currency],
    queryFn: async () => {
      const params = new URLSearchParams({ currency, size: "24" });
      const response = await fetch(
        `/api/fourthwall/collections/${encodeURIComponent(collection)}/products?${params}`,
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Merch catalog is unavailable right now.");
      }
      return response.json() as Promise<ProductResponse>;
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <Loader2 aria-label="Loading merchandise" className="animate-spin text-vb-purple-bright" />
    );
  }

  if (error || !data?.results.length) {
    return (
      <a
        href={`https://${shopDomain}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 font-sub uppercase tracking-wider text-vb-purple-bright hover:text-white transition"
      >
        Visit the official store <ExternalLink size={16} />
      </a>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {data.results.map((product) => {
        const variant = product.variants[0];
        const soldOut = product.state.type === "SOLD_OUT" || !variant;
        return (
          <article
            key={product.id}
            className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-vb-ink"
          >
            <ProductImageGallery name={product.name} images={product.images} />
            <div className="p-5">
              <h3 className="font-sub text-xl uppercase tracking-wide text-vb-silver-bright">
                {product.name}
              </h3>
              {variant && (
                <p className="mt-1 font-body text-sm text-vb-silver/60">
                  {formatMoney(variant.unitPrice.value, variant.unitPrice.currency)}
                </p>
              )}
              <a
                href={
                  soldOut
                    ? `https://${shopDomain}/products/${product.slug}`
                    : `/api/fourthwall/checkout?${new URLSearchParams({
                        variantId: variant.id,
                        quantity: "1",
                        currency,
                      })}`
                }
                className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-sub uppercase tracking-wider transition ${
                  soldOut
                    ? "border border-white/10 text-vb-silver/70 hover:bg-white/[0.05]"
                    : "bg-vb-purple text-white hover:bg-vb-purple-bright"
                }`}
              >
                {soldOut ? "View product" : "Buy now"} <ExternalLink size={15} />
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ProductImageGallery({
  name,
  images,
}: {
  name: string;
  images: FourthwallProduct["images"];
}) {
  const galleryImages = images
    .map((image) => image.transformedUrl || image.url)
    .filter((url, index, urls) => Boolean(url) && urls.indexOf(url) === index);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = galleryImages[Math.min(activeIndex, Math.max(galleryImages.length - 1, 0))];

  if (!activeImage) {
    return (
      <div className="grid aspect-square place-items-center bg-white/[0.04] text-vb-silver/30">
        <ShoppingBag size={28} />
      </div>
    );
  }

  return (
    <div className="bg-white/[0.04] p-2">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-vb-black/30">
        <img
          src={activeImage}
          alt={`${name} — view ${activeIndex + 1} of ${galleryImages.length}`}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {galleryImages.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-vb-black/75 px-2.5 py-1 font-sub text-xs tracking-wide text-vb-silver-bright">
            {activeIndex + 1} / {galleryImages.length}
          </span>
        )}
      </div>
      {galleryImages.length > 1 && (
        <div
          className="mt-2 flex gap-2 overflow-x-auto pb-0.5"
          aria-label={`${name} image gallery`}
        >
          {galleryImages.map((image, index) => (
            <button
              key={image}
              type="button"
              aria-label={`Show ${name} photo ${index + 1} of ${galleryImages.length}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vb-purple-bright ${
                index === activeIndex
                  ? "border-vb-purple-bright ring-1 ring-vb-purple-bright"
                  : "border-white/10 hover:border-white/45"
              }`}
            >
              <img
                src={image}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
