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

    const res = await fetch(`/files/search?query=${encodeURIComponent(q)}&path=${encodeURIComponent(currentPath)}`);
    if (!res.ok) {
        const txt = await res.text();
        alert(`Search failed: ${res.status}\n${txt}`);
        return;
    }

    const data = await res.json();
    const items = data.items ?? [];

    const list = document.getElementById("fileList");
    list.innerHTML = "";

    // show a lightweight “search results” header in stats
    document.getElementById("stats").textContent =
        `Search results in /${currentPath || ""} • ${items.length} matches`;

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

window.addEventListener("hashchange", () => load(getCurrentPath()));
window.addEventListener("load", () => load(getCurrentPath()));

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