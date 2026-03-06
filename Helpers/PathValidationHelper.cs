using Microsoft.Extensions.Options;
using TestProject.Common;

namespace TestProject.Helpers;

internal static class PathValidationHelper
{
    public static PathValidationResult ValidateAndResolvePath(
        IOptionsMonitor<FileBrowserOptions> options,
        string? requestPath,
        bool checkDirectory = true,
        bool checkFile = false)
    {
        var rootPath = options.CurrentValue.RootPath;

        if (string.IsNullOrEmpty(rootPath))
        {
            return PathValidationResult.Failure(
                Results.BadRequest(new { message = "Root path is not configured." }));
        }

        string fullPath;
        try
        {
            fullPath = PathHelpers.ResolveUnderRoot(rootPath, requestPath);
        }
        catch
        {
            return PathValidationResult.Failure(
                Results.BadRequest(new { message = "Invalid path." }));
        }

        if (checkDirectory && !Directory.Exists(fullPath))
        {
            return PathValidationResult.Failure(
                Results.NotFound(new { message = "Directory not found." }));
        }

        if (checkFile && !File.Exists(fullPath))
        {
            return PathValidationResult.Failure(
                Results.NotFound(new { message = "File not found." }));
        }

        return PathValidationResult.Success(rootPath, fullPath);
    }
}
