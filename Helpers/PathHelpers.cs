namespace TestProject.Helpers;

internal static class PathHelpers
{
    public static string ResolveUnderRoot(string rootPath, string? userPath)
    {
        if (string.IsNullOrWhiteSpace(rootPath))
            throw new ArgumentException("Root path is required.", nameof(rootPath));

        var rootFull = Path.GetFullPath(rootPath);
        if (!rootFull.EndsWith(Path.DirectorySeparatorChar))
            rootFull += Path.DirectorySeparatorChar;

        // Combine + normalize into a full path
        var combinedFull = Path.GetFullPath(Path.Combine(rootFull, userPath ?? ""));

        var comparison = OperatingSystem.IsWindows()
            ? StringComparison.OrdinalIgnoreCase
            : StringComparison.Ordinal;
        if (!combinedFull.StartsWith(rootFull, comparison))
            throw new InvalidOperationException("Invalid path.");

        return combinedFull;
    }

    public static string ToRelativeUnderRoot(string rootPath, string fullPath)
    {
        return Path.GetRelativePath(Path.GetFullPath(rootPath), fullPath).Replace('\\', '/');
    }
}
