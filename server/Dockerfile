# Multi-stage Dockerfile for ASP.NET Core Web API (.NET 10)
# Purpose: Containerize the backend API for deployment on Render, Fly.io, or any container platform.

# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["HelpDesk.Api.csproj", "./"]
RUN dotnet restore "HelpDesk.Api.csproj"

# Copy source code and build
COPY . .
RUN dotnet publish "HelpDesk.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Copy published binaries
COPY --from=build /app/publish .

# Expose ASP.NET Core port
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "HelpDesk.Api.dll"]
