using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;

namespace AppMonitoringSampleAPI.Controllers
{
    public class ControllerQuery : ControllerBase
    {
        private readonly ILogger<ControllerQuery> _logger;
        private readonly IConfiguration _config;

        public ControllerQuery(IConfiguration config, ILogger<ControllerQuery> logger)
        {
            _logger = logger;
            _config = config;
        }

        protected async Task<JsonElement?> Query(string verb, Type entity, int? id = null, JsonElement payload = default(JsonElement))
        {
            JsonDocument result = null;

            string verbLowered = verb.ToLower();
            if (!(new string[] {"get", "put", "patch", "delete"}).Contains(verbLowered))
            {
                throw new ArgumentException($"verb '{verb}' not supported", nameof(verb));
            }

            string entityName = entity.Name.Replace("Controller", string.Empty).ToLower();
            string procedure = $"web.{verb}_{entityName}";
            _logger.LogDebug($"Executing {procedure}");

            using(var conn = new SqlConnection(_config.GetConnectionString("DefaultConnection"))) {
                DynamicParameters parameters = new DynamicParameters();

                if (payload.ValueKind != default(JsonValueKind))
                {
                    var json = JsonSerializer.Serialize(payload);
                    parameters.Add("Json", json);
                }

                if (id.HasValue)
                    parameters.Add("Id", id.Value);

                
                if (verbLowered == "patch" || verbLowered == "delete") 
                {
                    var qr = await conn.ExecuteAsync(
                        sql: procedure, 
                        param: parameters, 
                        commandType: CommandType.StoredProcedure
                    );

                    if (qr > 0)
                        result = JsonDocument.Parse("{}");
                }
                else 
                {
                    var qr = await conn.ExecuteScalarAsync<string>(
                        sql: procedure, 
                        param: parameters, 
                        commandType: CommandType.StoredProcedure
                    );
                    
                    if (qr != null)
                        result = JsonDocument.Parse(qr);
                }
            };
                        
            return result?.RootElement;
        }
    }
}
