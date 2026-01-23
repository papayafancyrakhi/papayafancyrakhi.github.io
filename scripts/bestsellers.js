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
			obj.price = Number(obj.price);
			obj.old = Number(obj.old);
			obj.discount = Math.round(((obj.old - obj.price) / obj.old) * 100);
			return obj;
		});

		const container = document.getElementById("bestSellers");
		container.innerHTML = "";

		products.forEach((p) => {
			container.innerHTML += `
			<div class="col-lg-3 col-md-6">
				<div class="card product-card h-100">
					<img src="${p.image}" class="card-img-top">
					<div class="card-body text-center">
						<div class="product-title">${p.title}</div>
						<div class="price">
							Rs ${p.price}
							<span class="old-price">Rs ${p.old}</span>
						</div>
						<div class="discount">${p.discount}% OFF</div>
						<a href="javascript:void(0)"
						   class="btn btn-whatsapp w-100 mt-2"
						   onclick="contactWhatsApp(this)">
							<i class="fa-brands fa-whatsapp"></i> WhatsApp
						</a>
					</div>
				</div>
			</div>`;
		});
	});
