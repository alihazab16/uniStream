// ADD SERVICE

document.getElementById("addServiceBtn").addEventListener("click", async () => {

  const nameField = document.getElementById("newServiceName");
  const name = nameField.value.trim();

  if (name === "") {
    alert("Service name cannot be blank");
    return;
  }

  const resp = await fetch("/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  if (resp.ok) {
    alert("Service added successfully");
    location.reload();
  } else {
    alert("Failed to add service");
  }

});


// DELETE SERVICE

document.querySelectorAll(".remove").forEach(img => {

  img.addEventListener("click", async () => {

    const id = img.dataset.id;

    if (!confirm("Delete this service?")) return;

    const resp = await fetch("/services/" + id, {
      method: "DELETE"
    });

    if (resp.ok) {
      alert("Service deleted");
      location.reload();
    } else {
      alert("Delete failed");
    }

  });

});