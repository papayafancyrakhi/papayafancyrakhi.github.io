// Supabase client
supabase = window.supabase.createClient(SUPA_URL, SUPA_PUBLIC_KEY);

// Load catalogue products with caching
async function loadCatalogue() {
	console.log("Starting catalogue load...");

	const localData = localStorage.getItem("catalogueProducts");
	const localTimestamps = localStorage.getItem("catalogueTimestamps");

	// Fetch only id and updated_at for catalogue products
	console.log("Fetching catalogue product metadata from Supabase...");
	const { data: productsMeta, error: metaError } = await supabase
		.from("products")
		.select("id, updated_at")
		.eq("show_in_catalogue", true);

	if (metaError) {
		console.error("Supabase fetch error:", metaError);
		return;
	}
	console.log("Fetched metadata:", productsMeta);

	let shouldUpdate = false;
	if (!localData || !localTimestamps) {
		console.log("No localStorage found. Will fetch full catalogue.");
		shouldUpdate = true;
	} else {
		const localTimestampsParsed = JSON.parse(localTimestamps);
		for (let p of productsMeta) {
			if (
				!localTimestampsParsed[p.id] ||
				localTimestampsParsed[p.id] !== p.updated_at
			) {
				console.log(`Product ${p.id} updated. Will fetch full catalogue.`);
				shouldUpdate = true;
				break;
			}
		}
		if (!shouldUpdate)
			console.log("All catalogue products up to date. Using localStorage.");
	}

	let catalogueProducts;
	if (shouldUpdate) {
		console.log("Fetching full catalogue products from Supabase...");
		const { data, error } = await supabase
			.from("products")
			.select("id,title,image,tags,price,discount,updated_at,is_best_seller")
			.eq("show_in_catalogue", true)
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Supabase fetch error:", error);
			return;
		}

		// Calculate old price dynamically
		catalogueProducts = data.map((p) => {
			const discount = p.discount || 0;
			const old = discount > 0 ? Math.round(p.price / (1 - discount / 100)) : 0;
			return {
				...p,
				old,
				discount,
			};
		});

		// Save data & timestamps to localStorage
		localStorage.setItem(
			"catalogueProducts",
			JSON.stringify(catalogueProducts),
		);
		const timestamps = {};
		catalogueProducts.forEach((p) => (timestamps[p.id] = p.updated_at));
		localStorage.setItem("catalogueTimestamps", JSON.stringify(timestamps));
		console.log("Cached catalogue products and timestamps.");
	} else {
		catalogueProducts = JSON.parse(localData);
		console.log(
			"Loaded catalogue products from localStorage:",
			catalogueProducts,
		);
	}

	const container = document.getElementById("catalogue");
	const tagFilters = document.getElementById("categoryFilters"); // renamed for tags
	const sortSelect = document.getElementById("sortCatalogue");

	// --- Tags for filter buttons ---
	const tags = [
		...new Set(catalogueProducts.flatMap((p) => p.tags).filter(Boolean)),
	];

	// --- Create filter buttons ---
	function createButtons() {
		tagFilters.innerHTML = "";

		const allBtn = document.createElement("button");
		allBtn.className = "desktop-btn btn btn-outline-secondary btn-sm active";
		allBtn.textContent = "All";
		allBtn.onclick = () => filterProducts("All");
		tagFilters.appendChild(allBtn);

		tags.forEach((tag) => {
			const btn = document.createElement("button");
			btn.className = "desktop-btn btn btn-outline-secondary btn-sm";
			btn.textContent = tag;
			btn.onclick = () => filterProducts(tag);
			tagFilters.appendChild(btn);
		});
	}

	// --- Filter products by tag ---
	function filterProducts(tag) {
		const filtered =
			tag === "All"
				? catalogueProducts
				: catalogueProducts.filter((p) => p.tags.includes(tag));

		document.querySelectorAll(".desktop-btn").forEach((b) => {
			b.classList.toggle("active", b.textContent === tag);
		});

		renderProducts(filtered);
	}

	// --- Sorting ---
	sortSelect.addEventListener("change", (e) => {
		const activeBtn = document.querySelector(".desktop-btn.active");
		const activeTag = activeBtn ? activeBtn.textContent : "All";

		let sorted = [...catalogueProducts];
		if (e.target.value === "price-asc")
			sorted.sort((a, b) => a.price - b.price);
		else if (e.target.value === "price-desc")
			sorted.sort((a, b) => b.price - a.price);
		else if (e.target.value === "discount")
			sorted.sort((a, b) => b.discount - a.discount);

		const filtered =
			activeTag === "All"
				? sorted
				: sorted.filter((p) => p.tags.includes(activeTag));

		renderProducts(filtered);
	});

	// --- Render products ---
	function renderProducts(list) {
		container.innerHTML = "";

		list.forEach((p) => {
			const wrapper = document.createElement("div");
			wrapper.className = "col-6 col-md-4 col-lg-3 col-xl-2";

			wrapper.innerHTML = `
				<div class="card product-card gold-outlier h-100">
					<div class="image-wrap">
						<img src="${p.image}" alt="${p.title}">
						${p.discount > 0 ? `<span class="discount-badge">${p.discount}% OFF</span>` : ""}
					</div>
					<div class="card-body text-center">
						<div class="product-title">${p.title}</div>
						<div class="price">Rs ${p.price} ${p.old > 0 ? `<span class="old-price">Rs ${p.old}</span>` : ""}</div>
					</div>
				</div>
			`;

			wrapper.querySelector(".product-card").addEventListener("click", () => {
				sessionStorage.setItem("selectedProductId", p.id);
				console.log("Catalogue product clicked:", p.id);
				window.location.href = "/product.html";
			});

			container.appendChild(wrapper);
		});
	}

	// --- Initialize catalogue ---
	createButtons();
	renderProducts(catalogueProducts);
}

// Run
loadCatalogue();
