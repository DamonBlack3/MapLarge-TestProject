namespace TestProject.Common;

internal sealed record FileItemDto(string Name, string Path, bool IsDirectory, long Size);
