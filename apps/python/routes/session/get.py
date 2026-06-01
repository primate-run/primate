from primate import Route, Session

@Route.get
def get(request):
    data = Session.try_get()
    return data if data else None
