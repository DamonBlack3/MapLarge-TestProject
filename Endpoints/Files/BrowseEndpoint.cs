using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using TestProject.Endpoints.Setup;
using TestProject.Common;
using TestProject.Helpers;

namespace TestProject.Endpoints.Files;

internal sealed record BrowseRequest(string Path = "");
internal sealed record BrowseResponse(
    IEnumerable<FileItemDto> Items,
    int FolderCount,
    int FileCount,
    long TotalFileBytes
);

internal sealed class BrowseEndpoint : BaseEndpoint
{
    public override string Group => "/files";
    public override string Route => "/browse";
    public override RequestMethod Method => RequestMethod.Get;

    public override Delegate Handler => (
        [AsParameters] BrowseRequest request,
        ILogger<BrowseEndpoint> logger,
        IOptionsMonitor<FileBrowserOptions> options) => 
    {
        var validationResult = PathValidationHelper.ValidateAndResolvePath(options, request.Path);

        if (!validationResult.IsSuccess)
            return validationResult.ErrorResult!;

        var (rootPath, fullPath) = validationResult;

        var directories = Directory
            .GetDirectories(fullPath)
            .Select(dir => new FileItemDto
            (
                Path.GetFileName(dir),
                PathHelpers.ToRelativeUnderRoot(rootPath, dir),
                true,
                0
            )).ToList();

        var files = Directory.GetFiles(fullPath)
            .Select(path => 
            {
                var info = new FileInfo(path);

                return new FileItemDto
                (
                    info.Name,
                    PathHelpers.ToRelativeUnderRoot(rootPath, path),
                    false,
                    info.Length
                );
            }).ToList();

        var response = new BrowseResponse(
            directories.Concat(files),
            directories.Count,
            files.Count,
            files.Sum(f => f.Size)
        );

        return Results.Ok(response);
    };
}
