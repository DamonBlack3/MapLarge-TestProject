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

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("backBtn").addEventListener("click", () => {
        const current = getCurrentPath();
        if (!current) return;

        const parts = current.split("/").filter(Boolean);
        parts.pop();
        setPath(parts.join("/"));
    });
});