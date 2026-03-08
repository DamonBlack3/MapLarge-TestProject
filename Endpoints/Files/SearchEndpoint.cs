using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;
using System.Data.OleDb;
using System.Runtime.Versioning;
using TestProject.Common;
using TestProject.Endpoints.Setup;
using TestProject.Helpers;

namespace TestProject.Endpoints.Files;

internal sealed record SearchRequest(string Query, string Path = "", int Limit = 200);
internal sealed record SearchResponse(IReadOnlyList<FileItemDto> Items, bool IsTruncated);

internal sealed class SearchEndpoint : BaseEndpoint
{
    private const int MaxLimit = 1000;

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
        var effectiveLimit = Math.Clamp(request.Limit, 1, MaxLimit);

        var (items, isTruncated) = SearchFiles(fullPath, rootPath, request.Query, effectiveLimit);

        return Results.Ok(new SearchResponse(items, isTruncated));
    };

    private static (List<FileItemDto> Items, bool IsTruncated) SearchFiles(
        string searchPath, string rootPath, string query, int limit)
    {
        var pattern = $"*{query}*";
        var results = new ConcurrentBag<FileItemDto>();
        var count = new[] { 0 }; // array element so Interlocked works inside closures

        var shallowOptions = new EnumerationOptions
        {
            RecurseSubdirectories = false,
            IgnoreInaccessible = true,
            ReturnSpecialDirectories = false,
            MatchCasing = MatchCasing.CaseInsensitive,
            MatchType = MatchType.Simple
        };

        var root = new DirectoryInfo(searchPath);

        // 1. Search files directly in the target folder
        foreach (var info in root.EnumerateFiles(pattern, shallowOptions))
        {
            if (Interlocked.Increment(ref count[0]) > limit + 1)
                break;

            results.Add(new FileItemDto(
                info.Name,
                PathHelpers.ToRelativeUnderRoot(rootPath, info.FullName),
                false,
                info.Length));
        }

        // 2. Fan out across top-level subdirectories in parallel (each recurses internally)
        if (Volatile.Read(ref count[0]) <= limit)
        {
            var deepOptions = new EnumerationOptions
            {
                RecurseSubdirectories = true,
                IgnoreInaccessible = true,
                ReturnSpecialDirectories = false,
                MatchCasing = MatchCasing.CaseInsensitive,
                MatchType = MatchType.Simple
            };

            var subdirs = root.EnumerateDirectories("*", shallowOptions).ToList();

            Parallel.ForEach(subdirs,
                new ParallelOptions { MaxDegreeOfParallelism = Environment.ProcessorCount },
                (subdir, state) =>
                {
                    if (Volatile.Read(ref count[0]) > limit)
                    {
                        state.Stop();
                        return;
                    }

                    foreach (var info in subdir.EnumerateFiles(pattern, deepOptions))
                    {
                        if (Interlocked.Increment(ref count[0]) > limit + 1)
                        {
                            state.Stop();
                            return;
                        }

                        results.Add(new FileItemDto(
                            info.Name,
                            PathHelpers.ToRelativeUnderRoot(rootPath, info.FullName),
                            false,
                            info.Length));
                    }
                });
        }

        var items = results.Take(limit).ToList();
        return (items, results.Count > limit);
    }
}


[SupportedOSPlatform("windows")]
internal sealed class SearchV2Endpoint : BaseEndpoint
{
    private const int MaxLimit = 1000;

    public override string Group => "/files";
    public override string Route => "/searchv2";
    public override RequestMethod Method => RequestMethod.Get;

    public override Delegate Handler => (
        [AsParameters] SearchRequest request,
        ILogger<SearchV2Endpoint> logger,
        IOptionsMonitor<FileBrowserOptions> options) =>
    {
        if (!OperatingSystem.IsWindows())
            return Results.Problem("Windows Search is only available on Windows.", statusCode: 501);

        var validationResult = PathValidationHelper.ValidateAndResolvePath(options, request.Path);

        if (!validationResult.IsSuccess)
            return validationResult.ErrorResult!;

        var (rootPath, fullPath) = validationResult;
        var effectiveLimit = Math.Clamp(request.Limit, 1, MaxLimit);

        try
        {
            var (items, isTruncated) = QueryWindowsSearch(
                fullPath, rootPath, request.Query, effectiveLimit, logger);

            return Results.Ok(new SearchResponse(items, isTruncated));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Windows Search query failed, falling back to filesystem scan");

            // Fall back to the parallel filesystem approach
            return Results.Problem(
                "Windows Search is unavailable. Ensure the path is indexed and the Windows Search service is running.",
                statusCode: 503);
        }
    };

    [SupportedOSPlatform("windows")]
    private static (List<FileItemDto> Items, bool IsTruncated) QueryWindowsSearch(
        string searchPath, string rootPath, string query, int limit,
        ILogger logger)
    {
        var items = new List<FileItemDto>();

        // Windows Search uses a SQL-like dialect over OLE DB.
        // SCOPE limits results to a directory tree, CONTAINS matches the index.
        // We request limit+1 rows to detect truncation without a COUNT query.
        var sql = $"""
            SELECT TOP {limit + 1}
                System.FileName,
                System.ItemPathDisplay,
                System.Size
            FROM SystemIndex
            WHERE SCOPE = 'file:{EscapeSqlString(searchPath)}'
              AND System.ItemType != 'Directory'
              AND System.FileName LIKE '%{EscapeSqlString(query)}%'
            """;

        const string connectionString =
            "Provider=Search.CollatorDSO;Extended Properties=\"Application=Windows\"";

        using var connection = new OleDbConnection(connectionString);
        connection.Open();

        using var command = new OleDbCommand(sql, connection);
        using var reader = command.ExecuteReader();

        while (reader.Read())
        {
            var fileName = reader.GetString(0);
            var fullItemPath = reader.GetString(1);
            var size = reader.IsDBNull(2) ? 0L : Convert.ToInt64(reader.GetValue(2));

            items.Add(new FileItemDto(
                fileName,
                PathHelpers.ToRelativeUnderRoot(rootPath, fullItemPath),
                false,
                size));
        }

        var isTruncated = items.Count > limit;
        if (isTruncated)
            items.RemoveAt(items.Count - 1);

        return (items, isTruncated);
    }

    private static string EscapeSqlString(string value)
        => value.Replace("'", "''");
}