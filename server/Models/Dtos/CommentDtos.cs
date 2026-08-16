namespace HelpDesk.Api.Models.Dtos;

public record CreateCommentRequest(string Content);

public record UpdateCommentRequest(string Content);

public record CommentResponse(
    int Id,
    string Content,
    string UserId,
    string UserName,
    DateTime CreatedAt,
    DateTime UpdatedAt);