window.addEventListener("DOMContentLoaded", async () => {
  await loadCategories();
});

async function loadCategories() {
  const res = await fetch("/api/categories");
  const categories = await res.json();

  const container = document.getElementById("categories-container");
  container.innerHTML = "";

  categories.forEach(cat => {
    const imageUrl = "/static/img/" + cat.image_filename;
    createCategoryCard(cat.name, imageUrl);
  });
}

document.getElementById("category-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nameInput = document.getElementById("new-category-name");
  const imageInput = document.getElementById("new-category-image");
  const name = nameInput.value.trim();
  const imageFile = imageInput.files[0];

  if (!name || !imageFile) {
    alert("Please enter a name and select an image.");
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("image", imageFile);

  try {
    const response = await fetch("/api/categories", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      await loadCategories();
      nameInput.value = "";
      imageInput.value = "";
    } else {
      console.error("Upload failed.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
});

function createCategoryCard(name, image) {
  const container = document.getElementById("categories-container");

  const card = document.createElement("div");
  card.className = "category-card";

  card.innerHTML = `
    <img src="${image}" alt="${name}">
    <span>${name}</span>
  `;

  container.appendChild(card);
}






