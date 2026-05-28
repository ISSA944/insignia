import { BRANDS } from "../../data/brands";

export default function BrandMarquee() {
  return (
    <div className="mt-24 w-full max-w-md overflow-hidden">
      <div className="marquee-track">
        {[...BRANDS, ...BRANDS].map((brand, i) => (
          <span
            key={i}
            className="mx-7 shrink-0 text-black/60 whitespace-nowrap"
            style={brand.style}
          >
            {brand.name}
          </span>
        ))}
      </div>
    </div>
  );
}
