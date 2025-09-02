from primate import session

def get(request):
    session.create({ "foo": "bar" })

    return session.get()
