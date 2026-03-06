using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using TestProject.Common;
using TestProject.Endpoints.Setup;
using TestProject.Helpers;

namespace TestProject.Endpoints.Files;

internal sealed record DownloadRequest(string Path);

internal sealed class DownloadEndpoint : BaseEndpoint
{
    public override string Group => "/files";
    public override string Route => "/download";
    public override RequestMethod Method => RequestMethod.Get;

    public override Delegate Handler => (
        [AsParameters] DownloadRequest request,
        ILogger<DownloadEndpoint> logger,
        IOptionsMonitor<FileBrowserOptions> options) =>
    {
        var validationResult = PathValidationHelper.ValidateAndResolvePath(options, request.Path, checkDirectory: false, checkFile: true);

        if (!validationResult.IsSuccess)
            return validationResult.ErrorResult!;

        string fullPath = validationResult.FullPath;
        
        return Results.File(
            fullPath,
            contentType: "application/octet-stream",
            fileDownloadName: Path.GetFileName(fullPath),
            enableRangeProcessing: true
        );
    };
}
