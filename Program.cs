using System.Reflection;
using TestProject;
using TestProject.Common;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.Configure<FileBrowserOptions>(builder.Configuration.GetSection("FileBrowser"));
builder.Services.AddEndpoints(Assembly.GetExecutingAssembly());

var app = builder.Build();

// Configure the HTTP request pipeline.

app.UseHttpsRedirection();

app.UseStaticFiles();

app.MapEndpoints();

app.Run();