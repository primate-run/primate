from primate import Route, pema

schema = pema.schema({"baz": pema.int(), "foo": pema.string()})


@Route.get
def handle_get(request):
    try:
        parsed = request.query.parse(schema, True)
        return parsed
    except pema.ValidationError as e:
        return str(e)
