// Fetch products JSON
fetch("/data/products.json")
	.then((res) => res.json())
	.then((products) => {
		const container = document.getElementById("catalogue");
		const categoryFilters = document.getElementById("categoryFilters");
		const sortSelect = document.getElementById("sortCatalogue");

		// --- Only catalogue products (exclude best sellers) ---
		const catalogueProducts = products.filter((p) => !p.isBestSeller);

		// --- Compute discount if not present ---
		catalogueProducts.forEach((p) => {
			p.discount = p.discount || Math.round(((p.old - p.price) / p.old) * 100);
		});

		// --- Categories for filter buttons ---
		const categories = [
			...new Set(catalogueProducts.flatMap((p) => p.category).filter(Boolean)),
		];

		// --- Create filter buttons ---
		function createButtons() {
			categoryFilters.innerHTML = "";

			const allBtn = document.createElement("button");
			allBtn.className = "desktop-btn btn btn-outline-secondary btn-sm active";
			allBtn.textContent = "All";
			allBtn.onclick = () => filterProducts("All");
			categoryFilters.appendChild(allBtn);

			categories.forEach((cat) => {
				const btn = document.createElement("button");
				btn.className = "desktop-btn btn btn-outline-secondary btn-sm";
				btn.textContent = cat;
				btn.onclick = () => filterProducts(cat);
				categoryFilters.appendChild(btn);
			});
		}

		// --- Filter products by category ---
		function filterProducts(category) {
			const filtered =
				category === "All"
					? catalogueProducts
					: catalogueProducts.filter((p) => p.category.includes(category));

			document.querySelectorAll(".desktop-btn").forEach((b) => {
				b.classList.toggle("active", b.textContent === category);
			});

			renderProducts(filtered);
		}

		// --- Sorting ---
		sortSelect.addEventListener("change", (e) => {
			const activeBtn = document.querySelector(".desktop-btn.active");
			const activeCategory = activeBtn ? activeBtn.textContent : "All";

			let sorted = [...catalogueProducts];
			if (e.target.value === "price-asc")
				sorted.sort((a, b) => a.price - b.price);
			else if (e.target.value === "price-desc")
				sorted.sort((a, b) => b.price - a.price);
			else if (e.target.value === "discount")
				sorted.sort((a, b) => b.discount - a.discount);

			const filtered =
				activeCategory === "All"
					? sorted
					: sorted.filter((p) => p.category.includes(activeCategory));

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
							<img src="/${p.image}" alt="${p.title}">
							<span class="discount-badge">${p.discount}% OFF</span>
						</div>
						<div class="card-body text-center">
							<div class="product-title">${p.title}</div>
							<div class="price">Rs ${p.price} <span class="old-price">Rs ${p.old}</span></div>
						</div>
					</div>
				`;

				// Store only ID for navigation
				wrapper.querySelector(".product-card").addEventListener("click", () => {
					sessionStorage.setItem("selectedProductId", p.id);
					window.location.href = "/product.html";
				});

				container.appendChild(wrapper);
			});
		}

		// --- Initialize catalogue ---
		createButtons();
		renderProducts(catalogueProducts);
	});
