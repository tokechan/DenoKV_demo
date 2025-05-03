import { Hono } from "hono";
import { DOMParser } from "@b-fuze/deno-dom";

const app = new Hono();

const kv = await Deno.openKv();


async function fetchHtmlTitle(url: string): Promise<string | undefined> {
  try {
      const res = await fetch(url);
      const html = await res.text();

      const parser = new DOMParser();
      const document = parser.parseFromString(html, "text/html");

      const titleElment = document.querySelector("title");
      const title = titleElment?.textContent;

      return title;
    } catch {
      return undefined;
    }
}

app.get("/", (c) => {
  return c.json({ message: "hello Hono!"});
});

app.get("/api/title", async (c) => {
  const url = c.req.query("url") ?? "";
  
  const title =await fetchHtmlTitle(url);
  
  if (!title) {
    return c.json({ message: "Not get page titel"}, 400);
  }
  return c.json<{ url: string; title: string }> ({ url, title });
});

app.post("/api/bookmarks", async (c) => {
  const body = await c.req.parseBody<{ url: string }>();
  const url = body.url;

  const title = await fetchHtmlTitle(url);
  
  const result = await kv.set(["bookmark", url], { url, title });
  return c.json({ result }, 201);
});




Deno.serve(app.fetch)
