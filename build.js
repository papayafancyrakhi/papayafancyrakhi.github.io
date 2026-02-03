import fs from "fs";
import sharp from "sharp";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// Config
const SITE = "https://papayafancyrakhi.github.io";
const SUPA_URL = "https://kalnrdppoweegikefipm.supabase.co";
const SUPA_KEY = "sb_publishable_8aQ_4ZPHfA1SKbVpg5BylA_IuEuJfcd";
const TEMPLATE_PATH = "templates/product.html";
const OUTPUT_DIR = "public";

// Create Supabase client
const supabase = createClient(SUPA_URL, SUPA_KEY);

// Helper: convert image to WebP
async function toWebp(url, out) {
	try {
		console.log(`Downloading image: ${url}`);
		const res = await fetch(url);
		if (!res.ok) throw new Error(`Failed to fetch ${url}`);
		const buf = Buffer.from(await res.arrayBuffer());
		await sharp(buf).resize(1200).webp({ quality: 80 }).toFile(out);
		console.log(`Saved WebP: ${out}`);
	} catch (err) {
		console.error(`Error processing image ${url}:`, err.message);
	}
}

// Helper: build carousel HTML
function buildCarousel(id, count) {
	let html = "";
	for (let i = 0; i < count; i++) {
		const file = i === 0 ? "main.webp" : `${i}.webp`;
		html += `
<div class="carousel-item ${i === 0 ? "active" : ""}">
  <img src="/assets/${id}/${file}" class="d-block w-100 product-image">
</div>`;
	}
	return html;
}

// Helper: build gallery HTML
function buildGallery(id, count) {
	let html = "";
	for (let i = 0; i < count; i++) {
		const file = i === 0 ? "main.webp" : `${i}.webp`;
		html += `<img src="/assets/${id}/${file}" class="${i === 0 ? "active" : ""}">`;
	}
	return html;
}

// Main function
async function buildStore() {
	if (!fs.existsSync(TEMPLATE_PATH)) {
		console.error("Template file not found:", TEMPLATE_PATH);
		return;
	}

	const TEMPLATE = fs.readFileSync(TEMPLATE_PATH, "utf8");

	console.log("Fetching products from Supabase...");
	const { data: products, error } = await supabase.from("products").select("*");
	if (error) {
		console.error("Supabase fetch error:", error.message);
		return;
	}
	if (!products || products.length === 0) {
		console.log("No products found.");
		return;
	}

	console.log(`Found ${products.length} products.`);

	for (const p of products) {
		const id = p.id;
		const productDir = `${OUTPUT_DIR}/product/${id}`;
		const assetsDir = `${OUTPUT_DIR}/assets/${id}`;

		fs.mkdirSync(productDir, { recursive: true });
		fs.mkdirSync(assetsDir, { recursive: true });

		const images = [p.image, ...(p.gallery || [])];

		// Download and convert images
		for (let i = 0; i < images.length; i++) {
			const name = i === 0 ? "main.webp" : `${i}.webp`;
			await toWebp(images[i], `${assetsDir}/${name}`);
		}

		const discount = Math.min(p.discount || 0, 100);
		const oldPrice =
			discount > 0 && discount < 100
				? Math.round(p.price / (1 - discount / 100))
				: "";

		// Build HTML
		const html = TEMPLATE.replaceAll("{{TITLE}}", p.title)
			.replaceAll("{{DESCRIPTION}}", p.description || "")
			.replaceAll("{{PRICE}}", p.price)
			.replaceAll("{{OLD_PRICE}}", oldPrice ? "Rs " + oldPrice : "")
			.replaceAll(
				"{{DISCOUNT}}",
				discount ? (discount === 100 ? "FREE" : discount + "% OFF") : "",
			)
			.replaceAll("{{TAGS}}", (p.tags || []).join(", "))
			.replaceAll("{{MAIN_IMAGE}}", `/assets/${id}/main.webp`)
			.replaceAll("{{URL}}", `${SITE}/product/${id}/`)
			.replace("{{CAROUSEL}}", buildCarousel(id, images.length))
			.replace("{{GALLERY}}", buildGallery(id, images.length));

		fs.writeFileSync(`${productDir}/index.html`, html);
		console.log(`Generated: ${productDir}/index.html`);
	}

	console.log("Static store build complete!");
}

// Run
buildStore();
