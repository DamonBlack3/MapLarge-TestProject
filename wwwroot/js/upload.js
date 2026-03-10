async function upload() {
    const fileInput = document.getElementById("upload");
    const file = fileInput.files?.[0];
    if (!file) {
        alert("Choose a file first.");
        return;
    }

    const currentPath = getCurrentPath();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/files/upload?path=${encodeURIComponent(currentPath)}`, {
        method: "POST",
        body: formData
    });

    if (!res.ok) {
        const errText = await res.text();
        alert(`Upload failed: ${res.status}\n${errText}`);
        return;
    }

    // clear picker + label
    fileInput.value = "";
    document.getElementById("chosenFile").textContent = "";

    await load(currentPath);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("chooseFileBtn").addEventListener("click", () => {
        document.getElementById("upload").click();
    });

    document.getElementById("upload").addEventListener("change", () => {
        const file = document.getElementById("upload").files?.[0];
        document.getElementById("chosenFile").textContent = file ? file.name : "";
    });

    document.getElementById("uploadBtn").addEventListener("click", upload);
});