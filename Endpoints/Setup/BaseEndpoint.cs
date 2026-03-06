using TestProject.Common;

namespace TestProject.Endpoints.Setup;

internal abstract class BaseEndpoint : IEndpoint
{
    public abstract string Route { get; }
    public abstract RequestMethod Method { get; }
    public abstract Delegate Handler { get; }
    public virtual string[] Tags { get; } = [];
    public virtual string Group { get; } = string.Empty;
    public virtual bool DisableAntiforgery { get; } = false;


    public virtual void Map(IEndpointRouteBuilder app) 
    {
        var builder = app.MapGroup(Group);

        RouteHandlerBuilder routeHandlerBuilder = Method switch
        {
            RequestMethod.Get => builder.MapGet(Route, Handler),
            RequestMethod.Post => builder.MapPost(Route, Handler),
            RequestMethod.Put => builder.MapPut(Route, Handler),
            RequestMethod.Delete => builder.MapDelete(Route, Handler),
            _ => throw new NotSupportedException($"HTTP method {Method} is not supported.")
        };
       
        ConfigureRoute(routeHandlerBuilder);
    }

    private void ConfigureRoute(RouteHandlerBuilder routeHandlerBuilder)
    {
        routeHandlerBuilder
            .WithName(this.GetType().Name)
            .WithTags(Tags);

        if (DisableAntiforgery)
        {
            routeHandlerBuilder.DisableAntiforgery();
        }
    }
}
