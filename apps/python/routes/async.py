from primate import Route
import asyncio


@Route.get
async def get(request):
    # simulate some async work
    await asyncio.sleep(0.01)
    return "Hi from async"
