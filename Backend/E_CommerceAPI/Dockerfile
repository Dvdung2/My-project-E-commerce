# Use the official ASP.NET Core runtime as a parent image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Use the SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["E_CommerceAPI/E_CommerceAPI.csproj", "E_CommerceAPI/"]
RUN dotnet restore "E_CommerceAPI/E_CommerceAPI.csproj"
COPY . .
WORKDIR "/src/E_CommerceAPI"
RUN dotnet build "E_CommerceAPI.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "E_CommerceAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage/image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "E_CommerceAPI.dll"]
