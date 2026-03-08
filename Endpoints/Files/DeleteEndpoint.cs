using Microsoft.Extensions.Options;
using TestProject.Common;
using TestProject.Endpoints.Setup;
using TestProject.Helpers;

namespace TestProject.Endpoints.Files;

internal sealed record DeleteRequest(string Path = "", bool isDirectory = false);

internal sealed class DeleteEndpoint : BaseEndpoint
{
    public override string Group => "/files";
    public override string Route => "/delete";

    public override RequestMethod Method => RequestMethod.Delete;

    public override Delegate Handler => (
        [AsParameters] DeleteRequest request,
        ILogger<DeleteEndpoint> logger,
        IOptionsMonitor<FileBrowserOptions> options) => 
    { 
        var validationResult = PathValidationHelper.ValidateAndResolvePath(options, request.Path, checkDirectory: request.isDirectory, checkFile: !request.isDirectory);
        if (!validationResult.IsSuccess)
            return validationResult.ErrorResult!;

        var fullPath = validationResult.FullPath;
        try
        {
            if (!request.isDirectory)
                File.Delete(fullPath);
            else
                Directory.Delete(fullPath, true);

            return Results.Ok();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting file or directory at {Path}", fullPath);
            return Results.StatusCode(500);
        }
    };
}
