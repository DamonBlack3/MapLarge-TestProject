# TestProject

This is a simple file explorer application that covers the minimum functionality required by the instruction document I was given. I decided to mostly stick to the minimum requirements and not add much extra because if this was a real task in a professional setting, I would ask that separate tickets be made for the bonus items to ensure the minimum ask was achieved and tested and the bonus items done only when time permitted.

# AI Usage
Since AI usage was allowed I did decide to use it as freely as I would in any other situation. While I have not quite grown comfortable enough with AI to use agent mode and allow it to apply changes itself, I am comfortable enought with it to copy and paste suggestions then tailor them to be more my style. That being said, for large suggestions such as implementing entire classes, I prefer having those changes on a separate monitor and applying them manually. 

Another common AI use case for me is to have it give a grade and potential improvements after I have written something regardless of whether it was original code from me or code already suggested by AI. I find that this helps me when thinking of future implementations and can also sometimes offer entirely different approaches to the current changes now that there is more to go off of.

# Approach
The template given was very bare and I work much better when I have other logic/code to reference so the first thing I did was upload both the requirements and project into ChatGPT so that it could generate initial structure, classes, and logic. Now that I had ample content to reference I went about changing the project how I would like so that I could better tailor ChatGPT's suggestions. First, I modernized the program.cs a bit by switching to top level statements. Second, I removed the controller logic and switched over to a minimal api implementation. 

# Implementaion
### Configuration
Although the configuration was small, just being a single value, I've gotten into the habit of using the options pattern.

### Endpoints
I was initially slow to adopt minimal api, but as it is getting pushed more and more I've been tinkering with various approaches to it and finally settled on one I think I like. That approach is making a simple interface and abstract base endpoint class and a couple simple extension methods that use reflection to add and map them. Then I can make a class for an endpoint, extend the base class, and not have to worry about any clutter from the registration.

There is an endpoint for each of the minimum outlined functions: browse, search, upload, download.

### Misc
There are a couple helper classes for normalizing and validating paths

### Frontend
While the instructions said pretty wasn't important, I did still want to at a minimum not be repulsed by it. That being said, my amount of frontend knowledge, especially when it comes to css, is fairly low. The frontend, both the HTML and JavaScript, remained almost entirely what was suggested by ChatGPT with my contributions primarily being slight rearrangements so that it looked a bit better to me.
