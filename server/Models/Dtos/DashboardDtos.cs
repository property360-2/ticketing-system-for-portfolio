namespace HelpDesk.Api.Models.Dtos;

public record DashboardSummary(
    int Total,
    int Open,
    int InProgress,
    int Resolved,
    int Closed,
    int Critical);

public record CountByValue(string Value, int Count);