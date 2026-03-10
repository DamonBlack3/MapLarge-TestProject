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