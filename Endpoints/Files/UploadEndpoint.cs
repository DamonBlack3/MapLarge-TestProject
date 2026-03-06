using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using TestProject.Endpoints.Setup;
using TestProject.Common;
using TestProject.Helpers;

namespace TestProject.Endpoints.Files;

internal sealed record UploadRequest([FromForm] IFormFile File, [FromQuery] string Path = "");

internal sealed class UploadEndpoint : BaseEndpoint
{
    public override string Group => "/files";
    public override string Route => "/upload";
    public override bool DisableAntiforgery => true;
    public override RequestMethod Method => RequestMethod.Post;

    public override Delegate Handler => async (
        [AsParameters] UploadRequest request,
        ILogger<UploadEndpoint> logger,
        IOptionsMonitor<FileBrowserOptions> options) => 
    {
        if (request.File is null || request.File.Length == 0)
            return Results.BadRequest(new { message = "No file uploaded." });

        var validationResult = PathValidationHelper.ValidateAndResolvePath(options, request.Path);

        if (!validationResult.IsSuccess)
            return validationResult.ErrorResult!;

        var folderFullPath = validationResult.FullPath;

        try
        {
            var fileName = Path.GetFileName(request.File.FileName);
            var fileFullPath = Path.Combine(folderFullPath, fileName);

            using var stream = new FileStream(fileFullPath, FileMode.Create);
            await request.File.CopyToAsync(stream);

            return Results.Ok();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error uploading file to {Path}", folderFullPath);
            return Results.StatusCode(500);
        }
    };
}
