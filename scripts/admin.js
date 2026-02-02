// Initialize Supabase
supabase = window.supabase.createClient(SUPA_URL, SUPA_PUBLIC_KEY);

// DOM
const loginForm = document.getElementById("loginForm");
const dashboard = document.getElementById("dashboard");
const loginError = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const productsTableBody = document.querySelector("#productsTable tbody");
const productForm = document.getElementById("productForm");
const formTitle = document.getElementById("formTitle");
const cancelEditBtn = document.getElementById("cancelEdit");
const spinner = document.getElementById("spinner");

// Inputs
const productIdInput = document.getElementById("productId");
const prodTitle = document.getElementById("prodTitle");
const prodDesc = document.getElementById("prodDesc");
const prodTags = document.getElementById("prodTags");
const prodMainImg = document.getElementById("prodMainImg");
const prodExtraImgs = document.getElementById("prodExtraImgs");
const prodBestSeller = document.getElementById("prodBestSeller");
const prodShowCat = document.getElementById("prodShowCat");

// Spinner helpers
function showSpinner() {
	spinner.classList.remove("hidden");
	productForm.querySelector("button[type=submit]").disabled = true;
}
function hideSpinner() {
	spinner.classList.add("hidden");
	productForm.querySelector("button[type=submit]").disabled = false;
}

// ---------- AUTH ----------
async function checkSession() {
	showSpinner();

	const { data } = await supabase.auth.getSession();

	if (data.session) {
		loginForm.style.display = "none";
		dashboard.style.display = "block";
		await loadProducts();
	} else {
		loginForm.style.display = "block";
		dashboard.style.display = "none";
	}

	hideSpinner();
}

async function login() {
	showSpinner();

	const email = document.getElementById("email").value;
	const password = document.getElementById("password").value;

	const { error } = await supabase.auth.signInWithPassword({ email, password });

	if (error) {
		loginError.textContent = error.message;
		hideSpinner();
	} else {
		loginError.textContent = "";
		await checkSession();
		hideSpinner();
	}
}

async function logout() {
	await supabase.auth.signOut();
	checkSession();
}

loginBtn.onclick = login;
logoutBtn.onclick = logout;

// ---------- LOAD ----------
async function loadProducts() {
	const { data, error } = await supabase
		.from("products")
		.select("*")
		.order("created_at", { ascending: false });

	if (error) {
		alert(error.message);
		return;
	}

	productsTableBody.innerHTML = "";
	data.forEach((p) => {
		const tr = document.createElement("tr");
		tr.innerHTML = `
      <td>${p.title}</td>
      <td>${p.description}</td>
      <td>${p.tags.join(", ")}</td>
      <td>${p.is_best_seller ? "Yes" : "No"}</td>
      <td>${p.show_in_catalogue ? "Yes" : "No"}</td>
      <td>${p.image ? `<img src="${p.image}" />` : ""}</td>
      <td>
        <button class="edit" data-id="${p.id}">Edit</button>
        <button class="delete" data-id="${p.id}">Delete</button>
      </td>
    `;
		productsTableBody.appendChild(tr);
	});

	document
		.querySelectorAll(".edit")
		.forEach((b) => (b.onclick = () => editProduct(b.dataset.id)));
	document
		.querySelectorAll(".delete")
		.forEach((b) => (b.onclick = () => deleteProduct(b.dataset.id)));
}

// ---------- UPLOAD ----------
async function uploadFile(file, folder) {
	const filePath = `${folder}/${crypto.randomUUID()}_${file.name}`;

	const { error } = await supabase.storage
		.from("product-images")
		.upload(filePath, file, { upsert: true });

	if (error) throw error;

	return supabase.storage.from("product-images").getPublicUrl(filePath).data
		.publicUrl;
}

// ---------- SAVE ----------
productForm.onsubmit = async (e) => {
	e.preventDefault();
	showSpinner();

	try {
		const id = productIdInput.value || crypto.randomUUID();
		const title = prodTitle.value;
		const description = prodDesc.value;
		const tags = prodTags.value
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);

		let imageUrl = null;
		if (prodMainImg.files.length) {
			imageUrl = await uploadFile(prodMainImg.files[0], "main");
		}

		let gallery = [];
		for (const file of prodExtraImgs.files) {
			const url = await uploadFile(file, "extra");
			gallery.push(url);
		}

		const payload = {
			id,
			title,
			description,
			tags,
			is_best_seller: prodBestSeller.checked,
			show_in_catalogue: prodShowCat.checked,
		};

		if (imageUrl) payload.image = imageUrl;
		if (gallery.length) payload.gallery = gallery;

		const { error } = productIdInput.value
			? await supabase.from("products").update(payload).eq("id", id)
			: await supabase.from("products").insert(payload);

		if (error) throw error;

		productForm.reset();
		productIdInput.value = "";
		formTitle.textContent = "Add New Product";
		loadProducts();
	} catch (err) {
		alert(err.message);
	}

	hideSpinner();
};

// ---------- EDIT ----------
async function editProduct(id) {
	const { data } = await supabase
		.from("products")
		.select("*")
		.eq("id", id)
		.single();

	productIdInput.value = data.id;
	prodTitle.value = data.title;
	prodDesc.value = data.description;
	prodTags.value = data.tags.join(", ");
	prodBestSeller.checked = data.is_best_seller;
	prodShowCat.checked = data.show_in_catalogue;
	formTitle.textContent = "Edit Product";
}

// ---------- DELETE ----------
async function deleteProduct(id) {
	if (!confirm("Delete this product?")) return;
	await supabase.from("products").delete().eq("id", id);
	loadProducts();
}

cancelEditBtn.onclick = () => {
	productForm.reset();
	productIdInput.value = "";
	formTitle.textContent = "Add New Product";
};

checkSession();
