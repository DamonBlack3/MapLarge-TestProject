function openCreateModal() {
    const modal = document.getElementById("createModal");
    const nameInput = document.getElementById("createName");
    const typeSelect = document.getElementById("createType");
    const fileTypeField = document.getElementById("fileTypeField");

    // Reset fields
    nameInput.value = "";
    typeSelect.value = "folder";
    fileTypeField.style.display = "none";

    modal.classList.add("open");
    nameInput.focus();
}

function closeCreateModal() {
    document.getElementById("createModal").classList.remove("open");
}

async function submitCreate() {
    const typeSelect = document.getElementById("createType");
    const nameInput = document.getElementById("createName");
    const fileTypeSelect = document.getElementById("createFileType");

    const isDirectory = typeSelect.value === "folder";
    let name = nameInput.value.trim();

    if (!name) {
        nameInput.focus();
        return;
    }

    // Append file extension when creating a file (if an extension is selected and not already present)
    if (!isDirectory) {
        const ext = fileTypeSelect.value;
        if (ext && !name.endsWith(ext)) {
            name += ext;
        }
    }

    const currentPath = getCurrentPath();
    const newPath = currentPath ? `${currentPath}/${name}` : name;

    const res = await fetch(`/files?path=${encodeURIComponent(newPath)}&isDirectory=${isDirectory}`, {
        method: "POST"
    });

    if (!res.ok) {
        const txt = await res.text();
        alert(`Create ${isDirectory ? "folder" : "file"} failed: ${res.status}\n${txt}`);
        return;
    }

    closeCreateModal();
    await load(currentPath);
}

document.addEventListener("DOMContentLoaded", async () => {
    // Load the modal partial and inject it into the page
    const res = await fetch("/partials/create-modal.html");
    if (res.ok) {
        const html = await res.text();
        document.body.insertAdjacentHTML("beforeend", html);
    }

    document.getElementById("newBtn").addEventListener("click", openCreateModal);

    document.getElementById("createType").addEventListener("change", (e) => {
        document.getElementById("fileTypeField").style.display =
            e.target.value === "file" ? "" : "none";
    });

    document.getElementById("createName").addEventListener("keydown", (e) => {
        if (e.key === "Enter") submitCreate();
    });

    document.getElementById("createConfirmBtn").addEventListener("click", submitCreate);
    document.getElementById("createCancelBtn").addEventListener("click", closeCreateModal);

    document.getElementById("createModal").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeCreateModal();
    });
});