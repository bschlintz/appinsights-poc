using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using System.Net.Mime;
using Microsoft.AspNetCore.Authorization;

namespace AppMonitoringSampleAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class CustomerController : ControllerQuery
    {
        public CustomerController(IConfiguration config, ILogger<CustomerController> logger):
            base(config, logger) {}

        [HttpGet("{customerId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<JsonElement>> Get(int customerId)
        {
            var result = await this.Query("get", this.GetType(), customerId);

            if (!result.HasValue)
            {
                return NotFound();
            }

            return Ok(result.Value);
        }

        [HttpPut]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<JsonElement>> Put([FromBody]JsonElement payload)
        {
            var result = await this.Query("put", this.GetType(), payload: payload);

            if (!result.HasValue)
            {
                return BadRequest();
            }

            JsonElement newCustomerID;
            result.Value.TryGetProperty("CustomerID", out newCustomerID);

            return Created($"{Request.Protocol}://{Request.Host}/customer/{newCustomerID.GetInt32()}", result.Value);
        }

        [HttpPatch("{customerId}")]
        [Consumes(MediaTypeNames.Application.Json)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<JsonElement>> Patch([FromBody]JsonElement payload, int customerId)
        {
            var result = await this.Query("patch", this.GetType(), customerId, payload);

            if (!result.HasValue)
            {
                return BadRequest();
            }

            return NoContent();
        }

        [HttpDelete("{customerId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<JsonElement>> Delete(int customerId)
        {
            var result = await this.Query("delete", this.GetType(), customerId);

            if (!result.HasValue)
            {
                return BadRequest();
            }

            return NoContent();
        }
    }
}
