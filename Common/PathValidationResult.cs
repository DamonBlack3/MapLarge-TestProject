namespace TestProject.Common;

internal readonly record struct PathValidationResult
{
    public bool IsSuccess { get; init; }
    public string RootPath { get; init; }
    public string FullPath { get; init; }
    public IResult? ErrorResult { get; init; }

    public static PathValidationResult Success(string rootPath, string fullPath) =>
        new() { IsSuccess = true, RootPath = rootPath, FullPath = fullPath };

    public static PathValidationResult Failure(IResult errorResult) =>
        new() { IsSuccess = false, ErrorResult = errorResult };

    public void Deconstruct(out string rootPath, out string fullPath)
    {
        rootPath = RootPath;
        fullPath = FullPath;
    }
}
