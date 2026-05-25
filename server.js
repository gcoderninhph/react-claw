import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = "https://netshort.dramafren.org";
const DRAMAFREN_BASE_URL = "https://dramafren.org";

app.use(cors());
app.use(express.json());

function parseMoviesFromHtml(html) {
  const $ = cheerio.load(html);
  const seen = new Set();
  const movies = [];

  $('a[href*="index.php?page=detail&id="]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const id = href.match(/id=(\d+)/)?.[1];
    if (!id || seen.has(id)) {
      return;
    }

    const titleFromCard = $(el).find("h3").first().text().trim();
    const img = $(el).find("img").first();
    const titleFromAlt = (img.attr("alt") || "").trim();
    const poster = img.attr("src") || null;
    const title = titleFromCard || titleFromAlt || null;

    if (!title) {
      return;
    }

    seen.add(id);
    movies.push({
      id,
      title,
      poster,
      detailUrl: `${BASE_URL}/index.php?page=detail&id=${id}`
    });
  });

  const pageText = $("body").text();
  const pageMatch = pageText.match(/Page\s+(\d+)\s+of\s+(\d+)/i);
  const pagination = pageMatch
    ? {
        currentPage: Number(pageMatch[1]),
        totalPages: Number(pageMatch[2])
      }
    : null;

  return { movies, pagination };
}

async function fetchHtml(url) {
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Accept: "text/html,application/xhtml+xml"
    },
    timeout: 20000
  });
  return data;
}

function parseEpisodesFromDetailHtml(html, movieId) {
  const $ = cheerio.load(html);
  const episodes = [];
  const seen = new Set();

  $('a[href*="index.php?page=watch&id="]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const epMatch = href.match(/[?&]ep=(\d+)/);
    if (!epMatch) {
      return;
    }

    const episode = Number(epMatch[1]);
    if (seen.has(episode)) {
      return;
    }

    seen.add(episode);
    episodes.push({
      episode,
      watchUrl: `${BASE_URL}/index.php?page=watch&id=${encodeURIComponent(movieId)}&ep=${episode}`
    });
  });

  episodes.sort((a, b) => a.episode - b.episode);
  return episodes;
}

function parseStreamUrlFromWatchHtml(html) {
  const $ = cheerio.load(html);
  const sourceUrl = $("video source").first().attr("src") || null;
  if (sourceUrl) {
    return sourceUrl;
  }

  const scriptText = $("script")
    .map((_, el) => $(el).html() || "")
    .get()
    .join("\n");
  const fallback = scriptText.match(/serverUrl1\s*=\s*"([^"]+)"/);
  return fallback?.[1] || null;
}

function normalizeUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function decodeBase64Utf8(input) {
  try {
    return Buffer.from(input, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function extractIframeSrcFromHtmlFragment(htmlFragment) {
  if (!htmlFragment) {
    return null;
  }
  const $ = cheerio.load(htmlFragment);
  return $("iframe").first().attr("src") || null;
}

function parseDramafrenSeriesFromHomeHtml(html) {
  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();

  $('a[href*="/series/"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const absoluteUrl = normalizeUrl(DRAMAFREN_BASE_URL, href);
    if (!absoluteUrl) {
      return;
    }

    const slugMatch = absoluteUrl.match(/\/series\/([^/?#]+)/i);
    const slug = slugMatch?.[1];
    if (!slug || seen.has(slug)) {
      return;
    }

    const titleFromHeading = $(el).find("h2").first().text().trim();
    const titleFromAttr = ($(el).attr("title") || "").trim();
    const title = titleFromHeading || titleFromAttr || slug;
    const poster = $(el).find("img").first().attr("src") || null;

    seen.add(slug);
    items.push({
      slug,
      title,
      poster,
      seriesUrl: absoluteUrl,
      watchApiUrl: `/api/dramafren/series/${slug}`
    });
  });

  return items;
}

function parseDramafrenEpisodesFromSeriesHtml(html) {
  const $ = cheerio.load(html);
  const title = $("h1.entry-title").first().text().trim() || $("title").text().trim() || null;
  const poster = $(".thumb img, .limage img, article img").first().attr("src") || null;
  const episodes = [];

  $(".epsdlist li a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const watchUrl = normalizeUrl(DRAMAFREN_BASE_URL, href);
    if (!watchUrl) {
      return;
    }

    const epNumText = $(el).find(".epl-num").first().text().trim();
    const epTitle = $(el).find(".epl-title").first().text().trim() || null;
    const epDate = $(el).find(".epl-date").first().text().trim() || null;
    const epNumber = Number((epNumText.match(/(\d+)/) || [])[1]) || null;

    episodes.push({
      episode: epNumber,
      episodeLabel: epNumText || null,
      title: epTitle,
      date: epDate,
      watchUrl
    });
  });

  return { title, poster, episodes };
}

function parseDramafrenMirrorsFromWatchHtml(html) {
  const $ = cheerio.load(html);
  const title = $("h1.entry-title").first().text().trim() || $("title").text().trim() || null;
  const seriesUrl = $(".breadcrumb a[href*='/series/']").first().attr("href") || null;
  const currentIframe = $("#embed_holder iframe").first().attr("src") || null;
  const mirrors = [];

  $("ul.mirror a").each((_, el) => {
    const name = $(el).text().trim() || null;
    const dataEm = $(el).attr("data-em") || "";
    const dataHref = $(el).attr("data-href") || "";
    const decodedHtml = decodeBase64Utf8(dataEm);
    const embeddedUrl = extractIframeSrcFromHtmlFragment(decodedHtml);

    mirrors.push({
      name,
      mirrorPage: normalizeUrl(DRAMAFREN_BASE_URL, dataHref),
      embeddedUrl
    });
  });

  return {
    title,
    seriesUrl,
    currentIframe,
    mirrors
  };
}

app.get("/api/movies", async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const url = `${BASE_URL}/index.php?page=home&p_hist=${page}`;
    const html = await fetchHtml(url);
    const { movies, pagination } = parseMoviesFromHtml(html);

    res.json({
      success: true,
      source: "netshort.dramafren.org",
      endpoint: "home",
      page,
      count: movies.length,
      pagination,
      movies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch movie list",
      error: error.message
    });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const lang = String(req.query.lang || "English").trim();

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Missing query param: q"
      });
    }

    const url = `${BASE_URL}/index.php?page=search_result&q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}`;
    const html = await fetchHtml(url);
    const { movies, pagination } = parseMoviesFromHtml(html);

    return res.json({
      success: true,
      source: "netshort.dramafren.org",
      endpoint: "search_result",
      query: q,
      lang,
      count: movies.length,
      pagination,
      movies
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to search movies",
      error: error.message
    });
  }
});

