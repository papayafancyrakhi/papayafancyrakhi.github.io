// Supabase client
supabase = window.supabase.createClient(SUPA_URL, SUPA_PUBLIC_KEY);

// Render a single product card
function renderProductCard(product) {
	const div = document.createElement("div");
	div.className = "product-card";

	div.innerHTML = `
		<div class="card shell-card gold-outlier">
			<div class="image-wrap">
				<img src="${product.image}" alt="${product.title}">
			</div>
			<div class="card-body text-center">
				<h5 class="product-title">${product.title}</h5>
			</div>
		</div>
	`;

	div.addEventListener("click", () => {
		sessionStorage.setItem("selectedProductId", product.id);
		location.href = "/product.html";
	});

	return div;
}

// Fetch best sellers from Supabase with caching
async function loadBestSellers() {
	const localData = localStorage.getItem("bestSellers");
	const localTimestamps = localStorage.getItem("bestSellersTimestamps");

	// Fetch only id and updated_at first (ignore show_in_catalogue)
	const { data: productsMeta, error: metaError } = await supabase
		.from("products")
		.select("id, updated_at")
		.eq("is_best_seller", true);

	if (metaError) {
		console.error("Supabase fetch error:", metaError);
		return;
	}

	let shouldUpdate = false;
	if (!localData || !localTimestamps) {
		shouldUpdate = true;
	} else {
		const localTimestampsParsed = JSON.parse(localTimestamps);
		for (let p of productsMeta) {
			if (
				!localTimestampsParsed[p.id] ||
				localTimestampsParsed[p.id] !== p.updated_at
			) {
				console.log(
					`Product ${p.id} has new update date. Will fetch full data.`,
				);
				shouldUpdate = true;
				break;
			}
		}
		if (!shouldUpdate)
			console.log("All products are up to date. Using localStorage.");
	}

	let products;
	if (shouldUpdate) {
		const { data, error } = await supabase
			.from("products")
			.select("id,title,image,is_best_seller,updated_at")
			.eq("is_best_seller", true)
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Supabase fetch error:", error);
			return;
		}

		products = data;

		// Save data & timestamps to localStorage
		localStorage.setItem("bestSellers", JSON.stringify(products));
		const timestamps = {};
		products.forEach((p) => (timestamps[p.id] = p.updated_at));
		localStorage.setItem("bestSellersTimestamps", JSON.stringify(timestamps));
	} else {
		products = JSON.parse(localData);
	}

	const container = document.getElementById("bestSellers");
	container.innerHTML = "";

	// Render cards
	products.forEach((p) => container.appendChild(renderProductCard(p)));
	products.forEach((p) => container.appendChild(renderProductCard(p))); // duplicate for scroll

	// ---------- AUTO SCROLL ----------
	let speed = 0.5;
	let isUserInteracting = false;

	function autoScroll() {
		if (!isUserInteracting) {
			container.scrollLeft += speed;
			if (container.scrollLeft >= container.scrollWidth / 2) {
				container.scrollLeft = 0;
			}
		}
		requestAnimationFrame(autoScroll);
	}
	autoScroll();

	// ---------- MOUSE DRAG ----------
	let isDown = false;
	let startX = 0;
	let scrollStart = 0;

	container.addEventListener("mousedown", (e) => {
		isDown = true;
		isUserInteracting = true;
		startX = e.pageX - container.offsetLeft;
		scrollStart = container.scrollLeft;
	});

	container.addEventListener("mouseup", () => {
		isDown = false;
		isUserInteracting = false;
	});

	container.addEventListener("mouseleave", () => {
		isDown = false;
		isUserInteracting = false;
	});

	container.addEventListener("mousemove", (e) => {
		if (!isDown) return;
		e.preventDefault();
		container.scrollLeft = scrollStart - (e.pageX - startX) * 2;
	});

	// ---------- TOUCH ----------
	let touchStartX = 0;
	let touchScrollStart = 0;

	container.addEventListener(
		"touchstart",
		(e) => {
			isUserInteracting = true;
			touchStartX = e.touches[0].pageX;
			touchScrollStart = container.scrollLeft;
		},
		{ passive: true },
	);

	container.addEventListener(
		"touchmove",
		(e) => {
			container.scrollLeft =
				touchScrollStart - (e.touches[0].pageX - touchStartX) * 2;
		},
		{ passive: true },
	);

	container.addEventListener(
		"touchend",
		() => {
			isUserInteracting = false;
		},
		{ passive: true },
	);
}

// Run
loadBestSellers();
