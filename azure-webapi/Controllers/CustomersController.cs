using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;

namespace AppMonitoringSampleAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class CustomersController : ControllerQuery
    {
        public CustomersController(IConfiguration config, ILogger<CustomersController> logger):
            base(config, logger) {}

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<JsonElement>> Get()
        {
            var result = await this.Query("get", this.GetType());
            
            return Ok(result.Value);
        }
    }
}
