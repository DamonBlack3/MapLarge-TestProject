using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Reflection;
using TestProject.Endpoints.Setup;

namespace TestProject;

internal static class Extensions
{
    public static IServiceCollection AddEndpoints(this IServiceCollection services, Assembly assembly)
    {
        ServiceDescriptor[] endpointDescriptors = assembly.DefinedTypes
            .Where(t => t is
            {
                IsAbstract: false,
                IsInterface: false
            } && t.IsAssignableTo(typeof(IEndpoint)))
            .Select(t => ServiceDescriptor.Transient(typeof(IEndpoint), t))
            .ToArray();

        services.TryAddEnumerable(endpointDescriptors);

        return services;
    }

    public static IApplicationBuilder MapEndpoints(this WebApplication app)
    {
        IEnumerable<IEndpoint> endpoints = app.Services.GetRequiredService<IEnumerable<IEndpoint>>();

        foreach (IEndpoint endpoint in endpoints)
            endpoint.Map(app);

        return app;
    }
}