app.get("/api/movie/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const url = `${BASE_URL}/index.php?page=detail&id=${encodeURIComponent(id)}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const title = $("h1").first().text().trim() || $("title").text().trim() || null;
    const poster = $("img").first().attr("src") || null;

    const episodes = parseEpisodesFromDetailHtml(html, id);

    res.json({
      success: true,
      source: "netshort.dramafren.org",
      id,
      title,
      poster,
      detailUrl: url,
      episodeCount: episodes.length,
      episodes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch movie detail",
      error: error.message
    });
  }
});

app.get("/api/movie/:id/episodes", async (req, res) => {
  try {
    const { id } = req.params;
    const detailUrl = `${BASE_URL}/index.php?page=detail&id=${encodeURIComponent(id)}`;
    const detailHtml = await fetchHtml(detailUrl);
    const episodes = parseEpisodesFromDetailHtml(detailHtml, id);

    res.json({
      success: true,
      source: "netshort.dramafren.org",
      id,
      detailUrl,
      episodeCount: episodes.length,
      episodes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch movie episodes",
      error: error.message
    });
  }
});

app.get("/api/movie/:id/episode/:ep", async (req, res) => {
  try {
    const { id, ep } = req.params;
    const episode = Math.max(Number(ep) || 1, 1);
    const watchUrl = `${BASE_URL}/index.php?page=watch&id=${encodeURIComponent(id)}&ep=${episode}`;
    const watchHtml = await fetchHtml(watchUrl);
    const streamUrl = parseStreamUrlFromWatchHtml(watchHtml);

    res.json({
      success: true,
      source: "netshort.dramafren.org",
      id,
      episode,
      watchUrl,
      streamUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch episode stream",
      error: error.message
    });
  }
});

app.get("/api/dramafren/series", async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const url = page === 1 ? `${DRAMAFREN_BASE_URL}/` : `${DRAMAFREN_BASE_URL}/page/${page}/`;
    const html = await fetchHtml(url);
    const series = parseDramafrenSeriesFromHomeHtml(html);

    res.json({
      success: true,
      source: "dramafren.org",
      page,
      count: series.length,
      series
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch Dramafren series",
      error: error.message
    });
  }
});

app.get("/api/dramafren/series/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const seriesUrl = `${DRAMAFREN_BASE_URL}/series/${encodeURIComponent(slug)}/`;
    const html = await fetchHtml(seriesUrl);
    const { title, poster, episodes } = parseDramafrenEpisodesFromSeriesHtml(html);

    res.json({
      success: true,
      source: "dramafren.org",
      slug,
      title,
      poster,
      seriesUrl,
      episodeCount: episodes.length,
      episodes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch Dramafren episodes",
      error: error.message
    });
  }
});

app.get("/api/dramafren/watch/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const watchUrl = `${DRAMAFREN_BASE_URL}/watch/${encodeURIComponent(slug)}/`;
    const html = await fetchHtml(watchUrl);
    const { title, seriesUrl, currentIframe, mirrors } = parseDramafrenMirrorsFromWatchHtml(html);

    res.json({
      success: true,
      source: "dramafren.org",
      slug,
      title,
      watchUrl,
      seriesUrl,
      currentIframe,
      mirrorCount: mirrors.length,
      mirrors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch Dramafren watch mirrors",
      error: error.message
    });
  }
});

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Proxy API running on http://localhost:${PORT}`);
});