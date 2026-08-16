namespace HelpDesk.Api.Services;

public class AttachmentStorage
{
    private readonly IWebHostEnvironment _env;
    private readonly string _uploadRoot;

    public AttachmentStorage(IWebHostEnvironment env)
    {
        _env = env;
        _uploadRoot = Path.Combine(env.ContentRootPath, "uploads");
    }

    public async Task<string> SaveAsync(IFormFile file, int ticketId, CancellationToken cancellationToken)
    {
        var directory = Path.Combine(_uploadRoot, "tickets", ticketId.ToString());
        Directory.CreateDirectory(directory);

        var safeName = Path.GetFileName(file.FileName);
        var fileName = $"{Guid.NewGuid():N}_{safeName}";
        var fullPath = Path.Combine(directory, fileName);

        await using var stream = File.Create(fullPath);
        await file.CopyToAsync(stream, cancellationToken);

        return Path.Combine("uploads", "tickets", ticketId.ToString(), fileName).Replace('\\', '/');
    }

    public void Delete(string relativePath)
    {
        var fullPath = GetFullPath(relativePath);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
    }

    public string GetFullPath(string relativePath) => Path.Combine(_env.ContentRootPath, relativePath);

    public static async Task<byte[]> ReadBytesAsync(string relativePath, CancellationToken cancellationToken)
    {
        var fullPath = Path.GetFullPath(relativePath);
        return await File.ReadAllBytesAsync(fullPath, cancellationToken);
    }
}