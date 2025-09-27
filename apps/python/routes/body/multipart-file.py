from primate import Route


@Route.post
def handle_post(request):
    fields = request.body.fields()

    try:
        baz = int(str(fields.get("baz", "")))
    except (ValueError, TypeError):
        baz = 0

    foo = str(fields.get("foo", ""))

    files = request.body.files()
    greeting = next((f for f in files if f.field == "greeting"), None)

    name = greeting.filename if greeting else None
    typ = greeting.content_type if greeting else None
    size = greeting.size if greeting else None

    content = None
    if greeting:
        content = greeting.io.read().decode("utf-8")

    return {
        "baz": baz,
        "foo": foo,
        "greeting": {
            "name": name,
            "size": size,
            "type": typ,
            "content": content,
        },
    }
