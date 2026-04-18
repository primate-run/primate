from primate import Route


@Route.post(content_type="multipart/form-data")
def handle_post(request):
    result = request.body.multipart()

    try:
        baz = int(str(result.form.get("baz", "")))
    except (ValueError, TypeError):
        baz = 0

    foo = str(result.form.get("foo", ""))
    greeting = next((f for f in result.files if f.field == "greeting"), None)

    return {
        "baz": baz,
        "foo": foo,
        "greeting": {
            "name": greeting.filename if greeting else None,
            "size": greeting.size if greeting else None,
            "type": greeting.content_type if greeting else None,
            "content": greeting.io.read().decode("utf-8") if greeting else None,
        },
    }
