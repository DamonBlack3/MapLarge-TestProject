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

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("searchBtn").addEventListener("click", search);
    document.getElementById("searchBox").addEventListener("keydown", (e) => {
        if (e.key === "Enter") search();
    });
});