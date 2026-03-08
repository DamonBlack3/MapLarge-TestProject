function getCurrentPath() {
    return decodeURIComponent(location.hash.substring(1) || "");
}

function setPath(p) {
    location.hash = `#${encodeURIComponent(p)}`;
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

async function load(path = "") {
    const res = await fetch(`/files/browse?path=${encodeURIComponent(path)}`);
    if (!res.ok) {
        const txt = await res.text();
        alert(`Browse failed: ${res.status}\n${txt}`);
        return;
    }

    const data = await res.json();
    const items = data.items ?? [];

    document.getElementById("path").textContent = path ? `/${path}` : "/";
    document.getElementById("stats").textContent =
        `${data.folderCount} folders • ${data.fileCount} files • ${formatBytes(data.totalFileBytes)}`;

    const list = document.getElementById("fileList");
    list.innerHTML = "";

    items.forEach(i => {
        const li = document.createElement("li");
        li.className = "item";

        const icon = document.createElement("div");
        icon.textContent = i.isDirectory ? "📁" : "📄";

        const name = document.createElement("div");
        name.className = "name";

        if (i.isDirectory) {
            name.innerHTML = `<a href="#${encodeURIComponent(i.path)}">${i.name}</a>`;
        } else {
            name.innerHTML = `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${i.name}</span>`;
        }

        const right = document.createElement("div");
        right.className = "right";

        if (!i.isDirectory) {
            const meta = document.createElement("div");
            meta.className = "meta";
            meta.textContent = formatBytes(i.size);

            const dl = document.createElement("a");
            dl.className = "btn link";
            dl.href = `/files/download?path=${encodeURIComponent(i.path)}`;
            dl.textContent = "Download";

            right.appendChild(meta);
            right.appendChild(dl);
        } else {
            const meta = document.createElement("div");
            meta.className = "meta";
            meta.textContent = "Folder";
            right.appendChild(meta);
        }

        const del = document.createElement("a");
        del.className = "btn link";
        del.textContent = "Delete";
        del.addEventListener("click", async (e) => {
            e.preventDefault();
            const res = await fetch(`/files/delete?path=${encodeURIComponent(i.path)}&isDirectory=${i.isDirectory}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const txt = await res.text();
                alert(`Delete failed: ${res.status}\n${txt}`);
                return;
            }
            await load(getCurrentPath());
        });

        right.appendChild(del);

        li.appendChild(icon);
        li.appendChild(name);
        li.appendChild(right);
        list.appendChild(li);
    });

    // disable back at root
    document.getElementById("backBtn").disabled = !path;
}

async function search() {
    const q = document.getElementById("searchBox").value.trim();
    const currentPath = getCurrentPath();

    if (!q) {
        // if empty, just reload current folder
        await load(currentPath);
        return;
    }

    const res = await fetch(`/files/searchv2?query=${encodeURIComponent(q)}&path=${encodeURIComponent(currentPath)}`);
    if (!res.ok) {
        const txt = await res.text();
        alert(`Search failed: ${res.status}\n${txt}`);
        return;
    }

    const data = await res.json();
    const items = data.items ?? [];

    const list = document.getElementById("fileList");
    list.innerHTML = "";

    // show a lightweight "search results" header in stats
    const truncNote = data.truncated ? " (showing first 200 — refine your search)" : "";
    document.getElementById("stats").textContent =
        `Search results in /${currentPath || ""} • ${items.length} matches${truncNote}`;

    items.forEach(i => {
        const li = document.createElement("li");
        li.className = "item";

        const icon = document.createElement("div");
        icon.textContent = "📄";

        const name = document.createElement("div");
        name.className = "name";
        name.innerHTML = `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${i.path}</span>`;

        const right = document.createElement("div");
        right.className = "right";

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = formatBytes(i.size);

        const dl = document.createElement("a");
        dl.className = "btn link";
        dl.href = `/files/download?path=${encodeURIComponent(i.path)}`;
        dl.textContent = "Download";

        right.appendChild(meta);
        right.appendChild(dl);

        li.appendChild(icon);
        li.appendChild(name);
        li.appendChild(right);
        list.appendChild(li);
    });
}

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

window.addEventListener("hashchange", () => load(getCurrentPath()));
window.addEventListener("load", () => load(getCurrentPath()));

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("backBtn").addEventListener("click", () => {
        const current = getCurrentPath();
        if (!current) return;

        const parts = current.split("/").filter(Boolean);
        parts.pop();
        setPath(parts.join("/"));
    });

    document.getElementById("searchBtn").addEventListener("click", search);
    document.getElementById("searchBox").addEventListener("keydown", (e) => {
        if (e.key === "Enter") search();
    });

    document.getElementById("chooseFileBtn").addEventListener("click", () => {
        document.getElementById("upload").click();
    });

    document.getElementById("upload").addEventListener("change", () => {
        const file = document.getElementById("upload").files?.[0];
        document.getElementById("chosenFile").textContent = file ? file.name : "";
    });

    document.getElementById("uploadBtn").addEventListener("click", upload);
    document.getElementById("newBtn").addEventListener("click", openCreateModal);

    // Modal: toggle file-type selector visibility when type changes
    document.getElementById("createType").addEventListener("change", (e) => {
        document.getElementById("fileTypeField").style.display =
            e.target.value === "file" ? "" : "none";
    });

    // Modal: submit on Enter in the name field
    document.getElementById("createName").addEventListener("keydown", (e) => {
        if (e.key === "Enter") submitCreate();
    });

    document.getElementById("createConfirmBtn").addEventListener("click", submitCreate);
    document.getElementById("createCancelBtn").addEventListener("click", closeCreateModal);

    // Close modal when clicking the overlay background
    document.getElementById("createModal").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeCreateModal();
    });
});