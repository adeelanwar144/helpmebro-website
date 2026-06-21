interface Props {
  src: string;
  alt: string;
  caption?: string;
}

export default function ArticleSectionImage({ src, alt, caption }: Props) {
  return (
    <figure className="my-10 -mx-4 sm:mx-0">
      <div className="overflow-hidden rounded-2xl border-2 border-brand-teal/25 bg-white shadow-lg sm:rounded-xl">
        <img src={src} alt={alt} className="w-full h-48 sm:h-56 object-cover" />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-xs font-medium text-brand-teal-dark">{caption}</figcaption>
      )}
    </figure>
  );
}
