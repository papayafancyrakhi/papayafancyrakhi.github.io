// floating menu
const floatingMenu = document.getElementById("floatingMenu");
const menuActions = document.getElementById("menuActions");

// Function to close menu
function closeMenu() {
	if (menuActions.classList.contains("active")) {
		menuActions.classList.remove("active");
		floatingMenu.classList.remove("open");

		const icon = floatingMenu.querySelector("i");
		icon.classList.remove("fa-times");
		icon.classList.add("fa-bars");

		// Remove focus from menu button
		floatingMenu.blur();
	}
}

// Toggle menu open/close
function toggleMenu() {
	menuActions.classList.toggle("active");
	floatingMenu.classList.toggle("open");

	const icon = floatingMenu.querySelector("i");
	icon.classList.toggle("fa-bars");
	icon.classList.toggle("fa-times");

	// Focus menu when opened
	if (floatingMenu.classList.contains("open")) {
		floatingMenu.focus();
	}
}

// Click on menu button
floatingMenu.addEventListener("click", (e) => {
	e.stopPropagation();
	toggleMenu();
});

// Click outside menu
document.addEventListener("click", closeMenu);

// Close menu on scroll
window.addEventListener("scroll", closeMenu);
