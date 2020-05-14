using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;

namespace AppMonitoringSampleAPI.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("[controller]")]
    public class PingController : ControllerBase
    {
        public PingController(): base() {}
        
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<JsonElement> Get()
        {
            return Ok("pong");
        }
    }
}
