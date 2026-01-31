fetch("/data/catalogue.md")
	.then((r) => r.text())
	.then((md) => {
		const blocks = md
			.split("## product")
			.map((b) => b.trim())
			.filter(Boolean);

		const products = blocks.map((b) => {
			const obj = {};
			b.split("\n").forEach((line) => {
				const [k, ...v] = line.split(":");
				if (!v.length) return;
				obj[k.trim()] = v.join(":").trim();
			});
			obj.price = Number(obj.price);
			obj.old = Number(obj.old);
			obj.discount = Math.round(((obj.old - obj.price) / obj.old) * 100);
			// Keep description if present
			obj.description = obj.description || "";
			return obj;
		});

		const container = document.getElementById("catalogue");
		const categoryFilters = document.getElementById("categoryFilters");
		const sortSelect = document.getElementById("sortCatalogue");

		const categories = [
			...new Set(products.map((p) => p.category).filter(Boolean)),
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

		// --- Filter + render ---
		function filterProducts(category) {
			const filtered =
				category === "All"
					? products
					: products.filter((p) => p.category === category);

			document.querySelectorAll(".desktop-btn").forEach((b) => {
				b.classList.toggle("active", b.textContent === category);
			});

			renderProducts(filtered);
		}

		// --- Sorting ---
		sortSelect.addEventListener("change", (e) => {
			const activeBtn = document.querySelector(".desktop-btn.active");
			const activeCategory = activeBtn ? activeBtn.textContent : "All";

			let sorted = [...products];
			if (e.target.value === "price-asc")
				sorted.sort((a, b) => a.price - b.price);
			else if (e.target.value === "price-desc")
				sorted.sort((a, b) => b.price - a.price);
			else if (e.target.value === "discount")
				sorted.sort((a, b) => b.discount - a.discount);

			const filtered =
				activeCategory === "All"
					? sorted
					: sorted.filter((p) => p.category === activeCategory);
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

				wrapper.querySelector(".product-card").onclick = () => {
					// description is stored in localStorage along with other product data
					localStorage.setItem("selectedProduct", JSON.stringify(p));
					window.location.href = "/product.html";
				};

				container.appendChild(wrapper);
			});
		}

		createButtons();
		renderProducts(products);
	});
