// Supabase client
supabase = window.supabase.createClient(SUPA_URL, SUPA_PUBLIC_KEY);

async function loadBestSellers() {
	const localData = localStorage.getItem("bestSellers");
	const localTimestamps = localStorage.getItem("bestSellersTimestamps");

	let localProducts = JSON.parse(localData || "[]");
	let localTimestampsParsed = JSON.parse(localTimestamps || "{}");

	// 1. Get live product ids
	const { data: productsMeta, error: metaError } = await supabase
		.from("products")
		.select("id, updated_at")
		.eq("is_best_seller", true);

	if (metaError) return console.error(metaError);

	if (!productsMeta || productsMeta.length === 0) {
		localStorage.removeItem("bestSellers");
		localStorage.removeItem("bestSellersTimestamps");

		document.getElementById("bestSellers").innerHTML =
			'<div class="empty-state">No best sellers.</div>';
		return;
	}

	const liveIds = new Set();
	const changedIds = [];

	for (const p of productsMeta) {
		liveIds.add(p.id);

		if (
			!localTimestampsParsed[p.id] ||
			localTimestampsParsed[p.id] !== p.updated_at
		)
			changedIds.push(p.id);
	}

	// 2. Remove deleted products from cache
	localProducts = localProducts.filter((p) => liveIds.has(p.id));

	// 3. Fetch changed products
	let updatedProducts = [];
	if (changedIds.length > 0) {
		const { data, error } = await supabase
			.from("products")
			.select(
				"id,title,description,image,gallery,tags,price,discount,updated_at,is_best_seller",
			)
			.in("id", changedIds);

		if (error) return console.error(error);

		updatedProducts = data;
	}

	// 4. Merge
	const productMap = new Map(localProducts.map((p) => [p.id, p]));
	updatedProducts.forEach((p) => {
		productMap.set(p.id, p);
		localTimestampsParsed[p.id] = p.updated_at;
	});

	const bestSellers = Array.from(productMap.values());

	// 5. Save
	localStorage.setItem("bestSellers", JSON.stringify(bestSellers));
	localStorage.setItem(
		"bestSellersTimestamps",
		JSON.stringify(localTimestampsParsed),
	);

	// 6. Render
	const container = document.getElementById("bestSellers");
	container.innerHTML = "";

	if (bestSellers.length === 0) {
		container.innerHTML = '<div class="empty-state">No best sellers.</div>';
		return;
	}

	bestSellers.forEach((p) => {
		const div = document.createElement("div");
		div.className = "product-card";

		div.innerHTML = `
			<div class="card shell-card gold-outlier">
				<div class="image-wrap">
					<img src="${p.image}" alt="${p.title}" width="260" height="260">
				</div>
				<div class="card-body text-center">
					<h5 class="product-title">${p.title}</h5>
				</div>
			</div>
		`;

		div.addEventListener("click", () => {
			location.href = `/product#id=${encodeURIComponent(p.id)}`;
		});

		container.appendChild(div);
	});

	// Optional: duplicate for scrolling like before
	bestSellers.forEach((p) => container.appendChild(renderProductCard(p)));
}

loadBestSellers();
