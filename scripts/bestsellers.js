fetch("/data/bestsellers.md")
	.then((r) => r.text())
	.then((md) => {
		const blocks = md
			.split("## product")
			.map((b) => b.trim())
			.filter((b) => b.length);

		const products = blocks.map((b) => {
			const obj = {};
			b.split("\n").forEach((line) => {
				const [k, ...v] = line.split(":");
				if (!v.length) return;
				obj[k.trim()] = v.join(":").trim();
			});
			return obj;
		});

		const container = document.getElementById("bestSellers");
		container.innerHTML = "";

		products.forEach((p, idx) => {
			const div = document.createElement("div");
			div.classList.add("product-card");

			div.innerHTML = `
        <div class="card shell-card gold-outlier" onclick='openProduct(${JSON.stringify(p)})'>
          <div class="image-wrap">
            <img src="/${p.image}" alt="${p.title}">
          </div>
          <div class="card-body text-center">
            <h5 class="product-title">${p.title}</h5>
          </div>
        </div>
      `;
			container.appendChild(div);
		});

		// Duplicate cards for seamless infinite scroll
		container.innerHTML += container.innerHTML;

		// Infinite horizontal scroll
		let scrollPos = 0;
		function animate() {
			scrollPos += 0.5; // adjust speed
			if (scrollPos >= container.scrollWidth / 2) scrollPos = 0;
			container.style.transform = `translateX(-${scrollPos}px)`;
			requestAnimationFrame(animate);
		}
		animate();
	});

function openProduct(p) {
	localStorage.setItem("selectedProduct", JSON.stringify(p));
	window.location.href = "/product.html";
}
