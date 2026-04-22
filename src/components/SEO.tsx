import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  type?: string;
  image?: string;
  schema?: Record<string, any> | Record<string, any>[];
  noindex?: boolean;
}

export default function SEO({ 
  title, 
  description, 
  canonical, 
  type = 'website', 
  image = 'https://flatsonly.in/og-image.jpg',
  schema,
  noindex = false
}: SEOProps) {
  const siteName = 'FlatsOnly.in';
  
  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{`${title} | ${siteName}`}</title>
      <meta name="description" content={description} />
      
      {/* Indexing instructions for bots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Canonical Link */}
      {canonical && <link rel="canonical" href={`https://flatsonly.in${canonical}`} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      {canonical && <meta property="og:url" content={`https://flatsonly.in${canonical}`} />}
      <meta property="og:title" content={`${title} | ${siteName}`} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${title} | ${siteName}`} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* AEO / GEO / AIO Specifics: Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
