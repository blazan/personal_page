import Image from "next/image";

/**
 * Image wrapper that skips Next.js optimisation for locally stored uploads.
 *
 * Uploads are already WebP, already resized, and already served with an
 * immutable cache header from /api/media. Sending them through the image
 * optimiser a second time would cost CPU on every cold cache and gain nothing.
 * Remote seed images (Unsplash) still get the full optimisation pipeline.
 */
export default function SmartImage({
  src,
  alt,
  className = "",
  sizes,
  priority = false,
  fill = false,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  const isLocalUpload = src.startsWith("/api/media/");

  if (isLocalUpload) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...(width && height && !fill ? { width, height } : {})}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      priority={priority}
      fill={fill}
      {...(width && height && !fill ? { width, height } : {})}
    />
  );
}
