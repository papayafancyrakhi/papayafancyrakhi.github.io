function contactWhatsApp(button) {
	// Find the nearest card container
	const card = button.closest(".product-card");
	if (!card) return;

	// Get product name
	const productTitle = card.querySelector(".product-title");
	if (!productTitle) return;

	const productName = productTitle.innerText.trim();

	// WhatsApp number
	const phoneNumber = "917601938547"; // replace with your number

	// Message
	const message = `Hello! I am interested in ${productName}.`;

	// WhatsApp URL
	const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

	// Open WhatsApp in new tab
	window.open(url, "_blank");
}
