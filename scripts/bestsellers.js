// Render a single product card
function renderProductCard(product) {
	const div = document.createElement("div");
	div.className = "product-card";

	div.innerHTML = `
		<div class="card shell-card gold-outlier">
			<div class="image-wrap">
				<img src="/${product.image}" alt="${product.title}">
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

// Fetch products and render best sellers
fetch("/data/products.json")
	.then((res) => res.json())
	.then((products) => {
		const bestSellers = products.filter((p) => p.isBestSeller);
		const container = document.getElementById("bestSellers");
		container.innerHTML = "";

		// Render cards
		bestSellers.forEach((p) => container.appendChild(renderProductCard(p)));

		// Duplicate for seamless scroll
		bestSellers.forEach((p) => container.appendChild(renderProductCard(p)));

		// Auto scroll
		let speed = 0.5;
		let isUserInteracting = false;

		function autoScroll() {
			if (!isUserInteracting) {
				container.scrollLeft += speed;
				if (container.scrollLeft >= container.scrollWidth / 2) {
					container.scrollLeft %= container.scrollWidth / 2;
				}
			}
			requestAnimationFrame(autoScroll);
		}
		autoScroll();

		// Drag and touch scroll
		let isDown = false,
			startX = 0,
			scrollLeft = 0;
		let startTouchX = 0,
			touchScrollStart = 0;

		container.addEventListener("mousedown", (e) => {
			isDown = true;
			isUserInteracting = true;
			startX = e.pageX - container.offsetLeft;
			scrollLeft = container.scrollLeft;
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
			container.scrollLeft = scrollLeft - (e.pageX - startX) * 2;
		});

		container.addEventListener(
			"touchstart",
			(e) => {
				isUserInteracting = true;
				startTouchX = e.touches[0].pageX;
				touchScrollStart = container.scrollLeft;
			},
			{ passive: true },
		);
		container.addEventListener(
			"touchmove",
			(e) => {
				container.scrollLeft =
					touchScrollStart - (e.touches[0].pageX - startTouchX) * 2;
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
	});
