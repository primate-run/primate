module HelloWorld

from "primate/request" include Request
from "primate/response" include Response

use Request.{ type Request }

provide let get = (request: Request) => "Hello, world!"
