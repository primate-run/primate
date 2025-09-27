from primate import Route, Session


@Route.get
def get(request):
    Session.create({"foo": "bar"})

    return Session.get()
