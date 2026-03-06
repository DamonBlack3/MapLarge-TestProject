using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using TestProject.Endpoints.Setup;
using TestProject.Common;
using TestProject.Helpers;

namespace TestProject.Endpoints.Files;

internal sealed record SearchRequest(string Query, string Path = "");
internal sealed record SearchResponse(IEnumerable<FileItemDto> Items);

internal sealed class SearchEndpoint : BaseEndpoint
{
    public override string Group => "/files";
    public override string Route => "/search";
    public override RequestMethod Method => RequestMethod.Get;

    public override Delegate Handler => (
        [AsParameters] SearchRequest request,
        ILogger<SearchEndpoint> logger,
        IOptionsMonitor<FileBrowserOptions> options) => 
    {
        var validationResult = PathValidationHelper.ValidateAndResolvePath(options, request.Path);

        if (!validationResult.IsSuccess)
            return validationResult.ErrorResult!;

        var (rootPath, fullPath) = validationResult;

        var searchOptions = new EnumerationOptions
        {
            RecurseSubdirectories = true,
            IgnoreInaccessible = false,
            ReturnSpecialDirectories = false,
            MatchCasing = MatchCasing.CaseInsensitive,
            MatchType = MatchType.Simple
        };

        var results = Directory
            .EnumerateFiles(fullPath, $"*{request.Query}*", searchOptions)
            .Select(f => 
            {
                var info = new FileInfo(f);

                return new FileItemDto
                (
                    info.Name,
                    PathHelpers.ToRelativeUnderRoot(rootPath, f),
                    false,
                    info.Length
                );
            });

        return Results.Ok(new SearchResponse(results));
    };
}
