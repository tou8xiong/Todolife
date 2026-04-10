import { MetadataRoute } from "next";

const BASE_URL = "https://todolife.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/newtasks", "/mytasks", "/completetasks", "/dashboard",
          "/settimepage", "/noteidea", "/pdfeditor", "/background-removal",
          "/agent", "/formlogin", "/formsignup"],
        disallow: ["/api/", "/profile"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
