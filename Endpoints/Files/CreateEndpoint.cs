using Microsoft.Extensions.Options;
using TestProject.Common;
using TestProject.Endpoints.Setup;
using TestProject.Helpers;

namespace TestProject.Endpoints.Files;

internal sealed record CreateRequest(string Path = "", bool IsDirectory = false);

internal sealed class CreateEndpoint : BaseEndpoint
{
    public override string Group => "/files";
    public override string Route => "";

    public override RequestMethod Method => RequestMethod.Post;

    public override Delegate Handler => (
        [AsParameters] CreateRequest request,
        ILogger<CreateEndpoint> logger,
        IOptionsMonitor<FileBrowserOptions> options) => 
    {
        var validationResult = PathValidationHelper.ValidateAndResolvePath(options, request.Path, checkDirectory: false, checkFile: false);

        if (!validationResult.IsSuccess)
            return validationResult.ErrorResult!;

        var fullPath = validationResult.FullPath;
        try
        {
            if (request.IsDirectory)
                Directory.CreateDirectory(fullPath);
            else
                File.Create(fullPath).Dispose();
            return Results.Ok();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating file or directory at {Path}", fullPath);
            return Results.StatusCode(500);
        }
    };
}
