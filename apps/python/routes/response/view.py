from primate import view

def get(request):
    return view("index.html", { "hello" : "world" })
